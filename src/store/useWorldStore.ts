import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ITEM_BY_ID,
  ITEM_IDS,
  PERSIST_VERSION,
  REWARD_TIERS,
  STARTING_COINS,
  STORAGE_KEY,
  createEmptyInventory,
  createStarterInventory,
  createStarterTasks,
} from '../data/catalog';
import { cellKey, isInsideGrid, normalizeRotation } from '../lib/grid';
import { makeId } from '../lib/id';
import { audio } from '../lib/sound';
import type {
  Inventory,
  ItemId,
  PlacedItem,
  RewardTier,
  Task,
  ToastMessage,
  ToastTone,
  WorldMode,
} from '../types';

interface PersistedWorld {
  coins: number;
  tasks: Task[];
  inventory: Inventory;
  placed: PlacedItem[];
  muted: boolean;
}

interface WorldData {
  coins: number;
  tasks: Task[];
  inventory: Inventory;
  placed: PlacedItem[];
  mode: WorldMode;
  selectedItemId: ItemId | null;
  rotation: number;
  muted: boolean;
  hideUI: boolean;
  cameraReset: number;
  toasts: ToastMessage[];
  sidebarOpen: boolean;
  shopOpen: boolean;
  completedOpen: boolean;
}

export interface WorldState extends WorldData {
  addTask: (title: string, tier: RewardTier) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  clearCompleted: () => void;
  buyItem: (itemId: ItemId) => boolean;
  selectItem: (itemId: ItemId) => void;
  setMode: (mode: WorldMode) => void;
  rotate: () => void;
  placeItem: (col: number, row: number) => boolean;
  removeAt: (col: number, row: number) => boolean;
  resetWorld: () => void;
  toggleMuted: () => void;
  toggleHideUI: () => void;
  requestCameraReset: () => void;
  addToast: (message: string, tone?: ToastTone) => void;
  dismissToast: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setShopOpen: (open: boolean) => void;
  setCompletedOpen: (open: boolean) => void;
}

export function createDefaultData(): WorldData {
  return {
    coins: STARTING_COINS,
    tasks: createStarterTasks(),
    inventory: createStarterInventory(),
    placed: [],
    mode: 'build',
    selectedItemId: 'grass',
    rotation: 0,
    muted: false,
    hideUI: false,
    cameraReset: 0,
    toasts: [],
    sidebarOpen: true,
    shopOpen: false,
    completedOpen: false,
  };
}

function makeToast(message: string, tone: ToastTone): ToastMessage {
  return { id: makeId('toast'), message, tone };
}

