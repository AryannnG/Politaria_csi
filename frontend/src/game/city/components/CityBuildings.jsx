import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Object3D } from 'three';
import { Clone, useGLTF } from '@react-three/drei';
import { makeCityMaps, makeCityTexture } from './cityTextures.js';
import { BASE_LOT_SITES, CITY_BUILD_SITES, isNearStreet, terrainHeight } from './cityLayout.js';

const SUBURBAN_MODELS = 'abcdefghijklmnopqrstu'.split('').map((name) => `/assets/kenney-city-suburban/building-type-${name}.glb`);
const COMMERCIAL_MODELS = 'abcde'.split('').map((name) => `/assets/kenney-city-commercial/building-skyscraper-${name}.glb`);
const MODEL_URLS = [...SUBURBAN_MODELS, ...COMMERCIAL_MODELS];
const MODEL_SIZE = [
  [1.3,.83,1.03],[1.83,1.14,1.14],[1.29,1.03,1.03],[1.76,1.24,1.03],[1.3,1.14,1.03],[1.43,1.14,1.41],[1.45,.77,1.18],
  [1.3,.74,.92],[1.29,.74,1.03],[1.37,1.04,.92],[.92,1.15,1.02],[1.03,1.05,1.02],[1.43,.74,1.43],[1.78,1.14,1.38],
  [1.27,1.14,1.03],[1.24,.92,.99],[1.24,.92,.89],[1.03,1.14,1.02],[1.41,1.14,1.09],[1.31,1.16,1.41],[1.43,1.14,1.09],
  [1.36,2.88,1.36],[1.36,4.48,1.36],[1.28,4.08,1.39],[1.28,5.47,1.39],[1.29,4.08,1.24],
];

const palette = {
  hospital: ['#f0eee0', '#9dcac3', '#628e91'], clinic: ['#f0e4cf', '#dfa18a', '#b76558'],
  school: ['#e5c280', '#d49655', '#a95342'], commercial: ['#b5d5d8', '#73aeb7', '#426e7a'],
  civic: ['#e6d1a5', '#c7a66e', '#896c49'], residential: ['#dfb897', '#c98e68', '#935d4b'],
  apartment: ['#cad9ce', '#93b4ad', '#55757a'], market: ['#edc27c', '#d18c4e', '#ae523d'],
  industry: ['#adb8a7', '#849783', '#596e63'], park: ['#8cbb72', '#619656', '#3f714a'],
  police: ['#b9d2db', '#77a1b0', '#4f7080'], fire: ['#eab08a', '#d87555', '#984739'],
  transport: ['#d0d0b1', '#a4b489', '#75845f'], power: ['#c8c8ae', '#a5b17d', '#74845f'],
  water: ['#c5dfd5', '#82beb4', '#4e898b'], culture: ['#ecd8a8', '#d0aa70', '#966b45'],
  stadium: ['#c6c9bd', '#aab7ad', '#879992'], monument: ['#c9c2b3', '#afa795', '#948a78'],
};

