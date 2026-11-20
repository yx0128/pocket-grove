import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ItemId } from '../../types';

interface AssetProps {
  ghost?: boolean;
}

interface MaterialOptions {
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
  roughness?: number;
  metalness?: number;
}

function mat(color: string, ghost: boolean, options: MaterialOptions = {}) {
  const opacity = options.opacity ?? 1;
  return {
    color,
    roughness: options.roughness ?? 0.84,
    metalness: options.metalness ?? 0.02,
    flatShading: true,
    emissive: options.emissive ?? '#000000',
    emissiveIntensity:
      (options.emissiveIntensity ?? 0) * (ghost ? 0.35 : 1),
    transparent: ghost || opacity < 1,
    opacity: ghost ? Math.min(0.68, opacity) : opacity,
    depthWrite: !ghost && opacity >= 1,
  };
}

const FLOWERS = [
  { x: -0.28, z: 0.26, color: '#f6b3c8' },
  { x: 0.22, z: 0.3, color: '#f5e2a8' },
  { x: 0.3, z: -0.2, color: '#d9c5ef' },
  { x: -0.2, z: -0.3, color: '#f6b3c8' },
] as const;

const BLADES = [
  { x: -0.1, z: 0.05, lean: 0.25 },
  { x: 0.05, z: -0.12, lean: -0.3 },
  { x: 0.34, z: 0.05, lean: 0.2 },
  { x: -0.36, z: -0.06, lean: -0.2 },
  { x: 0.04, z: 0.34, lean: 0.1 },
] as const;

function GrassPatch({ ghost = false }: AssetProps) {
  return (
    <group>
      <mesh position={[0, 0.02, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.96, 0.04, 0.96]} />
        <meshStandardMaterial {...mat('#8fc47a', ghost)} />
      </mesh>
      {FLOWERS.map((flower) => (
        <group key={`${flower.x}-${flower.z}`} position={[flower.x, 0.04, flower.z]}>
          <mesh position={[0, 0.045, 0]} castShadow>
            <cylinderGeometry args={[0.008, 0.01, 0.09, 5]} />
            <meshStandardMaterial {...mat('#6f9e5c', ghost)} />
          </mesh>
          <mesh position={[0, 0.1, 0]} castShadow>
            <dodecahedronGeometry args={[0.035, 0]} />
            <meshStandardMaterial {...mat(flower.color, ghost)} />
          </mesh>
          <mesh position={[0, 0.115, 0]}>
            <sphereGeometry args={[0.016, 8, 8]} />
            <meshStandardMaterial {...mat('#f2cf6b', ghost)} />
          </mesh>
        </group>
      ))}
      {BLADES.map((blade) => (
        <mesh
          key={`${blade.x}-${blade.z}`}
          position={[blade.x, 0.1, blade.z]}
          rotation={[0, 0, blade.lean]}
          castShadow
        >
          <coneGeometry args={[0.018, 0.13, 4]} />
          <meshStandardMaterial {...mat('#77ad67', ghost)} />
        </mesh>
      ))}
    </group>
  );
}

const STONES = [
  { x: -0.31, z: -0.29, color: '#c5b49a' },
  { x: -0.09, z: -0.33, color: '#b9a78d' },
  { x: 0.2, z: -0.29, color: '#cfbea4' },
  { x: 0.33, z: -0.05, color: '#b9a78d' },
  { x: 0.11, z: 0.03, color: '#c8b79d' },
  { x: -0.15, z: 0.01, color: '#b3a188' },
  { x: -0.33, z: 0.19, color: '#cbbaa0' },
  { x: -0.07, z: 0.27, color: '#bfae94' },
  { x: 0.21, z: 0.28, color: '#cfbea4' },
  { x: -0.03, z: -0.11, color: '#b9a78d' },
  { x: 0.3, z: 0.19, color: '#c2b197' },
] as const;

