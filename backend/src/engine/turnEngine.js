const { collectTaxRevenue, payExpenses } = require("./economy");
const { updateSimulation } = require("./simulation");
const { selectEvent, triggerScheduledEvent, resolveEventChoice } = require("./events");
const { updateMissions } = require("./missions");
const { checkWinLoss } = require("./winLoss");

function log(city, type, message, data = {}) {
  city.log.push({ month: city.month, type, message, data });
}

function awardSurvivalMilestone(city) {
  if (city.status !== "active" || city.month <= 0 || city.month % 10 !== 0) return;
  city.milestoneRewards ||= [];
  if (city.milestoneRewards.some((milestone) => milestone.month === city.month)) return;
  const completedMilestones = city.milestoneRewards.length;
  const treasury = 7500 + completedMilestones * 2500;
  city.stats.treasury += treasury;
  city.milestoneRewards.push({ month: city.month, treasury });
  log(city, "milestone", `Ten-month legacy reached! The city received ₹${treasury.toLocaleString()} in survival funds.`, { milestone: completedMilestones + 1, treasury });
}

// ADVANCE MONTH through TRIGGER EVENT. Stops short of APPLY CONSEQUENCES
// when an event fires, since that step requires the player's choice.
function advanceMonth(city) {
  if (city.status !== "active") {
    throw new Error("This city's game has already ended.");
  }
  if (city.pendingEvents.length > 0) {
    throw new Error("Resolve the pending event before advancing to the next month.");
  }

  city.month += 1;
  city.mapEffects = (city.mapEffects || []).filter((effect) => effect.endsOnMonth >= city.month);

  const revenue = collectTaxRevenue(city);
  city.stats.treasury += revenue;
  log(city, "revenue", `Collected ${revenue} in tax revenue.`, { revenue });

  const expenses = payExpenses(city);
  city.stats.treasury -= expenses;
  log(city, "expense", `Paid ${expenses} in city expenses.`, { expenses });

  updateSimulation(city);

  const event = triggerScheduledEvent(city) || selectEvent(city);
  if (event) {
    city.pendingEvents.push(event);
    log(city, "event", `Crisis triggered: ${event.title}`, { eventId: event.eventId, category: event.category, severity: event.severity, visualType: event.visualType });
  }

  updateMissions(city);
  checkWinLoss(city);
  awardSurvivalMilestone(city);
  checkWinLoss(city);

  return city;
}

// PLAYER CHOOSES RESPONSE -> APPLY CONSEQUENCES -> UPDATE MISSIONS -> CHECK WIN/LOSS.
function applyPlayerChoice(city, eventId, choiceId) {
  const result = resolveEventChoice(city, eventId, choiceId);
  log(city, "consequence", `Resolved "${eventId}" with choice "${choiceId}".`, result);

  updateMissions(city);
  checkWinLoss(city);

  return city;
}

module.exports = { advanceMonth, applyPlayerChoice, awardSurvivalMilestone };
