# AGENTS.md — Pocket Grove agent handoff

This file is the contract for any AI coding agent (or human maintainer) continuing this project. Read it before changing code. The full product brief is in [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md); the rebuild recipe is in [docs/REPRODUCTION.md](docs/REPRODUCTION.md).

## 1. What this is

A desktop-first, browser-only **3D isometric task manager + miniature world builder**:

- Complete Quick/Standard/Deep Work tasks → earn 10/25/50 coins.
- Buy 1 × 1 procedural miniatures in the Build Shop.
- Place them on an 8 × 8 floating diorama with ghost previews, rotation, bounce animation, and removal.
- Everything persists locally. No backend, accounts, external models, or network art.

Stack: **React 18 + TypeScript + Vite + Tailwind CSS + Zustand/persist + Three.js + @react-three/fiber + @react-three/drei + lucide-react + Vitest**.

## 2. Commands

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # tsc -b --pretty false
npm run lint         # eslint .
npm test             # vitest run
npm run build        # tsc -b && vite build
npm run preview      # http://localhost:4173
```

Visual release capture (assumes `npm run preview -- --port 4173` is already running):

```bash
node scripts/capture.mjs
VIEWPORT=1280x720 SHOT_SUFFIX=-1280 node scripts/capture.mjs
```

The capture script launches headless Chrome via CDP using Node's built-in `fetch`/`WebSocket`; it intentionally injects a demo save and disables CSS animations for deterministic frames. It exits non-zero on browser console errors.

## 3. Hard product invariants

Do not change these without updating the spec, tests, docs, and screenshots:

1. **Grid is 8 × 8.** Cell coordinates are `(col, row)` in `0..7`; world units are 1 × 1 per cell.
2. **Every miniature fits inside 1.0 × 1.0.** Assets may be tall, but their X/Z geometry must stay within ±0.5 of the cell centre.
3. **Exactly ten catalog items**, at the specified prices: 10, 15, 20, 25, 30, 35, 45, 75, 90, 100.
4. **Reward tiers are Quick +10, Standard +25, Deep Work +50.**
5. **Starter state:** 60 coins, one Grass Patch + one Pine Tree, three sample tasks, Build mode with Grass selected.
6. **Task rewards are one-shot.** Completed tasks never pay again and cannot be un-checked.
7. **Placement consumes one inventory unit.** Removal returns exactly one.
8. **View mode hides grid lines.** Build/Remove show them.
9. **No external 3D/audio/font assets.** All art is procedural; all sound is Web Audio.
10. **All state is local.** Do not add analytics, network calls, auth, or remote persistence without an explicit request.

## 4. Source map

```text
src/
  App.tsx                         shell, shortcuts, cursor, mute sync, hide UI
  main.tsx
  index.css                       Tailwind layers, scrollbars, base styles
  types.ts                        ItemId, Task, PlacedItem, WorldMode, etc.
  data/catalog.ts                 prices, descriptions, tiers, starter data
  lib/
    grid.ts                       cell/world conversion, vertical constants
    id.ts                         crypto.randomUUID + fallback
    sound.ts                      lazy AudioContext synth effects
  store/
    useWorldStore.ts              all game actions + persist + sanitizer
    useWorldStore.test.ts         11 behavior tests
  components/canvas/
    Scene.tsx                     Canvas, sky, lights, camera, debug hook
    IslandGrid.tsx                island, tiles, grid, raycast, placement
    GhostPreview.tsx              lifted translucent preview + validity plane
    AssetMeshes.tsx               all ten assets + NoRaycast wrapper
    Clouds.tsx                    drifting clouds + floating rocks
  components/ui/
    TopBar.tsx                    brand, coins, modes, camera, mute, hide
    TaskSidebar.tsx               add/complete/delete/completed/reset
    ShopModal.tsx                 catalog grid, prices, buy/place
    BottomHotbar.tsx              10 slots, 1–9 shortcuts, rotate, shop
    ModeHint.tsx                  contextual one-line help
    Toasts.tsx                    auto-dismiss messages
    AnimatedNumber.tsx            rAF coin count-up
    ItemIcon.tsx                  lucide icon mapping
  test/setup.ts                   in-memory localStorage for jsdom
