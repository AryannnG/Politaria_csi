import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { Object3D } from 'three';

const roadLines = [-21, -7, 7, 21];

function Road({ horizontal, at, width, roadLevel }) {
  const length = 55;
  const centerRef = useRef();
  const laneRef = useRef();
  const dummy = useMemo(() => new Object3D(), []);
  const laneOffsets = useMemo(() => roadLevel >= 3 ? [-0.31, -0.1, 0.1, 0.31] : roadLevel >= 2 ? [-0.25, 0.25] : [-0.2], [roadLevel]);
  useLayoutEffect(() => {
    if (!centerRef.current || !laneRef.current) return;
    for (let index = 0; index < 22; index += 1) {
      const p = -26 + index * 2.45;
      dummy.position.set(horizontal ? p : at, 0.105, horizontal ? at : p);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, horizontal ? 0 : Math.PI / 2, 0);
      dummy.updateMatrix();
      centerRef.current.setMatrixAt(index, dummy.matrix);
    }
    let laneIndex = 0;
    laneOffsets.forEach((offset) => {
      for (let index = 0; index < 22; index += 1) {
        const p = -26 + index * 2.45;
        dummy.position.set(horizontal ? p : at + width * offset, 0.12, horizontal ? at + width * offset : p);
        dummy.rotation.set(0, horizontal ? 0 : Math.PI / 2, 0);
        dummy.updateMatrix();
        laneRef.current.setMatrixAt(laneIndex, dummy.matrix);
        laneIndex += 1;
      }
    });
    centerRef.current.instanceMatrix.needsUpdate = true;
    laneRef.current.instanceMatrix.needsUpdate = true;
  }, [at, dummy, horizontal, laneOffsets, width]);
  const center = horizontal ? [0, 0.025, at] : [at, 0.025, 0];
  const scale = horizontal ? [length, 0.12, width] : [width, 0.12, length];
  return <group>
    <mesh position={center} receiveShadow><boxGeometry args={scale} /><meshStandardMaterial color="#62696a" roughness={0.94} /></mesh>
    <mesh position={[center[0], 0.094, center[2]]}>
      <boxGeometry args={horizontal ? [length, 0.012, width * 0.57] : [width * 0.57, 0.012, length]} />
      <meshBasicMaterial color="#596163" />
    </mesh>
    <instancedMesh ref={centerRef} args={[undefined, undefined, 22]}>
      <boxGeometry args={[0.95, 0.018, 0.11]} /><meshBasicMaterial color="#e9dfb3" />
    </instancedMesh>
    {[-1, 1].map((side) => <mesh key={side} position={horizontal ? [0, 0.106, at + side * width * 0.33] : [at + side * width * 0.33, 0.106, 0]}>
      <boxGeometry args={horizontal ? [length, 0.016, 0.085] : [0.085, 0.016, length]} />
      <meshBasicMaterial color="#e8e0c8" />
    </mesh>)}
    <instancedMesh ref={laneRef} args={[undefined, undefined, laneOffsets.length * 22]}>
      <boxGeometry args={[0.45, 0.025, 0.075]} /><meshBasicMaterial color="#eee5c9" />
    </instancedMesh>
  </group>;
}

function Crosswalk({ x, z, horizontal = true }) {
  const stripesRef = useRef();
  const dummy = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    if (!stripesRef.current) return;
    for (let index = 0; index < 7; index += 1) {
      dummy.position.set(-1.45 + index * 0.48, 0, 0);
      dummy.updateMatrix();
      stripesRef.current.setMatrixAt(index, dummy.matrix);
    }
    stripesRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);
  return <group position={[x, 0.13, z]} rotation={horizontal ? [0, 0, 0] : [0, Math.PI / 2, 0]}>
    <instancedMesh ref={stripesRef} args={[undefined, undefined, 7]}><boxGeometry args={[0.23, 0.022, 1.35]} /><meshBasicMaterial color="#f4f0df" /></instancedMesh>
  </group>;
}

export function RoadNetwork({ roadLevel = 1 }) {
  const level = Math.max(0, Math.min(4, roadLevel));
  const width = 4.2 + level * 0.48;
  const footpathOffset = width / 2 + (level >= 3 ? 1.32 : 0.64);
  return <group>
    <mesh position={[0, -0.28, 0]} receiveShadow><boxGeometry args={[57, 0.55, 57]} /><meshStandardMaterial color="#d6d1be" roughness={1} /></mesh>
    {roadLines.map((at) => <group key={`road-${at}`}>
      <Road horizontal at={at} width={width} roadLevel={level} />
      <Road at={at} width={width} roadLevel={level} />
      <mesh position={[0, 0.12, at + footpathOffset]}><boxGeometry args={[55, 0.04, 0.72]} /><meshStandardMaterial color="#b9b8a9" roughness={1} /></mesh>
      <mesh position={[0, 0.12, at - footpathOffset]}><boxGeometry args={[55, 0.04, 0.72]} /><meshStandardMaterial color="#b9b8a9" roughness={1} /></mesh>
      <mesh position={[at + footpathOffset, 0.12, 0]}><boxGeometry args={[0.72, 0.04, 55]} /><meshStandardMaterial color="#b9b8a9" roughness={1} /></mesh>
      <mesh position={[at - footpathOffset, 0.12, 0]}><boxGeometry args={[0.72, 0.04, 55]} /><meshStandardMaterial color="#b9b8a9" roughness={1} /></mesh>
    </group>)}
    {roadLines.slice(0, 3).flatMap((at) => [[at + width / 2, at - width / 2], [at - width / 2, at + width / 2]].map(([x, z], i) => <Crosswalk key={`${at}-${i}`} x={x} z={z} horizontal={i === 0} />))}
    {level >= 3 && <group>{[-21, -7, 7, 21].map((at) => <group key={`bike-${at}`}>
      <mesh position={[0, 0.12, at + width / 2 + 0.38]}><boxGeometry args={[55, 0.025, 0.48]} /><meshStandardMaterial color="#a9c7a7" /></mesh>
      <mesh position={[at + width / 2 + 0.38, 0.12, 0]}><boxGeometry args={[0.48, 0.025, 55]} /><meshStandardMaterial color="#a9c7a7" /></mesh>
    </group>)}</group>}
    <group position={[0, 0.18, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[3.8, 32]} /><meshStandardMaterial color="#d4c7a2" /></mesh>
      <mesh position={[0, 0.34, 0]}><cylinderGeometry args={[0.48, 0.62, 0.68, 8]} /><meshStandardMaterial color="#b39a6b" /></mesh>
      <mesh position={[0, 0.81, 0]}><sphereGeometry args={[0.28, 10, 7]} /><meshStandardMaterial color="#73977c" /></mesh>
    </group>
  </group>;
}
