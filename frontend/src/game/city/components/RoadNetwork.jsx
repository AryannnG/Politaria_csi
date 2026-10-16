import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, CatmullRomCurve3, ExtrudeGeometry, Float32BufferAttribute, Object3D, Shape, ShapeGeometry, Vector3 } from 'three';
import { CITY_STREETS, ISLAND_SHORELINE, isInsideIsland, terrainHeight } from './cityLayout.js';
import { makeCityMaps } from './cityTextures.js';
export { CITY_STREETS, isNearStreet } from './cityLayout.js';

function ribbonGeometry(points, width, y) {
  const curve = new CatmullRomCurve3(points.map(([x,z]) => new Vector3(x,0,z)), false, 'centripetal');
  const samples = Math.max(64, points.length * 14);
  const vertices = []; const uvs = []; const indices = [];
  for (let i=0; i<=samples; i+=1) {
    const t=i/samples; const point=curve.getPointAt(t); const tangent=curve.getTangentAt(t).normalize();
    const nx=-tangent.z; const nz=tangent.x;
    const leftX=point.x+nx*width/2, leftZ=point.z+nz*width/2;
    const rightX=point.x-nx*width/2, rightZ=point.z-nz*width/2;
    vertices.push(leftX,y+terrainHeight(leftX,leftZ),leftZ,rightX,y+terrainHeight(rightX,rightZ),rightZ);
    uvs.push(t*9,0,t*9,1);
    if(i<samples){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
  }
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new Float32BufferAttribute(vertices,3));
  geometry.setAttribute('uv',new Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function offsetLine(points,width,side) {
  return points.map(([x,z],i)=>{
    const prev=points[Math.max(0,i-1)]; const next=points[Math.min(points.length-1,i+1)];
    const dx=next[0]-prev[0]; const dz=next[1]-prev[1]; const len=Math.hypot(dx,dz)||1;
    const offset=width/2+0.43;
    return [x-dz/len*offset*side,z+dx/len*offset*side];
  });
}

function Street({ path, roadLevel }) {
  const width=path.width+roadLevel*0.16;
  const asphalt=useMemo(()=>ribbonGeometry(path.points,width,0.035),[path,width]);
  const walkways=useMemo(()=>[-1,1].map(side=>ribbonGeometry(offsetLine(path.points,width,side),1.05,0.105)),[path,width]);
  const curbs=useMemo(()=>[-1,1].map(side=>ribbonGeometry(offsetLine(path.points,width-0.52,side),0.16,0.14)),[path,width]);
  const curve=useMemo(()=>new CatmullRomCurve3(path.points.map(([x,z])=>new Vector3(x,0,z)),false,'centripetal'),[path]);
  const dashRef=useRef(); const dummy=useMemo(()=>new Object3D(),[]);
  const dashCount=Math.max(12,Math.floor(curve.getLength()/2.7));
  useLayoutEffect(()=>{
    if(!dashRef.current)return;
    for(let i=0;i<dashCount;i+=1){
      const t=(i+0.5)/dashCount; const point=curve.getPointAt(t); const tangent=curve.getTangentAt(t);
      dummy.position.set(point.x,0.047+terrainHeight(point.x,point.z),point.z);
      dummy.rotation.set(0,Math.atan2(tangent.x,tangent.z),0);
      dummy.updateMatrix(); dashRef.current.setMatrixAt(i,dummy.matrix);
    }
    dashRef.current.instanceMatrix.needsUpdate=true;
  },[curve,dashCount,dummy]);
  const maps=useMemo(()=>makeCityMaps('asphalt'),[]);
  const walkMaps=useMemo(()=>makeCityMaps('paving'),[]);
  return <group>
    <mesh geometry={asphalt} receiveShadow><meshStandardMaterial map={maps.map} normalMap={maps.normalMap} roughnessMap={maps.roughnessMap} color="#b4b6b1" roughness={0.92} metalness={0.015} side={2} /></mesh>
    {walkways.map((geometry,i)=><mesh key={`walk-${i}`} geometry={geometry} receiveShadow><meshStandardMaterial map={walkMaps.map} normalMap={walkMaps.normalMap} roughnessMap={walkMaps.roughnessMap} color="#d0cbbd" roughness={0.9} side={2}/></mesh>)}
    {curbs.map((geometry,i)=><mesh key={`curb-${i}`} geometry={geometry}><meshStandardMaterial color="#a6a397" roughness={0.95} side={2}/></mesh>)}
    <instancedMesh ref={dashRef} args={[undefined,undefined,dashCount]}><boxGeometry args={[0.14,0.018,path.width>5?1.1:0.92]}/><meshBasicMaterial color="#e9dfc9"/></instancedMesh>
  </group>;
}

function Crosswalks() {
  const ref=useRef(); const dummy=useMemo(()=>new Object3D(),[]);
  const stripes=useMemo(()=>{
    const result=[];
    const vertical=[...new Map(CITY_STREETS.filter(street=>street.axis==='vertical').map(street=>[street.at,street])).values()];
    const horizontal=[...new Map(CITY_STREETS.filter(street=>street.axis==='horizontal').map(street=>[street.at,street])).values()];
    for(const v of vertical)for(const h of horizontal){
      const x=v.at;const z=h.at;
      if(!isInsideIsland(x,z,5))continue;
      for(let i=-3;i<=3;i+=1){result.push({x:x+i*0.46,z,rotation:0});result.push({x,z:z+i*0.46,rotation:Math.PI/2});}
    }
    return result;
  },[]);
  useLayoutEffect(()=>{
    if(!ref.current)return;
    stripes.forEach((stripe,index)=>{
      dummy.position.set(stripe.x,0.048+terrainHeight(stripe.x,stripe.z),stripe.z);dummy.rotation.set(0,stripe.rotation,0);dummy.updateMatrix();ref.current.setMatrixAt(index,dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate=true;
  },[dummy,stripes]);
  return <instancedMesh ref={ref} args={[undefined,undefined,stripes.length]}><boxGeometry args={[0.22,0.018,2.2]}/><meshBasicMaterial color="#eee8d9"/></instancedMesh>;
}

function TerrainHills() {
  const hills = [[-24,-36,1.05,8], [24,-36,1.15,9], [-48,36,0.95,8], [48,36,1.2,9], [0,48,0.85,7]];
  return <group>{hills.map(([x,z,h,r],i)=><mesh key={i} position={[x,-0.02,z]} scale={[1,h/r,1]} receiveShadow><sphereGeometry args={[r,16,8]}/><meshStandardMaterial color={i%2?'#84966d':'#8e9e73'} roughness={0.98}/></mesh>)}</group>;
}

function StreetFurniture() {
  const items=useMemo(()=>{
    const result=[];
    CITY_STREETS.forEach((street,s)=>{
      const curve=new CatmullRomCurve3(street.points.map(([x,z])=>new Vector3(x,0,z)),false,'centripetal');
      const n=Math.floor(curve.getLength()/17);
      for(let i=1;i<n;i+=1){const t=i/n,p=curve.getPointAt(t),v=curve.getTangentAt(t),side=(i+s)%2?1:-1,off=street.width/2+1.55,x=p.x-v.z*off*side,z=p.z+v.x*off*side;if(isInsideIsland(x,z,1))result.push({x,z,bench:i%3===0});}
    }); return result;
  },[]);
  const poles=useRef(), heads=useRef(), seats=useRef(), legs=useRef(); const dummy=useMemo(()=>new Object3D(),[]);
  useLayoutEffect(()=>{items.forEach((p,i)=>{dummy.position.set(p.x,1.55+terrainHeight(p.x,p.z),p.z);dummy.scale.set(1,1,1);dummy.updateMatrix();poles.current?.setMatrixAt(i,dummy.matrix);dummy.position.y=3.13+terrainHeight(p.x,p.z);dummy.updateMatrix();heads.current?.setMatrixAt(i,dummy.matrix);if(p.bench){dummy.position.set(p.x,0.55+terrainHeight(p.x,p.z),p.z);dummy.scale.set(1,1,1);dummy.updateMatrix();seats.current?.setMatrixAt(i,dummy.matrix);dummy.position.y=0.27+terrainHeight(p.x,p.z);dummy.updateMatrix();legs.current?.setMatrixAt(i*2,dummy.matrix);dummy.position.x+=0.4;dummy.updateMatrix();legs.current?.setMatrixAt(i*2+1,dummy.matrix);}});for(const r of [poles,heads,seats,legs])if(r.current)r.current.instanceMatrix.needsUpdate=true;},[items,dummy]);
  return <>
    <instancedMesh ref={poles} args={[undefined,undefined,items.length]} castShadow><cylinderGeometry args={[0.055,0.08,3.1,6]}/><meshStandardMaterial color="#303b39" metalness={0.5} roughness={0.5}/></instancedMesh>
    <instancedMesh ref={heads} args={[undefined,undefined,items.length]}><sphereGeometry args={[0.14,7,5]}/><meshBasicMaterial color="#ffe4a0"/></instancedMesh>
    <instancedMesh ref={seats} args={[undefined,undefined,items.length]} castShadow><boxGeometry args={[1.25,0.12,0.38]}/><meshStandardMaterial color="#76583d" roughness={0.85}/></instancedMesh>
    <instancedMesh ref={legs} args={[undefined,undefined,items.length*2]}><boxGeometry args={[0.08,0.48,0.08]}/><meshStandardMaterial color="#394340"/></instancedMesh>
  </>;
}

function Harbor() {
  const vessel=useRef();
  useFrame(({clock})=>{if(vessel.current){vessel.current.position.y=-0.58+Math.sin(clock.elapsedTime*0.8)*0.035;vessel.current.rotation.z=Math.sin(clock.elapsedTime*0.55)*0.012;}});
  return <group>
    <mesh position={[89,-0.08,-8]} castShadow><boxGeometry args={[15,0.25,3.4]}/><meshStandardMaterial color="#795a3e" roughness={0.86}/></mesh>
    {Array.from({length:8},(_,i)=><mesh key={i} position={[84+i*1.45,-0.38,-8]} castShadow><cylinderGeometry args={[0.2,0.24,1.35,7]}/><meshStandardMaterial color="#594734" roughness={0.94}/></mesh>)}
    <group ref={vessel} position={[91,-0.58,-13]}>
      <mesh castShadow><boxGeometry args={[6,0.8,1.7]}/><meshStandardMaterial color="#884d36" roughness={0.7}/></mesh>
      <mesh position={[0.3,0.53,0]}><boxGeometry args={[1.8,0.7,1.3]}/><meshStandardMaterial color="#eee0c3" roughness={0.65}/></mesh>
    </group>
  </group>;
}
export function RoadNetwork({roadLevel=1}) {
  const level=Math.max(0,Math.min(4,roadLevel));
  const ground=useMemo(()=>makeCityMaps('stone'),[]);
  const water=useMemo(()=>makeCityMaps('water'),[]);
  const island=useMemo(()=>{
    const shape=new Shape();
    ISLAND_SHORELINE.forEach(([x,z],index)=>index===0?shape.moveTo(x,-z):shape.lineTo(x,-z));
    shape.closePath();
    const top=new ShapeGeometry(shape,2);
    const body=new ExtrudeGeometry(shape,{depth:0.95,bevelEnabled:false,curveSegments:3});
    top.rotateX(-Math.PI/2);
    body.translate(0,0,-0.95);
    body.rotateX(-Math.PI/2);
    return {top,body};
  },[]);
  return <group>
    <mesh position={[0,-1.005,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[420,420]}/><meshStandardMaterial map={water.map} normalMap={water.normalMap} roughnessMap={water.roughnessMap} color="#578d92" roughness={0.3} metalness={0.12}/></mesh>
    <mesh geometry={island.body} position={[0,-0.037,0]} receiveShadow><meshStandardMaterial color="#827260" roughness={0.96}/></mesh>
    <mesh geometry={island.top} position={[0,-0.028,0]} receiveShadow><meshStandardMaterial map={ground.map} normalMap={ground.normalMap} roughnessMap={ground.roughnessMap} color="#91a96e" roughness={0.96}/></mesh>

    <TerrainHills />
    <StreetFurniture />
    <Harbor />
    {CITY_STREETS.map(path=><Street key={path.id} path={path} roadLevel={level}/>)}
    <Crosswalks />
    {level>=3 && CITY_STREETS.filter((_,i)=>i%3===0).map(path=><BikeLane key={`bike-${path.id}`} path={path}/>)}
  </group>;
}

function BikeLane({path}) {
  const geometry=useMemo(()=>ribbonGeometry(path.points,0.55,0.13),[path]);
  return <mesh geometry={geometry}><meshStandardMaterial color="#83a17f" roughness={0.88}/></mesh>;
}
