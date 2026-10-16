import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Matrix4, Object3D, Vector3 } from 'three';

function makeTrees(environmentLevel, roadLevel) {
  const trees = [];
  const add = (x, z, scale = 1) => trees.push([x, z, scale]);
  const offset = roadLevel >= 3 ? 4.15 : 3.65;
  // Avenue trees, placed on footpaths and in the neighborhood setbacks.
  for (const road of [-21, -7, 7, 21]) {
    for (let p = -25; p <= 25; p += 5) {
      if (Math.abs(p) < 4) continue;
      add(p, road - offset, 0.78 + ((p + 40) % 3) * 0.12);
      add(road + offset, p, 0.82 + ((p + 30) % 4) * 0.08);
    }
  }
  [[-29, -27], [-28, -25], [-25, -28], [27, -27], [29, -25], [26, -29], [-28, 26], [-25, 29], [28, 28], [25, 26], [26, 12], [27, 17], [25, 21]].forEach(([x, z], i) => add(x, z, 0.9 + (i % 3) * 0.13));
  return trees.map(([x, z, size], index) => ({ x, z, size, index, tint: Math.max(0, Math.min(1, environmentLevel / 100)) }));
}

function TreeInstances({ trees }) {
  const crownRef = useRef();
  const trunkRef = useRef();
  const dummy = useMemo(() => new Object3D(), []);
  const matrix = useMemo(() => new Matrix4(), []);
  useLayoutEffect(() => {
    if (!crownRef.current || !trunkRef.current) return;
    trees.forEach(({ x, z, size, index, tint }, i) => {
      dummy.position.set(x, 0.7 * size, z);
      dummy.scale.set(size, size * (1 + (index % 3) * 0.08), size);
      dummy.rotation.set(0, index * 0.73, 0);
      dummy.updateMatrix();
      crownRef.current.setMatrixAt(i, dummy.matrix);
      const green = new Color().setHSL(0.29 + (index % 5) * 0.009, 0.22 + tint * 0.2, 0.35 + tint * 0.15);
      crownRef.current.setColorAt(i, green);
      matrix.compose(new Vector3(x, 0.42 * size, z), dummy.quaternion, new Vector3(0.18 * size, 0.55 * size, 0.18 * size));
      trunkRef.current.setMatrixAt(i, matrix);
    });
    crownRef.current.instanceMatrix.needsUpdate = true;
    trunkRef.current.instanceMatrix.needsUpdate = true;
    if (crownRef.current.instanceColor) crownRef.current.instanceColor.needsUpdate = true;
  }, [trees, dummy, matrix]);
  return <>
    <instancedMesh ref={trunkRef} args={[undefined, undefined, trees.length]} castShadow>
      <cylinderGeometry args={[0.14, 0.2, 1, 5]} /><meshStandardMaterial color="#76624d" roughness={1} />
    </instancedMesh>
    <instancedMesh ref={crownRef} args={[undefined, undefined, trees.length]} castShadow>
      <icosahedronGeometry args={[0.94, 1]} /><meshStandardMaterial color="#73916c" roughness={0.98} />
    </instancedMesh>
  </>;
}

export function Greenery({ environmentLevel = 68, roadLevel = 1 }) {
  const trees = useMemo(() => makeTrees(environmentLevel, roadLevel), [environmentLevel, roadLevel]);
  return <group>
    <TreeInstances trees={trees} />
    <mesh position={[0, -0.2, 0]}><boxGeometry args={[59, 0.15, 59]} /><meshStandardMaterial color={environmentLevel < 35 ? '#8f957f' : '#a4b294'} roughness={1} /></mesh>
  </group>;
}
