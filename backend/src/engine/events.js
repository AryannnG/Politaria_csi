const eventCatalog = require("../data/events");
const { applyEffects } = require("./statUtils");

const NO_EVENT_CHANCE = { easy: 0.5, normal: 0.4, hard: 0.28 };

function challengeScale(city) {
  return Math.min(2.2, 1 + Math.floor(Math.max(0, Number(city.month || 0)) / 10) * 0.07);
}

function pickWeighted(eligible, stats) {
  const choices = eligible.map((event) => ({ event, weight: event.weight * event.relevance(stats) }));
  const total = choices.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of choices) {
    roll -= item.weight;
    if (roll <= 0) return item.event;
  }
  return choices[choices.length - 1]?.event ?? null;
}

function rememberAndQueue(city, def) {
  city.seenEvents ||= [];
  const old = city.seenEvents.find((entry) => entry.eventId === def.id);
  if (old) old.lastOccurredOnMonth = city.month;
  else city.seenEvents.push({ eventId: def.id, lastOccurredOnMonth: city.month });
  city.mapEffects ||= [];
  city.mapEffects.push({ eventId: def.id, visualType: def.visualType, title: def.title, startedOnMonth: city.month, endsOnMonth: city.month + 3, intensity: 1 });
  return {
    eventId: def.id, title: def.title, description: def.description, category: def.category, icon: def.icon,
    severity: def.severity, visualType: def.visualType,
    // Consequences remain server-side; the mayor sees the policy options and
    // must decide without a spoiler preview.
    choices: def.choices.map(({ id, label }) => ({ id, label })),
    difficultyScale: challengeScale(city),
    triggeredOnMonth: city.month,
  };
}

function selectEvent(city) {
  const pressure = Math.floor(Math.max(0, Number(city.month || 0)) / 10) * 0.025;
  const noEventChance = Math.max(0.1, (NO_EVENT_CHANCE[city.difficulty] ?? NO_EVENT_CHANCE.normal) - pressure);
  if (Math.random() < noEventChance) return null;

  const seen = city.seenEvents || [];
  const eligible = eventCatalog.filter((event) => {
    const last = seen.find((entry) => entry.eventId === event.id)?.lastOccurredOnMonth;
    return last === undefined || city.month - last >= event.cooldownMonths;
  });
  const chosen = pickWeighted(eligible, city.stats);
  if (!chosen) return null;
  return rememberAndQueue(city, chosen);
}

function triggerScheduledEvent(city) {
  city.scheduledEvents ||= [];
  const index = city.scheduledEvents.findIndex((event) => event.dueMonth <= city.month);
  if (index < 0) return null;
  const [scheduled] = city.scheduledEvents.splice(index, 1);
  const def = eventCatalog.find((event) => event.id === scheduled.eventId);
  return def ? rememberAndQueue(city, def) : null;
}

function resolveEventChoice(city, eventId, choiceId) {
  const def = eventCatalog.find((event) => event.id === eventId);
  if (!def) throw new Error(`Unknown event: ${eventId}`);
  const choice = def.choices.find((item) => item.id === choiceId);
  if (!choice) throw new Error(`Unknown choice "${choiceId}" for event "${eventId}"`);

  const pending = (city.pendingEvents || []).find((event) => event.eventId === eventId);
  const scale = Math.max(1, Number(pending?.difficultyScale) || 1);
  const effects = Object.fromEntries(Object.entries(choice.effects || {}).map(([key, value]) => {
    const multiplier = value < 0 ? scale : 1 + (scale - 1) * 0.35;
    return [key, Math.round(value * multiplier)];
  }));
  applyEffects(city.stats, effects);
  city.scheduledEvents ||= [];
  for (const followUp of choice.followUps || []) {
    city.scheduledEvents.push({ eventId: followUp.eventId, dueMonth: city.month + followUp.afterMonths, sourceEventId: eventId });
  }
  city.pendingEvents = city.pendingEvents.filter((event) => event.eventId !== eventId);
  return { eventId, choiceId, effects, visualType: def.visualType, difficultyScale: scale };
}

module.exports = { selectEvent, triggerScheduledEvent, resolveEventChoice, eventCatalog, NO_EVENT_CHANCE };
