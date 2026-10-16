import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, Vector3 } from 'three';
import { CITY_STREETS } from './RoadNetwork.jsx';
import { terrainHeight } from './cityLayout.js';

const colors = ['#d97d50', '#e4c36c', '#577c82', '#f0eee0', '#aa554c', '#426571', '#d2d1c4'];

function Car({ index, path, trafficLevel, roadLevel }) {
  const ref = useRef();
  const route = useMemo(() => new CatmullRomCurve3(path.points.map(([x,z]) => new Vector3(x,0,z)), false, 'centripetal'), [path]);
  const config = useMemo(() => ({
    progress: ((index * 0.173) % 1),
    speed: 2.2 + ((index * 13) % 7) * 0.15,
    direction: index % 4 === 0 ? -1 : 1,
    color: colors[index % colors.length],
    lane: (index % 2 ? 1 : -1) * Math.min(0.8, path.width * 0.12 + roadLevel * 0.08),
    bus: roadLevel >= 2 && index % 8 === 2,
  }), [index, path.width, roadLevel]);
  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    const congestion = Math.max(0.46, 1 - Math.min(0.66, trafficLevel / 155) + roadLevel * 0.045);
    const routeLength = route.getLength();
    if (!Number.isFinite(routeLength) || routeLength < 0.01) return;
    const nextProgress = config.progress + delta * config.speed * congestion * config.direction / routeLength;
    config.progress = ((nextProgress % 1) + 1) % 1;
    const point = route.getPointAt(config.progress);
    const tangent = route.getTangentAt(config.progress).normalize();
    const nx = -tangent.z; const nz = tangent.x;
    ref.current.position.set(point.x + nx * config.lane, 0.035 + terrainHeight(point.x, point.z) + Math.sin(clock.elapsedTime * 5 + index) * 0.008, point.z + nz * config.lane);
    // Car meshes are authored along local +X; rotate that axis onto the road tangent.
    ref.current.rotation.y = Math.atan2(-tangent.z, tangent.x) + (config.direction < 0 ? Math.PI : 0);
  });
  const length = config.bus ? 1.52 : 0.9;
  const width = config.bus ? 0.5 : 0.43;
  return <group ref={ref}>
    <mesh position={[0, 0.25, 0]} castShadow><boxGeometry args={[length, config.bus ? 0.42 : 0.28, width]} /><meshStandardMaterial color={config.color} roughness={0.65} /></mesh>
    <mesh position={[-0.05, 0.48, 0]}><boxGeometry args={[length * 0.47, 0.21, width * 0.82]} /><meshStandardMaterial color="#a8bdba" roughness={0.32} metalness={0.1} /></mesh>
    {[-1, 1].flatMap((side) => [-1, 1].map((axle) => <mesh key={`${side}-${axle}`} position={[axle * length * 0.34, 0.12, side * (width / 2 - 0.02)]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.11, 0.11, 0.08, 8]} /><meshStandardMaterial color="#3d4341" roughness={0.95} /></mesh>))}
  </group>;
}

export function Vehicles({ trafficLevel = 30, roadLevel = 1, quality = 'medium' }) {
  const qualityFactor = quality === 'low' ? 0.58 : quality === 'medium' ? 0.82 : 1;
  const count = Math.max(8, Math.min(64, Math.round((28 + trafficLevel * 0.72) * qualityFactor)));
  return <group>{Array.from({ length: count }, (_, index) => {
    const path = CITY_STREETS[(index * 3 + Math.floor(index / 3)) % CITY_STREETS.length];
    return <Car key={index} index={index} path={path} trafficLevel={trafficLevel} roadLevel={roadLevel} />;
  })}</group>;
}
