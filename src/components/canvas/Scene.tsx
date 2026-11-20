import { useEffect, useRef, type ElementRef } from 'react';
import { OrbitControls, Sparkles } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../../store/useWorldStore';
import { Clouds } from './Clouds';
import { IslandGrid } from './IslandGrid';

function Lighting() {
  return (
    <group>
      <hemisphereLight args={['#d8efff', '#efd6ad', 1.15]} />
      <ambientLight intensity={0.2} />
      <directionalLight
        castShadow
        position={[8, 13, 6]}
        intensity={2.15}
        color="#fff2d8"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={0.5}
        shadow-camera-far={35}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight
        position={[-6, 5, -8]}
        intensity={0.5}
        color="#bcd8e8"
      />
    </group>
  );
}

function CameraControls() {
  const controls = useRef<ElementRef<typeof OrbitControls>>(null);
  const camera = useThree((state) => state.camera);
  const mode = useWorldStore((state) => state.mode);
  const selectedItemId = useWorldStore((state) => state.selectedItemId);
  const cameraReset = useWorldStore((state) => state.cameraReset);

  useEffect(() => {
    if (cameraReset === 0) return;
    camera.position.set(9.6, 10, 12.4);
    if (controls.current) {
      controls.current.target.set(0, 0.25, 0.5);
      controls.current.update();
    }
  }, [camera, cameraReset]);

  const canRotate = mode !== 'build' || !selectedItemId;

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan
      minDistance={7.5}
      maxDistance={28}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI / 2.2}
      target={[0, 0.25, 0.5]}
      enableRotate={canRotate}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
    />
  );
}

export function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [9.6, 10, 12.4], fov: 40, near: 0.1, far: 120 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl, scene, camera }) => {
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.06;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        if (
          new URLSearchParams(window.location.search).has('debug')
        ) {
          (
            window as unknown as {
              __pocketGrove?: {
                scene: THREE.Scene;
                gl: THREE.WebGLRenderer;
                camera: THREE.Camera;
                three: typeof THREE;
              };
            }
          ).__pocketGrove = { scene, gl, camera, three: THREE };
        }
      }}
    >
      <fog attach="fog" args={['#d7e9e2', 28, 62]} />
      <Lighting />
      <IslandGrid />
      <Clouds />
      <Sparkles
        count={26}
        scale={[11, 6, 11]}
        position={[0, 2.2, 0]}
        size={2.2}
        speed={0.24}
        opacity={0.36}
        color="#fff4cf"
      />
      <CameraControls />
    </Canvas>
  );
}
