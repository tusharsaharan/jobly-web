import { Suspense, useEffect, useMemo, useRef } from "react";
import { RoundedBox, useTexture } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import * as THREE from "three";

export interface WorkflowVisualStep {
  accent: string;
  image: string;
}

interface WorkflowCanvasProps {
  onReady?: () => void;
  reducedMotion?: boolean;
  scrollProgress: MotionValue<number>;
  steps: readonly WorkflowVisualStep[];
}

function SceneRibbon({ color, offset, rotation }: { color: string; offset: number; rotation: number }) {
  const ribbon = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.8, -1.3 + offset, -2.8),
      new THREE.Vector3(-2.1, 1.15 + offset, -2.4),
      new THREE.Vector3(0.2, -0.55 + offset, -2.9),
      new THREE.Vector3(2.5, 1.28 + offset, -2.5),
      new THREE.Vector3(5.2, -0.1 + offset, -2.8),
    ]);
    return new THREE.TubeGeometry(curve, 96, 0.08, 12, false);
  }, [offset]);

  useFrame(({ clock }) => {
    if (!ribbon.current) return;
    ribbon.current.rotation.z = rotation + Math.sin(clock.getElapsedTime() * 0.24 + offset) * 0.08;
    ribbon.current.position.y = Math.sin(clock.getElapsedTime() * 0.42 + offset) * 0.12;
  });

  return (
    <mesh ref={ribbon} geometry={geometry} rotation={[0.22, -0.18, rotation]}>
      <meshStandardMaterial color={color} roughness={0.38} metalness={0.03} transparent opacity={0.52} />
    </mesh>
  );
}

function WorkflowCard({
  index,
  reducedMotion = false,
  scrollProgress,
  step,
}: {
  index: number;
  reducedMotion?: boolean;
  scrollProgress: MotionValue<number>;
  step: WorkflowVisualStep;
}) {
  const group = useRef<THREE.Group>(null);
  const accentMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const frameMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const imageMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const markerMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const texture = useTexture(step.image);
  const targetPosition = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
  }, [texture]);

  useFrame((_state, delta) => {
    if (!group.current) return;

    const progress = reducedMotion ? 0 : scrollProgress.get();
    const angle = index * (Math.PI / 2) - progress * Math.PI * 2 + Math.PI / 4;
    const depth = Math.cos(angle);
    const focus = (depth + 1) / 2;
    const targetScale = 0.56 + focus * 0.46;
    const cardOpacity = 0.06 + focus * focus * focus * focus * 0.94;

    targetPosition.set(
      Math.sin(angle) * 3.25,
      Math.sin(angle * 2) * 0.28 + Math.cos(angle) * 0.12 + (depth < -0.25 ? 0.82 : 0),
      depth * 2.55,
    );

    group.current.position.lerp(targetPosition, 1 - Math.exp(-delta * 8));
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      -0.05 + depth * 0.04,
      8,
      delta,
    );
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      -Math.sin(angle) * 0.36,
      8,
      delta,
    );
    group.current.rotation.z = THREE.MathUtils.damp(
      group.current.rotation.z,
      -Math.sin(angle) * 0.1,
      8,
      delta,
    );

    const nextScale = THREE.MathUtils.damp(group.current.scale.x, targetScale, 8, delta);
    group.current.scale.setScalar(nextScale);
    if (frameMaterial.current) frameMaterial.current.opacity = THREE.MathUtils.damp(frameMaterial.current.opacity, cardOpacity, 9, delta);
    if (imageMaterial.current) imageMaterial.current.opacity = THREE.MathUtils.damp(imageMaterial.current.opacity, cardOpacity, 9, delta);
    if (accentMaterial.current) accentMaterial.current.opacity = THREE.MathUtils.damp(accentMaterial.current.opacity, cardOpacity, 9, delta);
    if (markerMaterial.current) markerMaterial.current.opacity = THREE.MathUtils.damp(markerMaterial.current.opacity, cardOpacity, 9, delta);
  });

  return (
    <group ref={group}>
      <RoundedBox args={[3.2, 4.2, 0.18]} radius={0.1} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial ref={frameMaterial} color="#fffefd" metalness={0.02} opacity={0.3} roughness={0.56} transparent />
      </RoundedBox>

      <mesh position={[0, 0.14, 0.105]}>
        <planeGeometry args={[2.84, 3.36]} />
        <meshBasicMaterial ref={imageMaterial} map={texture} opacity={0.3} toneMapped={false} transparent />
      </mesh>

      <mesh position={[0, -1.74, 0.112]}>
        <planeGeometry args={[2.84, 0.34]} />
        <meshBasicMaterial ref={accentMaterial} color={step.accent} opacity={0.3} transparent />
      </mesh>

      <mesh position={[-1.08, -1.74, 0.118]}>
        <circleGeometry args={[0.07, 24]} />
        <meshBasicMaterial ref={markerMaterial} color="#e8f6c8" opacity={0.3} transparent />
      </mesh>
    </group>
  );
}

function WorkflowScene({
  reducedMotion,
  scrollProgress,
  steps,
}: Omit<WorkflowCanvasProps, "onReady">) {
  return (
    <>
      <color attach="background" args={["#f7fffb"]} />
      <ambientLight intensity={1.7} />
      <directionalLight castShadow color="#effcf6" intensity={2.1} position={[-4, 6, 8]} />
      <pointLight color="#a9ebd1" intensity={7} position={[5, 1, 4]} />
      <pointLight color="#b7d7f1" intensity={4.5} position={[-4, -2, 2]} />
      <SceneRibbon color="#d6f6e7" offset={0.7} rotation={-0.14} />
      <SceneRibbon color="#74cbaa" offset={-1.65} rotation={0.18} />

      <group position={[-1.35, -0.35, 0]}>
        {steps.map((step, index) => (
          <WorkflowCard
            key={step.image}
            index={index}
            reducedMotion={reducedMotion}
            scrollProgress={scrollProgress}
            step={step}
          />
        ))}
      </group>
    </>
  );
}

export function WorkflowCanvas({
  onReady,
  reducedMotion,
  scrollProgress,
  steps,
}: WorkflowCanvasProps) {
  return (
    <Canvas
      camera={{ fov: 37, position: [0, 0, 11.5] }}
      className="h-full w-full"
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={() => onReady?.()}
    >
      <Suspense fallback={null}>
        <WorkflowScene
          reducedMotion={reducedMotion}
          scrollProgress={scrollProgress}
          steps={steps}
        />
      </Suspense>
    </Canvas>
  );
}
