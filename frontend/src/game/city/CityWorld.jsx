import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sky } from "@react-three/drei";
import { Color, Fog, Vector3 } from "three";
import { RoadNetwork } from "./components/RoadNetwork.jsx";
import { CityBuildings } from "./components/CityBuildings.jsx";
import { Vehicles } from "./components/Vehicles.jsx";
import { Greenery } from "./components/Greenery.jsx";
import { CityEffects } from "./components/CityEffects.jsx";
import { CivicLife } from "./components/CivicLife.jsx";
import { SeasonalAtmosphere, seasonalIndex } from "./components/SeasonalAtmosphere.jsx";

const QUALITY = {
  low: { dpr: 0.9, shadows: false },
  medium: { dpr: [1, 1.25], shadows: true },
  high: { dpr: [1, 1.55], shadows: true },
};

function SceneAtmosphere({ pollutionLevel = 0, cityStatus = "active", quality = "medium" }) {
  const { scene } = useThree();
  const sunRef = useRef();
  const transition = useRef(null);
  const mood = useMemo(() => {
    if (cityStatus === "won") return { sky: "#d2d9bf", ground: "#697b5d", light: "#ffe0a0", intensity: 3.2 };
    if (cityStatus === "lost") return { sky: "#8f8b82", ground: "#655a55", light: "#d89b82", intensity: 1.65 };
    if (pollutionLevel > 70) return { sky: "#bdc1b7", ground: "#626c5e", light: "#e5c9a0", intensity: 2.05 };
    return { sky: "#b8d0cb", ground: "#6d875f", light: "#ffe2b2", intensity: 2.7 };
  }, [cityStatus, pollutionLevel]);

  useEffect(() => {
    const color = new Color(mood.sky);
    scene.background = color;
    scene.fog = new Fog(color, pollutionLevel > 55 ? 145 : 185, pollutionLevel > 55 ? 365 : 430);
    return () => { scene.fog = null; };
  }, [mood.sky, pollutionLevel, scene]);

  useEffect(() => {
    const onMonth = () => { transition.current = { elapsed: 0, duration: 1.75 }; };
    window.addEventListener("cityworld:month-change", onMonth);
    return () => window.removeEventListener("cityworld:month-change", onMonth);
  }, []);

  useFrame((_, delta) => {
    if (!sunRef.current) return;
    if (transition.current) {
      transition.current.elapsed += delta;
      const t = Math.min(1, transition.current.elapsed / transition.current.duration);
      const arc = Math.sin(t * Math.PI);
      sunRef.current.position.set(-30 + t * 58, 29 + arc * 22, 15 - arc * 10);
      sunRef.current.intensity = mood.intensity * (0.62 + arc * 0.48);
      if (t >= 1) {
        sunRef.current.position.set(-25, 38, 16);
        sunRef.current.intensity = mood.intensity;
        transition.current = null;
      }
    } else {
      sunRef.current.intensity += (mood.intensity - sunRef.current.intensity) * Math.min(1, delta * 2);
    }
  });

  return <>
    <ambientLight intensity={quality === "low" ? 1.55 : 1.15} color={cityStatus === "won" ? "#ffedca" : "#fff1dc"} />
    <hemisphereLight args={["#dbe9e8", mood.ground, 1.15]} />
    <directionalLight ref={sunRef} position={[-25, 38, 16]} color={mood.light} intensity={mood.intensity} castShadow={QUALITY[quality]?.shadows ?? QUALITY.medium.shadows} shadow-mapSize={quality === "high" ? [2048, 2048] : [1024, 1024]} shadow-camera-left={-112} shadow-camera-right={112} shadow-camera-top={112} shadow-camera-bottom={-112} />
    <Sky distance={450000} sunPosition={[-0.44, 0.75, 0.38]} inclination={0.53} azimuth={0.19} rayleigh={pollutionLevel > 65 || cityStatus === "lost" ? 2.7 : 1.1} turbidity={pollutionLevel > 65 || cityStatus === "lost" ? 7 : 3.5} />
  </>;
}