const lots = [
  { id: 'hospital-central', type: 'hospital', x: -20, z: -17, w: 6.3, d: 5.2, h: 3.1, name: 'Northbank General Hospital', description: 'Emergency, inpatient and community care.' },
  { id: 'school-north', type: 'school', x: -4, z: -20, w: 5.7, d: 5.6, h: 2.7, name: 'Riverside Public School', description: 'Primary and secondary education campus.' },
  { id: 'civic-hall', type: 'civic', x: 13, z: -17, w: 6.2, d: 5, h: 4.3, name: 'City Hall', description: 'The seat of city administration.' },
  { id: 'apartments-nw', type: 'apartment', x: -21, z: -2, w: 5.1, d: 5.4, h: 6.2, name: 'Northbank Residences', description: 'Mixed-income housing.' },
  { id: 'market-square', type: 'market', x: -4, z: -2, w: 6.1, d: 4.8, h: 2.8, name: 'Market Square', description: 'Local retail, food and services.' },
  { id: 'tower-central', type: 'commercial', x: 13, z: 0, w: 5.2, d: 5.5, h: 8.6, name: 'Meridian House', description: 'Commercial offices and local employers.' },
  { id: 'clinic-east', type: 'clinic', x: -20, z: 15, w: 5.2, d: 5.3, h: 2.5, name: 'Eastbank Community Clinic', description: 'Walk-in primary care and vaccinations.' },
  { id: 'homes-east', type: 'residential', x: -3, z: 15, w: 6.1, d: 5.3, h: 3.8, name: 'Garden Court', description: 'Neighbourhood homes around a shared courtyard.' },
  { id: 'commerce-east', type: 'commercial', x: 14, z: 16, w: 5.5, d: 5.2, h: 4.9, name: 'Exchange Building', description: 'Shops and professional services.' },
  { id: 'homes-west', type: 'residential', x: -39, z: -25, w: 5, d: 5.1, h: 3.1, name: 'Old Quarter Homes', description: 'Established neighbourhood housing.' },
  { id: 'university-west', type: 'school', x: 37, z: -29, w: 5.6, d: 5.5, h: 4.1, name: 'Technical College', description: 'Vocational training and applied research.' },
  { id: 'warehouse-south', type: 'industry', x: -39, z: 28, w: 6.1, d: 5.2, h: 3.5, name: 'Civic Works Depot', description: 'Maintenance and public works facility.' },
  { id: 'park-south', type: 'park', x: 39, z: 29, w: 6, d: 6, h: 0.4, name: 'Founders Garden', description: 'A small park and public gathering space.' },
  { id: 'apartments-sw', type: 'apartment', x: -38, z: 1, w: 5.1, d: 5.1, h: 5.6, name: 'Canal View Apartments', description: 'Dense housing beside the transit corridor.' },
  { id: 'homes-ne', type: 'residential', x: 38, z: 0, w: 5.4, d: 5.1, h: 3.5, name: 'Maple Street Homes', description: 'Family housing and neighbourhood shops.' },
  { id: 'depot-south', type: 'industry', x: 1, z: 39, w: 6, d: 5, h: 2.7, name: 'Transit Maintenance Depot', description: 'Fleet maintenance and transport operations.' },
].map((lot, index) => ({
  ...lot,
  x: BASE_LOT_SITES[index].x,
  z: BASE_LOT_SITES[index].z,
  w: BASE_LOT_SITES[index].width,
  d: BASE_LOT_SITES[index].depth,
  reserveW: BASE_LOT_SITES[index].reserveWidth,
  reserveD: BASE_LOT_SITES[index].reserveDepth,
}));

function Windows({ width, depth, height, color = '#e8dfc3' }) {
  const rows = Math.max(1, Math.floor(height / 0.74));
  const cols = Math.max(2, Math.floor(width / 0.72));
  const count = rows * cols;
  const frontRef = useRef();
  const sideRef = useRef();
  const dummy = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    if (!frontRef.current || !sideRef.current) return;
    let index = 0;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const x = -width / 2 + 0.42 + col * ((width - 0.55) / cols);
        const y = 0.34 + row * 0.68;
        dummy.position.set(x, y, depth / 2 + 0.012);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        frontRef.current.setMatrixAt(index, dummy.matrix);
        dummy.position.set(width / 2 + 0.012, y, x * depth / width);
        dummy.rotation.set(0, Math.PI / 2, 0);
        dummy.updateMatrix();
        sideRef.current.setMatrixAt(index, dummy.matrix);
        index += 1;
      }
    }
    frontRef.current.instanceMatrix.needsUpdate = true;
    sideRef.current.instanceMatrix.needsUpdate = true;
  }, [cols, count, depth, dummy, height, rows, width]);
  return <group>
    <instancedMesh ref={frontRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.27, 0.28, 0.025]} /><meshBasicMaterial color={color} />
    </instancedMesh>
    <instancedMesh ref={sideRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.27, 0.28, 0.025]} /><meshBasicMaterial color={color} />
    </instancedMesh>
  </group>;
}

function HospitalWings({ level, height }) {
  if (level < 2) return null;
  const wings = Math.min(3, level - 1);
  return <group>
    {Array.from({ length: wings }, (_, index) => <group key={index} position={[(index - (wings - 1) / 2) * 1.82, 0, -2.1]}>
      <mesh position={[0, 0.72 + index * 0.08, 0]} castShadow receiveShadow><boxGeometry args={[1.8, 1.44 + index * 0.16, 2.1]} /><meshStandardMaterial color={index === wings - 1 ? '#bfd1cd' : '#e6e9df'} roughness={0.86} /></mesh>
      <Windows width={1.75} depth={2.05} height={1.2 + index * 0.15} />
    </group>)}
    {level >= 3 && <mesh position={[0, 1.57, 0.06]} castShadow><boxGeometry args={[2.25, 0.16, 1.2]} /><meshStandardMaterial color="#c95f57" roughness={0.7} /></mesh>}
    {level >= 4 && <group position={[1.85, height + 0.46, 0]}>
      <mesh castShadow><cylinderGeometry args={[0.62, 0.62, 0.1, 20]} /><meshStandardMaterial color="#e9e4d1" /></mesh>
      <mesh position={[0, 0.1, 0]}><ringGeometry args={[0.32, 0.41, 24]} /><meshBasicMaterial color="#cf655b" side={2} /></mesh>
    </group>}
  </group>;
}

