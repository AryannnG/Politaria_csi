function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

// Adds deltas to city data; civic indicators are clamped, while debt remains
// negative so the mayor's bankruptcy condition can end the game immediately.
function applyEffects(stats, effects = {}) {
  for (const [key, delta] of Object.entries(effects)) {
    if (!(key in stats)) continue;
    if (key === "treasury") {
      stats[key] += delta;
    } else if (key === "population") {
      stats[key] = Math.max(0, stats[key] + delta);
    } else {
      stats[key] = clamp(stats[key] + delta);
    }
  }
  return stats;
}

module.exports = { clamp, applyEffects };
