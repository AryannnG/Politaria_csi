// Construction catalog. Each facility is stored on the city and rendered in the 3D map.
module.exports = [
  { id: "clinic", name: "Community Clinic", cost: 8000, upkeep: 150, effects: { healthcare: 6, approval: 2 } },
  { id: "hospital", name: "Regional Hospital", cost: 18000, upkeep: 420, effects: { healthcare: 11, approval: 3 } },
  { id: "school", name: "Public School", cost: 9000, upkeep: 180, effects: { education: 6, approval: 2 } },
  { id: "university", name: "University Campus", cost: 18500, upkeep: 360, effects: { education: 9, economy: 3 } },
  { id: "power_plant", name: "Power Plant", cost: 15000, upkeep: 400, effects: { infrastructure: 8, environment: -6, economy: 4 } },
  { id: "park", name: "Public Park", cost: 4000, upkeep: 60, effects: { environment: 5, approval: 3 } },
  { id: "factory", name: "Industrial Factory", cost: 12000, upkeep: 250, effects: { economy: 8, environment: -8, approval: -2 } },
  { id: "transit_line", name: "Transit Line", cost: 20000, upkeep: 500, effects: { infrastructure: 10, economy: 3, environment: 2 } },
  { id: "police_station", name: "Community Police Station", cost: 10500, upkeep: 240, effects: { governance: 7, approval: 2 } },
  { id: "fire_station", name: "Fire and Rescue Station", cost: 11800, upkeep: 280, effects: { governance: 5, infrastructure: 3, approval: 2 } },
  { id: "water_works", name: "Water Treatment Works", cost: 13200, upkeep: 310, effects: { infrastructure: 7, environment: 4, healthcare: 2 } },
  { id: "transit_terminal", name: "Transit Terminal", cost: 19000, upkeep: 390, effects: { infrastructure: 9, economy: 3, environment: 2 } },
  { id: "innovation_hub", name: "Innovation Hub", cost: 16800, upkeep: 330, effects: { education: 5, economy: 7 } },
  { id: "recycling_center", name: "Recycling Center", cost: 12500, upkeep: 260, effects: { environment: 8, governance: 2 } },
  { id: "community_center", name: "Community Center", cost: 7800, upkeep: 130, effects: { approval: 5, governance: 3 } },
];
