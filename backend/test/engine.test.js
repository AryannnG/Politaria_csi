const test = require("node:test");
const assert = require("node:assert/strict");
const { checkWinLoss } = require("../src/engine/winLoss");
const { collectTaxRevenue, payExpenses } = require("../src/engine/economy");
const { updateSimulation } = require("../src/engine/simulation");
const { updateMissions } = require("../src/engine/missions");
const { advanceMonth, applyPlayerChoice } = require("../src/engine/turnEngine");
const { selectEvent, triggerScheduledEvent, eventCatalog } = require("../src/engine/events");
const missions = require("../src/data/missions");
const City = require("../src/models/City");

function makeCity(overrides = {}) {
  return {
    month: 0, taxRate: 10, difficulty: "normal", status: "active", outcomeReason: null, outcome: null,
    stats: { population: 10000, treasury: 50000, economy: 50, healthcare: 50, education: 50, infrastructure: 50, environment: 50, governance: 50, approval: 50 },
    buildings: [], activePolicies: [], missions: [], pendingEvents: [], mapEffects: [], scheduledEvents: [], seenEvents: [], milestoneRewards: [], log: [],
    ...overrides,
  };
}

test("tax revenue and expenses are computed from stats and difficulty", () => {
  const city = makeCity();
  assert.equal(collectTaxRevenue(city), 1000);
  assert.equal(payExpenses(city), 300);
  assert.ok(payExpenses(makeCity({ difficulty: "hard" })) > 300);
});

test("simulation keeps all civic stats in range and only applies approval pressure when services slip", () => {
  const city = makeCity();
  updateSimulation(city);
  assert.equal(city.stats.approval, 50);
  city.stats.environment = 0;
  city.stats.governance = 0;
  city.stats.infrastructure = 0;
  updateSimulation(city);
  for (const key of ["environment", "governance", "infrastructure", "approval"]) assert.ok(city.stats[key] >= 0 && city.stats[key] <= 100, key);
});

test("debt, majority-loss, zero population and governance collapse end the term", () => {
  const broke = makeCity(); broke.stats.treasury = -1;
  assert.equal(checkWinLoss(broke).outcome.failingStat, "treasury");
  const ousted = makeCity(); ousted.stats.approval = 49;
  assert.equal(checkWinLoss(ousted).outcome.failingStat, "approval");
  const abandoned = makeCity(); abandoned.stats.population = 0;
  assert.equal(checkWinLoss(abandoned).outcome.failingStat, "population");
  const chaos = makeCity(); chaos.stats.governance = 0;
  assert.equal(checkWinLoss(chaos).outcome.failingStat, "governance");
});

test("strong cities have no three-month victory or fixed term limit", () => {
  const city = makeCity();
  Object.assign(city.stats, { population: 60000, economy: 80, healthcare: 80, education: 80, infrastructure: 80, environment: 70, governance: 80, approval: 80 });
  city.month = 240;
  checkWinLoss(city);
  assert.equal(city.status, "active");
  assert.equal(city.outcome, null);
});

test("active missions are unmet, limited to two, have progress/deadlines and grant a reward once", () => {
  const city = makeCity();
  updateMissions(city);
  assert.equal(city.missions.filter((mission) => mission.status === "active").length, 2);
  assert.ok(city.missions.every((mission) => mission.deadlineMonth > city.month && mission.progressPercent === 0));
  const progress = { missionId: "stabilize_healthcare", status: "active", startedOnMonth: 0, deadlineMonth: 5, startValue: 50, current: 50, target: 57, progressPercent: 0, reward: missions.find((mission) => mission.id === "stabilize_healthcare").reward, rewardGranted: false };
  const rewardCity = makeCity({ missions: [progress] });
  rewardCity.stats.healthcare = 57;
  const before = rewardCity.stats.treasury;
  updateMissions(rewardCity);
  updateMissions(rewardCity);
  assert.equal(progress.status, "completed");
  assert.equal(rewardCity.stats.treasury, before + 2600);
  assert.equal(rewardCity.log.filter((entry) => entry.message.startsWith("Mission completed")).length, 1);
});

test("mission targets, deadlines, and rewards escalate as a campaign matures", () => {
  const city = makeCity({ month: 40 });
  const oldRandom = Math.random;
  Math.random = () => 0;
  try { updateMissions(city); } finally { Math.random = oldRandom; }
  assert.equal(city.missions.length, 2);
  assert.ok(city.missions.every((mission) => mission.challengeTier === 2));
  for (const mission of city.missions) {
    const definition = missions.find((item) => item.id === mission.missionId);
    assert.ok(mission.target > definition.target, mission.missionId);
    assert.ok(mission.deadlineMonth - mission.startedOnMonth < definition.deadlineMonths, mission.missionId);
    assert.ok(mission.reward.treasury > definition.reward.treasury, mission.missionId);
  }
});

