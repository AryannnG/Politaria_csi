const missions = [
  { id: "stabilize_healthcare", name: "Stabilize Healthcare", description: "Raise healthcare to 57 or higher.", stat: "healthcare", target: 57, deadlineMonths: 5, reward: { treasury: 2600, effects: { healthcare: 2 } } },
  { id: "balance_budget", name: "Rebuild the Reserve", description: "Grow the treasury beyond ₹58,000.", stat: "treasury", target: 58000, deadlineMonths: 8, reward: { treasury: 3200, effects: { governance: 1 } } },
  { id: "win_the_people", name: "Earn Public Trust", description: "Raise citizen approval to 58 or higher.", stat: "approval", target: 58, deadlineMonths: 6, reward: { treasury: 3500, effects: { approval: 2 } } },
  { id: "grow_the_city", name: "Welcome New Neighbors", description: "Grow the population to 11,000.", stat: "population", target: 11000, deadlineMonths: 12, reward: { treasury: 4200, effects: { economy: 2 } } },
  { id: "clean_governance", name: "Open City Hall", description: "Raise governance to 57 or higher.", stat: "governance", target: 57, deadlineMonths: 6, reward: { treasury: 3000, effects: { governance: 2 } } },
  { id: "repair_roads", name: "Repair the Main Roads", description: "Raise infrastructure to 58 or higher.", stat: "infrastructure", target: 58, deadlineMonths: 7, reward: { treasury: 4200, effects: { infrastructure: 2 } } },
  { id: "support_learning", name: "Support Local Schools", description: "Raise education to 58 or higher.", stat: "education", target: 58, deadlineMonths: 7, reward: { treasury: 3900, effects: { education: 2 } } },
  { id: "green_blocks", name: "Green the Neighborhoods", description: "Raise environment to 57 or higher.", stat: "environment", target: 57, deadlineMonths: 6, reward: { treasury: 3000, effects: { environment: 2 } } },
  { id: "small_business", name: "Back Local Enterprise", description: "Raise the economy to 58 or higher.", stat: "economy", target: 58, deadlineMonths: 8, reward: { treasury: 5000, effects: { economy: 2 } } },
  { id: "health_and_safety", name: "Safe Streets Initiative", description: "Reach 60 in governance and 55 in approval.", stat: "governance", target: 60, deadlineMonths: 9, reward: { treasury: 6500, effects: { governance: 2, approval: 2 }, buildingId: "police_station" } },
  { id: "water_resilience", name: "Secure the Water Supply", description: "Reach 58 infrastructure and 55 environment.", stat: "infrastructure", target: 58, deadlineMonths: 9, reward: { treasury: 5600, effects: { infrastructure: 2, environment: 2 }, buildingId: "water_works" } },
  { id: "community_hub", name: "Create a Community Hub", description: "Reach 62 approval and 55 governance.", stat: "approval", target: 62, deadlineMonths: 9, reward: { treasury: 7200, effects: { approval: 3 }, buildingId: "community_center" } },
  { id: "urban_transit", name: "Make Transit Reliable", description: "Reach 62 infrastructure and 56 economy.", stat: "infrastructure", target: 62, deadlineMonths: 10, reward: { treasury: 8200, effects: { infrastructure: 3 }, buildingId: "transit_terminal" } },
  { id: "research_city", name: "Invest in the Future", description: "Reach 62 education and 60 economy.", stat: "education", target: 62, deadlineMonths: 11, reward: { treasury: 9800, effects: { education: 3, economy: 2 }, buildingId: "innovation_hub" } },
  { id: "clean_air", name: "Clear the Air", description: "Reach 65 environment and 58 healthcare.", stat: "environment", target: 65, deadlineMonths: 11, reward: { treasury: 10500, effects: { environment: 3, healthcare: 2 }, buildingId: "recycling_center" } },
];

function currentValue(city, def) {
  return Number(city.stats?.[def.stat] || 0);
}

function missionSnapshot(city, def, target = def.target) {
  const current = currentValue(city, def);
  // Mission progress measures improvement from the value at assignment, not
  // the city's total stat. This keeps newly assigned bars at 0%.
  const startValue = current;
  const requiredChange = Math.max(1, target - startValue);
  const percent = Math.max(0, Math.min(100, Math.floor(((current - startValue) / requiredChange) * 100)));
  return { current, target, startValue, progressPercent: percent };
}

for (const def of missions) {
  def.check = (city, target = def.target) => currentValue(city, def) >= target;
  def.progress = (city, target = def.target) => missionSnapshot(city, def, target);
}

module.exports = missions;