```

## 5. State and persistence rules

- `src/data/catalog.ts` is the **only** source of item metadata, prices, rewards, starter inventory, and starter tasks. Do not hardcode duplicate price tables in UI components.
- The persisted key is `pocket-grove-v1`; version is `1`.
- Only `coins`, `tasks`, `inventory`, `placed`, and `muted` are persisted. Mode, selection, rotation, toasts, sidebar/shop open state, and hide-UI are session-only.
- Persisted data is **untrusted**. `mergePersisted()` must keep sanitizing:
  - coin floor and non-negative,
  - known tier ids, non-empty task titles, valid timestamps,
  - all item ids present, integer counts capped at 999,
  - placed cells in range, unique cells, normalized rotation `0..3`, max 64 pieces.
- On hydration, mode resets to Build, rotation 0, and the first owned item is selected. This prevents stale/ghost selections.
- If you add a persisted field, bump `PERSIST_VERSION`, extend the sanitizer, add a test, and document it in `docs/STATE_FORMAT.md`.

## 6. 3D rules that prevent bugs

### 6.1 RoundedBox radius

The island grass cap originally used `RoundedBox` with `height 0.16` and `radius 0.18`. Because the radius exceeded half the smallest dimension, the bevel inflated the geometry to `maxY = 0.304`, burying every flat ground tile. **Always keep `radius < min(width, height, depth) / 2`.** The current grass cap uses `radius 0.06`; the dirt slab uses `0.22` for height `0.52`.

### 6.2 Raycasting

- `AssetMesh` wraps every asset in `NoRaycast`, which sets `object.raycast = () => {}` on all descendants. This ensures the invisible pointer plane receives events consistently.
- Placement, hover, click, and right-click are handled by a single invisible `8 × 8` plane at `y = 0.1`.
- If you add a new 3D interaction mesh above the pointer plane, either disable its raycast or raise the pointer plane carefully. Hover cell math uses `worldToCell(event.point.x, event.point.z)`, which assumes the near-ground plane.
- The right-click removal path records pointer-down position and only removes when pointer movement is ≤ 6 px. This keeps right-drag pan working. The app root prevents the browser context menu.

### 6.3 Vertical constants

Defined in `src/lib/grid.ts`:

- `TILE_TOP_Y = 0.06` — top of the instanced board tiles.
- `PROP_BASE_Y = 0.06` — group Y for placed miniatures.
- `HIGHLIGHT_Y = 0.103` — above flat ground assets (top ≈ 0.10), so validity tint is visible over occupied grass/path/pond tiles.

Keep these aligned with the island geometry. If the board top moves, update the constants, ghost lift, and preview planes.

### 6.4 Ghost preview

- The ghost is lifted by `GHOST_LIFT = 0.06` so the validity plane is visible underneath.
- Ghost materials use `opacity ≈ 0.68` and `depthWrite: false`.
- The ghost group must not raycast.
- Validity is `!occupied.has(cellKey)`. The plane and ring are green (`#4ade80`) or red (`#f87171`).

### 6.5 Sky, fog, and canvas

- The Canvas is transparent (`alpha: true`). The sky is a CSS gradient on `<main>` (sky blue → warm cream) plus a radial sun glow.
- Do **not** put a shader sky dome based on world direction: with a top-down camera the lower hemisphere dominates and the scene becomes all orange. The CSS gradient is deliberate.
- Fog is `#d7e9e2` from 28 to 62 so the nearby island is unaffected.
- Shadows use `PCFSoftShadowMap` at 2048 × 2048. Keep `castShadow` on major meshes; tiny decoration can omit it if performance matters.

### 6.6 Camera

- Initial: `[9.6, 10, 12.4]`, target `[0, 0.25, 0.5]`, fov 40.
- Clamp `maxPolarAngle = Math.PI / 2.2`, distance `7.5..28`.
- `enableRotate` is `view || (build && no selection)`. This reserves left click/drag for placement and removal while still allowing orbit in View/Build-with-no-selection.
- Right button pans; middle dollies; wheel zooms.
- Reset camera is a non-persisted `cameraReset` counter; `Scene` applies the default position/target.

### 6.7 Animation

- Windmill blades rotate with `useFrame` (`delta * 0.55`).
- Campfire flame scale/rotation and point-light intensity animate with elapsed time.
- Fountain droplets orbit/rise with elapsed time.
- Placed pieces only bounce if `Date.now() - placedAt < 1400`; saved pieces reload statically.

## 7. UI rules

- Desktop-first; test at 1440 × 900 and 1280 × 720.
- Glass panels: `border-white/60 bg-cream/75 backdrop-blur-xl shadow-glass`.
- Palette and type are documented in `docs/DESIGN_SYSTEM.md`.
- Top bar: brand, animated coin badge, View/Build/Remove pills, reset camera, mute, hide UI.
- Task panel: add form (title + tier), active list, collapsible Completed, clear completed, local-save note, reset world.
- Hotbar: all ten items, quantities, selected ring, keys 1–9, Rotate button (disabled unless a selected item exists), Shop.
- Shop: 3-column card grid at desktop, affordability-disabled Buy, Place for owned items, coin balance, owned count, 1 × 1 badge.
- Hide UI switches to View and hides all UI; a “Show interface” button remains.
- Keyboard shortcuts must ignore events from `input`, `textarea`, and `contenteditable`.
- Toasts cap at 3 and auto-dismiss after 2.8 s.

