function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

// Adds `delta` to every stat key present in `effects`, clamping 0-100 stats
// (population and treasury are left unclamped on the low end at 0).
function applyEffects(stats, effects = {}) {
  for (const [key, delta] of Object.entries(effects)) {
    if (!(key in stats)) continue;
    if (key === "population" || key === "treasury") {
      stats[key] = Math.max(0, stats[key] + delta);
    } else {
      stats[key] = clamp(stats[key] + delta);
    }
  }
  return stats;
}

module.exports = { clamp, applyEffects };
