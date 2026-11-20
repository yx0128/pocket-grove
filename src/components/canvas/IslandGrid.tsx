import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import {
  GRID_SIZE,
  ITEM_BY_ID,
} from '../../data/catalog';
import {
  PROP_BASE_Y,
  cellKey,
  cellToWorld,
  rotationToRadians,
  worldToCell,
  HIGHLIGHT_Y,
} from '../../lib/grid';
import { useWorldStore } from '../../store/useWorldStore';
import type { Cell, PlacedItem } from '../../types';
import { AssetMesh } from './AssetMeshes';
import { GhostPreview } from './GhostPreview';

function IslandTiles() {
  const mesh = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let index = 0; index < GRID_SIZE * GRID_SIZE; index += 1) {
      const col = index % GRID_SIZE;
      const row = Math.floor(index / GRID_SIZE);
      const [x, z] = cellToWorld(col, row);
      matrix.makeTranslation(x, 0.045, z);
      mesh.current.setMatrixAt(index, matrix);
      color.set('#aecfa0');
      mesh.current.setColorAt(index, color);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) {
      mesh.current.instanceColor.needsUpdate = true;
    }
  }, []);

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, GRID_SIZE * GRID_SIZE]}
      name="island-tiles"
      receiveShadow
    >
      <boxGeometry args={[1, 0.03, 1]} />
      <meshStandardMaterial roughness={0.96} metalness={0} />
    </instancedMesh>
  );
}

