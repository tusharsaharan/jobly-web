import { Float, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function CurveRibbon({
  color,
  offset = 0,
  rotation = 0,
  reducedMotion = false,
}: {
  color: string;
  offset?: number;
  rotation?: number;
  reducedMotion?: boolean;
}) {
  const ribbon = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3.6, -1.8 + offset, 0),
      new THREE.Vector3(-1.5, 0.7 + offset, 0.5),
      new THREE.Vector3(0.5, -0.2 + offset, -0.5),
      new THREE.Vector3(2.4, 1.8 + offset, 0.2),
      new THREE.Vector3(4.4, -0.4 + offset, -0.1),
    ]);
    return new THREE.TubeGeometry(curve, 120, 0.11, 14, false);
  }, [offset]);

  useFrame(({ clock }) => {
    if (!ribbon.current || reducedMotion) return;
    ribbon.current.rotation.z = rotation + Math.sin(clock.getElapsedTime() * 0.35 + offset) * 0.1;
    ribbon.current.position.y = Math.sin(clock.getElapsedTime() * 0.55 + offset) * 0.16;
  });

  return (
    <mesh ref={ribbon} geometry={geometry} rotation={[0.18, -0.28, rotation]}>
      <meshStandardMaterial color={color} roughness={0.34} metalness={0.04} transparent opacity={0.64} />
    </mesh>
  );
}

function ResumeLayer({
  color,
  position,
  rotation,
  scale = 1,
  reducedMotion = false,
}: {
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
  reducedMotion?: boolean;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!group.current || reducedMotion) return;
    group.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 0.7 + position[0]) * 0.12;
    group.current.rotation.y = rotation[1] + Math.sin(clock.getElapsedTime() * 0.35 + position[2]) * 0.05;
  });

  return (
    <group ref={group} position={position} rotation={rotation} scale={scale}>
      <RoundedBox args={[2.65, 3.45, 0.14]} radius={0.14} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#fffefd" roughness={0.48} metalness={0.02} transparent opacity={0.9} />
      </RoundedBox>
      <mesh position={[0, 1.15, 0.09]}>
        <planeGeometry args={[1.82, 0.42]} />
        <meshBasicMaterial color={color} transparent opacity={0.86} />
      </mesh>
      <mesh position={[-0.4, 0.48, 0.09]}>
        <planeGeometry args={[1.02, 0.11]} />
        <meshBasicMaterial color="#183a32" transparent opacity={0.56} />
      </mesh>
      <mesh position={[-0.2, 0.13, 0.09]}>
        <planeGeometry args={[1.42, 0.08]} />
        <meshBasicMaterial color="#183a32" transparent opacity={0.28} />
      </mesh>
      <mesh position={[-0.04, -0.16, 0.09]}>
        <planeGeometry args={[1.72, 0.08]} />
        <meshBasicMaterial color="#183a32" transparent opacity={0.24} />
      </mesh>
      <mesh position={[-0.3, -0.75, 0.09]}>
        <planeGeometry args={[1.22, 0.3]} />
        <meshBasicMaterial color={color} transparent opacity={0.34} />
      </mesh>
    </group>
  );
}

function HeroScene({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const cluster = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!cluster.current || reducedMotion) return;
    cluster.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.22) * 0.08;
    cluster.current.rotation.x = -0.08 + Math.cos(clock.getElapsedTime() * 0.18) * 0.025;
  });

  return (
    <>
      <ambientLight intensity={1.7} />
      <directionalLight position={[-4, 5, 7]} intensity={2.7} color="#effcf6" />
      <pointLight position={[4, 1, 4]} intensity={6} color="#a9ebd1" />
      <pointLight position={[-3, -2, 3]} intensity={3.2} color="#b7d7f1" />

      <CurveRibbon color="#d6f6e7" offset={0.2} rotation={-0.18} reducedMotion={reducedMotion} />
      <CurveRibbon color="#74cbaa" offset={-1.8} rotation={0.15} reducedMotion={reducedMotion} />

      <group ref={cluster} position={[0.7, -0.2, 0]}>
        <Float speed={reducedMotion ? 0 : 1.1} rotationIntensity={reducedMotion ? 0 : 0.16} floatIntensity={reducedMotion ? 0 : 0.7}>
          <ResumeLayer color="#b7d7f1" position={[-0.86, 0.02, -1.25]} rotation={[0.14, 0.34, -0.18]} scale={0.88} reducedMotion={reducedMotion} />
          <ResumeLayer color="#74cbaa" position={[0.78, -0.28, -0.52]} rotation={[0.08, -0.28, 0.18]} scale={0.94} reducedMotion={reducedMotion} />
          <ResumeLayer color="#a9ebd1" position={[-0.02, 0.32, 0.5]} rotation={[-0.04, 0.05, -0.03]} reducedMotion={reducedMotion} />
        </Float>
      </group>
    </>
  );
}

export function HeroCanvas({ reducedMotion = false }: { reducedMotion?: boolean }) {
  return (
    <Canvas
      camera={{ fov: 38, position: [0, 0, 10.8] }}
      className="h-full w-full"
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <HeroScene reducedMotion={reducedMotion} />
    </Canvas>
  );
}
