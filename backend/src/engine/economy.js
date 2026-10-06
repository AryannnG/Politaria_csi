const buildings = require("../data/buildings");
const policies = require("../data/policies");

// Tunable constants for monthly economy balance.
const INCOME_PER_CAPITA = 2;
const BASE_SERVICE_COST_PER_CAPITA = 0.03;

function collectTaxRevenue(city) {
  const { population, economy } = city.stats;
  const revenue = Math.round(
    population * INCOME_PER_CAPITA * (economy / 100) * (city.taxRate / 100)
  );
  return revenue;
}

function payExpenses(city) {
  const baseUpkeep = Math.round(city.stats.population * BASE_SERVICE_COST_PER_CAPITA);

  const buildingUpkeep = city.buildings.reduce((sum, instance) => {
    const def = buildings.find((b) => b.id === instance.buildingId);
    return sum + (def ? def.upkeep : 0);
  }, 0);

  const policyUpkeep = city.activePolicies.reduce((sum, instance) => {
    const def = policies.find((p) => p.id === instance.policyId);
    return sum + (def ? def.monthlyCost : 0);
  }, 0);

  return baseUpkeep + buildingUpkeep + policyUpkeep;
}

module.exports = { collectTaxRevenue, payExpenses };