## 8. Testing and QA

Minimum gate before any push:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

Current expected result: **11 tests passing**.

The store tests cover starter state, reward payout, double payout prevention, task trimming, purchase, insufficient funds, item selection, placement/stock advance, occupied/out-of-bounds rejection, removal, and reset. Add a test whenever you change store behavior.

Visual QA: see `docs/QA.md`. Use `scripts/capture.mjs`; inspect the four 1440 screenshots and the 1280 overview. Browser console must be clean.

Headless screenshot gotchas:

- CSS animations are throttled in headless Chrome; the script injects `animation-duration: 0.001s` to settle modal/toast states.
- The shop screenshot was previously caught mid-fade and looked transparent; the injected style fixes it.
- Use the `?debug=1` URL to expose `window.__pocketGrove = { scene, gl, camera, three }` for projection/QA. The global is absent in normal production loads.
- Chrome must allow software WebGL in headless: the script passes `--enable-unsafe-swiftshader` and `--ignore-gpu-blocklist`.

## 9. Adding an item

1. Add the id to `ItemId` in `src/types.ts`.
2. Add its entry to `CATALOG` in `src/data/catalog.ts` (name, description, price, category, icon key, accent).
3. Add the icon mapping in `src/components/ui/ItemIcon.tsx` if the lucide icon is new.
4. Add an asset component in `src/components/canvas/AssetMeshes.tsx` and register it in `ASSET_COMPONENTS`.
5. Keep every X/Z extent within ±0.5 and all geometry above `PROP_BASE_Y`.
6. Use `mat(color, ghost, options)` for consistent clay materials and ghost transparency.
7. Confirm `NoRaycast` wraps it (automatic through `AssetMesh`).
8. Update starter data if it should be free; update tests if inventory shape changes.
9. Add a shop/hotbar visual check and regenerate screenshots.
10. Update README economy, product spec, and docs if the catalog changes.

## 10. Publishing to GitHub without repeated keychain prompts

The original environment used macOS and `git credential.helper=store`, with `gh` authenticated via keyring. To avoid repeated Keychain prompts:

```bash
export GH_TOKEN="$(gh auth token)"   # one keychain access at most
```

Create a repo with the API instead of interactive `gh` flows:

```bash
curl -sS -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/user/repos \
  -d '{"name":"pocket-grove","description":"...","private":false,"has_issues":true}'
```

Push without writing the token into `.git/config` or the remote URL permanently:

```bash
git remote add origin https://github.com/yx0128/pocket-grove.git
git -c credential.helper= \
    -c credential.helper='!f() { echo username=x-access-token; echo "password=${GH_TOKEN}"; }; f' \
    push -u origin main
```

Do not commit `.env`, tokens, or `~/.git-credentials`. Do not force-push unless explicitly asked.

## 11. Session state file

`STATE.md` records wall-clock time, token buckets, cost, model, and reproduction SQL. If you continue this work in a new session, replace the numbers with the new session row and note the snapshot time. The source of truth is:

```bash
sqlite3 -readonly ~/.local/share/opencode/opencode.db "
SELECT id, title, version, model, cost,
       tokens_input, tokens_output, tokens_reasoning,
       tokens_cache_read, tokens_cache_write,
       datetime(time_created/1000,'unixepoch'),
       datetime(time_updated/1000,'unixepoch')
FROM session
ORDER BY time_created DESC
LIMIT 5;"
```

Session rows update after each model step, so a state file written before the closing message will be slightly stale. Say so rather than implying exact final totals.

## 12. Definition of done

- [ ] `npm run typecheck` clean
- [ ] `npm run lint` clean
- [ ] `npm test` clean (11+ tests)
- [ ] `npm run build` succeeds
- [ ] Browser console clean at 1440 × 900 and 1280 × 720
- [ ] View hides grid; Build shows grid + green ghost; occupied cells show red
- [ ] R rotation, right-click removal, remove mode, reset camera work
- [ ] Task reward, shop purchase, place, remove, reload persistence verified
- [ ] Screenshots regenerated
- [ ] README, AGENTS, spec, architecture, QA, reproduction, changelog updated
- [ ] `STATE.md` updated with current session metrics and credits
- [ ] Skill updated and mirrored to its GitHub repo if the process changed
- [ ] No debug images, secrets, `node_modules`, or `dist` in git
