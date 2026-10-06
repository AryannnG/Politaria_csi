// Mission catalog. `check` runs each month against the city doc and returns
// true once the goal is met. `expiresAfterMonths` (optional) fails the
// mission if not completed within that many months of being started.
module.exports = [
  {
    id: "stabilize_healthcare",
    name: "Stabilize Healthcare",
    description: "Raise healthcare to at least 60.",
    check: (city) => city.stats.healthcare >= 60,
  },
  {
    id: "balance_budget",
    name: "Balance the Budget",
    description: "Keep the treasury above 20,000.",
    check: (city) => city.stats.treasury >= 20000,
  },
  {
    id: "win_the_people",
    name: "Win the People",
    description: "Raise citizen approval to at least 70.",
    check: (city) => city.stats.approval >= 70,
  },
  {
    id: "grow_the_city",
    name: "Grow the City",
    description: "Grow population to at least 20,000.",
    check: (city) => city.stats.population >= 20000,
    expiresAfterMonths: 24,
  },
  {
    id: "clean_governance",
    name: "Clean Governance",
    description: "Raise governance to at least 65.",
    check: (city) => city.stats.governance >= 65,
  },
];
