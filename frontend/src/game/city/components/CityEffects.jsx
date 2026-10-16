import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

const VIRUS_KEYS = ["disease", "virus", "epidemic", "outbreak", "pandemic"];
const FLOOD_KEYS = ["flood", "storm", "natural_disaster", "monsoon"];
const FIRE_KEYS = ["fire", "wildfire", "blaze"];
const UNREST_KEYS = ["protest", "strike", "unrest", "demonstration"];
const BOOM_KEYS = ["boom", "growth", "construction", "investment", "economy"];

function eventMatches(events, keys) {
  return events.some((event) => {
    const text = `${event?.eventId ?? ""} ${event?.title ?? ""} ${event?.description ?? ""}`.toLowerCase();
    return keys.some((key) => text.includes(key) || event?.visualType === key);
  });
}

function ConcernRing({ position, radius, color, pulse = false }) {
  const ring = useRef();
  useFrame(({ clock }) => {
    if (!pulse || !ring.current) return;
    const wave = (Math.sin(clock.elapsedTime * 2) + 1) / 2;
    ring.current.scale.setScalar(0.96 + wave * 0.09);
  });
  return <group position={position}>
    <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius, radius + 0.18, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.76} side={2} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[radius - 0.08, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.09} side={2} depthWrite={false} />
    </mesh>
  </group>;
}

function SmokeColumn({ index, color = "#6b716d", density = 0.22 }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime * 0.15 + index * 0.23) % 1;
    ref.current.position.y = 1 + t * 5.2;
    ref.current.scale.setScalar(0.38 + t * 1.32);
    ref.current.material.opacity = (1 - t) * density;
  });
  return <mesh ref={ref} position={[-25 + (index % 4) * 1.2, 1, index % 2 ? 14 : 16]}>
    <sphereGeometry args={[1, 9, 7]} />
    <meshStandardMaterial color={color} transparent opacity={density} depthWrite={false} roughness={1} />
  </mesh>;
}

function FloatingParticles({ count, color, center, spread = 7, height = 4, size = 0.13, speed = 1 }) {
  const refs = useRef([]);
  const points = useMemo(() => Array.from({ length: count }, (_, index) => ({
    x: center[0] + Math.sin(index * 13.7) * spread,
    z: center[2] + Math.cos(index * 7.3) * spread,
    phase: index * 2.4,
  })), [center, count, spread]);
  useFrame(({ clock }) => {
    points.forEach((point, index) => {
      const item = refs.current[index];
      if (!item) return;
      item.position.set(point.x + Math.sin(clock.elapsedTime * 0.4 + point.phase) * 0.45,
        0.25 + ((clock.elapsedTime * speed + point.phase) % height),
        point.z + Math.cos(clock.elapsedTime * 0.35 + point.phase) * 0.45);
    });
  });
  return <group>
    {points.map((_, index) => <mesh key={index} ref={(node) => { refs.current[index] = node; }}>
      <sphereGeometry args={[size, 7, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0.54} depthWrite={false} />
    </mesh>)}
  </group>;
}

function UnrestGroup() {
  return <group position={[14, 0.15, -10]}>
    {[-0.58, -0.12, 0.36, 0.74].map((x, i) => <group key={i} position={[x, 0, (i % 2) * 0.28]}>
      <mesh position={[0, 0.42, 0]}><capsuleGeometry args={[0.1, 0.32, 3, 5]} /><meshStandardMaterial color={i % 2 ? "#796654" : "#68787a"} /></mesh>
      <mesh position={[0.02, 0.84, 0]}><sphereGeometry args={[0.14, 7, 6]} /><meshStandardMaterial color="#d1ae8c" /></mesh>
    </group>)}
    <mesh position={[0.3, 1.24, 0]}><boxGeometry args={[0.75, 0.38, 0.06]} /><meshStandardMaterial color="#c46d56" /></mesh>
    <mesh position={[0.3, 1.23, 0.04]}><boxGeometry args={[0.045, 0.6, 0.045]} /><meshStandardMaterial color="#706458" /></mesh>
  </group>;
}

function Flooding() {
  const water = useRef();
  useFrame(({ clock }) => {
    if (water.current) water.current.material.opacity = 0.25 + (Math.sin(clock.elapsedTime * 1.4) + 1) * 0.035;
  });
  return <group>
    {[[-13, -6, 7.5, 3.5], [12, 8, 6.5, 3.2], [27, -14, 4.5, 2.5]].map(([x, z, sx, sz], i) => <group key={i} position={[x, 0.145 + i * 0.002, z]}>
      <mesh ref={i === 0 ? water : null} rotation={[-Math.PI / 2, 0, 0]} scale={[sx, sz, 1]}>
        <circleGeometry args={[1, 32]} /><meshStandardMaterial color="#648f9b" transparent opacity={0.28} roughness={0.2} metalness={0.22} depthWrite={false} />
      </mesh>
      {[1.1, 1.8].map((radius) => <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]} scale={[sx, sz, 1]}>
        <ringGeometry args={[radius, radius + 0.035, 36]} /><meshBasicMaterial color="#b2d1cb" transparent opacity={0.28} side={2} depthWrite={false} />
      </mesh>)}
    </group>)}
  </group>;
}

