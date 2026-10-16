const missionCatalog = require("../data/missions");
const buildings = require("../data/buildings");
const { applyEffects } = require("./statUtils");
const MAX_ACTIVE_MISSIONS = 2;

function rewardMission(city, progress, def) {
  const reward = progress.reward || def.reward || {};
  city.stats.treasury = Number(city.stats.treasury || 0) + Number(reward.treasury || 0);
  applyEffects(city.stats, reward.effects || {});
  if (reward.buildingId && buildings.some((building) => building.id === reward.buildingId)) {
    city.buildings.push({ buildingId: reward.buildingId, builtOnMonth: city.month, constructionEndsOnMonth: city.month + 1, level: 1 });
  }
  progress.rewardGranted = true;
  const rewardText = [reward.treasury ? `₹${Number(reward.treasury).toLocaleString()} treasury` : "", reward.buildingId ? buildings.find((item) => item.id === reward.buildingId)?.name : "", ...Object.entries(reward.effects || {}).map(([key, value]) => `${key} ${value > 0 ? "+" : ""}${value}`)].filter(Boolean).join(" · ");
  city.log.push({ month: city.month, type: "mission", message: `Mission completed: ${def.name}. Reward: ${rewardText || "city development"}.`, data: { missionId: def.id, reward } });
}

function challengeFor(city, def) {
  const tier = Math.floor(Math.max(0, Number(city.month || 0)) / 20);
  const baseTarget = Number(def.target);
  const step = def.stat === "treasury" ? 9000 : def.stat === "population" ? 1800 : 3;
  const target = def.stat === "treasury" || def.stat === "population"
    ? baseTarget + tier * step
    : Math.min(92, baseTarget + tier * step);
  const rewardScale = 1 + tier * 0.12;
  const reward = {
    ...def.reward,
    treasury: Math.round(Number(def.reward?.treasury || 0) * rewardScale),
    effects: Object.fromEntries(Object.entries(def.reward?.effects || {}).map(([key, value]) => [key, Math.round(value * rewardScale)])),
  };
  return { tier, target, reward };
}

function failMission(city, progress, def) {
  const tier = Number(progress.challengeTier || 0);
  const penalty = {
    treasury: -Math.max(1800, Math.round(Number(progress.reward?.treasury || def.reward?.treasury || 5000) * 0.35)),
    approval: -2 - Math.min(3, tier),
  };
  if (def.stat !== "treasury" && def.stat !== "approval" && def.stat !== "population") penalty[def.stat] = -2 - Math.min(4, tier);
  applyEffects(city.stats, penalty);
  progress.status = "failed";
  city.log.push({ month: city.month, type: "mission", message: `Mission expired: ${def.name}. The missed commitment cost the city treasury and public trust.`, data: { missionId: def.id, penalty } });
}

function assignNewMissions(city) {
  city.missions ||= [];
  const taken = new Set(city.missions.filter((mission) => mission.status === "active" || city.month - mission.startedOnMonth < 4).map((mission) => mission.missionId));
  const activeCount = city.missions.filter((mission) => mission.status === "active").length;
  const available = missionCatalog.filter((def) => !taken.has(def.id) && !def.check(city, challengeFor(city, def).target));
  let slots = MAX_ACTIVE_MISSIONS - activeCount;
  while (slots > 0 && available.length > 0) {
    const index = Math.floor(Math.random() * available.length);
    const def = available.splice(index, 1)[0];
    const { tier, target, reward } = challengeFor(city, def);
    const difficultyOffset = city.difficulty === "easy" ? 2 : city.difficulty === "hard" ? -1 : 0;
    const deadlineMonths = Math.max(3, def.deadlineMonths + difficultyOffset - tier);
    const deadlineMonth = city.month + deadlineMonths;
    const snapshot = def.progress(city, target);
    city.missions.push({ missionId: def.id, status: "active", startedOnMonth: city.month, deadlineMonth, completedOnMonth: null, ...snapshot, challengeTier: tier, reward, rewardGranted: false });
    city.log.push({ month: city.month, type: "mission", message: `New mission: ${def.name}. ${deadlineMonth - city.month} months to complete.`, data: { missionId: def.id, deadlineMonth, reward } });
    taken.add(def.id);
    slots -= 1;
  }
}

function updateMissions(city) {
  city.missions ||= [];
  for (const progress of city.missions) {
    if (progress.status !== "active") continue;
    const def = missionCatalog.find((mission) => mission.id === progress.missionId);
    if (!def) continue;
    const { tier, target: escalatedTarget, reward: escalatedReward } = challengeFor(city, def);
    if (!Number.isFinite(Number(progress.deadlineMonth))) progress.deadlineMonth = progress.startedOnMonth + Math.max(3, def.deadlineMonths - tier);
    if (!Number.isFinite(Number(progress.target)) || Number(progress.target) <= 0) progress.target = escalatedTarget;
    if (!Number.isFinite(Number(progress.challengeTier))) progress.challengeTier = tier;
    if (!progress.reward || !Object.keys(progress.reward).length) progress.reward = escalatedReward;
    if (typeof progress.rewardGranted !== "boolean") progress.rewardGranted = false;
    const snapshot = def.progress(city, progress.target);
    progress.current = snapshot.current;
    progress.target = snapshot.target;
    if (!Number.isFinite(Number(progress.startValue))) progress.startValue = Number.isFinite(Number(snapshot.startValue)) ? snapshot.startValue : snapshot.current;
    const span = Math.max(1, Number(progress.target) - Number(progress.startValue));
    progress.progressPercent = Math.max(0, Math.min(100, Math.floor(((Number(progress.current) - Number(progress.startValue)) / span) * 100)));
    if (def.check(city, progress.target)) {
      progress.status = "completed";
      progress.completedOnMonth = city.month;
      if (!progress.rewardGranted) rewardMission(city, progress, def);
    } else if (city.month >= progress.deadlineMonth) {
      failMission(city, progress, def);
    }
  }
  assignNewMissions(city);
}

module.exports = { updateMissions, assignNewMissions };
