import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { Object3D } from 'three';

const palette = {
  hospital: ['#e7e7db', '#c9d8d5', '#b2c6c3'], clinic: ['#e8ded0', '#d8c9bb', '#c4b8ab'],
  school: ['#d8c4a2', '#c2b194', '#a9937a'], commercial: ['#d8d9d0', '#bbc6c5', '#909f9f'],
  civic: ['#d3cdbd', '#bcb6a9', '#8e9996'], residential: ['#c7ab8c', '#b9c0b4', '#a69883'],
  apartment: ['#c6d0c9', '#b4c3bf', '#899b9b'], market: ['#d7bda0', '#c5b095', '#afa18f'],
  industry: ['#b9beb9', '#aeb6b1', '#939b97'], park: ['#9db591', '#849f7e', '#71896d'],
  police: ['#bbc7c8', '#a5b4b5', '#849797'], fire: ['#d7b59b', '#c49d82', '#a77b67'],
  transport: ['#c6c9bc', '#a9b4ab', '#8b9993'], power: ['#b6bcb5', '#aab5b0', '#909d98'],
  water: ['#bfd1ca', '#a6c2bb', '#819e9c'], culture: ['#d8ccb0', '#c9b995', '#a99777'],
  stadium: ['#c6c9bd', '#aab7ad', '#879992'], monument: ['#c9c2b3', '#afa795', '#948a78'],
};

const lots = [
  { id: 'hospital-central', type: 'hospital', x: -14, z: -14, w: 6.3, d: 5.2, h: 3.1, name: 'Northbank General Hospital', description: 'Emergency, inpatient and community care.' },
  { id: 'school-north', type: 'school', x: 0, z: -14, w: 5.7, d: 5.6, h: 2.7, name: 'Riverside Public School', description: 'Primary and secondary education campus.' },
  { id: 'civic-hall', type: 'civic', x: 14, z: -14, w: 6.2, d: 5, h: 4.3, name: 'City Hall', description: 'The seat of city administration.' },
  { id: 'apartments-nw', type: 'apartment', x: -14, z: 0, w: 5.1, d: 5.4, h: 6.2, name: 'Northbank Residences', description: 'Mixed-income housing.' },
  { id: 'market-square', type: 'market', x: 0, z: 0, w: 6.1, d: 4.8, h: 2.8, name: 'Market Square', description: 'Local retail, food and services.' },
  { id: 'tower-central', type: 'commercial', x: 14, z: 0, w: 5.2, d: 5.5, h: 8.6, name: 'Meridian House', description: 'Commercial offices and local employers.' },
  { id: 'clinic-east', type: 'clinic', x: -14, z: 14, w: 5.2, d: 5.3, h: 2.5, name: 'Eastbank Community Clinic', description: 'Walk-in primary care and vaccinations.' },
  { id: 'homes-east', type: 'residential', x: 0, z: 14, w: 6.1, d: 5.3, h: 3.8, name: 'Garden Court', description: 'Neighbourhood homes around a shared courtyard.' },
  { id: 'commerce-east', type: 'commercial', x: 14, z: 14, w: 5.5, d: 5.2, h: 4.9, name: 'Exchange Building', description: 'Shops and professional services.' },
  { id: 'homes-west', type: 'residential', x: -26, z: -14, w: 5, d: 5.1, h: 3.1, name: 'Old Quarter Homes', description: 'Established neighbourhood housing.' },
  { id: 'university-west', type: 'school', x: 26, z: -14, w: 5.6, d: 5.5, h: 4.1, name: 'Technical College', description: 'Vocational training and applied research.' },
  { id: 'warehouse-south', type: 'industry', x: -26, z: 14, w: 6.1, d: 5.2, h: 3.5, name: 'Civic Works Depot', description: 'Maintenance and public works facility.' },
  { id: 'park-south', type: 'park', x: 26, z: 14, w: 6, d: 6, h: 0.4, name: 'Founders Garden', description: 'A small park and public gathering space.' },
  { id: 'apartments-sw', type: 'apartment', x: -26, z: 0, w: 5.1, d: 5.1, h: 5.6, name: 'Canal View Apartments', description: 'Dense housing beside the transit corridor.' },
  { id: 'homes-ne', type: 'residential', x: 26, z: 0, w: 5.4, d: 5.1, h: 3.5, name: 'Maple Street Homes', description: 'Family housing and neighbourhood shops.' },
  { id: 'depot-south', type: 'industry', x: 0, z: 26, w: 6, d: 5, h: 2.7, name: 'Transit Maintenance Depot', description: 'Fleet maintenance and transport operations.' },
];

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
  const needsAttention = ['damaged', 'neglected', 'abandoned', 'disrupted'].includes(item.status);
  const details = (event) => { event.stopPropagation(); onSelect({ id: item.id, name: item.name, description: item.description, level, status: construction ? 'under-construction' : item.status }); };
  return <group position={[item.x, 0.1, item.z]} onClick={details} onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'auto'; }}>
    <mesh position={[0, 0.11, 0]} receiveShadow><boxGeometry args={[item.w + 0.7, 0.16, item.d + 0.7]} /><meshStandardMaterial color={isSelected ? '#e8d2a2' : '#c8c1ae'} roughness={1} /></mesh>
    {item.type === 'park' ? <ParkLot width={item.w} depth={item.d} level={level} /> : <>
      <mesh position={[0, height / 2 + 0.16, 0]} castShadow receiveShadow><boxGeometry args={[width, height, depth]} /><meshStandardMaterial color={base} roughness={0.88} /></mesh>
      <Windows width={width} depth={depth} height={height} color={level > 2 ? '#fff0c6' : '#dfd5b6'} />
      <mesh position={[0, height + 0.22, 0]} castShadow><boxGeometry args={[width + 0.28, 0.28, depth + 0.28]} /><meshStandardMaterial color={roof} roughness={0.82} /></mesh>
      {item.type === 'hospital' && <HospitalWings level={upgraded} height={height} />}
      {item.type === 'school' && <mesh position={[0, height + 0.42, 0]} castShadow><boxGeometry args={[0.72, 0.25, 0.72]} /><meshStandardMaterial color="#b7554f" /></mesh>}
      {item.type === 'hospital' && <mesh position={[0, height + 0.38, depth / 2 - 0.1]}><boxGeometry args={[1.25, 0.56, 0.08]} /><meshStandardMaterial color="#d0e0dc" roughness={0.7} /></mesh>}
      {item.type === 'commercial' && height > 6 && <mesh position={[0, height / 2 + 0.16, depth / 2 + 0.06]}><boxGeometry args={[width + 0.02, 0.1, 0.08]} /><meshBasicMaterial color="#c5d5d4" /></mesh>}
      <mesh position={[0, 0.86, depth / 2 + 0.018]}><boxGeometry args={[0.54, 1.03, 0.035]} /><meshStandardMaterial color={needsAttention ? '#705f55' : '#526b6d'} roughness={0.45} /></mesh>
      {item.type === 'hospital' && <mesh position={[0, height + 0.47, 0]}><boxGeometry args={[0.88, 0.055, 0.22]} /><meshBasicMaterial color="#bd534d" /></mesh>}
      {construction && <Construction frameHeight={height + 1.25} width={width + 0.8} depth={depth + 0.8} />}
    </>}
    {needsAttention && <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[Math.max(item.w, item.d) * 0.54, Math.max(item.w, item.d) * 0.6, 48]} /><meshBasicMaterial color="#c86052" transparent opacity={0.82} side={2} /></mesh>}
    {isSelected && <mesh position={[0, 0.27, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[Math.max(item.w, item.d) * 0.55, Math.max(item.w, item.d) * 0.62, 48]} /><meshBasicMaterial color="#f1b85c" transparent opacity={0.9} side={2} /></mesh>}
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
  const sector = ({ hospital: 'healthcare', clinic: 'healthcare', school: 'education', park: 'environment', transport: 'infrastructure' })[type];
  if (!sector || !Number.isFinite(Number(sectors?.[sector]))) return 1;
  return Math.max(1, Math.min(5, Math.ceil(Number(sectors[sector]) / 20)));
}

