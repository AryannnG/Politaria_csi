import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Matrix4, Object3D, Vector3 } from 'three';
import { getCityFootprints } from './CityBuildings.jsx';
import { isInsideIsland, isNearStreet, terrainHeight } from './cityLayout.js';

function makeTrees(environmentLevel, buildings, sectors, population, season) {
  const footprints = getCityFootprints(buildings, sectors, population);
  const candidates = [];
  let cell = 0;
  for (let z = -86; z <= 86; z += 7.8) for (let x = -86; x <= 86; x += 7.8) {
    const px = x + ((cell * 17) % 7 - 3) * 0.29;
    const pz = z + ((cell * 11) % 9 - 4) * 0.23;
    const id = cell++;
    if (!isInsideIsland(px, pz, 1.7)) continue;
    if (isNearStreet(px, pz, 3.25)) continue;
    const blocked = footprints.some((lot) => Math.abs(px - lot.x) < lot.w / 2 + 1.2 && Math.abs(pz - lot.z) < lot.d / 2 + 1.2);
    if (blocked) continue;
    candidates.push({ x: px, z: pz, index: id, rank: (id * 37) % 101 });
  }
  // Keep parks, courtyards and green pockets distributed through the city.
  candidates.sort((a,b) => a.rank - b.rank || a.index - b.index);
  const count = Math.min(candidates.length, 78 + Math.round(Math.max(0, Math.min(100, environmentLevel)) * 0.5));
  return candidates.slice(0, count).map(({ x, z, index }) => ({
    x, z, size: 0.72 + ((index * 7) % 5) * 0.09, index,
    tint: Math.max(0, Math.min(1, environmentLevel / 100)), season,
  }));
}

function TreeInstances({ trees, season }) {
  const crownRef = useRef();
  const trunkRef = useRef();
  const dummy = useMemo(() => new Object3D(), []);
  const matrix = useMemo(() => new Matrix4(), []);
  useLayoutEffect(() => {
    if (!crownRef.current || !trunkRef.current) return;
    trees.forEach(({ x, z, size, index, tint }, i) => {
      dummy.position.set(x, 0.7 * size + terrainHeight(x,z), z);
      dummy.scale.set(size, size * (1 + (index % 3) * 0.08), size);
      dummy.rotation.set(0, index * 0.73, 0);
      dummy.updateMatrix();
      crownRef.current.setMatrixAt(i, dummy.matrix);
      const hue = season === 2 ? 0.075 + (index % 5) * 0.012 : season === 3 ? 0.31 : season === 0 ? 0.27 + (index % 5) * 0.01 : 0.29 + (index % 5) * 0.009;
      const saturation = season === 3 ? 0.06 : 0.25 + tint * 0.18;
      crownRef.current.setColorAt(i, new Color().setHSL(hue, saturation, 0.36 + tint * 0.12));
      matrix.compose(new Vector3(x, 0.42 * size + terrainHeight(x,z), z), dummy.quaternion, new Vector3(0.18 * size, 0.55 * size, 0.18 * size));
      trunkRef.current.setMatrixAt(i, matrix);
    });
    crownRef.current.instanceMatrix.needsUpdate = true;
    trunkRef.current.instanceMatrix.needsUpdate = true;
    if (crownRef.current.instanceColor) crownRef.current.instanceColor.needsUpdate = true;
  }, [trees, dummy, matrix, season]);
  return <>
    <instancedMesh ref={trunkRef} args={[undefined, undefined, trees.length]} castShadow>
      <cylinderGeometry args={[0.14, 0.2, 1, 5]} /><meshStandardMaterial color="#76624d" roughness={1} />
    </instancedMesh>
    <instancedMesh ref={crownRef} args={[undefined, undefined, trees.length]} castShadow>
      <icosahedronGeometry args={[0.94, 1]} /><meshStandardMaterial color="#73916c" roughness={0.98} />
    </instancedMesh>
  </>;
}

export function Greenery({ environmentLevel = 68, buildings = [], sectors = {}, population = 10000, season = 1 }) {
  const trees = useMemo(() => makeTrees(environmentLevel, buildings, sectors, population, season), [environmentLevel, buildings, sectors, population, season]);
  return <TreeInstances trees={trees} season={season} />;
}
