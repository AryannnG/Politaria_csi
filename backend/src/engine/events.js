const eventCatalog = require("../data/events");
const { applyEffects } = require("./statUtils");

const NO_EVENT_CHANCE = 0.4; // 40% chance nothing happens this month

function pickWeighted(eligible) {
  const totalWeight = eligible.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const event of eligible) {
    roll -= event.weight;
    if (roll <= 0) return event;
  }
  return eligible[eligible.length - 1];
}

// TRIGGER EVENT step. Returns null when no event fires this month.
function selectEvent(city) {
  if (Math.random() < NO_EVENT_CHANCE) return null;

  const eligible = eventCatalog.filter((e) => !e.condition || e.condition(city.stats));
  if (eligible.length === 0) return null;

  const chosen = pickWeighted(eligible);
  return {
    eventId: chosen.id,
    title: chosen.title,
    description: chosen.description,
    choices: chosen.choices.map((c) => ({ id: c.id, label: c.label })),
    triggeredOnMonth: city.month,
  };
}

// APPLY CONSEQUENCES step, after the player picks a response.
function resolveEventChoice(city, eventId, choiceId) {
  const def = eventCatalog.find((e) => e.id === eventId);
  if (!def) throw new Error(`Unknown event: ${eventId}`);

  const choice = def.choices.find((c) => c.id === choiceId);
  if (!choice) throw new Error(`Unknown choice "${choiceId}" for event "${eventId}"`);

  applyEffects(city.stats, choice.effects);

  city.pendingEvents = city.pendingEvents.filter((e) => e.eventId !== eventId);

  return { eventId, choiceId, effects: choice.effects };
}

module.exports = { selectEvent, resolveEventChoice };