function seedBuildings(buildings, sectors) {
  const overrides = new Map(buildings.map((building) => [building.id, building]));
  const knownIds = new Set(lots.map((lot) => lot.id));
  const existing = lots.map((lot) => {
    const item = { ...lot, ...overrides.get(lot.id) };
    return { ...item, level: item.level ?? sectorLevelFor(item.type, sectors) };
  });
  const placed = buildings.filter((building) => !knownIds.has(building.id) && (building.position || (Number.isFinite(building.x) && Number.isFinite(building.z))));
  const additions = placed.map((building, index) => {
    const position = building.position ?? building;
    const type = building.type ?? 'civic';
    return {
      id: building.id, type,
      x: Math.max(-30, Math.min(30, position.x)),
      z: Math.max(-30, Math.min(30, position.z)),
      w: building.width ?? 4.5, d: building.depth ?? 4.2,
      h: building.height ?? (type === 'apartment' || type === 'commercial' ? 4.8 : 2.8),
      level: building.level ?? sectorLevelFor(type, sectors), name: building.name ?? `${type[0].toUpperCase()}${type.slice(1)} ${index + 1}`,
      description: building.description ?? 'A new city facility.',
      ...building,
      x: Math.max(-30, Math.min(30, position.x)),
      z: Math.max(-30, Math.min(30, position.z)),
    };
  });
  return [...existing, ...additions];
}

export function CityBuildings({ buildings = [], constructionSites = [], sectors = {}, selectedId, onSelect }) {
  const items = useMemo(() => seedBuildings(buildings, sectors), [buildings, sectors]);
  const constructionIds = new Set(constructionSites);
  return <group>
    {items.map((item) => <Building key={item.id} item={item} construction={constructionIds.has(item.id) || item.status === 'under-construction'} selectedId={selectedId} onSelect={onSelect} />)}
  </group>;
}
