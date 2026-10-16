import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import { Color, Fog } from 'three';
import { RoadNetwork } from './components/RoadNetwork.jsx';
import { CityBuildings } from './components/CityBuildings.jsx';
import { Vehicles } from './components/Vehicles.jsx';
import { Greenery } from './components/Greenery.jsx';
import { CityEffects } from './components/CityEffects.jsx';

function SceneAtmosphere({ pollutionLevel = 0 }) {
  const { scene } = useThree();
  useEffect(() => {
    const sky = new Color(pollutionLevel > 65 ? '#bac7c3' : '#dbe8df');
    scene.background = sky;
    scene.fog = new Fog(sky, 48, 115);
  }, [scene, pollutionLevel]);
  return <>
    <ambientLight intensity={1.55} />
    <hemisphereLight args={['#fff5d9', '#78966d', 1.15]} />
    <directionalLight position={[-25, 35, 12]} intensity={2.5} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-42} shadow-camera-right={42} shadow-camera-top={42} shadow-camera-bottom={-42} />
    <Sky distance={450000} sunPosition={[-25, 35, 12]} inclination={0.53} azimuth={0.19} rayleigh={pollutionLevel > 65 ? 2.7 : 0.7} turbidity={pollutionLevel > 65 ? 8 : 2} />
  </>;
}

function CameraRig({ controlsRef }) {
  const { camera } = useThree();
  useEffect(() => {
    const reset = () => {
      camera.position.set(31, 35, 39);
      camera.lookAt(0, 0, 0);
      controlsRef.current?.target.set(0, 0, 0);
      controlsRef.current?.update();
    };
    window.addEventListener('cityworld:reset-camera', reset);
    return () => window.removeEventListener('cityworld:reset-camera', reset);
  }, [camera, controlsRef]);
  return null;
}

/**
 * Pure renderer boundary. `cityState` is read-only presentation data from React state/API.
 * See README for the stable integration contract and supported visual fields.
 */
export function CityWorld({ cityState, onSelect = () => {}, selectedId }) {
  const controlsRef = useRef();
  const city = cityState?.city ?? {};
  const sectors = cityState?.sectors ?? {};
  const roadLevel = city.roadLevel ?? Math.round((sectors.infrastructure ?? 50) / 25);
  return <Canvas className="city-canvas" shadows dpr={[1, 1.6]} camera={{ position: [31, 35, 39], fov: 35, near: 0.1, far: 220 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
    <Suspense fallback={null}>
      <SceneAtmosphere pollutionLevel={city.pollutionLevel ?? Math.max(0, 100 - (sectors.environment ?? 70))} />
      <CameraRig controlsRef={controlsRef} />
      <OrbitControls ref={controlsRef} makeDefault target={[0, 0, 0]} minDistance={18} maxDistance={92} minPolarAngle={0.28} maxPolarAngle={1.43} enableDamping dampingFactor={0.08} rotateSpeed={0.58} panSpeed={0.8} zoomSpeed={0.82} />
      <group position={[0, -0.15, 0]}>
        <RoadNetwork roadLevel={roadLevel} />
        <CityBuildings buildings={city.buildings ?? []} constructionSites={city.constructionSites ?? []} sectors={sectors} selectedId={selectedId} onSelect={onSelect} />
        <Greenery environmentLevel={sectors.environment ?? 68} roadLevel={roadLevel} />
        <Vehicles trafficLevel={city.trafficLevel ?? 30} roadLevel={roadLevel} />
        <CityEffects pollutionLevel={city.pollutionLevel ?? Math.max(0, 100 - (sectors.environment ?? 70))} unrestLevel={city.unrestLevel ?? Math.max(0, 55 - (sectors.governance ?? 60))} />
      </group>
    </Suspense>
  </Canvas>;
}