function CobblestonePath({ ghost = false }: AssetProps) {
  return (
    <group>
      <mesh position={[0, 0.015, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.96, 0.03, 0.96]} />
        <meshStandardMaterial {...mat('#cdbb9f', ghost)} />
      </mesh>
      {STONES.map((stone) => (
        <mesh
          key={`${stone.x}-${stone.z}`}
          position={[stone.x, 0.055, stone.z]}
          scale={[1.15, 0.36, 0.95]}
          rotation={[0, stone.x * 2, 0]}
          receiveShadow
          castShadow
        >
          <dodecahedronGeometry args={[0.1, 0]} />
          <meshStandardMaterial {...mat(stone.color, ghost)} />
        </mesh>
      ))}
    </group>
  );
}

const POND_RIM = Array.from({ length: 9 }, (_, index) => {
  const angle = (index / 9) * Math.PI * 2;
  return {
    x: Math.cos(angle) * 0.4,
    z: Math.sin(angle) * 0.4,
    scale: 0.85 + (index % 3) * 0.1,
  };
});

const LILIES = [
  { x: -0.16, z: 0.1, rotation: 0.4 },
  { x: 0.15, z: -0.15, rotation: -0.7 },
  { x: 0.05, z: 0.22, rotation: 1.2 },
] as const;

function WaterPond({ ghost = false }: AssetProps) {
  return (
    <group>
      <mesh position={[0, 0.02, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.96, 0.04, 0.96]} />
        <meshStandardMaterial {...mat('#a6c99a', ghost)} />
      </mesh>
      <mesh position={[0, 0.045, 0]} receiveShadow>
        <boxGeometry args={[0.82, 0.03, 0.82]} />
        <meshStandardMaterial
          {...mat('#7cc6d8', ghost, {
            opacity: 0.84,
            roughness: 0.22,
            metalness: 0.05,
          })}
        />
      </mesh>
      {POND_RIM.map((stone, index) => (
        <mesh
          key={index}
          position={[stone.x, 0.065, stone.z]}
          scale={[stone.scale, 0.55, stone.scale]}
          castShadow
        >
          <dodecahedronGeometry args={[0.055, 0]} />
          <meshStandardMaterial {...mat('#b9b09a', ghost)} />
        </mesh>
      ))}
      {LILIES.map((lily) => (
        <group
          key={`${lily.x}-${lily.z}`}
          position={[lily.x, 0.065, lily.z]}
          rotation={[0, lily.rotation, 0]}
        >
          <mesh receiveShadow>
            <cylinderGeometry args={[0.085, 0.085, 0.012, 12]} />
            <meshStandardMaterial {...mat('#6f9f5e', ghost)} />
          </mesh>
          <mesh position={[0.02, 0.018, 0.01]} castShadow>
            <dodecahedronGeometry args={[0.03, 0]} />
            <meshStandardMaterial {...mat('#f4b8c8', ghost)} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function PineTree({ ghost = false }: AssetProps) {
  return (
    <group>
      <mesh position={[0, 0.025, 0]} receiveShadow>
        <cylinderGeometry args={[0.31, 0.35, 0.05, 12]} />
        <meshStandardMaterial {...mat('#88b974', ghost)} />
      </mesh>
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.045, 0.06, 0.24, 7]} />
        <meshStandardMaterial {...mat('#8a5f3f', ghost)} />
      </mesh>
      <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.29, 0.28, 8]} />
        <meshStandardMaterial {...mat('#4f8a63', ghost)} />
      </mesh>
      <mesh position={[0, 0.49, 0]} rotation={[0, 0.35, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.23, 0.27, 8]} />
        <meshStandardMaterial {...mat('#5f9d72', ghost)} />
      </mesh>
      <mesh position={[0, 0.63, 0]} rotation={[0, 0.7, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.16, 0.25, 8]} />
        <meshStandardMaterial {...mat('#74ac82', ghost)} />
      </mesh>
      <mesh position={[0, 0.76, 0]} castShadow>
        <coneGeometry args={[0.06, 0.12, 6]} />
        <meshStandardMaterial {...mat('#86bb8f', ghost)} />
      </mesh>
    </group>
  );
}

const PETALS = [
  { x: -0.29, z: 0.19, color: '#f7c4d2' },
  { x: 0.2, z: 0.3, color: '#f2adc3' },
  { x: 0.33, z: -0.09, color: '#f8d2dc' },
  { x: -0.12, z: -0.31, color: '#f4b8c8' },
  { x: -0.34, z: -0.13, color: '#f2adc3' },
  { x: 0.08, z: 0.36, color: '#f8d2dc' },
] as const;

function CherryBlossom({ ghost = false }: AssetProps) {
  return (
    <group>
      <mesh position={[0, 0.025, 0]} receiveShadow>
        <cylinderGeometry args={[0.3, 0.34, 0.05, 12]} />
        <meshStandardMaterial {...mat('#8fbf7a', ghost)} />
      </mesh>
      <mesh position={[0, 0.19, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.045, 0.065, 0.3, 7]} />
        <meshStandardMaterial {...mat('#8a5f3f', ghost)} />
      </mesh>
      <mesh position={[-0.09, 0.39, 0]} rotation={[0, 0, -0.5]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, 0.22, 6]} />
        <meshStandardMaterial {...mat('#8a5f3f', ghost)} />
      </mesh>
      <mesh position={[0.1, 0.4, 0.02]} rotation={[0, 0, 0.55]} castShadow>
        <cylinderGeometry args={[0.022, 0.032, 0.2, 6]} />
        <meshStandardMaterial {...mat('#8a5f3f', ghost)} />
      </mesh>
      <mesh position={[0, 0.64, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.27, 1]} />
        <meshStandardMaterial {...mat('#f4b8c8', ghost)} />
      </mesh>
      <mesh position={[-0.2, 0.56, 0.05]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.17, 1]} />
        <meshStandardMaterial {...mat('#f8cdd8', ghost)} />
      </mesh>
      <mesh position={[0.21, 0.58, -0.04]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.18, 1]} />
        <meshStandardMaterial {...mat('#f2adc3', ghost)} />
      </mesh>
      <mesh position={[0.01, 0.77, 0.04]} castShadow>
        <dodecahedronGeometry args={[0.14, 1]} />
        <meshStandardMaterial {...mat('#f8cdd8', ghost)} />
      </mesh>
      {PETALS.map((petal) => (
        <mesh
          key={`${petal.x}-${petal.z}`}
          position={[petal.x, 0.06, petal.z]}
          scale={[1, 0.25, 0.7]}
          rotation={[0, petal.x * 4, 0]}
        >
          <dodecahedronGeometry args={[0.035, 0]} />
          <meshStandardMaterial {...mat(petal.color, ghost)} />
        </mesh>
      ))}
    </group>
  );
}