test("missed mission deadline closes the mission and applies a penalty", () => {
  const city = makeCity({ missions: [{ missionId: "stabilize_healthcare", status: "active", startedOnMonth: 0, deadlineMonth: 2, reward: {}, rewardGranted: false }] });
  city.month = 2;
  const beforeTreasury = city.stats.treasury;
  const beforeApproval = city.stats.approval;
  updateMissions(city);
  assert.equal(city.missions[0].status, "failed");
  assert.ok(city.stats.treasury < beforeTreasury);
  assert.ok(city.stats.approval < beforeApproval);
});

test("legacy completed missions without a deadline remain saveable", () => {
  const mongoose = require("mongoose");
  const legacy = new City({ name: "Old save", mayor: new mongoose.Types.ObjectId(), month: 1, missions: [{ missionId: "old_mission", status: "completed", startedOnMonth: 1 }] });
  advanceMonth(legacy);
  assert.equal(legacy.validateSync(), undefined);
  assert.equal(legacy.month, 2);
});

test("event catalog contains 100+ unique crises with multiple choices", () => {
  assert.ok(eventCatalog.length >= 100);
  assert.equal(new Set(eventCatalog.map((event) => event.id)).size, eventCatalog.length);
  assert.ok(eventCatalog.every((event) => event.severity === "crisis" && event.choices.length >= 3));
});

test("events leave a map effect, respect cooldown and can schedule a follow-up", () => {
  const city = makeCity();
  const oldRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const first = selectEvent(city);
    assert.ok(first);
    assert.ok(first.choices.every((choice) => !Object.hasOwn(choice, "effects")), "choice consequences stay hidden before selection");
    assert.equal(first.difficultyScale, 1);
    assert.equal(city.mapEffects.length, 1);
    city.month += 1;
    const second = selectEvent(city);
    assert.notEqual(second.eventId, first.eventId);
    const def = eventCatalog.find((event) => event.id === first.eventId);
    const chainChoice = def.choices.find((choice) => choice.followUps.length);
    if (chainChoice) {
      city.pendingEvents = [first];
      applyPlayerChoice(city, first.eventId, chainChoice.id);
      assert.ok(city.scheduledEvents.length > 0);
      city.month += 2;
      assert.ok(triggerScheduledEvent(city));
    }
  } finally { Math.random = oldRandom; }
});

test("crisis effects intensify as the campaign advances", () => {
  const city = makeCity({ month: 50 });
  const oldRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const event = selectEvent(city);
    assert.ok(event);
    assert.ok(event.difficultyScale > 1);
  } finally { Math.random = oldRandom; }
});

test("advanceMonth refuses with a pending event or ended game", () => {
  assert.throws(() => advanceMonth(makeCity({ pendingEvents: [{ eventId: "x" }] })), /pending event/);
  assert.throws(() => advanceMonth(makeCity({ status: "won" })), /ended/);
});

test("every event choice resolves and keeps stats finite/in range", () => {
  for (const event of eventCatalog) for (const choice of event.choices) {
    const city = makeCity({ pendingEvents: [{ eventId: event.id }] });
    applyPlayerChoice(city, event.id, choice.id);
    assert.equal(city.pendingEvents.length, 0);
    for (const [key, value] of Object.entries(city.stats)) {
      assert.ok(Number.isFinite(value), key);
      if (!["population", "treasury"].includes(key)) assert.ok(value >= 0 && value <= 100, `${event.id}/${choice.id} ${key}=${value}`);
    }
  }
});

test("random games never throw or produce non-finite civic stats", () => {
  for (let run = 0; run < 1000; run += 1) {
    const city = makeCity({ difficulty: ["easy", "normal", "hard"][run % 3] });
    for (let month = 0; month < 200 && city.status === "active"; month += 1) {
      if (city.pendingEvents.length) {
        const pending = city.pendingEvents[0];
        const def = eventCatalog.find((event) => event.id === pending.eventId);
        applyPlayerChoice(city, pending.eventId, def.choices[Math.floor(Math.random() * def.choices.length)].id);
      }
      if (city.status === "active") advanceMonth(city);
      for (const [key, value] of Object.entries(city.stats)) {
        assert.ok(Number.isFinite(value), `${run}/${month}/${key}`);
        if (!["population", "treasury"].includes(key)) assert.ok(value >= 0 && value <= 100, `${run}/${month}/${key}=${value}`);
      }
    }
  }
});

test("survival rewards are one-time and grow every ten months", () => {
  const city = makeCity({ month: 9 });
  advanceMonth(city);
  assert.equal(city.month, 10);
  assert.equal(city.milestoneRewards[0].treasury, 7500);
  assert.equal(city.log.filter((entry) => entry.type === "milestone").length, 1);
  const monthTwenty = makeCity({ month: 19, milestoneRewards: [{ month: 10, treasury: 7500 }] });
  advanceMonth(monthTwenty);
  assert.equal(monthTwenty.milestoneRewards.at(-1).treasury, 10000);
});
