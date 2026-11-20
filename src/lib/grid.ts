import { GRID_SIZE } from '../data/catalog';
import type { Cell } from '../types';

export const CELL_SIZE = 1;
export const HALF_GRID = GRID_SIZE / 2;
export const CELL_CENTRE_OFFSET = (GRID_SIZE - 1) / 2;
export const TILE_TOP_Y = 0.06;
export const PROP_BASE_Y = TILE_TOP_Y;
export const HIGHLIGHT_Y = 0.103;

export function cellToWorld(col: number, row: number): [number, number] {
  return [col - CELL_CENTRE_OFFSET, row - CELL_CENTRE_OFFSET];
}

export function worldToCell(x: number, z: number): Cell | null {
  const col = Math.floor(x + HALF_GRID);
  const row = Math.floor(z + HALF_GRID);
  if (!isInsideGrid(col, row)) return null;
  return { col, row };
}

export function isInsideGrid(col: number, row: number): boolean {
  return (
    Number.isInteger(col) &&
    Number.isInteger(row) &&
    col >= 0 &&
    col < GRID_SIZE &&
    row >= 0 &&
    row < GRID_SIZE
  );
}

export function cellKey(col: number, row: number): string {
  return `${col}:${row}`;
}

export function normalizeRotation(rotation: number): number {
  if (!Number.isFinite(rotation)) return 0;
  return ((Math.round(rotation) % 4) + 4) % 4;
}

export function rotationToRadians(rotation: number): number {
  return (normalizeRotation(rotation) * Math.PI) / 2;
}
