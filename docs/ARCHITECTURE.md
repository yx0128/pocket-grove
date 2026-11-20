# Architecture

## Overview

Pocket Grove is a single-page React app with two co-operating layers:

1. **Simulation state** — a Zustand store that owns coins, tasks, inventory, placed pieces, mode, selection, rotation, UI flags, and toasts. It is persisted (partially) through `persist`.
2. **Presentation** — a React Three Fiber canvas rendering a procedural floating island, plus a glass HUD rendered in normal DOM on top.

There is no server, router, data fetching, or external asset pipeline.

```text
User gesture
   ├── DOM HUD action ──────────────► Zustand action ──► state ──► persist
   └── R3F pointer event ───────────► Zustand action ──► state ──► re-render canvas
```

## Runtime layers

```text
<main> CSS sky gradient + sun glow
├── <div absolute inset-0> <Scene />  (R3F Canvas, alpha)
├── vignette overlay (pointer-events-none)
└── HUD (TopBar, TaskSidebar, ModeHint, BottomHotbar, Toasts, ShopModal)
```

The Canvas is transparent so the CSS gradient and radial sun remain visible. The sky is not rendered by a world-space shader; a top-down camera would see the lower hemisphere and turn the whole scene orange. This is a deliberate design decision documented in [AGENTS.md](../AGENTS.md#65-sky-fog-and-canvas).

## Data model

```ts
type ItemId =
  | 'grass' | 'cobblestone' | 'pond' | 'pine' | 'cherry'
  | 'bench' | 'cottage' | 'windmill' | 'campfire' | 'fountain';

type RewardTier = 'quick' | 'standard' | 'deep';
type WorldMode = 'view' | 'build' | 'remove';

interface Task {
  id: string;
  title: string;
  tier: RewardTier;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

interface PlacedItem {
  id: string;
  itemId: ItemId;
  col: number;       // 0..7
  row: number;       // 0..7
  rotation: number;  // 0..3, 90° increments
  placedAt: number;
}

type Inventory = Record<ItemId, number>;
```

`CatalogEntry` adds `name`, `description`, `price`, `category`, `icon`, and `accent`.

### World state

```ts
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
```

Actions: `addTask`, `completeTask`, `deleteTask`, `clearCompleted`, `buyItem`, `selectItem`, `setMode`, `rotate`, `placeItem`, `removeAt`, `resetWorld`, `toggleMuted`, `toggleHideUI`, `requestCameraReset`, `addToast`, `dismissToast`, `setSidebarOpen`, `setShopOpen`, `setCompletedOpen`.

### Economy rules

- Completing an uncompleted task adds `REWARD_TIERS[tier].coins`, marks it completed with `completedAt`, and emits a toast + chime.
- Completing an already-completed task is a no-op (the UI moves it to Completed, so this is also a defense against programmatic farming).
- Deleting a task never refunds or charges coins.
- Buying subtracts `price`, increments inventory by one, and emits a toast + coin sound. Insufficient funds emits an error toast/sound and does not mutate state.
- Placing requires mode `build`, a selected item, stock > 0, in-bounds cell, and an empty cell. Stock decrements; if the selected item reaches zero, the next owned item is selected (or `null`).
- Removing returns exactly one unit and leaves the app in Remove mode.

## Persistence

`src/store/useWorldStore.ts` uses:

```ts
persist(initializer, {
  name: 'pocket-grove-v1',
  version: 1,
  partialize: (state) => ({
    coins, tasks, inventory, placed, muted,
  }),
  merge: (persisted, current) => mergePersisted(persisted, current),
});
```

Hydration is defensive. `mergePersisted`:

- starts from `createStarterInventory()` if inventory is missing or malformed;
- reconstructs inventory from known ids, flooring positive finite counts and capping at 999;
- filters tasks by id/title/tier/completed/createdAt shape and caps titles at 90 chars;
- filters placed pieces by known item id, integer in-range cells, unique cell keys, normalizes rotations, caps at 64;
- floors and clamps coins;
- resets mode to `build`, rotation to `0`, and selects the first owned item;
- clears toasts and hides UI on load.

UI layout flags are intentionally not persisted. This avoids a user reloading into a hidden interface or a stale modal.

See [STATE_FORMAT.md](STATE_FORMAT.md) for the exact JSON schema.

## 3D scene

### Scene setup (`components/canvas/Scene.tsx`)

- `<Canvas shadows dpr={[1,2]} camera={{ position: [9.6,10,12.4], fov: 40 }} gl={{ alpha: true }}>`
- `gl` setup: `PCFSoftShadowMap`, `ACESFilmicToneMapping`, exposure `1.06`, sRGB output.
- `<fog args={['#d7e9e2', 28, 62]}>`
- Lighting: hemisphere `#d8efff` / `#efd6ad` at 1.15, ambient 0.2, warm directional `#fff2d8` at 2.15 with 2048² shadow map, cool fill directional at 0.5.
- `Clouds` + `Sparkles`.
- `CameraControls`: drei `OrbitControls` with damping, distance 7.5–28, polar 0.25–`π/2.2`, target `[0,0.25,0.5]`.
- A gated debug hook: `?debug=1` exposes `window.__pocketGrove = { scene, gl, camera, three }` for automated QA and projection. Normal production pages do not expose it.

### Island (`components/canvas/IslandGrid.tsx`)

Geometry from top to bottom:

| Piece | Geometry | Y |
| --- | --- | --- |
| Grass cap | RoundedBox 8.9 × 0.16 × 8.9, radius 0.06 | centre −0.05, top 0.03 |
| Dirt slab | RoundedBox 8.72 × 0.52 × 8.72, radius 0.22 | centre −0.37, top −0.11 |
| Rock cone | 9-sided cone, radius 4.15, height 2.8, flipped | top ≈ −0.1, tip −2.9 |
| Under-rock | second 8-sided cone | layered silhouette |
| Board tiles | 64 instanced 1 × 1 boxes, height 0.03, `#aecfa0` | centre 0.045, top 0.06 |
| Grid lines | 18 thin bars, 0.026 wide | 0.064 |
| Pointer plane | invisible 8 × 8 plane | 0.1 |
| Placed pieces | group at cell centre | 0.06 |

The pointer plane handles **all** tile interactions. Assets are wrapped in `NoRaycast` so they never steal pointer events. The right-click path checks drag distance (≤ 6 px) to avoid deleting while panning.

### Hover + ghost

`IslandGrid` stores the hovered `Cell` locally. On every pointer move, `worldToCell(event.point.x, event.point.z)` maps the intersection to an integer cell. A local highlight plane at `HIGHLIGHT_Y = 0.103` uses green/red or a neutral cream depending on mode/occupancy. `GhostPreview` renders the selected asset at cell centre, lifted by 0.06, with a translucent material, a cell plane, a ring, and a faint tinted volume. The ghost does not raycast.

### Placement animation

`PlacedPiece` checks `Date.now() - placedAt < 1400` to decide whether it is fresh. A fresh piece is scaled from 0.001 with an ease-out + sine overshoot over ~0.52 s and renders a `PlacementPuff` (expanding ring + six dots, removed after 0.7 s). Loaded saves do not re-bounce.

### Procedural assets (`components/canvas/AssetMeshes.tsx`)

All ten components are pure geometry compositions. Shared `mat(color, ghost, options)` returns consistent `meshStandardMaterial` props: high roughness, near-zero metalness, flat shading, optional emissive, ghost opacity 0.68, and `depthWrite: false` for ghosts.

| Asset | Geometry highlights | Animation |
| --- | --- | --- |
| Grass Patch | slab, 4 flowers (stem + dodeca + centre), 5 blades | — |
| Cobblestone Path | slab + 11 scaled dodeca stones | — |
| Water Pond | slab, translucent water, 9 rim stones, 3 lily pads | — |
| Pine Tree | grass mound, trunk, 3 cones + tip | — |
| Cherry Blossom | mound, trunk, 2 branches, 4 dodeca canopy puffs, 6 petals | — |
| Bench & Lamppost | pad, bench, legs, armrest, pole, arm, emissive lantern, point light | lamp light |
| Cozy Cottage | pad, body, 4-sided pitched roof, chimney, door, 2 emissive windows, step | window glow |
| Windmill | pad, tapered tower, cap, door, hub, 4 sails, point | `useFrame` blade rotation |
| Campfire | pad, 8 stones, crossed logs, layered flame cones, point light | flame scale/rotation + light flicker |
| Fountain Plaza | pad, basin, torus rim, water, pedestal, upper bowl, jet, 9 droplets | droplet orbit/bob |

Footprint guard: keep all X/Z vertices inside ±0.5. The bench lamp currently reaches x ≈ 0.49; that is inside the 1.0 boundary but close. If you widen it, move the lamp inward.

### Clouds (`components/canvas/Clouds.tsx`)

Six high clouds and three low clouds made from five flattened spheres each. Low clouds drift on X (wrap at ±17) and bob on Y; four floating rocks rotate and bob under the island. The low clouds are intentionally at y ≈ 1.3–1.7 so they are visible with the top-down camera; high clouds may only appear when orbiting.

## UI architecture

The HUD is plain DOM inside the same React tree. It reads Zustand via narrow selectors; all game mutations go through actions. No component mutates state directly.

- `TopBar`: brand, `AnimatedNumber` coin badge, mode pills, reset camera, mute, hide UI. At <md the mode pills move to a second row.
- `TaskSidebar`: a collapsible glass panel. The add form has a title input and three tier buttons. Active list uses a custom checkbox; completed tasks move to a collapsible section with clear/delete. Footer has reset world. A tip card fills the empty state.
- `ShopModal`: fixed z-70 backdrop; 3-column card grid; affordability-disabled Buy; Place for owned items; owned counts and 1 × 1 badge.
- `BottomHotbar`: all ten items with numeric quick labels (1–9; the tenth has no numeric label), quantity badges, selected ring, Rotate button, Shop.
- `ModeHint`: contextual instructions above the hotbar.
- `Toasts`: fixed top-center stack, max three, auto-dismiss 2.8 s, tones success/error/info.
- `AnimatedNumber`: rAF cubic ease from previous to next value over 520 ms; remounts a keyed span to replay `coin-pop`.

### Keyboard behavior

Handled once in `App.tsx`:

- Ignore all shortcuts while focus is in an input/textarea/contenteditable (Escape blurs).
- Escape: show UI if hidden → close shop → return to View.
- Ignore shortcuts when hidden or shop open.
- Ignore key repeats.
- `R` rotate, `B` build, `V` view, `X` remove, `1–9` select first nine catalog items.

### Cursor

The body cursor is `grab` in View / Build-with-no-selection, `crosshair` when placing or removing. Buttons override with `cursor: pointer`.

## Audio

`src/lib/sound.ts` lazily creates an `AudioContext` on the first user-gesture sound and resumes it. `audio.setMuted()` is a module-level flag. Effects are short oscillator + gain envelopes:

- `click`: triangle 520→660 Hz
- `taskComplete`: 659/880/1046 Hz chime
- `coin`: 988/1319 Hz sparkle
- `pop`: triangle 330→620 Hz + 880 Hz blip
- `remove`: 420→230 Hz
- `error`: sawtooth 220→165 Hz

Failures are swallowed. Audio never gates gameplay and is always triggered from user interactions.

## Testing

Vitest + jsdom. `src/test/setup.ts` defines an in-memory `localStorage` because Node 22+/26 exposes an experimental `localStorage` global that can shadow jsdom's and break Zustand's storage adapter. Tests call `resetWorld()` before each case and assert store behavior only (no Canvas rendering in jsdom).

## Performance notes

- One instanced mesh for 64 board tiles.
- Procedural geometry only; no HDR environment map or model loading.
- 2048 shadow map; keep tiny meshes out of shadow casting if the scene grows.
- 10 catalog items × at most 64 placed pieces. Fountain droplets are 9 meshes; windmill uses one `useFrame`.
- Build output ~1.06 MB JS before gzip, ~300 KB gzip; Three is the main chunk.
- `dpr={[1,2]}` caps high-DPI rendering.

## Key decisions & pitfalls

1. **RoundedBox radius > half-height inflates geometry.** The grass cap bug is documented in AGENTS.md; keep radius small.
2. **Assets must not raycast.** `NoRaycast` traverses descendants; use `AssetMesh` for every piece.
3. **Use the pointer plane, not asset clicks.** It keeps placement and removal consistent across flat and tall assets.
4. **Keep the validity plane above flat assets.** `HIGHLIGHT_Y = 0.103` is intentional.
5. **CSS sky, transparent canvas.** A world-space sky shader in a top-down view becomes all sunset.
6. **Headless CSS animations throttle.** Screenshot script freezes animation durations.
7. **Node 26 + jsdom localStorage.** Use the explicit shim in tests.
8. **Completed tasks are terminal.** Prevents infinite coin farming.
9. **Hydration resets mode/selection.** Avoid stale ghost state after reload.
10. **No external assets.** Guarantees zero broken model/CDN links; all geometry is in source.
