import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const colors = ['#d97d50', '#e4c36c', '#577c82', '#f0eee0', '#aa554c', '#426571', '#d2d1c4'];

function Car({ index, road, lane, horizontal, trafficLevel, roadLevel }) {
  const ref = useRef();
  const config = useMemo(() => ({
    start: -26 + ((index * 7.67) % 52),
    speed: 2.3 + ((index * 13) % 6) * 0.18,
    direction: index % 3 === 0 ? -1 : 1,
    color: colors[index % colors.length],
    bus: roadLevel >= 2 && index % 8 === 2,
  }), [index, roadLevel]);
  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    const congestion = Math.max(0.5, 1 - Math.min(0.68, trafficLevel / 150) + roadLevel * 0.055);
    config.start += delta * config.speed * congestion * config.direction;
    if (config.start > 28) config.start = -28;
    if (config.start < -28) config.start = 28;
    const a = horizontal ? config.start : road + lane;
    const b = horizontal ? road + lane : config.start;
    ref.current.position.set(a, 0.12 + Math.sin(clock.elapsedTime * 5 + index) * 0.008, b);
    ref.current.rotation.y = horizontal ? (config.direction > 0 ? 0 : Math.PI) : (config.direction > 0 ? -Math.PI / 2 : Math.PI / 2);
  });
  const length = config.bus ? 1.45 : 0.85;
  const width = config.bus ? 0.5 : 0.42;
  return <group ref={ref}>
    <mesh position={[0, 0.25, 0]} castShadow><boxGeometry args={[length, config.bus ? 0.42 : 0.28, width]} /><meshStandardMaterial color={config.color} roughness={0.65} /></mesh>
    <mesh position={[-0.05, 0.48, 0]}><boxGeometry args={[length * 0.47, 0.21, width * 0.82]} /><meshStandardMaterial color="#a8bdba" roughness={0.32} metalness={0.1} /></mesh>
    {[-1, 1].map((side) => <mesh key={side} position={[0.26, 0.12, side * (width / 2 - 0.02)]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.11, 0.11, 0.08, 8]} /><meshStandardMaterial color="#3d4341" roughness={0.95} /></mesh>)}
  </group>;
}

export function Vehicles({ trafficLevel = 30, roadLevel = 1 }) {
  const count = Math.max(3, Math.min(27, Math.round(3 + trafficLevel * 0.3)));
  const roads = [-21, -7, 7, 21];
  return <group>
    {Array.from({ length: count }, (_, index) => {
      const horizontal = index % 2 === 0;
      const road = roads[Math.floor(index / 2) % roads.length];
      const lane = ((index % 4) < 2 ? -1 : 1) * (0.62 + roadLevel * 0.11);
      return <Car key={index} index={index} road={road} lane={lane} horizontal={horizontal} trafficLevel={trafficLevel} roadLevel={roadLevel} />;
    })}
  </group>;
}
