import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D } from 'three';

export function seasonalIndex(month = 1) { return Math.floor(Math.max(0, Number(month || 1) - 1) / 4) % 4; }

function Clouds() {
  const groups = useRef([]);
  useFrame(({ clock }) => groups.current.forEach((g, i) => { if (g) { g.position.x = Math.sin(clock.elapsedTime * 0.012 + i * 1.7) * 66; g.position.z = Math.cos(clock.elapsedTime * 0.009 + i * 1.3) * 52; } }));
  return <group>{Array.from({length:7},(_,i)=><group key={i} ref={el=>groups.current[i]=el} position={[0,25+(i%3)*4,0]}>
    {[-1,0,1].map((n)=><mesh key={n} position={[n*2.1,Math.abs(n)*0.38,Math.sin(n)*0.7]}><sphereGeometry args={[2.4,9,7]}/><meshStandardMaterial color="#fffaf1" transparent opacity={0.2} depthWrite={false} roughness={1}/></mesh>)}
  </group>)}</group>;
}

function SeasonParticles({ season }) {
  const ref=useRef(); const dummy=useMemo(()=>new Object3D(),[]); const count=season===2?140:season===3?260:0;
  const points=useMemo(()=>Array.from({length:count},(_,i)=>({x:((i*47)%170)-85,z:((i*83)%165)-82,y:(i*19)%24,phase:i*0.71})),[count]);
  useFrame(({clock},delta)=>{
    if(!ref.current)return; const t=clock.elapsedTime;
    points.forEach((p,i)=>{p.y-=delta*(season===3?1.7:2.4);if(p.y<0)p.y=24;dummy.position.set(p.x+Math.sin(t*0.35+p.phase)*(season===3?2.4:0.8),p.y,p.z+Math.cos(t*0.22+p.phase));dummy.rotation.set(t*0.4+p.phase,0,t*0.25);dummy.scale.setScalar(season===3?0.09:0.12);dummy.updateMatrix();ref.current.setMatrixAt(i,dummy.matrix);});ref.current.instanceMatrix.needsUpdate=true;
  });
  if(!count)return null;
  return <instancedMesh ref={ref} args={[undefined,undefined,count]}><sphereGeometry args={[1,5,4]}/><meshStandardMaterial color={season===3?'#f5f5ee':'#ba7443'} roughness={0.9}/></instancedMesh>;
}

export function SeasonalAtmosphere({ month=1 }) {
  const season=seasonalIndex(month);

  return <group>
    <Clouds />
    <SeasonParticles season={season}/>

  </group>;
}
