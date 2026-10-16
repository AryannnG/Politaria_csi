const policies = require("../data/policies");
const { clamp, applyEffects } = require("./statUtils");

function applyActivePolicies(city) {
  for (const instance of city.activePolicies) {
    const def = policies.find((policy) => policy.id === instance.policyId);
    if (!def) continue;
    const effects = {};
    for (const [key, delta] of Object.entries(def.monthlyEffects)) {
      const room = key === "treasury" || key === "population" ? 1 : Math.max(0.2, (100 - Number(city.stats[key] || 0)) / 50);
      effects[key] = delta * room;
    }
    applyEffects(city.stats, effects);
  }
}

function applyNaturalDrift(city) {
  const { stats } = city;
  const difficultyFactor = city.difficulty === "hard" ? 1.3 : city.difficulty === "easy" ? 0.75 : 1;
  stats.infrastructure = clamp(stats.infrastructure - (stats.population / 50000) * 0.5 * difficultyFactor);
  stats.environment = clamp(stats.environment - 0.2 * difficultyFactor);
  stats.governance = clamp(stats.governance - 0.1 * difficultyFactor);

  const serviceAverage = [stats.healthcare, stats.education, stats.infrastructure, stats.environment, stats.governance].reduce((sum, value) => sum + value, 0) / 5;
  const servicePressure = Math.max(0, 45 - serviceAverage) * 0.025;
  const highTaxPressure = Math.max(0, Number(city.taxRate || 0) - 30) * 0.02;
  stats.economy = clamp(stats.economy - Math.max(0, Number(city.taxRate || 0) - 10) * 0.025);
  const taxApprovalPenalty = Math.min(highTaxPressure, Math.max(0, stats.approval - 50));
  if (servicePressure + taxApprovalPenalty > 0) stats.approval = clamp(stats.approval - servicePressure - taxApprovalPenalty);

  const populationChangeRate = ((stats.approval - 50) / 50) * 0.015 + ((stats.economy - 50) / 50) * 0.01;
  stats.population = Math.max(0, Math.round(stats.population * (1 + populationChangeRate)));
}

function updateSimulation(city) {
  applyActivePolicies(city);
  applyNaturalDrift(city);
}

module.exports = { updateSimulation, applyActivePolicies, applyNaturalDrift };
