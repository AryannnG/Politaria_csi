// Renderer-only example data. Replace this object with the normalized state from the game API.
export const initialCityState = {
  month: 8,
  year: 1,
  sectors: {
    healthcare: 52,
    infrastructure: 48,
    environment: 68,
    governance: 62,
    economy: 57,
  },
  city: {
    cityName: 'Northbank',
    districtName: 'Capital District',
    population: 128430,
    trafficLevel: 36,
    pollutionLevel: 24,
    constructionSites: ['hospital-central'],
    buildings: [
      { id: 'hospital-central', type: 'hospital', district: 'civic', level: 1, status: 'active' },
      { id: 'school-north', type: 'school', district: 'residential', level: 2, status: 'active' },
      { id: 'clinic-east', type: 'clinic', district: 'residential', level: 1, status: 'active' },
      { id: 'market-square', type: 'commercial', district: 'market', level: 2, status: 'active' },
    ],
  },
};

export const demoStates = {
  starting: initialCityState,
  healthcare: {
    ...initialCityState,
    sectors: { ...initialCityState.sectors, healthcare: 84 },
    city: {
      ...initialCityState.city,
      buildings: initialCityState.city.buildings.map((building) =>
        building.id === 'hospital-central' ? { ...building, level: 4 } : building,
      ),
      constructionSites: [],
    },
  },
  infrastructure: {
    ...initialCityState,
    sectors: { ...initialCityState.sectors, infrastructure: 88 },
    city: { ...initialCityState.city, trafficLevel: 61, roadLevel: 3 },
  },
  crisis: {
    ...initialCityState,
    sectors: { ...initialCityState.sectors, environment: 26, governance: 34 },
    city: {
      ...initialCityState.city,
      pollutionLevel: 82,
      trafficLevel: 78,
      unrestLevel: 68,
      buildings: initialCityState.city.buildings.map((building) =>
        building.id === 'market-square' ? { ...building, status: 'neglected' } : building,
      ),
    },
  },
};