function ConstructionActivity({ quality }) {
  return <group>
    {[[-17, 0, -15], [17, 0, 15]].map(([x, y, z], index) => <group key={index} position={[x, y, z]}>
      <mesh position={[0, 1.3, 0]}><boxGeometry args={[3.4, 2.6, 2.6]} /><meshStandardMaterial color="#bd9c73" roughness={0.88} /></mesh>
      <mesh position={[0, 2.65, 0]}><boxGeometry args={[3.65, 0.12, 2.85]} /><meshStandardMaterial color="#a76f51" roughness={0.8} /></mesh>
      <mesh position={[1.65, 2.15, 0]}><boxGeometry args={[0.09, 1.1, 0.09]} /><meshStandardMaterial color="#d4ac56" /></mesh>
      <mesh position={[0.92, 2.67, 0]} rotation={[0, 0, Math.PI / 2]}><boxGeometry args={[0.09, 1.5, 0.09]} /><meshStandardMaterial color="#d4ac56" /></mesh>
      {quality !== "low" && <mesh position={[1.55, 1.65, 0]}><boxGeometry args={[0.08, 0.7, 0.08]} /><meshStandardMaterial color="#d4ac56" /></mesh>}
    </group>)}
  </group>;
}

export function CityEffects({ pollutionLevel = 20, unrestLevel = 0, events = [], cityStatus = "active", quality = "medium" }) {
  const smog = Math.max(0, Math.min(100, pollutionLevel));
  const unrest = Math.max(0, Math.min(100, unrestLevel));
  const virus = eventMatches(events, VIRUS_KEYS);
  const flood = eventMatches(events, FLOOD_KEYS);
  const fire = eventMatches(events, FIRE_KEYS);
  const protest = eventMatches(events, UNREST_KEYS);
  const boom = eventMatches(events, BOOM_KEYS);
  const conflict = eventMatches(events, ["conflict"]);
  const crime = eventMatches(events, ["crime"]);
  const infrastructure = eventMatches(events, ["infrastructure"]);
  const diplomacy = eventMatches(events, ["diplomacy"]);
  const education = eventMatches(events, ["education"]);
  const culture = eventMatches(events, ["culture"]);
  const environment = eventMatches(events, ["environment"]);
  const particleScale = quality === "low" ? 0.45 : quality === "medium" ? 0.72 : 1;
  const isLost = cityStatus === "lost";
  const isWon = cityStatus === "won";

  return <group>
    {smog > 35 && Array.from({ length: Math.min(7, 2 + Math.floor(smog / 16)) }, (_, index) => <SmokeColumn key={`smog-${index}`} index={index} density={Math.min(0.25, smog / 400)} />)}
    {smog > 60 && <ConcernRing position={[-25, 0.15, 14]} radius={3.3} color="#b66d4c" />}
    {unrest > 42 && <><ConcernRing position={[14, 0.16, -11]} radius={2.4} color="#ce6457" pulse /><UnrestGroup /></>}
    {virus && <>
      <ConcernRing position={[-14, 0.16, 0]} radius={4.5} color="#9e9c55" pulse />
      <mesh position={[-14, 2.4, 0]}><sphereGeometry args={[5, 18, 12]} /><meshStandardMaterial color="#9fa55d" transparent opacity={0.1} depthWrite={false} /></mesh>
      <FloatingParticles count={Math.round(23 * particleScale)} color="#b1bd70" center={[-14, 0, 0]} spread={6} height={5.5} size={0.11} speed={0.48} />
    </>}
    {flood && <><Flooding /><FloatingParticles count={Math.round(12 * particleScale)} color="#b9d9d5" center={[0, 0, 8]} spread={19} height={0.6} size={0.08} speed={0.3} /></>}
    {fire && <>
      <ConcernRing position={[26, 0.16, -14]} radius={3.4} color="#db744b" pulse />
      {Array.from({ length: quality === "low" ? 3 : 6 }, (_, index) => <SmokeColumn key={`fire-${index}`} index={index + 8} color="#594b40" density={0.34} />)}
      <FloatingParticles count={Math.round(15 * particleScale)} color="#e78948" center={[26, 0, -14]} spread={3.5} height={3} size={0.1} speed={0.75} />
    </>}
    {protest && <><ConcernRing position={[14, 0.16, -11]} radius={2.4} color="#ce6457" pulse /><UnrestGroup /></>}
    {boom && <><ConstructionActivity quality={quality} /><FloatingParticles count={Math.round(9 * particleScale)} color="#e5c577" center={[0, 0, 0]} spread={22} height={3.5} size={0.07} speed={0.36} /></>}
    {conflict && <><ConcernRing position={[-25, 0.17, 14]} radius={4.2} color="#bd5949" pulse />{Array.from({ length: quality === "low" ? 2 : 4 }, (_, index) => <SmokeColumn key={`conflict-${index}`} index={index + 18} color="#554b46" density={0.3} />)}<FloatingParticles count={Math.round(10 * particleScale)} color="#d27a50" center={[-25, 0, 14]} spread={4} height={3.2} size={0.09} speed={0.55} /></>}
    {crime && <group position={[14, 0.18, -11]}><ConcernRing position={[0, 0, 0]} radius={3} color="#d16b55" pulse /><pointLight position={[0, 1.5, 0]} color="#e35f54" intensity={1.5} distance={7} /><pointLight position={[1.4, 1.5, 0]} color="#638ac6" intensity={1.2} distance={7} /></group>}
    {infrastructure && <group position={[0, 0.17, -21]}><ConcernRing position={[0, 0, 0]} radius={3.5} color="#e0a34d" pulse />{[-1.4, -0.45, 0.5, 1.45].map((x) => <mesh key={x} position={[x, 0.34, 0]}><coneGeometry args={[0.22, 0.7, 6]} /><meshStandardMaterial color="#e19448" roughness={0.75} /></mesh>)}<mesh position={[0, 0.53, 0]}><boxGeometry args={[4.2, 0.13, 0.12]} /><meshStandardMaterial color="#e8c171" /></mesh></group>}
    {diplomacy && <group position={[14, 0.18, -14]}>{[-1.35, 1.35].map((x, index) => <group key={x} position={[x, 0, 0]}><mesh position={[0, 1.25, 0]}><cylinderGeometry args={[0.035, 0.045, 2.5, 6]} /><meshStandardMaterial color="#77776d" /></mesh><mesh position={[0.42, 2.05, 0]}><boxGeometry args={[0.82, 0.42, 0.035]} /><meshStandardMaterial color={index ? "#d2b662" : "#678c81"} /></mesh></group>)}<ConcernRing position={[0, 0, 0]} radius={3.8} color="#c6ab63" /></group>}
    {education && <><ConcernRing position={[0, 0.17, -14]} radius={3.2} color="#669db0" pulse /><FloatingParticles count={Math.round(8 * particleScale)} color="#e6d39c" center={[0, 0, -14]} spread={2.5} height={1.8} size={0.07} speed={0.3} /></>}
    {culture && <FloatingParticles count={Math.round(quality === "low" ? 9 : 19 * particleScale)} color="#e9c978" center={[0, 0, 0]} spread={17} height={5} size={0.1} speed={0.28} />}
    {environment && <><ConcernRing position={[-25, 0.16, 14]} radius={4} color="#7a9b67" pulse /><FloatingParticles count={Math.round(12 * particleScale)} color="#9fb978" center={[-25, 0, 14]} spread={5} height={2.5} size={0.08} speed={0.25} /></>}
    {isWon && <FloatingParticles count={Math.round(25 * particleScale)} color="#f1d58c" center={[0, 0, 0]} spread={28} height={10} size={0.09} speed={0.22} />}
    {isLost && <>
      <mesh position={[0, 14, 0]}><sphereGeometry args={[38, 18, 12]} /><meshBasicMaterial color="#88776e" transparent opacity={0.09} side={2} depthWrite={false} /></mesh>
      <FloatingParticles count={Math.round(8 * particleScale)} color="#a8755e" center={[0, 0, 0]} spread={27} height={7} size={0.08} speed={0.16} />
    </>}
  </group>;
}
