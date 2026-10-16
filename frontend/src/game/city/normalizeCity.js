import { BASE_LOT_SITES, findOpenCitySite } from "./components/cityLayout.js";

const BUILDING_TYPES = {
  clinic: "clinic",
  hospital: "hospital",
  school: "school",
  university: "school",
  power_plant: "power",
  park: "park",
  factory: "industry",
  transit_line: "transport",
  transit_terminal: "transport",
  police_station: "police",
  fire_station: "fire",
  water_works: "water",
  innovation_hub: "commercial",
  recycling_center: "industry",
  community_center: "civic",
};

const BUILDING_SECTORS = {
  clinic: "healthcare",
  hospital: "healthcare",
  school: "education",
  university: "education",
  power_plant: "infrastructure",
  park: "environment",
  factory: "economy",
  transit_line: "infrastructure",
  transit_terminal: "infrastructure",
  police_station: "governance",
  fire_station: "governance",
  water_works: "infrastructure",
  innovation_hub: "economy",
  recycling_center: "environment",
  community_center: "governance",
};

function visualLevel(value) {
  return Math.max(1, Math.min(5, Math.floor((Number(value || 0) - 45) / 5) + 1));
}

function buildingCondition(type, stats, events) {
  const visuals = new Set((events || []).map((event) => event.visualType));
  if ((visuals.has("flood") || visuals.has("infrastructure")) && ["transport", "power", "water"].includes(type)) return "disrupted";
  if ((visuals.has("virus") || visuals.has("health")) && ["clinic", "hospital"].includes(type)) return "under-pressure";
  if ((visuals.has("crime") || visuals.has("conflict")) && ["police", "fire", "civic"].includes(type)) return "disrupted";
  if (stats.governance < 35) return "neglected";
  if (stats.environment < 20 && type === "industry") return "damaged";
  return "active";
}

/** Adapt the backend's persisted city document into read-only scene data. */
export function toCityWorldState(city, buildingCatalog = []) {
  if (!city) return null;
  const stats = city.stats || {};
  const sectors = {
    healthcare: stats.healthcare ?? 50,
    education: stats.education ?? 50,
    infrastructure: stats.infrastructure ?? 50,
    economy: stats.economy ?? 50,
    environment: stats.environment ?? 50,
    governance: stats.governance ?? 50,
  };
  const definitions = new Map(buildingCatalog.map((item) => [item.id, item]));
  const occupied = BASE_LOT_SITES.map(({ x, z, reserveWidth, reserveDepth }) => ({ x, z, width: reserveWidth, depth: reserveDepth }));
  const buildings = (city.buildings || []).map((instance, index) => {
    const definition = definitions.get(instance.buildingId) || { name: instance.buildingId };
    const type = BUILDING_TYPES[instance.buildingId] || "civic";
    const width = type === "power" ? 6.2 : type === "industry" ? 6 : 4.8;
    const depth = type === "park" ? 5.6 : 4.8;
    const reserveWidth = width * 1.42;
    const reserveDepth = depth * 1.42;
    const point = findOpenCitySite(occupied, reserveWidth, reserveDepth, index);
    if (!point) return null;
    const { x, z } = point;
    occupied.push({ x, z, width: reserveWidth, depth: reserveDepth });
    const sector = BUILDING_SECTORS[instance.buildingId];
    const level = Math.max(Number(instance.level || 1), visualLevel(sector ? sectors[sector] : 50));
    return {
      id: `${instance.buildingId}-${index + 1}`,
      catalogId: instance.buildingId,
      type,
      name: definition.name || instance.buildingId,
      description: `Opened in month ${instance.builtOnMonth}. Current ${sector || "city"} development is ${Math.round(sector ? sectors[sector] : 50)}%.`,
      level,
      status: buildingCondition(type, stats, [...(city.pendingEvents || []), ...(city.mapEffects || [])]),
      x,
      z,
      width,
      depth,
      height: type === "school" ? 2.7 : type === "power" ? 3.6 : 3,
    };
  }).filter(Boolean);

  return {
    month: city.month,
    sectors,
    city: {
      cityName: city.name,
      status: city.status ?? "active",
      stats,
      population: stats.population ?? 10000,
      trafficLevel: Math.max(8, Math.min(95, 20 + (stats.population || 10000) / 1800 + (100 - sectors.infrastructure) * 0.42)),
      pollutionLevel: Math.max(0, Math.min(100, 100 - sectors.environment)),
      unrestLevel: Math.max(0, 100 - (stats.approval ?? 60)),
      roadLevel: Math.max(0, Math.min(4, Math.floor((sectors.infrastructure - 34) / 8))),
      buildings,
      constructionSites: (city.buildings || []).filter((building) => Number(building.constructionEndsOnMonth) > Number(city.month)).map((building, index) => `${building.buildingId}-${index + 1}`),
      pendingEvents: city.pendingEvents ?? [],
      mapEffects: city.mapEffects ?? [],
    },
  };
}

export { visualLevel };
