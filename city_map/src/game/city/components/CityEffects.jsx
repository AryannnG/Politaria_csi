import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

function SmokePuff({ index, pollutionLevel }) {
  const ref = useRef();
  const phase = index * 1.7;
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime * (0.08 + pollutionLevel / 600) + phase) % 1;
    ref.current.position.y = 2.3 + t * 5.3;
    const size = 0.38 + t * 1.65;
    ref.current.scale.setScalar(size);
    ref.current.material.opacity = (1 - t) * Math.min(0.24, pollutionLevel / 380);
  });
  return <mesh ref={ref} position={[-27 + index * 1.1, 2, 15 + (index % 2) * 0.8]}>
    <sphereGeometry args={[1, 7, 5]} /><meshStandardMaterial color="#676f6d" transparent opacity={0.12} depthWrite={false} roughness={1} />
  </mesh>;
}

function ConcernRing({ position, radius, color }) {
  return <group position={position}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[radius, radius + 0.2, 40]} /><meshBasicMaterial color={color} transparent opacity={0.78} side={2} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[radius - 0.08, 40]} /><meshBasicMaterial color={color} transparent opacity={0.08} side={2} depthWrite={false} /></mesh>
  </group>;
}

function UnrestGroup() {
  const group = useRef();
  useFrame(({ clock }) => {
    if (group.current) group.current.position.y = 0.14 + Math.sin(clock.elapsedTime * 2) * 0.025;
  });
  return <group ref={group} position={[14, 0, -10]}>
    {[-0.58, -0.12, 0.36, 0.74].map((x, i) => <group key={i} position={[x, 0, (i % 2) * 0.28]}>
      <mesh position={[0, 0.42, 0]}><capsuleGeometry args={[0.1, 0.32, 3, 5]} /><meshStandardMaterial color={i % 2 ? '#796654' : '#68787a'} /></mesh>
      <mesh position={[0.02, 0.84, 0]}><sphereGeometry args={[0.14, 7, 6]} /><meshStandardMaterial color="#d1ae8c" /></mesh>
    </group>)}
    <mesh position={[0.3, 1.24, 0]}><boxGeometry args={[0.75, 0.38, 0.06]} /><meshStandardMaterial color="#c46d56" /></mesh>
    <mesh position={[0.3, 1.23, 0.04]}><boxGeometry args={[0.045, 0.6, 0.045]} /><meshStandardMaterial color="#706458" /></mesh>
  </group>;
}

export function CityEffects({ pollutionLevel = 20, unrestLevel = 0 }) {
  const smog = useMemo(() => Math.max(0, Math.min(100, pollutionLevel)), [pollutionLevel]);
  const unrest = Math.max(0, Math.min(100, unrestLevel));
  return <group>
    {smog > 35 && Array.from({ length: Math.min(7, 2 + Math.floor(smog / 16)) }, (_, index) => <SmokePuff key={index} index={index} pollutionLevel={smog} />)}
    {pollutionLevel > 60 && <mesh position={[-23, 4.4, 15]}><sphereGeometry args={[5.5, 12, 7]} /><meshStandardMaterial color="#a39b80" transparent opacity={0.08} depthWrite={false} /></mesh>}
    {unrest > 42 && <><ConcernRing position={[14, 0.16, -11]} radius={2.4} color="#ce6457" /><UnrestGroup /></>}
    {pollutionLevel > 55 && <ConcernRing position={[-26, 0.15, 14]} radius={3.3} color="#b66d4c" />}
  </group>;
}