function BenchAndLamp({ ghost = false }: AssetProps) {
  return (
    <group>
      <mesh position={[0, 0.012, 0]} receiveShadow>
        <boxGeometry args={[0.9, 0.024, 0.9]} />
        <meshStandardMaterial {...mat('#b9c9a4', ghost)} />
      </mesh>
      <group position={[-0.13, 0, 0.03]}>
        <mesh position={[0, 0.17, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.055, 0.19]} />
          <meshStandardMaterial {...mat('#a9744f', ghost)} />
        </mesh>
        <mesh position={[0, 0.29, -0.07]} rotation={[-0.13, 0, 0]} castShadow>
          <boxGeometry args={[0.42, 0.19, 0.05]} />
          <meshStandardMaterial {...mat('#a9744f', ghost)} />
        </mesh>
        {[
          [-0.16, 0.1, -0.05],
          [0.16, 0.1, -0.05],
          [-0.16, 0.1, 0.05],
          [0.16, 0.1, 0.05],
        ].map(([x, y, z]) => (
          <mesh key={`${x}-${z}`} position={[x, y, z]} castShadow>
            <boxGeometry args={[0.035, 0.17, 0.035]} />
            <meshStandardMaterial {...mat('#7d5237', ghost)} />
          </mesh>
        ))}
        <mesh position={[0, 0.21, 0.1]} castShadow>
          <boxGeometry args={[0.36, 0.04, 0.02]} />
          <meshStandardMaterial {...mat('#8f5f3f', ghost)} />
        </mesh>
      </group>
      <group position={[0.3, 0, -0.08]}>
        <mesh position={[0, 0.04, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.07, 0.08, 8]} />
          <meshStandardMaterial {...mat('#5f6f66', ghost)} />
        </mesh>
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.03, 0.46, 7]} />
          <meshStandardMaterial {...mat('#5f6f66', ghost)} />
        </mesh>
        <mesh position={[0.07, 0.48, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.015, 0.02, 0.15, 6]} />
          <meshStandardMaterial {...mat('#5f6f66', ghost)} />
        </mesh>
        <mesh position={[0.145, 0.46, 0]} castShadow>
          <boxGeometry args={[0.09, 0.11, 0.09]} />
          <meshStandardMaterial
            {...mat('#ffe0a3', ghost, {
              emissive: '#ffc46b',
              emissiveIntensity: 1.4,
              opacity: 0.95,
            })}
          />
        </mesh>
        <mesh position={[0.145, 0.53, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[0.085, 0.07, 4]} />
          <meshStandardMaterial {...mat('#5f6f66', ghost)} />
        </mesh>
        <pointLight
          position={[0.145, 0.46, 0]}
          color="#ffc46b"
          intensity={ghost ? 0 : 0.55}
          distance={2.1}
          decay={2}
        />
      </group>
    </group>
  );
}