function Building({ item, selectedId, onSelect, construction }) {
  const level = Math.max(1, Math.min(5, item.level ?? 1));
  const [base, upper, roof] = palette[item.type] ?? palette.civic;
  const upgraded = item.type === 'hospital' || item.type === 'clinic' ? level : item.type === 'school' ? level : 1;
  const densityType = ['commercial', 'apartment', 'residential', 'industry', 'school', 'civic'].includes(item.type);
  const height = item.type === 'hospital' ? 2.25 + level * 0.42 : item.type === 'clinic' ? 2.35 + level * 0.25 : item.h * (densityType ? 1 + (level - 1) * (item.type === 'school' ? 0.15 : 0.2) : 1);
  const width = item.w * (item.type === 'hospital' ? 0.88 + level * 0.08 : densityType ? 1 + (level - 1) * 0.045 : 1);
  const depth = item.d * (item.type === 'hospital' ? 0.9 + level * 0.06 : densityType ? 1 + (level - 1) * 0.035 : 1);
  const isSelected = selectedId === item.id;
  const needsAttention = ['damaged', 'neglected', 'abandoned', 'disrupted', 'under-pressure'].includes(item.status);
  const plasterMaps = useMemo(() => makeCityMaps(item.type === 'industry' ? 'brick' : 'plaster'), [item.type]);
  const roofMaps = useMemo(() => makeCityMaps(item.type === 'industry' || item.type === 'residential' ? 'roof' : 'stone'), [item.type]);
  const pavingMaps = useMemo(() => makeCityMaps('paving'), []);
  const details = (event) => { event.stopPropagation(); onSelect({ id: item.id, name: item.name, description: item.description, level, status: construction ? 'under-construction' : item.status, focus: { x: item.x, z: item.z } }); };
  return <group position={[item.x, 0.1, item.z]} onClick={details} onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'auto'; }}>
    <mesh position={[0, 0.11, 0]} receiveShadow><boxGeometry args={[item.w + 0.7, 0.16, item.d + 0.7]} /><meshStandardMaterial map={pavingMaps.map} normalMap={pavingMaps.normalMap} roughnessMap={pavingMaps.roughnessMap} color={isSelected ? '#e8d2a2' : '#c8c1ae'} roughness={1} /></mesh>
    {item.type === 'park' ? <ParkLot width={item.w} depth={item.d} level={level} /> : <>
      <mesh position={[0, height / 2 + 0.16, 0]} castShadow receiveShadow><boxGeometry args={[width, height, depth]} /><meshStandardMaterial map={plasterMaps.map} normalMap={plasterMaps.normalMap} roughnessMap={plasterMaps.roughnessMap} color={base} roughness={0.88} /></mesh>
      <Windows width={width} depth={depth} height={height} color={level > 2 ? '#fff0c6' : '#dfd5b6'} />
      <mesh position={[0, height + 0.22, 0]} castShadow><boxGeometry args={[width + 0.28, 0.28, depth + 0.28]} /><meshStandardMaterial map={roofMaps.map} normalMap={roofMaps.normalMap} roughnessMap={roofMaps.roughnessMap} color={roof} roughness={0.82} /></mesh>
      <FacadeArchitecture width={width} depth={depth} height={height} base={upper} level={level} type={item.type} />
      {item.type === 'hospital' && <HospitalWings level={upgraded} height={height} />}
      {item.type === 'school' && <SchoolIdentity width={width} height={height} depth={depth} level={level} />}
      {item.type === 'hospital' && <HospitalIdentity height={height} depth={depth} />}
      {item.type === 'clinic' && <ClinicIdentity height={height} depth={depth} />}
      {item.type === 'industry' && <FactoryIdentity width={width} height={height} depth={depth} level={level} />}
      {item.type === 'power' && <PowerIdentity width={width} height={height} depth={depth} level={level} />}
      {item.type === 'transport' && <TransitIdentity width={width} height={height} depth={depth} level={level} />}
      {item.type === 'police' && <PoliceIdentity width={width} height={height} depth={depth} />}
      {item.type === 'fire' && <FireIdentity width={width} height={height} depth={depth} />}
      {item.type === 'water' && <WaterIdentity width={width} height={height} depth={depth} level={level} />}
      {item.type === 'commercial' && height > 6 && <mesh position={[0, height / 2 + 0.16, depth / 2 + 0.06]}><boxGeometry args={[width + 0.02, 0.1, 0.08]} /><meshBasicMaterial color="#c5d5d4" /></mesh>}
      <mesh position={[0, 0.86, depth / 2 + 0.018]}><boxGeometry args={[0.54, 1.03, 0.035]} /><meshStandardMaterial color={needsAttention ? '#705f55' : '#526b6d'} roughness={0.45} /></mesh>
      {item.type === 'hospital' && <mesh position={[0, height + 0.47, 0]}><boxGeometry args={[0.88, 0.055, 0.22]} /><meshBasicMaterial color="#bd534d" /></mesh>}
      {construction && <Construction frameHeight={height + 1.25} width={width + 0.8} depth={depth + 0.8} />}
    </>}
    {needsAttention && <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[Math.max(item.w, item.d) * 0.54, Math.max(item.w, item.d) * 0.6, 48]} /><meshBasicMaterial color="#c86052" transparent opacity={0.82} side={2} /></mesh>}
    {isSelected && <mesh position={[0, 0.27, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[Math.max(item.w, item.d) * 0.55, Math.max(item.w, item.d) * 0.62, 48]} /><meshBasicMaterial color="#f1b85c" transparent opacity={0.9} side={2} /></mesh>}
  </group>;
}

