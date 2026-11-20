import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const CLOUD_PUFFS = [
  { position: [0, 0, 0], scale: 1 },
  { position: [0.75, 0.12, 0.08], scale: 0.72 },
  { position: [-0.72, 0.02, -0.06], scale: 0.64 },
  { position: [0.28, 0.33, 0.02], scale: 0.55 },
  { position: [-0.34, 0.24, 0.12], scale: 0.48 },
] as const;

const CLOUDS = [
  { position: [-8.5, 5.8, -5.5], scale: 1.15, speed: 0.24 },
  { position: [7.5, 6.6, -7], scale: 0.9, speed: 0.18 },
  { position: [10.5, 5.2, 3.5], scale: 1.3, speed: 0.2 },
  { position: [-10, 6.9, 4.8], scale: 0.8, speed: 0.16 },
  { position: [2, 7.5, -10.5], scale: 1.05, speed: 0.22 },
  { position: [-3.5, 4.9, 9.5], scale: 0.7, speed: 0.14 },
  { position: [0, 1.5, -4.2], scale: 0.55, speed: 0.1 },
  { position: [4.0, 1.7, -5.2], scale: 0.62, speed: 0.13 },
  { position: [7.2, 1.3, 3.2], scale: 0.5, speed: 0.11 },
] as const;

function Cloud({
  position,
  scale,
  speed,
}: {
  position: readonly [number, number, number];
  scale: number;
  speed: number;
}) {
  const group = useRef<THREE.Group>(null);
  const origin = useRef(position[0]);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.position.x += delta * speed;
    if (group.current.position.x > 17) {
      group.current.position.x = -17;
    }
    group.current.position.y =
      position[1] + Math.sin(group.current.position.x * 0.18 + origin.current) * 0.18;
  });

  return (
    <group ref={group} position={position} scale={scale}>
      {CLOUD_PUFFS.map((puff, index) => (
        <mesh
          key={index}
          position={puff.position}
          scale={[puff.scale * 1.25, puff.scale * 0.72, puff.scale]}
        >
          <sphereGeometry args={[0.62, 10, 8]} />
          <meshStandardMaterial
            color="#fffaf0"
            roughness={1}
            metalness={0}
            flatShading
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

function FloatingRock({
  position,
  scale,
  speed,
}: {
  position: readonly [number, number, number];
  scale: number;
  speed: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = clock.elapsedTime * speed;
    mesh.current.rotation.x = Math.sin(clock.elapsedTime * speed * 0.7) * 0.2;
    mesh.current.position.y =
      position[1] + Math.sin(clock.elapsedTime * 0.5 + position[0]) * 0.16;
  });

  return (
    <mesh ref={mesh} position={position} scale={[scale, scale * 0.8, scale]} castShadow>
      <dodecahedronGeometry args={[0.42, 0]} />
      <meshStandardMaterial
        color="#8c7965"
        roughness={0.95}
        metalness={0}
        flatShading
      />
    </mesh>
  );
}

export function Clouds() {
  return (
    <group>
      {CLOUDS.map((cloud, index) => (
        <Cloud key={index} {...cloud} />
      ))}
      <FloatingRock position={[-5.3, -2.1, 2.2]} scale={0.75} speed={0.2} />
      <FloatingRock position={[5.1, -2.7, -1.4]} scale={0.55} speed={0.15} />
      <FloatingRock position={[2.2, -3.4, 4.4]} scale={0.42} speed={0.24} />
      <FloatingRock position={[-3.1, -3.1, -4.6]} scale={0.48} speed={0.18} />
    </group>
  );
}
