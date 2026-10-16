import React, { useLayoutEffect, useMemo, useRef } from "react";
import { CatmullRomCurve3, Object3D, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { CITY_STREETS, terrainHeight } from "./cityLayout.js";

const COATS = ["#6c4d3b", "#465b58", "#a76445", "#7b8061", "#526678", "#b38c63", "#6e5551", "#d3c29e"];

function sidewalkRoute(street, side) {
  const offset = street.width / 2 + 0.93;
  const points = street.points.map(([x, z], index, list) => {
    const previous = list[Math.max(0, index - 1)];
    const next = list[Math.min(list.length - 1, index + 1)];
    const dx = next[0] - previous[0];
    const dz = next[1] - previous[1];
    const length = Math.hypot(dx, dz) || 1;
    return new Vector3(x - dz / length * offset * side, 0, z + dx / length * offset * side);
  });
  return new CatmullRomCurve3(points, false, "centripetal");
}

function Pedestrians({ population, quality }) {
  const personCount = Math.max(18, Math.min(52, Math.round(22 + population / 2500))) * (quality === "low" ? 0.55 : quality === "medium" ? 0.78 : 1);
  const count = Math.max(4, Math.round(personCount));
  const torsoRef = useRef();
  const headRef = useRef();
  const legRef = useRef();
  const dummy = useMemo(() => new Object3D(), []);
  const people = useMemo(() => Array.from({ length: count }, (_, index) => ({
    index,
    speed: 1.2 + (index % 5) * 0.16,
    phase: index * 3.91,
    route: sidewalkRoute(CITY_STREETS[(index * 5 + 2) % CITY_STREETS.length], index % 2 ? -1 : 1),
    color: COATS[index % COATS.length],
  })), [count]);

  useLayoutEffect(() => {
    if (!torsoRef.current || !headRef.current || !legRef.current) return;
    people.forEach((person, i) => {
      torsoRef.current.setColorAt(i, new (torsoRef.current.material.color.constructor)(person.color));
      headRef.current.setColorAt(i, new (headRef.current.material.color.constructor)("#c39b79"));
      legRef.current.setColorAt(i * 2, new (legRef.current.material.color.constructor)("#364148"));
      legRef.current.setColorAt(i * 2 + 1, new (legRef.current.material.color.constructor)("#364148"));
    });
    torsoRef.current.instanceColor.needsUpdate = true;
    headRef.current.instanceColor.needsUpdate = true;
    legRef.current.instanceColor.needsUpdate = true;
  }, [people]);

  useFrame(({ clock }) => {
    if (!torsoRef.current || !headRef.current || !legRef.current) return;
    const time = clock.elapsedTime;
    people.forEach((person, i) => {
      const progress = ((time * person.speed + person.phase) % person.route.getLength()) / person.route.getLength();
      const point = person.route.getPointAt(progress);
      const tangent = person.route.getTangentAt(progress);
      const x = point.x;
      const z = point.z;
      const stride = Math.sin(time * 8 + person.phase) * 0.09;
      const yaw = Math.atan2(tangent.x, tangent.z);
      const bob = Math.abs(Math.sin(time * 8 + person.phase)) * 0.035;

      dummy.position.set(x, 0.57 + bob + terrainHeight(x,z), z);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      torsoRef.current.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, 0.99 + bob + terrainHeight(x,z), z);
      dummy.scale.set(0.16, 0.17, 0.16);
      dummy.updateMatrix();
      headRef.current.setMatrixAt(i, dummy.matrix);
      for (let leg = 0; leg < 2; leg += 1) {
        dummy.position.set(x + Math.cos(yaw) * (leg ? 0.07 : -0.07), 0.22 + bob + terrainHeight(x,z), z - Math.sin(yaw) * (leg ? 0.07 : -0.07));
        dummy.rotation.set(stride * (leg ? 1 : -1), yaw, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        legRef.current.setMatrixAt(i * 2 + leg, dummy.matrix);
      }
    });
    torsoRef.current.instanceMatrix.needsUpdate = true;
    headRef.current.instanceMatrix.needsUpdate = true;
    legRef.current.instanceMatrix.needsUpdate = true;
  });

  return <>
    <instancedMesh ref={torsoRef} args={[undefined, undefined, count]} castShadow>
      <capsuleGeometry args={[0.14, 0.34, 3, 6]} /><meshStandardMaterial color="white" roughness={0.86} />
    </instancedMesh>
    <instancedMesh ref={headRef} args={[undefined, undefined, count]} castShadow>
      <sphereGeometry args={[1, 8, 7]} /><meshStandardMaterial color="white" roughness={0.9} />
    </instancedMesh>
    <instancedMesh ref={legRef} args={[undefined, undefined, count * 2]} castShadow>
      <capsuleGeometry args={[0.055, 0.22, 2, 5]} /><meshStandardMaterial color="#364148" roughness={0.9} />
    </instancedMesh>
  </>;
}

function StreetDogs({ quality }) {
  const count = quality === "low" ? 3 : quality === "medium" ? 5 : 7;
  const bodyRef = useRef();
  const headRef = useRef();
  const legRef = useRef();
  const dummy = useMemo(() => new Object3D(), []);
  useFrame(({ clock }) => {
    if (!bodyRef.current || !headRef.current || !legRef.current) return;
    const time = clock.elapsedTime;
    for (let i = 0; i < count; i += 1) {
      const route = sidewalkRoute(CITY_STREETS[(i * 4 + 1) % CITY_STREETS.length], i % 2 ? -1 : 1);
      const progress = ((time * (0.62 + i * 0.1) + i * 16) % route.getLength()) / route.getLength();
      const point = route.getPointAt(progress);
      const tangent = route.getTangentAt(progress);
      const x = point.x;
      const z = point.z;
      dummy.position.set(x, 0.37 + Math.abs(Math.sin(time * 7 + i)) * 0.025 + terrainHeight(x,z), z);
      dummy.rotation.set(0, Math.atan2(-tangent.z, tangent.x), 0);
      dummy.scale.set(0.58, 0.43, 0.37);
      dummy.updateMatrix();
      bodyRef.current.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x + 0.31, 0.48 + terrainHeight(x,z), z + 0.02);
      dummy.scale.set(0.22, 0.21, 0.21);
      dummy.updateMatrix();
      headRef.current.setMatrixAt(i, dummy.matrix);
      for (let leg = 0; leg < 4; leg += 1) {
        dummy.position.set(x + (leg < 2 ? -0.16 : 0.18), 0.14 + Math.abs(Math.sin(time * 8 + leg + i)) * 0.04, z + (leg % 2 ? -0.12 : 0.12));
        dummy.scale.set(0.08, 0.28, 0.08);
        dummy.updateMatrix();
        legRef.current.setMatrixAt(i * 4 + leg, dummy.matrix);
      }
    }
    for (const mesh of [bodyRef.current, headRef.current, legRef.current]) mesh.instanceMatrix.needsUpdate = true;
  });
  return <>
    <instancedMesh ref={bodyRef} args={[undefined, undefined, count]} castShadow><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#987351" roughness={0.92} /></instancedMesh>
    <instancedMesh ref={headRef} args={[undefined, undefined, count]} castShadow><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#b48b64" roughness={0.92} /></instancedMesh>
    <instancedMesh ref={legRef} args={[undefined, undefined, count * 4]} castShadow><cylinderGeometry args={[0.055, 0.07, 1, 5]} /><meshStandardMaterial color="#74573e" roughness={0.95} /></instancedMesh>
  </>;
}