function FacadeArchitecture({ width, depth, height, base, level, type }) {
  const bands = Math.min(3, Math.max(0, Math.floor((level - 1) / 2)));
  return <group>
    <mesh position={[0, 0.34, depth / 2 + 0.035]} castShadow><boxGeometry args={[width + 0.08, 0.18, 0.09]} /><meshStandardMaterial color={base} roughness={0.86} /></mesh>
    <mesh position={[0, height + 0.08, 0]} castShadow><boxGeometry args={[width + 0.42, 0.12, depth + 0.42]} /><meshStandardMaterial color={base} roughness={0.78} /></mesh>
    {[-1, 1].flatMap((side) => [-1, 1].map((front) => <mesh key={`${side}-${front}`} position={[side * (width / 2 - 0.12), height * 0.52 + 0.16, front * (depth / 2 + 0.025)]} castShadow><boxGeometry args={[0.14, Math.max(0.8, height * 0.88), 0.13]} /><meshStandardMaterial color={base} roughness={0.8} /></mesh>))}
    {Array.from({ length: bands }, (_, floor) => <mesh key={floor} position={[0, height * (0.68 + floor * 0.1), depth / 2 + 0.1]} castShadow><boxGeometry args={[width + 0.24, 0.095, 0.2]} /><meshStandardMaterial color={type === 'commercial' ? '#8ea5a2' : base} roughness={0.7} /></mesh>)}
    {type === 'apartment' && level >= 3 && <mesh position={[0, height * 0.46, depth / 2 + 0.19]} castShadow><boxGeometry args={[width * 0.66, 0.08, 0.36]} /><meshStandardMaterial color="#9e927d" roughness={0.82} /></mesh>}
  </group>;
}

function HospitalIdentity({ height, depth }) {
  return <group position={[0, 0, depth / 2 + 0.08]}>
    <mesh position={[0, height + 0.39, 0]} castShadow><boxGeometry args={[1.55, 0.58, 0.12]} /><meshStandardMaterial color="#f0f1e8" /></mesh>
    <mesh position={[0, height + 0.39, 0.075]}><boxGeometry args={[0.17, 0.42, 0.035]} /><meshBasicMaterial color="#bd514e" /></mesh>
    <mesh position={[0, height + 0.39, 0.078]}><boxGeometry args={[0.48, 0.16, 0.04]} /><meshBasicMaterial color="#bd514e" /></mesh>
    <mesh position={[0, 0.58, 0]}><boxGeometry args={[2.25, 0.12, 0.48]} /><meshStandardMaterial color="#bd514e" /></mesh>
  </group>;
}

function ClinicIdentity({ height, depth }) {
  return <group position={[0, 0, depth / 2 + 0.08]}>
    <mesh position={[0, height + 0.39, 0]}><boxGeometry args={[0.78, 0.52, 0.11]} /><meshStandardMaterial color="#f1eee2" /></mesh>
    <mesh position={[0, height + 0.39, 0.07]}><boxGeometry args={[0.13, 0.38, 0.035]} /><meshBasicMaterial color="#bf5750" /></mesh>
    <mesh position={[0, height + 0.39, 0.075]}><boxGeometry args={[0.38, 0.13, 0.04]} /><meshBasicMaterial color="#bf5750" /></mesh>
    <mesh position={[0, 0.58, 0]}><boxGeometry args={[1.7, 0.12, 0.4]} /><meshStandardMaterial color="#c86c61" /></mesh>
  </group>;
}

