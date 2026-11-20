export type ItemId =
  | 'grass'
  | 'cobblestone'
  | 'pond'
  | 'pine'
  | 'cherry'
  | 'bench'
  | 'cottage'
  | 'windmill'
  | 'campfire'
  | 'fountain';

export type RewardTier = 'quick' | 'standard' | 'deep';

export type WorldMode = 'view' | 'build' | 'remove';

export type ToastTone = 'success' | 'error' | 'info';

export interface Task {
  id: string;
  title: string;
  tier: RewardTier;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

export interface PlacedItem {
  id: string;
  itemId: ItemId;
  col: number;
  row: number;
  rotation: number;
  placedAt: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  tone: ToastTone;
}

export type Inventory = Record<ItemId, number>;

export interface CatalogEntry {
  id: ItemId;
  name: string;
  description: string;
  price: number;
  category: 'ground' | 'nature' | 'furniture' | 'landmark';
  icon: string;
  accent: string;
}

export interface Cell {
  col: number;
  row: number;
}
