// Shared deterministic site plan for the map renderer. Simulation state remains the
// authority for upgrades and buildings; this module only chooses safe visual plots.
export const ISLAND_SHORELINE = [
  [-84, -70], [-75, -82], [-57, -82], [-42, -76], [-28, -80], [-8, -74],
  [10, -79], [28, -72], [48, -75], [64, -67], [79, -57], [75, -43],
  [87, -30], [80, -15], [87, 0], [79, 14], [83, 26], [68, 35],
  [74, 47], [60, 55], [55, 70], [38, 70], [27, 83], [8, 77],
  [-5, 85], [-22, 76], [-39, 80], [-54, 67], [-70, 63], [-79, 49],
  [-89, 34], [-81, 20], [-88, 4], [-80, -12], [-85, -31], [-72, -47], [-79, -61],
];

export function isInsideIsland(x, z, margin = 0) {
  let inside = false;
  for (let i = 0, j = ISLAND_SHORELINE.length - 1; i < ISLAND_SHORELINE.length; j = i, i += 1) {
    const [xi, zi] = ISLAND_SHORELINE[i];
    const [xj, zj] = ISLAND_SHORELINE[j];
    const crosses = (zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi;
    if (crosses) inside = !inside;
  }
  if (!inside || margin <= 0) return inside;
  let nearest = Infinity;
  for (let i = 0; i < ISLAND_SHORELINE.length; i += 1) {
    const [ax, az] = ISLAND_SHORELINE[i];
    const [bx, bz] = ISLAND_SHORELINE[(i + 1) % ISLAND_SHORELINE.length];
    const dx = bx - ax;
    const dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    nearest = Math.min(nearest, Math.hypot(x - (ax + t * dx), z - (az + t * dz)));
  }
  return nearest >= margin;
}

const GRID = [-72, -48, -24, 0, 24, 48, 72];
const samples = Array.from({ length: 97 }, (_, index) => -96 + index * 2);

function clipStreetRuns(points, margin) {
  const runs = [];
  let run = [];
  points.forEach((point) => {
    if (isInsideIsland(point[0], point[1], margin)) run.push(point);
    else if (run.length) {
      if (run.length >= 4) runs.push(run);
      run = [];
    }
  });
  if (run.length >= 4) runs.push(run);
  return runs;
}

function makeStreets(axis) {
  const vertical = axis === 'vertical';
  const roadWidth = 3.6;
  return GRID.flatMap((at, index) => {
    const width = at === 0 ? 5.8 : roadWidth;
    const bend = index % 3 === 1 ? 0.22 : 0.08;
    const raw = samples.map((along) => vertical
      ? [at + Math.sin(along / 24 + index * 0.7) * bend, along]
      : [along, at + Math.sin(along / 25 + index * 0.8) * bend]);
    return clipStreetRuns(raw, width / 2 + 2.15).map((points, part) => ({
      id: `${axis}-${index}-${part}`,
      axis,
      at,
      width,
      points,
    }));
  });
}

export const CITY_STREETS = [...makeStreets('vertical'), ...makeStreets('horizontal')];

export function isNearStreet(x, z, clearance = 4.8) {
  return CITY_STREETS.some((street) => {
    const threshold = street.width / 2 + clearance;
    for (let i = 1; i < street.points.length; i += 1) {
      const [ax, az] = street.points[i - 1];
      const [bx, bz] = street.points[i];
      const dx = bx - ax;
      const dz = bz - az;
      const denominator = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / denominator));
      if (Math.hypot(x - (ax + t * dx), z - (az + t * dz)) < threshold) return true;
    }
    return false;
  });
}

const candidateSites = [];
for (let z = -88; z <= 88; z += 3.1) {
  for (let x = -88; x <= 88; x += 3.1) {
    const seed = candidateSites.length;
    const jitterX = ((seed * 37) % 7 - 3) * 0.055;
    const jitterZ = ((seed * 23) % 7 - 3) * 0.055;
    const point = { x: x + jitterX, z: z + jitterZ, seed };
    if (isInsideIsland(point.x, point.z, 2.4) && !isNearStreet(point.x, point.z, 1.25)) candidateSites.push(point);
  }
}

export const CITY_BUILD_SITES = candidateSites.sort((a, b) => ((a.seed * 73) % 997) - ((b.seed * 73) % 997) || a.seed - b.seed);

const PREFERRED = [
  [-12, -12], [12, -12], [-36, -12], [36, -12], [-12, 36], [12, 36], [36, 12], [-36, 12],
  [-60, -36], [60, -36], [-60, 36], [60, 36], [-60, 12], [60, 12], [12, 60], [-12, -60],
];
const BASE_DIMENSIONS = [
  [6.3, 5.2], [5.7, 5.6], [6.2, 5], [5.1, 5.4], [6.1, 4.8], [5.2, 5.5], [5.2, 5.3], [6.1, 5.3],
  [5.5, 5.2], [5, 5.1], [5.6, 5.5], [6.1, 5.2], [6, 6], [5.1, 5.1], [5.4, 5.1], [6, 5],
];

function overlaps(point, width, depth, occupied, gap = 0.75) {
  return occupied.some((lot) => Math.abs(point.x - lot.x) < (width + lot.width) / 2 + gap
    && Math.abs(point.z - lot.z) < (depth + lot.depth) / 2 + gap);
}

const baseLotSites = [];
BASE_DIMENSIONS.forEach(([width, depth], index) => {
  const [preferX, preferZ] = PREFERRED[index];
  const reserveWidth = width * 1.38;
  const reserveDepth = depth * 1.38;
  const preferredOrder = CITY_BUILD_SITES.slice().sort((a, b) => Math.hypot(a.x - preferX, a.z - preferZ) - Math.hypot(b.x - preferX, b.z - preferZ));
  const point = preferredOrder.find((candidate) => isInsideIsland(candidate.x, candidate.z, Math.max(reserveWidth, reserveDepth) / 2 + 1.2)
    && !isNearStreet(candidate.x, candidate.z, Math.max(reserveWidth, reserveDepth) / 2 + 1.2)
    && !overlaps(candidate, reserveWidth, reserveDepth, baseLotSites));
  baseLotSites.push({ x: point?.x ?? preferX, z: point?.z ?? preferZ, width, depth, reserveWidth, reserveDepth });
});
export const BASE_LOT_SITES = baseLotSites;

export function findOpenCitySite(occupied, width, depth, seed = 0) {
  const offset = Math.abs(seed * 37) % CITY_BUILD_SITES.length;
  for (let step = 0; step < CITY_BUILD_SITES.length; step += 1) {
    const point = CITY_BUILD_SITES[(offset + step) % CITY_BUILD_SITES.length];
    const clearance = Math.max(width, depth) / 2 + 1.2;
    if (!isInsideIsland(point.x, point.z, clearance) || isNearStreet(point.x, point.z, clearance)) continue;
    if (!overlaps(point, width, depth, occupied, 0.75)) return point;
  }
  return null;
}

// Visual-only terrain elevation used to seat scene meshes on the rendered hills.
export function terrainHeight(x, z) {
  const hills = [[-24,-36,1.05,8],[24,-36,1.15,9],[-48,36,0.95,8],[48,36,1.2,9],[0,48,0.85,7]];
  return hills.reduce((sum, [hx, hz, height, radius]) => {
    const distance = Math.hypot(x - hx, z - hz);
    return sum + (distance < radius ? height * Math.sqrt(1 - (distance * distance) / (radius * radius)) : 0);
  }, 0);
}