function SchoolIdentity({ width, height, depth, level }) {
  const windowCount = Math.min(4, 2 + Math.floor(level / 2));
  return <group>
    <mesh position={[0, height + 0.59, 0]} castShadow><coneGeometry args={[Math.min(width, depth) * 0.44, 0.84, 4]} /><meshStandardMaterial color="#a95c49" roughness={0.9} /></mesh>
    <mesh position={[0, height + 0.48, depth / 2 + 0.08]}><boxGeometry args={[1.05, 0.54, 0.12]} /><meshStandardMaterial color="#efe5ca" /></mesh>
    <mesh position={[0, height + 0.48, depth / 2 + 0.15]}><circleGeometry args={[0.18, 16]} /><meshBasicMaterial color="#8b6048" /></mesh>
    {Array.from({ length: windowCount }, (_, i) => <mesh key={i} position={[-width * 0.34 + i * (width * 0.68 / Math.max(1, windowCount - 1)), 0.78, depth / 2 + 0.04]}><boxGeometry args={[0.3, 0.35, 0.04]} /><meshStandardMaterial color="#d4e0d9" /></mesh>)}
    <mesh position={[width * 0.34, height + 1.24, 0]}><cylinderGeometry args={[0.035, 0.035, 1.35, 6]} /><meshStandardMaterial color="#7a7668" /></mesh>
    <mesh position={[width * 0.34 + 0.18, height + 1.7, 0]}><boxGeometry args={[0.38, 0.22, 0.03]} /><meshStandardMaterial color="#bd6252" /></mesh>
  </group>;
}

function FactoryIdentity({ width, height, depth, level }) {
  const stacks = Math.min(3, Math.max(1, level - 1));
  return <group>
    {Array.from({ length: Math.min(4, Math.max(2, level)) }, (_, i) => <group key={i} position={[-width * 0.34 + i * (width * 0.22), height + 0.47, 0]}>
      <mesh castShadow><boxGeometry args={[width * 0.3, 0.16, depth + 0.04]} /><meshStandardMaterial color={i % 2 ? '#9da7a1' : '#c0c4bb'} /></mesh>
      <mesh position={[0, 0.13, 0]}><boxGeometry args={[width * 0.25, 0.025, depth * 0.5]} /><meshStandardMaterial color="#d5d0b9" /></mesh>
    </group>)}
    {Array.from({ length: stacks }, (_, i) => <group key={`stack-${i}`} position={[width * 0.28, height * 0.56, -depth * 0.3 + i * 0.62]}>
      <mesh castShadow><cylinderGeometry args={[0.25, 0.32, height * 0.88, 7]} /><meshStandardMaterial color="#9a7660" /></mesh>
      <mesh position={[0, height * 0.48, 0]}><cylinderGeometry args={[0.34, 0.34, 0.12, 7]} /><meshStandardMaterial color="#716b62" /></mesh>
    </group>)}
  </group>;
}

function PowerIdentity({ width, height, depth, level }) {
  const towers = Math.max(1, Math.min(3, 1 + Math.floor((level - 1) / 2)));
  return <group>
    {Array.from({ length: towers }, (_, i) => <group key={i} position={[-width * 0.27 + i * width * 0.27, 0, -depth * 0.15]}>
      <mesh position={[0, height * 0.64, 0]} castShadow><cylinderGeometry args={[0.8, 0.58, height * 1.28, 8]} /><meshStandardMaterial color="#d7d2bf" roughness={0.94} /></mesh>
      <mesh position={[0, height * 1.3, 0]}><torusGeometry args={[0.72, 0.075, 5, 10]} /><meshStandardMaterial color="#aeb8ad" /></mesh>
    </group>)}
    <mesh position={[width * 0.34, height + 0.9, depth * 0.23]} castShadow><cylinderGeometry args={[0.15, 0.22, 1.8, 6]} /><meshStandardMaterial color="#ad5c4a" /></mesh>
    {[0, 1].map((i) => <mesh key={i} position={[width * 0.34, height + 1.82 + i * 0.48, depth * 0.23]}><sphereGeometry args={[0.33 + i * 0.1, 7, 5]} /><meshStandardMaterial color="#a7aaa0" transparent opacity={0.32} /></mesh>)}
  </group>;
}

function TransitIdentity({ width, height, depth, level }) {
  return <group>
    <mesh position={[0, height + 0.72, 0]} castShadow><boxGeometry args={[width + 0.45, 0.12, depth + 1.35]} /><meshStandardMaterial color="#485d60" /></mesh>
    {[-1, 1].map((side) => <mesh key={side} position={[side * width * 0.38, height + 0.3, 0]}><boxGeometry args={[0.14, height * 0.65, 0.16]} /><meshStandardMaterial color="#b19d77" /></mesh>)}
    <mesh position={[0, 0.28, depth * 0.58]}><boxGeometry args={[width * 0.72, 0.2, 1.15]} /><meshStandardMaterial color="#c9a565" /></mesh>
    {level >= 3 && <mesh position={[0, height + 1.05, 0]}><boxGeometry args={[width * 0.45, 0.1, 0.1]} /><meshStandardMaterial color="#638889" /></mesh>}
  </group>;
}