function withToast(
  state: Pick<WorldState, 'toasts'>,
  message: string,
  tone: ToastTone,
): ToastMessage[] {
  return [...state.toasts, makeToast(message, tone)].slice(-3);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isRewardTier(value: unknown): value is RewardTier {
  return value === 'quick' || value === 'standard' || value === 'deep';
}

function sanitizeTasks(value: unknown): Task[] {
  if (!Array.isArray(value)) return createStarterTasks();
  return value
    .filter((entry): entry is Record<string, unknown> => isRecord(entry))
    .filter(
      (entry) =>
        typeof entry.id === 'string' &&
        entry.id.length > 0 &&
        typeof entry.title === 'string' &&
        entry.title.trim().length > 0 &&
        isRewardTier(entry.tier) &&
        typeof entry.completed === 'boolean' &&
        typeof entry.createdAt === 'number' &&
        Number.isFinite(entry.createdAt),
    )
    .map((entry) => ({
      id: entry.id as string,
      title: (entry.title as string).slice(0, 90),
      tier: entry.tier as RewardTier,
      completed: entry.completed as boolean,
      createdAt: entry.createdAt as number,
      ...(typeof entry.completedAt === 'number'
        ? { completedAt: entry.completedAt }
        : {}),
    }));
}

function sanitizeInventory(value: unknown): Inventory {
  if (!isRecord(value)) return createStarterInventory();
  const inventory = createEmptyInventory();
  for (const id of ITEM_IDS) {
    const count = value[id];
    if (typeof count === 'number' && Number.isFinite(count) && count > 0) {
      inventory[id] = Math.min(999, Math.floor(count));
    }
  }
  return inventory;
}

function sanitizePlaced(value: unknown): PlacedItem[] {
  if (!Array.isArray(value)) return [];
  const occupied = new Set<string>();
  const placed: PlacedItem[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const itemId = entry.itemId;
    if (typeof itemId !== 'string' || !(itemId in ITEM_BY_ID)) continue;
    if (
      typeof entry.col !== 'number' ||
      typeof entry.row !== 'number' ||
      !isInsideGrid(entry.col, entry.row)
    ) {
      continue;
    }
    const key = cellKey(entry.col, entry.row);
    if (occupied.has(key)) continue;
    occupied.add(key);
    placed.push({
      id:
        typeof entry.id === 'string' && entry.id.length > 0
          ? entry.id
          : makeId('piece'),
      itemId: itemId as ItemId,
      col: entry.col,
      row: entry.row,
      rotation: normalizeRotation(
        typeof entry.rotation === 'number' ? entry.rotation : 0,
      ),
      placedAt:
        typeof entry.placedAt === 'number' && Number.isFinite(entry.placedAt)
          ? entry.placedAt
          : Date.now(),
    });
    if (placed.length >= 64) break;
  }
  return placed;
}

function mergePersisted(persisted: unknown, current: WorldState): WorldState {
  const saved = isRecord(persisted) ? persisted : {};
  const inventory = sanitizeInventory(saved.inventory);
  const firstOwned = ITEM_IDS.find((id) => inventory[id] > 0) ?? null;
  const coins =
    typeof saved.coins === 'number' && Number.isFinite(saved.coins)
      ? Math.max(0, Math.floor(saved.coins))
      : STARTING_COINS;

  return {
    ...current,
    coins,
    tasks: sanitizeTasks(saved.tasks),
    inventory,
    placed: sanitizePlaced(saved.placed),
    muted: typeof saved.muted === 'boolean' ? saved.muted : false,
    mode: 'build',
    selectedItemId: firstOwned,
    rotation: 0,
    hideUI: false,
    toasts: [],
  };
}

export const useWorldStore = create<WorldState>()(
  persist(
    (set, get) => ({
      ...createDefaultData(),

      addTask: (title, tier) => {
        const clean = title.trim().replace(/\s+/g, ' ').slice(0, 90);
        if (!clean) return;
        const task: Task = {
          id: makeId('task'),
          title: clean,
          tier,
          completed: false,
          createdAt: Date.now(),
        };
        set((state) => ({ tasks: [task, ...state.tasks] }));
        audio.click();
      },

      completeTask: (id) => {
        const task = get().tasks.find((entry) => entry.id === id);
        if (!task || task.completed) return;
        const reward = REWARD_TIERS[task.tier].coins;
        set((state) => ({
          coins: state.coins + reward,
          tasks: state.tasks.map((entry) =>
            entry.id === id
              ? { ...entry, completed: true, completedAt: Date.now() }
              : entry,
          ),
          toasts: withToast(
            state,
            `+${reward} coins · ${task.title}`,
            'success',
          ),
        }));
        audio.taskComplete();
      },

      deleteTask: (id) => {
        if (!get().tasks.some((task) => task.id === id)) return;
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
        audio.click();
      },

      clearCompleted: () => {
        set((state) => ({
          tasks: state.tasks.filter((task) => !task.completed),
        }));
        audio.click();
      },

      buyItem: (itemId) => {
        const item = ITEM_BY_ID[itemId];
        const state = get();
        if (!item) return false;
        if (state.coins < item.price) {
          set({
            toasts: withToast(
              state,
              `Need ${item.price - state.coins} more coins for ${item.name}`,
              'error',
            ),
          });
          audio.error();
          return false;
        }
        set((current) => ({
          coins: current.coins - item.price,
          inventory: {
            ...current.inventory,
            [itemId]: current.inventory[itemId] + 1,
          },
          toasts: withToast(current, `${item.name} added to your tray`, 'success'),
        }));
        audio.coin();
        return true;
      },

      selectItem: (itemId) => {
        const state = get();
        if (state.inventory[itemId] <= 0) {
          set({
            shopOpen: true,
            toasts: withToast(
              state,
              `Buy ${ITEM_BY_ID[itemId].name} in the shop first`,
              'info',
            ),
          });
          audio.error();
          return;
        }
        set({
          mode: 'build',
          selectedItemId: itemId,
          rotation: 0,
          shopOpen: false,
        });
        audio.click();
      },

      setMode: (mode) => {
        const state = get();
        if (mode === 'build') {
          const selected =
            state.selectedItemId && state.inventory[state.selectedItemId] > 0
              ? state.selectedItemId
              : (ITEM_IDS.find((id) => state.inventory[id] > 0) ?? null);
          set({ mode, selectedItemId: selected });
        } else {
          set({ mode, selectedItemId: null });
        }
        audio.click();
      },

      rotate: () => {
        if (!get().selectedItemId) return;
        set((state) => ({ rotation: (state.rotation + 1) % 4 }));
        audio.click();
      },

      placeItem: (col, row) => {
        const state = get();
        const itemId = state.selectedItemId;
        if (state.mode !== 'build' || !itemId) return false;
        if (!isInsideGrid(col, row)) return false;
        if (state.inventory[itemId] <= 0) {
          set({
            toasts: withToast(state, 'That miniature is no longer in your tray', 'error'),
          });
          audio.error();
          return false;
        }
        if (state.placed.some((piece) => piece.col === col && piece.row === row)) {
          set({
            toasts: withToast(state, 'That tile is already occupied', 'error'),
          });
          audio.error();
          return false;
        }
        const remaining = state.inventory[itemId] - 1;
        const nextItem =
          remaining > 0
            ? itemId
            : (ITEM_IDS.find(
                (id) => id !== itemId && state.inventory[id] > 0,
              ) ?? null);
        const piece: PlacedItem = {
          id: makeId('piece'),
          itemId,
          col,
          row,
          rotation: normalizeRotation(state.rotation),
          placedAt: Date.now(),
        };
        set({
          placed: [...state.placed, piece],
          inventory: { ...state.inventory, [itemId]: remaining },
          selectedItemId: nextItem,
          toasts:
            remaining === 0 && !nextItem
              ? withToast(
                  state,
                  'Your tray is empty. Visit the shop for more miniatures.',
                  'info',
                )
              : state.toasts,
        });
        audio.pop();
        return true;
      },

      removeAt: (col, row) => {
        const state = get();
        const index = state.placed.findIndex(
          (piece) => piece.col === col && piece.row === row,
        );
        if (index < 0) return false;
        const piece = state.placed[index];
        const name = ITEM_BY_ID[piece.itemId].name;
        set({
          placed: state.placed.filter((_, pieceIndex) => pieceIndex !== index),
          inventory: {
            ...state.inventory,
            [piece.itemId]: state.inventory[piece.itemId] + 1,
          },
          toasts: withToast(state, `${name} returned to your tray`, 'success'),
        });
        audio.remove();
        return true;
      },

      resetWorld: () => {
        const muted = get().muted;
        set({
          ...createDefaultData(),
          muted,
          toasts: [makeToast('A fresh grove is ready for you.', 'info')],
        });
        audio.click();
      },

      toggleMuted: () => {
        const next = !get().muted;
        audio.setMuted(next);
        set({ muted: next });
        if (!next) audio.click();
      },

      toggleHideUI: () => {
        set((state) =>
          state.hideUI
            ? { hideUI: false, shopOpen: false }
            : {
                hideUI: true,
                shopOpen: false,
                mode: 'view',
                selectedItemId: null,
              },
        );
      },

      requestCameraReset: () => {
        set((state) => ({ cameraReset: state.cameraReset + 1 }));
        audio.click();
      },

      addToast: (message, tone = 'info') => {
        set((state) => ({ toasts: withToast(state, message, tone) }));
      },

      dismissToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      setShopOpen: (open) => {
        set({ shopOpen: open });
        if (open) audio.click();
      },

      setCompletedOpen: (open) => {
        set({ completedOpen: open });
      },
    }),
    {
      name: STORAGE_KEY,
      version: PERSIST_VERSION,
      partialize: (state): PersistedWorld => ({
        coins: state.coins,
        tasks: state.tasks,
        inventory: state.inventory,
        placed: state.placed,
        muted: state.muted,
      }),
      merge: (persisted, current) => mergePersisted(persisted, current),
    },
  ),
);

export function totalOwned(inventory: Inventory): number {
  return ITEM_IDS.reduce((sum, id) => sum + inventory[id], 0);
}
