const policies = require("../data/policies");
const { clamp, applyEffects } = require("./statUtils");

// Natural monthly drift, independent of player decisions.
const INFRASTRUCTURE_STRAIN_FACTOR = 0.5; // decay per 50k population
const ENVIRONMENT_BASE_DECAY = 0.2;
const GOVERNANCE_BASE_DECAY = 0.1;
const POPULATION_APPROVAL_WEIGHT = 0.015;
const POPULATION_ECONOMY_WEIGHT = 0.01;

function applyActivePolicies(city) {
  for (const instance of city.activePolicies) {
    const def = policies.find((p) => p.id === instance.policyId);
    if (!def) continue;
    applyEffects(city.stats, def.monthlyEffects);
  }
}

function applyNaturalDrift(city) {
  const { stats } = city;

  const infrastructureStrain = (stats.population / 50000) * INFRASTRUCTURE_STRAIN_FACTOR;
  stats.infrastructure = clamp(stats.infrastructure - infrastructureStrain);

  stats.environment = clamp(stats.environment - ENVIRONMENT_BASE_DECAY);
  stats.governance = clamp(stats.governance - GOVERNANCE_BASE_DECAY);

  const populationChangeRate =
    ((stats.approval - 50) / 50) * POPULATION_APPROVAL_WEIGHT +
    ((stats.economy - 50) / 50) * POPULATION_ECONOMY_WEIGHT;
  stats.population = Math.max(0, Math.round(stats.population * (1 + populationChangeRate)));
}

// UPDATE CITY SIMULATION step of the core game loop.
function updateSimulation(city) {
  applyActivePolicies(city);
  applyNaturalDrift(city);
}

module.exports = { updateSimulation };