function PoliceIdentity({ width, height, depth }) {
  return <group>
    <mesh position={[0, 0.8, depth / 2 + 0.1]}><boxGeometry args={[width * 0.76, 0.14, 0.1]} /><meshStandardMaterial color="#466d85" /></mesh>
    <mesh position={[0, height + 0.49, 0]}><cylinderGeometry args={[0.18, 0.18, 0.28, 8]} /><meshStandardMaterial color="#d3ae62" metalness={0.15} /></mesh>
    <mesh position={[width * 0.29, 0.3, depth / 2 + 0.56]}><boxGeometry args={[0.75, 0.42, 1.15]} /><meshStandardMaterial color="#496d82" /></mesh>
    <mesh position={[width * 0.29, 0.53, depth / 2 + 0.56]}><boxGeometry args={[0.42, 0.15, 0.72]} /><meshStandardMaterial color="#bed1d3" /></mesh>
  </group>;
}

function FireIdentity({ width, height, depth }) {
  return <group>
    {[-1, 1].map((side) => <mesh key={side} position={[side * width * 0.24, 0.72, depth / 2 + 0.045]}><boxGeometry args={[width * 0.28, 1.08, 0.08]} /><meshStandardMaterial color="#a84d3f" /></mesh>)}
    <mesh position={[0, height + 0.46, 0]}><boxGeometry args={[0.46, 0.3, 0.46]} /><meshStandardMaterial color="#dfb960" /></mesh>
    <mesh position={[width * 0.38, height * 0.62, -depth * 0.35]}><boxGeometry args={[0.35, height * 1.18, 0.35]} /><meshStandardMaterial color="#bb6955" /></mesh>
  </group>;
}

function WaterIdentity({ width, height, depth, level }) {
  return <group>
    <mesh position={[width * 0.27, height + 0.7, -depth * 0.18]} castShadow><cylinderGeometry args={[0.9 + level * 0.08, 0.9 + level * 0.08, 1.35, 12]} /><meshStandardMaterial color="#a8c0bb" roughness={0.45} metalness={0.28} /></mesh>
    <mesh position={[width * 0.27, height + 1.4, -depth * 0.18]}><coneGeometry args={[1.02 + level * 0.08, 0.32, 12]} /><meshStandardMaterial color="#748c84" roughness={0.55} metalness={0.2} /></mesh>
    <mesh position={[-width * 0.2, 0.25, depth * 0.23]}><boxGeometry args={[width * 0.46, 0.18, depth * 0.34]} /><meshStandardMaterial color="#6a9c9a" roughness={0.28} metalness={0.18} /></mesh>
  </group>;
}

function Construction({ frameHeight, width, depth }) {
  return <group>
    {[[-width / 2, -depth / 2], [width / 2, -depth / 2], [-width / 2, depth / 2], [width / 2, depth / 2]].map(([x, z], i) => <mesh key={i} position={[x, frameHeight / 2, z]}><boxGeometry args={[0.1, frameHeight, 0.1]} /><meshStandardMaterial color="#c79442" /></mesh>)}
    {[0, frameHeight * 0.45, frameHeight * 0.9].map((y) => <mesh key={y} position={[0, y, 0]}><boxGeometry args={[width, 0.08, 0.08]} /><meshStandardMaterial color="#dbad5e" /></mesh>)}
    <mesh position={[0, 0.28, depth / 2 + 0.34]}><boxGeometry args={[1.6, 0.38, 0.07]} /><meshStandardMaterial color="#e3b34e" /></mesh>
  </group>;
}

function ParkLot({ width, depth, level }) {
  return <group>
    <mesh position={[0, 0.22, 0]}><boxGeometry args={[width - 0.2, 0.12, depth - 0.2]} /><meshStandardMaterial color="#96b18b" /></mesh>
    <mesh position={[0, 0.3, 0]}><boxGeometry args={[0.9, 0.04, depth - 0.4]} /><meshStandardMaterial color="#dbcfaf" /></mesh>
    {Array.from({ length: Math.min(5, level + 1) }, (_, index) => <group key={index} position={[-width * 0.32 + (index % 3) * width * 0.31, 0.28, index < 3 ? -depth * 0.3 : depth * 0.31]}>
      <mesh position={[0, 0.28 + level * 0.035, 0]} castShadow><cylinderGeometry args={[0.08, 0.13, 0.55, 5]} /><meshStandardMaterial color="#75634e" /></mesh>
      <mesh position={[0, 0.75 + level * 0.04, 0]} castShadow><icosahedronGeometry args={[0.52 + level * 0.035, 1]} /><meshStandardMaterial color="#73926c" roughness={1} /></mesh>
    </group>)}
    {level >= 3 && <mesh position={[width * 0.27, 0.45, -depth * 0.2]}><cylinderGeometry args={[0.45, 0.5, 0.14, 12]} /><meshStandardMaterial color="#93bdbb" roughness={0.4} metalness={0.1} /></mesh>}
  </group>;
}