function CozyCottage({ ghost = false }: AssetProps) {
  return (
    <group>
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <boxGeometry args={[0.94, 0.03, 0.94]} />
        <meshStandardMaterial {...mat('#b4ca9d', ghost)} />
      </mesh>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.36, 0.5]} />
        <meshStandardMaterial {...mat('#f2e3c7', ghost)} />
      </mesh>
      <mesh position={[0, 0.52, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.45, 0.27, 4]} />
        <meshStandardMaterial {...mat('#d17c5b', ghost)} />
      </mesh>
      <mesh position={[0.17, 0.51, -0.08]} castShadow>
        <boxGeometry args={[0.085, 0.22, 0.085]} />
        <meshStandardMaterial {...mat('#b9a78d', ghost)} />
      </mesh>
      <mesh position={[0.17, 0.635, -0.08]} castShadow>
        <boxGeometry args={[0.11, 0.04, 0.11]} />
        <meshStandardMaterial {...mat('#8c7c65', ghost)} />
      </mesh>
      <mesh position={[-0.14, 0.19, 0.256]} castShadow>
        <boxGeometry args={[0.15, 0.24, 0.025]} />
        <meshStandardMaterial {...mat('#8a5f3f', ghost)} />
      </mesh>
      <mesh position={[-0.14, 0.31, 0.257]}>
        <sphereGeometry args={[0.075, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial {...mat('#8a5f3f', ghost)} />
      </mesh>
      {[-0.18, 0.18].map((x) => (
        <group key={x} position={[x, 0.27, 0.257]}>
          <mesh>
            <boxGeometry args={[0.12, 0.12, 0.018]} />
            <meshStandardMaterial {...mat('#8a5f3f', ghost)} />
          </mesh>
          <mesh position={[0, 0, 0.012]}>
            <boxGeometry args={[0.09, 0.09, 0.012]} />
            <meshStandardMaterial
              {...mat('#ffd98a', ghost, {
                emissive: '#ffbf5f',
                emissiveIntensity: 1.2,
              })}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.05, 0.31]} castShadow>
        <boxGeometry args={[0.2, 0.035, 0.08]} />
        <meshStandardMaterial {...mat('#c9b79c', ghost)} />
      </mesh>
      <pointLight
        position={[0, 0.3, 0.36]}
        color="#ffc46b"
        intensity={ghost ? 0 : 0.35}
        distance={1.6}
        decay={2}
      />
    </group>
  );
}

function Windmill({ ghost = false }: AssetProps) {
  const blades = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (blades.current) blades.current.rotation.z += delta * 0.55;
  });

  return (
    <group>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.37, 0.4, 0.04, 12]} />
        <meshStandardMaterial {...mat('#b9c9a4', ghost)} />
      </mesh>
      <mesh position={[0, 0.37, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.25, 0.66, 8]} />
        <meshStandardMaterial {...mat('#e8d9bd', ghost)} />
      </mesh>
      <mesh position={[0, 0.38, 0]} rotation={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.255, 0.26, 0.09, 8]} />
        <meshStandardMaterial {...mat('#cbb99c', ghost)} />
      </mesh>
      <mesh position={[0, 0.79, 0]} rotation={[0, Math.PI / 8, 0]} castShadow>
        <coneGeometry args={[0.2, 0.19, 8]} />
        <meshStandardMaterial {...mat('#c17c5d', ghost)} />
      </mesh>
      <mesh position={[0, 0.15, 0.235]} castShadow>
        <boxGeometry args={[0.09, 0.17, 0.025]} />
        <meshStandardMaterial {...mat('#8a5f3f', ghost)} />
      </mesh>
      <group position={[0, 0.62, 0.245]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.07, 8]} />
          <meshStandardMaterial {...mat('#7d5237', ghost)} />
        </mesh>
        <group ref={blades}>
          {[0, 1, 2, 3].map((index) => (
            <group key={index} rotation={[0, 0, (index * Math.PI) / 2]}>
              <mesh position={[0, 0.18, 0]} castShadow>
                <boxGeometry args={[0.045, 0.36, 0.022]} />
                <meshStandardMaterial {...mat('#8a6a4b', ghost)} />
              </mesh>
              <mesh position={[0, 0.2, 0.014]} castShadow>
                <boxGeometry args={[0.09, 0.24, 0.009]} />
                <meshStandardMaterial {...mat('#f5ead6', ghost)} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
      <mesh position={[0, 0.62, 0.28]} castShadow>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial {...mat('#7d5237', ghost)} />
      </mesh>
    </group>
  );
}

const FIRE_STONES = Array.from({ length: 8 }, (_, index) => {
  const angle = (index / 8) * Math.PI * 2;
  return {
    x: Math.cos(angle) * 0.29,
    z: Math.sin(angle) * 0.29,
    scale: 0.85 + (index % 2) * 0.18,
  };
});

function Campfire({ ghost = false }: AssetProps) {
  const flame = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (flame.current) {
      flame.current.scale.set(
        1 + Math.sin(t * 9.3) * 0.07,
        1 + Math.sin(t * 7.1 + 0.8) * 0.12,
        1 + Math.cos(t * 8.4) * 0.07,
      );
      flame.current.rotation.y = Math.sin(t * 1.8) * 0.22;
    }
    if (light.current) {
      light.current.intensity = 1.15 + Math.sin(t * 10.2) * 0.22;
    }
  });

  return (
    <group>
      <mesh position={[0, 0.018, 0]} receiveShadow>
        <cylinderGeometry args={[0.38, 0.4, 0.035, 14]} />
        <meshStandardMaterial {...mat('#9d7d5c', ghost)} />
      </mesh>
      {FIRE_STONES.map((stone, index) => (
        <mesh
          key={index}
          position={[stone.x, 0.06, stone.z]}
          scale={[stone.scale, 0.7, stone.scale]}
          castShadow
        >
          <dodecahedronGeometry args={[0.058, 0]} />
          <meshStandardMaterial {...mat('#9a9488', ghost)} />
        </mesh>
      ))}
      <mesh
        position={[0, 0.1, 0]}
        rotation={[0, 0.55, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.038, 0.045, 0.42, 7]} />
        <meshStandardMaterial {...mat('#7d5237', ghost)} />
      </mesh>
      <mesh
        position={[0, 0.1, 0]}
        rotation={[0, -0.65, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.038, 0.045, 0.42, 7]} />
        <meshStandardMaterial {...mat('#8f5f3f', ghost)} />
      </mesh>
      <group ref={flame} position={[0, 0.1, 0]}>
        <mesh position={[0, 0.17, 0]} castShadow>
          <coneGeometry args={[0.115, 0.28, 7]} />
          <meshStandardMaterial
            {...mat('#f28b3c', ghost, {
              emissive: '#ff7a1a',
              emissiveIntensity: 1.6,
              opacity: 0.92,
            })}
          />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <coneGeometry args={[0.065, 0.2, 6]} />
          <meshStandardMaterial
            {...mat('#ffd166', ghost, {
              emissive: '#ffb703',
              emissiveIntensity: 2,
              opacity: 0.95,
            })}
          />
        </mesh>
        <mesh position={[0.03, 0.24, 0.01]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial
            {...mat('#fff0b3', ghost, {
              emissive: '#ffe066',
              emissiveIntensity: 2.2,
            })}
          />
        </mesh>
      </group>
      <pointLight
        ref={light}
        position={[0, 0.3, 0]}
        color="#ff9b4a"
        intensity={ghost ? 0 : 1.15}
        distance={2.6}
        decay={2}
      />
    </group>
  );
}