function Bird({ index }) {
  const ref = useRef();
  const leftWing = useRef();
  const rightWing = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 0.16 + index * 1.5;
    ref.current.position.set(Math.sin(t) * 19, 8 + Math.sin(t * 2) * 1.3 + index * 0.28, Math.cos(t) * 15 - 4);
    ref.current.rotation.y = Math.atan2(Math.cos(t), -Math.sin(t));
    const flap = Math.sin(clock.elapsedTime * 6 + index) * 0.32;
    if (leftWing.current) leftWing.current.rotation.z = flap;
    if (rightWing.current) rightWing.current.rotation.z = -flap;
  });
  return <group ref={ref}>
    <mesh><capsuleGeometry args={[0.045, 0.22, 2, 5]} /><meshStandardMaterial color="#5a5b50" roughness={0.86} /></mesh>
    <mesh ref={leftWing} position={[-0.08, 0.015, 0]}><boxGeometry args={[0.22, 0.025, 0.08]} /><meshStandardMaterial color="#706c5e" /></mesh>
    <mesh ref={rightWing} position={[0.08, 0.015, 0]}><boxGeometry args={[0.22, 0.025, 0.08]} /><meshStandardMaterial color="#706c5e" /></mesh>
  </group>;
}

export function CivicLife({ population = 10000, quality = "medium", status = "active" }) {
  if (status === "lost") return null;
  const birdCount = quality === "low" ? 2 : quality === "medium" ? 4 : 7;
  return <group>
    <Pedestrians population={population} quality={quality} />
    <StreetDogs quality={quality} />
    {Array.from({ length: birdCount }, (_, index) => <Bird key={index} index={index} />)}
  </group>;
}