function sectorLevelFor(type, sectors) {
  const sector = ({ hospital: 'healthcare', clinic: 'healthcare', school: 'education', park: 'environment', transport: 'infrastructure', power: 'infrastructure', industry: 'economy' })[type];
  if (!sector || !Number.isFinite(Number(sectors?.[sector]))) return 1;
  return Math.max(1, Math.min(5, Math.floor((Number(sectors[sector]) - 45) / 5) + 1));
}

function seedBuildings(buildings, sectors) {
  const overrides = new Map(buildings.map((building) => [building.id, building]));
  const knownIds = new Set(lots.map((lot) => lot.id));
  const placed = buildings.filter((building) => !knownIds.has(building.id) && (building.position || (Number.isFinite(building.x) && Number.isFinite(building.z))));
  const occupied = new Set(placed.map((building) => {
    const point = building.position ?? building;
    return `${Math.round(point.x)}:${Math.round(point.z)}`;
  }));
  const existing = lots.filter((lot) => !occupied.has(`${lot.x}:${lot.z}`)).map((lot) => {
    const item = { ...lot, ...overrides.get(lot.id) };
    return { ...item, level: item.level ?? sectorLevelFor(item.type, sectors) };
  });
  const additions = placed.map((building, index) => {
    const position = building.position ?? building;
    const type = building.type ?? 'civic';
    return {
      id: building.id, type,
      x: Math.max(-86, Math.min(86, position.x)),
      z: Math.max(-86, Math.min(86, position.z)),
      w: building.width ?? 4.5, d: building.depth ?? 4.2,
      h: building.height ?? (type === 'apartment' || type === 'commercial' ? 4.8 : 2.8),
      level: building.level ?? sectorLevelFor(type, sectors), name: building.name ?? `${type[0].toUpperCase()}${type.slice(1)} ${index + 1}`,
      description: building.description ?? 'A new city facility.',
      ...building,
      x: Math.max(-86, Math.min(86, position.x)),
      z: Math.max(-86, Math.min(86, position.z)),
    };
  });
  return [...existing, ...additions];
}

function createUrbanLots(population, economy, landmarks) {
  const density = Math.max(0, Math.min(1, (Number(population) - 10000) / 90000));
  const housingCount = Math.round(360 + density * 150);
  const economyHeight = Math.max(0, Math.min(1, (Number(economy) - 30) / 70));
  const facadeColors = ['#cfab83', '#b7c2ae', '#d5b895', '#b9c9c5', '#c18e73', '#d0c4a8', '#9fb1ac', '#c49b78'];
  const roofColors = ['#846554', '#687b78', '#a46e54', '#77766a', '#8e725b'];
  const homes = [];
  const occupied = landmarks.map((lot) => ({ x: lot.x, z: lot.z, w: lot.reserveW ?? lot.w ?? lot.width ?? 5.5, d: lot.reserveD ?? lot.d ?? lot.depth ?? 5.2 }));
  const candidates = CITY_BUILD_SITES.map((site) => ({ ...site }));
  // Offset the candidate order by district so the first homes form dense neighborhoods
  // instead of appearing in rows across the entire map.
  candidates.sort((a, b) => Math.hypot(a.x + 18, a.z + 12) - Math.hypot(b.x + 18, b.z + 12) || a.seed - b.seed);
  let seed = 0;
  for (const candidate of candidates) {
    if (homes.length >= housingCount) break;
    const width = 2.9 + ((candidate.seed * 13) % 7) * 0.1;
    const depth = 3 + ((candidate.seed * 7) % 6) * 0.1;
    const rotation = (candidate.seed * 7 % 5 - 2) * 0.12;
    // GLB rotation adds a quarter-turn; a square safety radius avoids AABB corner overlap.
    const growsIntoTower = candidate.seed > 0 && candidate.seed % 9 === 0 && Math.hypot(candidate.x, candidate.z) < 54;
    const footprintW = Math.max(width, depth) * (growsIntoTower ? 1.27 : 1.12);
    const footprintD = footprintW;
    if (isNearStreet(candidate.x, candidate.z, Math.max(footprintW, footprintD) / 2 + 1.2)) continue;
    const safeW = (lot) => lot.w;
    const safeD = (lot) => lot.d;
    const occupiedLot = occupied.some((lot) => Math.abs(candidate.x - lot.x) < (footprintW + safeW(lot)) / 2 + 0.08 && Math.abs(candidate.z - lot.z) < (footprintD + safeD(lot)) / 2 + 0.08);
    if (occupiedLot) continue;
    const intersectsHome = homes.some((home) => Math.abs(candidate.x - home.x) < (footprintW + home.footprintW) / 2 + 0.08 && Math.abs(candidate.z - home.z) < (footprintD + home.footprintD) / 2 + 0.08);
    if (intersectsHome) continue;
    homes.push({
      x: candidate.x, z: candidate.z, width, depth, footprintW, footprintD, rotation,
      height: 3 + ((candidate.seed * 17) % 7) * 0.46 + (1 - Math.min(1, Math.hypot(candidate.x, candidate.z) / 100)) * 1.4 + density * (2.4 + economyHeight),
      color: facadeColors[(candidate.seed * 5 + Math.floor(economyHeight * 4)) % facadeColors.length],
      roofColor: roofColors[(candidate.seed * 3) % roofColors.length],
      pitched: candidate.seed % 4 === 1,
      seed: candidate.seed,
    });
    occupied.push({ x: candidate.x, z: candidate.z, w: footprintW, d: footprintD });
    seed += 1;
  }
  return homes;
}

