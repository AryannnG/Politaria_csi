// Construction catalog. effects are applied once, immediately, on build.
// upkeep is a recurring monthly treasury cost while the building stands.
module.exports = [
  {
    id: "clinic",
    name: "Community Clinic",
    cost: 8000,
    upkeep: 150,
    effects: { healthcare: 6, approval: 2 },
  },
  {
    id: "school",
    name: "Public School",
    cost: 9000,
    upkeep: 180,
    effects: { education: 6, approval: 2 },
  },
  {
    id: "power_plant",
    name: "Power Plant",
    cost: 15000,
    upkeep: 400,
    effects: { infrastructure: 8, environment: -6, economy: 4 },
  },
  {
    id: "park",
    name: "Public Park",
    cost: 4000,
    upkeep: 60,
    effects: { environment: 5, approval: 3 },
  },
  {
    id: "factory",
    name: "Industrial Factory",
    cost: 12000,
    upkeep: 250,
    effects: { economy: 8, environment: -8, approval: -2 },
  },
  {
    id: "transit_line",
    name: "Transit Line",
    cost: 20000,
    upkeep: 500,
    effects: { infrastructure: 10, economy: 3, environment: 2 },
  },
];
