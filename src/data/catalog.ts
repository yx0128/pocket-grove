import type { CatalogEntry, Inventory, ItemId, RewardTier, Task } from '../types';

export const STORAGE_KEY = 'pocket-grove-v1';
export const PERSIST_VERSION = 1;
export const GRID_SIZE = 8;
export const STARTING_COINS = 60;

export const CATALOG: CatalogEntry[] = [
  {
    id: 'grass',
    name: 'Grass Patch',
    description: 'A soft clover patch with tiny wildflowers. The friendliest way to fill an empty tile.',
    price: 10,
    category: 'ground',
    icon: 'sprout',
    accent: '#8fbf7a',
  },
  {
    id: 'cobblestone',
    name: 'Cobblestone Path',
    description: 'Warm, rounded paving stones that stitch the different corners of your grove together.',
    price: 15,
    category: 'ground',
    icon: 'route',
    accent: '#b8a58e',
  },
  {
    id: 'pond',
    name: 'Water Pond',
    description: 'A glassy blue pool with lily pads and one very small pink bloom. Pure calm.',
    price: 20,
    category: 'ground',
    icon: 'waves',
    accent: '#7cc6d8',
  },
  {
    id: 'pine',
    name: 'Pine Tree',
    description: 'Three tiers of evergreen foliage on a sturdy little trunk. A grove classic.',
    price: 25,
    category: 'nature',
    icon: 'tree-pine',
    accent: '#4f8a63',
  },
  {
    id: 'cherry',
    name: 'Cherry Blossom',
    description: 'A puff of pink canopy with fallen petals scattered around its roots.',
    price: 35,
    category: 'nature',
    icon: 'flower-2',
    accent: '#f4b8c8',
  },
  {
    id: 'bench',
    name: 'Bench & Lamppost',
    description: 'A place to pause and a warm lantern that glows a little brighter at dusk.',
    price: 30,
    category: 'furniture',
    icon: 'armchair',
    accent: '#b9825a',
  },
  {
    id: 'cottage',
    name: 'Cozy Cottage',
    description: 'A tiny pitched-roof home with a chimney, a round door, and two glowing windows.',
    price: 75,
    category: 'landmark',
    icon: 'home',
    accent: '#d17c5b',
  },
  {
    id: 'windmill',
    name: 'Windmill',
    description: 'A tall stone tower whose sails turn gently, even when the rest of the grove is still.',
    price: 100,
    category: 'landmark',
    icon: 'wind',
    accent: '#c9b28e',
  },
  {
    id: 'campfire',
    name: 'Campfire Site',
    description: 'A ring of stones, two crossed logs, and a flame that never quite sits still.',
    price: 45,
    category: 'furniture',
    icon: 'flame',
    accent: '#e39a5c',
  },
  {
    id: 'fountain',
    name: 'Fountain Plaza',
    description: 'A tiered stone fountain with a crown of looping water droplets. The grove centrepiece.',
    price: 90,
    category: 'landmark',
    icon: 'droplets',
    accent: '#8fc7dd',
  },
];

export const ITEM_BY_ID = Object.fromEntries(
  CATALOG.map((entry) => [entry.id, entry]),
) as Record<ItemId, CatalogEntry>;

export const ITEM_IDS = CATALOG.map((entry) => entry.id) as ItemId[];

export const REWARD_TIERS: Record<
  RewardTier,
  { label: string; coins: number; description: string; accent: string }
> = {
  quick: {
    label: 'Quick',
    coins: 10,
    description: 'Under 10 minutes',
    accent: '#7cb7a0',
  },
  standard: {
    label: 'Standard',
    coins: 25,
    description: 'A focused half hour',
    accent: '#e9b949',
  },
  deep: {
    label: 'Deep Work',
    coins: 50,
    description: 'A meaningful session',
    accent: '#d17c5b',
  },
};

export const REWARD_TIER_IDS: RewardTier[] = ['quick', 'standard', 'deep'];

export function createEmptyInventory(): Inventory {
  return Object.fromEntries(ITEM_IDS.map((id) => [id, 0])) as Inventory;
}

export function createStarterInventory(): Inventory {
  const inventory = createEmptyInventory();
  inventory.grass = 1;
  inventory.pine = 1;
  return inventory;
}

export function createStarterTasks(): Task[] {
  const now = Date.now();
  return [
    {
      id: 'starter-water',
      title: 'Drink a glass of water',
      tier: 'quick',
      completed: false,
      createdAt: now - 3000,
    },
    {
      id: 'starter-desk',
      title: 'Clear the desk before starting',
      tier: 'standard',
      completed: false,
      createdAt: now - 2000,
    },
    {
      id: 'starter-focus',
      title: 'Focus for 25 minutes',
      tier: 'deep',
      completed: false,
      createdAt: now - 1000,
    },
  ];
}