export function getCityFootprints(buildings = [], sectors = {}, population = 10000) {
  const landmarks = seedBuildings(buildings, sectors);
  const homes = createUrbanLots(population, sectors.economy ?? 50, landmarks);
  return [
    ...landmarks.map((item) => ({ x: item.x, z: item.z, w: item.reserveW ?? item.w ?? item.width ?? 5.5, d: item.reserveD ?? item.d ?? item.depth ?? 5.2 })),
    ...homes.map((home) => ({ x: home.x, z: home.z, w: home.footprintW, d: home.footprintD })),
  ];
}

function UrbanFabric({ population, economy, landmarks }) {
  const homes = useMemo(() => createUrbanLots(population, economy, landmarks), [population, economy, landmarks]);
  if (!homes.length) return null;
  return <group>{homes.map((home) => {
    const risesAboveTheDistrict = home.seed > 0 && home.seed % 9 === 0 && Math.hypot(home.x, home.z) < 54;
    const modelIndex = risesAboveTheDistrict
      ? SUBURBAN_MODELS.length + (Math.floor(home.seed / 9) % COMMERCIAL_MODELS.length)
      : (home.seed * 7 + Math.floor(economy / 15)) % SUBURBAN_MODELS.length;
    return <KenneyHome key={`fabric-${home.seed}`} home={home} modelIndex={modelIndex} isTower={risesAboveTheDistrict} />;
  })}</group>;
}

function KenneyHome({ home, modelIndex, isTower }) {
  const { scene } = useGLTF(MODEL_URLS[modelIndex]);
  const [modelWidth, modelHeight, modelDepth] = MODEL_SIZE[modelIndex];
  const width = home.width * (isTower ? 1.16 : 1);
  const depth = home.depth * (isTower ? 1.16 : 1);
  const height = home.height * (isTower ? 2.1 : 1);
  return <group position={[home.x, 0.22 + terrainHeight(home.x, home.z), home.z]} rotation={[0, home.rotation + (home.seed % 4) * Math.PI / 2, 0]}>
    <mesh position={[0, -0.035, 0]} receiveShadow><boxGeometry args={[width + 0.34, 0.08, depth + 0.34]} /><meshStandardMaterial map={makeCityTexture('paving')} color="#b8ad96" roughness={0.98} /></mesh>
    <group scale={[width / modelWidth, height / modelHeight, depth / modelDepth]}><Clone object={scene} castShadow receiveShadow /></group>
    {home.seed % 3 === 0 && <mesh position={[home.width * 0.34, 0.13, home.depth * 0.3]} castShadow><boxGeometry args={[0.42, 0.24, 0.38]} /><meshStandardMaterial color={home.roofColor} roughness={0.9} /></mesh>}
  </group>;
}

export function CityBuildings({ buildings = [], constructionSites = [], sectors = {}, population = 10000, selectedId, onSelect }) {
  const items = useMemo(() => seedBuildings(buildings, sectors), [buildings, sectors]);
  const constructionIds = new Set(constructionSites);
  return <group>
    <UrbanFabric population={population} economy={sectors.economy ?? 50} landmarks={items} />
    {items.map((item) => <Building key={item.id} item={item} construction={constructionIds.has(item.id) || item.status === 'under-construction'} selectedId={selectedId} onSelect={onSelect} />)}
  </group>;
}