function CameraRig({ controlsRef, onActivity }) {
  const { camera } = useThree();
  const focus = useRef(null);
  const scratchOffset = useMemo(() => new Vector3(), []);

  useEffect(() => {
    const reset = () => {
      focus.current = { position: new Vector3(132, 160, 132), target: new Vector3(0, 0, 0) };
      onActivity();
    };
    const focusOnBuilding = (event) => {
      const { x = 0, z = 0 } = event.detail || {};
      const target = new Vector3(x, 0, z);
      scratchOffset.copy(camera.position).sub(controlsRef.current?.target || new Vector3());
      scratchOffset.setLength(Math.max(20, Math.min(42, scratchOffset.length() * 0.54)));
      focus.current = { target, position: target.clone().add(scratchOffset) };
      onActivity();
    };
    const cancelFocus = () => { focus.current = null; };
    window.addEventListener("cityworld:camera-interaction", cancelFocus);
    window.addEventListener("cityworld:reset-camera", reset);
    window.addEventListener("cityworld:focus-camera", focusOnBuilding);
    return () => {
      window.removeEventListener("cityworld:camera-interaction", cancelFocus);
      window.removeEventListener("cityworld:reset-camera", reset);
      window.removeEventListener("cityworld:focus-camera", focusOnBuilding);
    };
  }, [camera, controlsRef, onActivity, scratchOffset]);

  useFrame((_, delta) => {
    const destination = focus.current;
    const controls = controlsRef.current;
    if (!destination || !controls) return;
    const blend = 1 - Math.exp(-delta * 2.8);
    camera.position.lerp(destination.position, blend);
    controls.target.lerp(destination.target, blend);
    controls.update();
    if (camera.position.distanceTo(destination.position) < 0.15 && controls.target.distanceTo(destination.target) < 0.08) focus.current = null;
  });
  return null;
}

/** Scene-only renderer boundary: all simulation fields come from the frontend adapter. */
export function CityWorld({ cityState, onSelect = () => {}, selectedId, quality = "medium" }) {
  const controlsRef = useRef();
  const idleTimer = useRef();
  const [autoRotate, setAutoRotate] = useState(false);
  const visualQuality = QUALITY[quality] || QUALITY.medium;
  const city = cityState?.city ?? {};
  const sectors = cityState?.sectors ?? {};
  const pollutionLevel = city.pollutionLevel ?? Math.max(0, 100 - (sectors.environment ?? 70));
  const month = cityState?.month ?? city.month ?? 1;
  const season = seasonalIndex(month);
  const startInteraction = useCallback(() => { window.clearTimeout(idleTimer.current); window.dispatchEvent(new Event("cityworld:camera-interaction")); setAutoRotate(false); }, []);
  const endInteraction = useCallback(() => { window.clearTimeout(idleTimer.current); idleTimer.current = window.setTimeout(() => { setAutoRotate(true); }, 6500); }, []);
  const focusActivity = useCallback(() => { startInteraction(); endInteraction(); }, [endInteraction, startInteraction]);
  const buildings = city.buildings ?? [];
  const cityEvents = [...(city.pendingEvents ?? []), ...(city.mapEffects ?? [])];
  const selectBuilding = (building) => {
    onSelect(building);
    if (building?.focus) window.dispatchEvent(new CustomEvent("cityworld:focus-camera", { detail: building.focus }));
  };

  useEffect(() => {
    endInteraction();
    return () => window.clearTimeout(idleTimer.current);
  }, [endInteraction]);

  return <Canvas className="city-canvas" shadows={visualQuality.shadows} dpr={visualQuality.dpr} camera={{ position: [132, 160, 132], fov: 38, near: 0.1, far: 620 }} gl={{ antialias: quality !== "low", powerPreference: "high-performance", alpha: false }}>
    <Suspense fallback={null}>
      <SceneAtmosphere pollutionLevel={pollutionLevel} cityStatus={city.status} quality={quality} />
      <SeasonalAtmosphere month={month} />
      <CameraRig controlsRef={controlsRef} onActivity={focusActivity} />
      <OrbitControls ref={controlsRef} makeDefault target={[0, 0, 0]} minDistance={12} maxDistance={260} minPolarAngle={0.15} maxPolarAngle={1.48} enableDamping dampingFactor={0.09} rotateSpeed={0.55} panSpeed={0.88} zoomSpeed={0.88} enablePan autoRotate={autoRotate} autoRotateSpeed={0.09} onStart={startInteraction} onEnd={endInteraction} />
      <group position={[0, -0.15, 0]}>
        <RoadNetwork roadLevel={city.roadLevel ?? Math.round((sectors.infrastructure ?? 50) / 25)} />
        <CityBuildings buildings={buildings} constructionSites={city.constructionSites ?? []} sectors={sectors} population={city.population ?? 10000} selectedId={selectedId} onSelect={selectBuilding} />
        <Greenery environmentLevel={sectors.environment ?? 68} roadLevel={city.roadLevel ?? 2} population={city.population ?? 10000} buildings={buildings} sectors={sectors} season={season} />
        <Vehicles trafficLevel={city.trafficLevel ?? 30} roadLevel={city.roadLevel ?? 2} quality={quality} />
        <CivicLife population={city.population ?? 10000} quality={quality} status={city.status} />
        <CityEffects pollutionLevel={pollutionLevel} unrestLevel={city.unrestLevel ?? Math.max(0, 100 - (city.stats?.approval ?? 50))} events={cityEvents} cityStatus={city.status} stats={city.stats ?? {}} quality={quality} />
      </group>
    </Suspense>
  </Canvas>;
}
