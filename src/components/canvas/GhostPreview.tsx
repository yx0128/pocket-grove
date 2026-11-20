import * as THREE from 'three';
import { AssetMesh } from './AssetMeshes';
import {
  HIGHLIGHT_Y,
  PROP_BASE_Y,
  cellToWorld,
  rotationToRadians,
} from '../../lib/grid';
import type { Cell, ItemId } from '../../types';

const GHOST_LIFT = 0.06;

export function GhostPreview({
  cell,
  itemId,
  rotation,
  valid,
}: {
  cell: Cell;
  itemId: ItemId;
  rotation: number;
  valid: boolean;
}) {
  const [x, z] = cellToWorld(cell.col, cell.row);
  const color = valid ? '#4ade80' : '#f87171';

  return (
    <group position={[x, PROP_BASE_Y + GHOST_LIFT, z]}>
      <group rotation={[0, rotationToRadians(rotation), 0]}>
        <AssetMesh itemId={itemId} ghost />
      </group>
      <mesh
        position={[0, HIGHLIGHT_Y - PROP_BASE_Y - GHOST_LIFT, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={3}
        raycast={() => undefined}
      >
        <planeGeometry args={[0.98, 0.98]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.34}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh
        position={[0, HIGHLIGHT_Y - PROP_BASE_Y - GHOST_LIFT + 0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={4}
        raycast={() => undefined}
      >
        <ringGeometry args={[0.44, 0.48, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.9}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh
        position={[0, 0.36, 0]}
        renderOrder={2}
        raycast={() => undefined}
      >
        <boxGeometry args={[0.94, 0.72, 0.94]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.06}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