function FountainDroplets({ ghost = false }: AssetProps) {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    group.current.children.forEach((child, index) => {
      const angle = (index / group.current!.children.length) * Math.PI * 2 + t * 0.9;
      const radius = 0.2 + Math.sin(t * 1.5 + index) * 0.035;
      child.position.set(
        Math.cos(angle) * radius,
        0.52 + Math.sin(t * 2.4 + index * 0.8) * 0.07,
        Math.sin(angle) * radius,
      );
    });
  });

  return (
    <group ref={group}>
      {Array.from({ length: 9 }, (_, index) => (
        <mesh key={index} position={[0, 0.52, 0]}>
          <sphereGeometry args={[0.018, 7, 7]} />
          <meshStandardMaterial
            {...mat('#b8ecf5', ghost, {
              opacity: 0.82,
              roughness: 0.2,
              emissive: '#9fe3f0',
              emissiveIntensity: 0.25,
            })}
          />
        </mesh>
      ))}
    </group>
  );
}

function FountainPlaza({ ghost = false }: AssetProps) {
  return (
    <group>
      <mesh position={[0, 0.017, 0]} receiveShadow>
        <boxGeometry args={[0.94, 0.034, 0.94]} />
        <meshStandardMaterial {...mat('#d8cbb4', ghost)} />
      </mesh>
      <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.37, 0.39, 0.12, 16]} />
        <meshStandardMaterial {...mat('#cfc0a6', ghost)} />
      </mesh>
      <mesh position={[0, 0.135, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.37, 0.022, 8, 28]} />
        <meshStandardMaterial {...mat('#b9a98f', ghost)} />
      </mesh>
      <mesh position={[0, 0.151, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.018, 20]} />
        <meshStandardMaterial
          {...mat('#7cc6d8', ghost, {
            opacity: 0.82,
            roughness: 0.18,
            metalness: 0.05,
          })}
        />
      </mesh>
      <mesh position={[0, 0.29, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.28, 10]} />
        <meshStandardMaterial {...mat('#cfc0a6', ghost)} />
      </mesh>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.19, 0.16, 0.035, 14]} />
        <meshStandardMaterial {...mat('#d8cbb4', ghost)} />
      </mesh>
      <mesh position={[0, 0.47, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.012, 16]} />
        <meshStandardMaterial
          {...mat('#7cc6d8', ghost, {
            opacity: 0.86,
            roughness: 0.18,
          })}
        />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.012, 0.016, 0.16, 6]} />
        <meshStandardMaterial
          {...mat('#a9e8f3', ghost, {
            opacity: 0.7,
            roughness: 0.15,
          })}
        />
      </mesh>
      <FountainDroplets ghost={ghost} />
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.032, 8, 8]} />
        <meshStandardMaterial
          {...mat('#c9f2f9', ghost, {
            opacity: 0.8,
            emissive: '#9fe3f0',
            emissiveIntensity: 0.3,
          })}
        />
      </mesh>
    </group>
  );
}

function NoRaycast({ children, resetKey }: { children: ReactNode; resetKey: string }) {
  const group = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    group.current?.traverse((object) => {
      object.raycast = () => {};
    });
  }, [resetKey]);

  return <group ref={group}>{children}</group>;
}

const ASSET_COMPONENTS: Record<ItemId, (props: AssetProps) => JSX.Element> = {
  grass: GrassPatch,
  cobblestone: CobblestonePath,
  pond: WaterPond,
  pine: PineTree,
  cherry: CherryBlossom,
  bench: BenchAndLamp,
  cottage: CozyCottage,
  windmill: Windmill,
  campfire: Campfire,
  fountain: FountainPlaza,
};

export function AssetMesh({
  itemId,
  ghost = false,
}: {
  itemId: ItemId;
  ghost?: boolean;
}) {
  const Component = ASSET_COMPONENTS[itemId];
  return (
    <NoRaycast resetKey={itemId}>
      <Component ghost={ghost} />
    </NoRaycast>
  );
}