function GridLines() {
  const lines = useMemo(() => {
    const half = GRID_SIZE / 2;
    return Array.from({ length: GRID_SIZE + 1 }, (_, index) => index - half);
  }, []);

  return (
    <group position={[0, 0.064, 0]}>
      {lines.map((offset) => (
        <group key={offset}>
          <mesh position={[0, 0, offset]}>
            <boxGeometry args={[GRID_SIZE + 0.02, 0.002, 0.026]} />
            <meshBasicMaterial
              color="#4f6f49"
              transparent
              opacity={0.7}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[offset, 0, 0]}>
            <boxGeometry args={[0.026, 0.002, GRID_SIZE + 0.02]} />
            <meshBasicMaterial
              color="#4f6f49"
              transparent
              opacity={0.7}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const BORDER_ROCKS = [
  { x: -4.18, z: -3.2, scale: 0.09 },
  { x: -4.2, z: 1.4, scale: 0.07 },
  { x: 4.18, z: -1.6, scale: 0.1 },
  { x: 4.2, z: 2.8, scale: 0.06 },
  { x: -2.1, z: -4.18, scale: 0.08 },
  { x: 2.6, z: 4.2, scale: 0.07 },
] as const;

const BORDER_FLOWERS = [
  { x: -4.18, z: -0.4, color: '#f6b3c8' },
  { x: 4.18, z: 0.6, color: '#f5e2a8' },
  { x: -1.1, z: 4.19, color: '#d9c5ef' },
  { x: 1.7, z: -4.19, color: '#f6b3c8' },
  { x: 4.16, z: -3.6, color: '#f5e2a8' },
] as const;

function BorderDetails() {
  return (
    <group>
      {BORDER_ROCKS.map((rock, index) => (
        <mesh
          key={`rock-${index}`}
          position={[rock.x, 0.055, rock.z]}
          scale={[rock.scale, rock.scale * 0.65, rock.scale]}
          castShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#9a9488"
            roughness={0.95}
            flatShading
          />
        </mesh>
      ))}
      {BORDER_FLOWERS.map((flower, index) => (
        <group key={`flower-${index}`} position={[flower.x, 0.05, flower.z]}>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.008, 0.01, 0.08, 5]} />
            <meshStandardMaterial color="#6f9e5c" roughness={0.9} flatShading />
          </mesh>
          <mesh position={[0, 0.09, 0]} castShadow>
            <dodecahedronGeometry args={[0.032, 0]} />
            <meshStandardMaterial
              color={flower.color}
              roughness={0.85}
              flatShading
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function IslandBase() {
  return (
    <group name="island-base">
      <RoundedBox
        args={[8.9, 0.16, 8.9]}
        radius={0.06}
        smoothness={3}
        position={[0, -0.05, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#9fc48d" roughness={0.94} metalness={0} />
      </RoundedBox>
      <RoundedBox
        args={[8.72, 0.52, 8.72]}
        radius={0.22}
        smoothness={4}
        position={[0, -0.37, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#b98a5a" roughness={0.96} metalness={0} />
      </RoundedBox>
      <mesh position={[0, -1.5, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[4.15, 2.8, 9]} />
        <meshStandardMaterial
          color="#7f6b5a"
          roughness={0.98}
          metalness={0}
          flatShading
        />
      </mesh>
      <mesh position={[0, -1.95, 0]} rotation={[Math.PI, 0.4, 0]} castShadow>
        <coneGeometry args={[3.25, 2.1, 8]} />
        <meshStandardMaterial
          color="#6d5b4c"
          roughness={0.98}
          metalness={0}
          flatShading
        />
      </mesh>
      <mesh position={[-2.4, -1.25, 1.4]} scale={[0.55, 0.4, 0.5]} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#8c7965" roughness={0.98} flatShading />
      </mesh>
      <mesh position={[2.1, -0.95, -1.8]} scale={[0.4, 0.3, 0.38]} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#8c7965" roughness={0.98} flatShading />
      </mesh>
      {[
        [-3.2, -0.72, 3.2, 0.5],
        [0, -0.8, 3.9, 0.62],
        [3.0, -0.7, 3.3, 0.46],
        [3.8, -0.62, 0.2, 0.42],
        [-3.8, -0.66, -1.0, 0.4],
        [1.2, -0.86, -3.7, 0.34],
      ].map(([x, y, z, scale], index) => (
        <mesh
          key={`underside-${index}`}
          position={[x, y, z]}
          scale={[scale, scale * 0.8, scale]}
          rotation={[0, index * 0.7, 0]}
          castShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#6d5b4c"
            roughness={0.98}
            flatShading
          />
        </mesh>
      ))}
      <BorderDetails />
    </group>
  );
}

function PlacementPuff() {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const elapsed = useRef(0);
  const [done, setDone] = useState(false);

  useFrame((_, delta) => {
    elapsed.current += delta;
    const progress = Math.min(1, elapsed.current / 0.7);
    if (group.current) {
      group.current.scale.setScalar(0.55 + progress * 0.95);
      group.current.rotation.y += delta * 1.2;
    }
    if (material.current) {
      material.current.opacity = 0.72 * (1 - progress);
    }
    if (progress >= 1 && !done) setDone(true);
  });

  if (done) return null;

  return (
    <group ref={group} position={[0, 0.06, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.4, 28]} />
        <meshBasicMaterial
          ref={material}
          color="#fff2c9"
          transparent
          opacity={0.72}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {Array.from({ length: 6 }, (_, index) => {
        const angle = (index / 6) * Math.PI * 2;
        return (
          <mesh
            key={index}
            position={[Math.cos(angle) * 0.4, 0.08, Math.sin(angle) * 0.4]}
          >
            <sphereGeometry args={[0.035, 6, 6]} />
            <meshBasicMaterial color="#fff8dd" transparent opacity={0.75} />
          </mesh>
        );
      })}
    </group>
  );
}

function PlacedPiece({ piece }: { piece: PlacedItem }) {
  const group = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const fresh = useRef(Date.now() - piece.placedAt < 1400).current;
  const [x, z] = cellToWorld(piece.col, piece.row);
  const item = ITEM_BY_ID[piece.itemId];

  useLayoutEffect(() => {
    if (fresh && group.current) group.current.scale.setScalar(0.001);
  }, [fresh]);

  useFrame((_, delta) => {
    if (!fresh || !group.current) return;
    elapsed.current += delta;
    const progress = Math.min(1, elapsed.current / 0.52);
    if (progress >= 1) {
      group.current.scale.setScalar(1);
      return;
    }
    const ease = 1 - Math.pow(1 - progress, 3);
    const overshoot = 1 + Math.sin(progress * Math.PI) * 0.16;
    group.current.scale.setScalar(Math.max(0.001, ease * overshoot));
  });

  return (
    <group
      ref={group}
      position={[x, PROP_BASE_Y, z]}
      name={`piece-${piece.itemId}-${piece.col}-${piece.row}`}
      userData={{
        itemId: piece.itemId,
        col: piece.col,
        row: piece.row,
      }}
    >
      <group rotation={[0, rotationToRadians(piece.rotation), 0]}>
        <AssetMesh itemId={piece.itemId} />
        {fresh && <PlacementPuff />}
      </group>
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.34, 20]} />
        <meshBasicMaterial
          color={item.accent}
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export function IslandGrid() {
  const placed = useWorldStore((state) => state.placed);
  const mode = useWorldStore((state) => state.mode);
  const selectedItemId = useWorldStore((state) => state.selectedItemId);
  const rotation = useWorldStore((state) => state.rotation);
  const placeItem = useWorldStore((state) => state.placeItem);
  const removeAt = useWorldStore((state) => state.removeAt);

  const [hover, setHover] = useState<Cell | null>(null);
  const rightDown = useRef<{ x: number; y: number } | null>(null);

  const occupied = useMemo(
    () => new Set(placed.map((piece) => cellKey(piece.col, piece.row))),
    [placed],
  );

  const hoveredOccupied = hover
    ? occupied.has(cellKey(hover.col, hover.row))
    : false;

  useLayoutEffect(() => {
    if (mode === 'view') setHover(null);
  }, [mode]);

  const handleMove = (event: ThreeEvent<PointerEvent>) => {
    if (mode === 'view') {
      if (hover) setHover(null);
      return;
    }
    const cell = worldToCell(event.point.x, event.point.z);
    if (!cell) {
      if (hover) setHover(null);
      return;
    }
    if (!hover || hover.col !== cell.col || hover.row !== cell.row) {
      setHover(cell);
    }
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (mode === 'view' || event.delta > 5) return;
    const cell = worldToCell(event.point.x, event.point.z);
    if (!cell) return;
    if (mode === 'remove') {
      removeAt(cell.col, cell.row);
      return;
    }
    if (selectedItemId) placeItem(cell.col, cell.row);
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.button === 2) {
      rightDown.current = { x: event.clientX, y: event.clientY };
    }
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 2 || !rightDown.current) return;
    const dx = event.clientX - rightDown.current.x;
    const dy = event.clientY - rightDown.current.y;
    rightDown.current = null;
    if (dx * dx + dy * dy > 36) return;
    const cell = worldToCell(event.point.x, event.point.z);
    if (cell) removeAt(cell.col, cell.row);
  };

  const highlightColor =
    mode === 'remove'
      ? hoveredOccupied
        ? '#f87171'
        : '#f4e6c9'
      : selectedItemId
        ? hoveredOccupied
          ? '#f87171'
          : '#4ade80'
        : '#f4e6c9';
  const highlightOpacity = mode === 'view' || !hover ? 0 : 0.34;
  const showGhost =
    mode === 'build' && hover !== null && selectedItemId !== null;

  return (
    <group>
      <IslandBase />
      <IslandTiles />
      {mode !== 'view' && <GridLines />}

      {hover && mode !== 'view' && (
        <mesh
          position={[
            cellToWorld(hover.col, hover.row)[0],
            HIGHLIGHT_Y,
            cellToWorld(hover.col, hover.row)[1],
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={2}
          raycast={() => undefined}
        >
          <planeGeometry args={[0.96, 0.96]} />
          <meshBasicMaterial
            color={highlightColor}
            transparent
            opacity={highlightOpacity}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {showGhost && selectedItemId && (
        <GhostPreview
          cell={hover}
          itemId={selectedItemId}
          rotation={rotation}
          valid={!hoveredOccupied}
        />
      )}

      {placed.map((piece) => (
        <PlacedPiece key={piece.id} piece={piece} />
      ))}

      <mesh
        name="pointer-plane"
        position={[0, 0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handleMove}
        onPointerOut={() => setHover(null)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
      >
        <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
