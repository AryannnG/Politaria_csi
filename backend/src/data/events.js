// Event catalog. `weight` biases random selection; `condition` (optional)
// gates whether the event is eligible this month based on current stats.
// Each choice carries the consequence effects applied when chosen.
module.exports = [
  {
    id: "disease_outbreak",
    title: "Disease Outbreak",
    description: "A contagious illness is spreading through the city's poorer districts.",
    weight: 3,
    condition: (stats) => stats.healthcare < 60,
    choices: [
      {
        id: "fund_response",
        label: "Fund an emergency medical response",
        effects: { treasury: -6000, healthcare: 8, approval: 5 },
      },
      {
        id: "ignore",
        label: "Let it run its course",
        effects: { healthcare: -10, approval: -8, population: -200 },
      },
    ],
  },
  {
    id: "economic_boom",
    title: "Economic Boom",
    description: "Favorable trade conditions have boosted local businesses.",
    weight: 2,
    condition: (stats) => stats.economy > 40,
    choices: [
      {
        id: "reinvest",
        label: "Reinvest profits into infrastructure",
        effects: { treasury: 5000, infrastructure: 5 },
      },
      {
        id: "tax_windfall",
        label: "Collect a one-time windfall tax",
        effects: { treasury: 10000, approval: -4 },
      },
    ],
  },
  {
    id: "protest",
    title: "Citizens Protest",
    description: "Residents are protesting over low approval of city leadership.",
    weight: 3,
    condition: (stats) => stats.approval < 40,
    choices: [
      {
        id: "address_concerns",
        label: "Hold a public forum and address concerns",
        effects: { approval: 8, governance: 3, treasury: -1500 },
      },
      {
        id: "crack_down",
        label: "Deploy police to disperse the protest",
        effects: { approval: -10, governance: -5 },
      },
    ],
  },
  {
    id: "corruption_scandal",
    title: "Corruption Scandal",
    description: "A city official has been caught embezzling public funds.",
    weight: 2,
    condition: (stats) => stats.governance < 55,
    choices: [
      {
        id: "investigate",
        label: "Launch a full investigation",
        effects: { governance: 10, approval: 4, treasury: -2000 },
      },
      {
        id: "cover_up",
        label: "Quietly cover it up",
        effects: { governance: -12, approval: -6, treasury: 3000 },
      },
    ],
  },
  {
    id: "natural_disaster",
    title: "Flooding",
    description: "Heavy rains have caused flooding in low-lying infrastructure.",
    weight: 2,
    condition: (stats) => stats.environment < 50,
    choices: [
      {
        id: "emergency_repair",
        label: "Fund emergency repairs",
        effects: { treasury: -8000, infrastructure: 6, approval: 3 },
      },
      {
        id: "minimal_response",
        label: "Provide minimal response",
        effects: { infrastructure: -12, approval: -7, population: -300 },
      },
    ],
  },
  {
    id: "population_growth",
    title: "Population Surge",
    description: "Word has spread that your city is a great place to live.",
    weight: 2,
    condition: (stats) => stats.approval > 65,
    choices: [
      {
        id: "welcome",
        label: "Welcome new residents",
        effects: { population: 1500, economy: 2, infrastructure: -3 },
      },
      {
        id: "limit_growth",
        label: "Limit housing permits to manage growth",
        effects: { population: 300, infrastructure: 1, approval: -2 },
      },
    ],
  },
];
