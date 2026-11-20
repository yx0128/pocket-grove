# Reproduction Guide

This guide rebuilds Pocket Grove from an empty folder, verifies it, documents it, and publishes it. It is written for another AI agent or a human maintainer. The original full brief is [PRODUCT_SPEC.md](PRODUCT_SPEC.md).

## 0. What you are reproducing

A desktop-first 3D isometric task manager/miniature builder:

- React 18 + TypeScript + Vite, Tailwind, Zustand persist.
- Three.js + `@react-three/fiber` + `@react-three/drei`.
- 8 × 8 floating island, ten procedural 1 × 1 miniatures.
- Task economy (10/25/50), shop, hotbar, ghost preview, rotation, removal, camera, audio, local saves.
- Professional docs, CI, screenshots, state record, reusable skill.

Outcome: a playable app at `http://localhost:5173`, a release-ready repo, and two GitHub repositories (app + skill backup).

## 1. Prerequisites

- Node 22+ (the original session used Node 26.13.1, npm 11.20.0; CI uses Node 22).
- npm.
- macOS/Linux shell; the screenshot script assumes Google Chrome at the standard macOS path unless `CHROME_PATH` is set.
- `git` and `gh` authenticated for GitHub publishing.
- Optional: `sqlite3` for reading OpenCode session metrics.

## 2. Create the folder

```bash
mkdir -p ~/Projects/pocket-grove
cd ~/Projects/pocket-grove
mkdir -p src/{components/{canvas,ui},data,lib,store,test} public docs scripts \
  .github/{workflows,ISSUE_TEMPLATE} skill/pocket-grove
```

## 3. Scaffold config

Create:

- `package.json` — scripts `dev`, `build`, `preview`, `typecheck`, `lint`, `test`, `test:watch`.
- Dependencies: `@react-three/drei ^9.117`, `@react-three/fiber ^8.17`, `lucide-react ^0.468`, `react ^18.3`, `react-dom ^18.3`, `three ^0.170`, `zustand ^5`.
- Dev dependencies: `@eslint/js`, `@types/node`, `@types/react`, `@types/react-dom`, `@types/three`, `@vitejs/plugin-react`, `autoprefixer`, `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `jsdom`, `postcss`, `tailwindcss`, `typescript ~5.6`, `typescript-eslint`, `vite ^5.4`, `vitest ^2.1`.
- `index.html` with a `/favicon.svg`, theme color `#dfeecd`, title and description.
- `vite.config.ts` with the React plugin, preview port 4173, manual chunks (`three`, `react-three`, `react-vendor`), and Vitest jsdom setup.
- `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` with strict mode, bundler resolution, project references, no emit.
- `tailwind.config.js` with the palette and keyframes/animations.
- `postcss.config.js`, `eslint.config.js`, `.gitignore`, `.editorconfig`, `.nvmrc`.

Reference versions are in [package.json](../package.json). Install:

```bash
npm install
```

> npm 11 may print an “install scripts not yet covered by allowScripts” warning for esbuild. The install still produced a working Vite/esbuild in the original session. If your npm variant blocks it, run `npm rebuild esbuild` or approve the esbuild install script.

## 4. Design the data layer first

1. `src/types.ts` — `ItemId`, `RewardTier`, `WorldMode`, `Task`, `PlacedItem`, `ToastMessage`, `Inventory`, `CatalogEntry`, `Cell`.
2. `src/data/catalog.ts` — ten entries with prices `10, 15, 20, 25, 30, 35, 45, 75, 90, 100`, categories, descriptions, icon keys, accents; `REWARD_TIERS` 10/25/50; `createStarterInventory()` (grass 1, pine 1); `createStarterTasks()`; constants `STARTING_COINS=60`, `GRID_SIZE=8`, `STORAGE_KEY='pocket-grove-v1'`, `PERSIST_VERSION=1`.
3. `src/lib/grid.ts` — `cellToWorld`, `worldToCell`, `isInsideGrid`, `cellKey`, `normalizeRotation`, `rotationToRadians`, `TILE_TOP_Y=0.06`, `PROP_BASE_Y=0.06`, `HIGHLIGHT_Y=0.103`.
4. `src/lib/id.ts` — UUID with fallback.
5. `src/lib/sound.ts` — lazy AudioContext; click, taskComplete, coin, pop, remove, error; mute flag.
6. `src/store/useWorldStore.ts` — full state/actions/persist/sanitizer as described in [ARCHITECTURE.md](ARCHITECTURE.md#persistence).

Key store rules:

- `completeTask` only pays once.
- `buyItem` rejects insufficient funds.
- `placeItem` checks mode, selection, stock, bounds, occupancy; decrements stock and advances selection.
- `removeAt` returns exactly one.
- `resetWorld` rebuilds starter data but preserves mute.
- `mergePersisted` sanitizes untrusted localStorage.

Write tests immediately:

```bash
npm test
```

The reference suite has 11 tests in `src/store/useWorldStore.test.ts`.

## 5. Build the 3D layer

### 5.1 Scene

- Transparent Canvas, alpha true.
- CSS sky gradient on `<main>`: radial sun at 80% 8% + `linear-gradient(180deg,#9bd6ea,#c7e7ee 45%,#f9dfba)`.
- Lights: hemisphere 1.15, ambient 0.2, warm sun 2.15 at `[8,13,6]` with 2048² PCFSoft shadows, cool fill 0.5.
- Fog `#d7e9e2` 28–62.
- Camera `[9.6,10,12.4]`, target `[0,0.25,0.5]`, fov 40.
- OrbitControls clamps 7.5–28 and maxPolar `π/2.2`; left rotate except in Build with a selected item; right pan, wheel zoom.
- Reset camera via a `cameraReset` counter.

### 5.2 Island

- Grass RoundedBox 8.9 × 0.16 × 8.9 with **radius 0.06** (do not use a radius > half-height; see the pitfall).
- Dirt RoundedBox 8.72 × 0.52 × 8.72 radius 0.22.
- Two flipped cones for the rock underside; perimeter boulders.
- 64 instanced 1 × 1 tiles, height 0.03, top at 0.06, uniform `#aecfa0`.
- Grid: 18 thin bars at `y=0.064`, only rendered when mode ≠ view.
- Invisible pointer plane at `y=0.1`, 8 × 8, handles move/click/right-click.
- Hover validity plane at `y=0.103` (raycast disabled).
- Placed pieces at `(cellToWorld, 0.06)` with bounce only if fresh.
- Right-click removes only when pointer movement ≤ 6 px.

### 5.3 Assets

Implement all ten in `AssetMeshes.tsx`. Use the shared `mat()` helper. Keep X/Z inside ±0.5. Wrap every `AssetMesh` in `NoRaycast`.

Animation:

- Windmill: `useFrame` rotate sails on Z.
- Campfire: flame group scale/rotation + point light flicker.
- Fountain: nine droplets orbit/bob.

### 5.4 Clouds

Three high/four low is enough; reference has six high + three low + four floating rocks. Low clouds at y≈1.3–1.7 are visible with the top-down camera. Drift X, wrap at ±17, bob sinusoidally.

## 6. Build the HUD

Order in `App.tsx`: `TopBar`, `TaskSidebar`, `ModeHint`, `BottomHotbar`, `Toasts`, `ShopModal`. Keep the Canvas mounted when UI is hidden.

- Top bar: brand, animated coin badge, mode pills, reset camera, mute, hide UI.
- Sidebar: add form + tier picker, active list, completed section, tip card, reset world footer.
- Shop: z-70 backdrop, 3-column grid, affordability-disabled buy, place when owned.
- Hotbar: all ten items, quantities, selected ring, 1–9 labels, Rotate, Shop.
- Hide UI: switch to View, hide HUD, leave a “Show interface” button.
- Keyboard: ignore inputs; Escape/close/shop/view; R/B/V/X; 1–9.
- Cursor: grab/crosshair.

## 7. Styling and audio

- Tailwind palette in `tailwind.config.js`; glass panels use `bg-cream/75 backdrop-blur-xl border-white/60 shadow-glass`.
- Google-free font stack: `SF Pro Rounded`, `Nunito`, `ui-rounded`, `Avenir Next`, `Segoe UI`.
- Scrollbar utilities, `overflow: hidden` on body, canvas `touch-action: none`.
- Audio is invoked from store actions; mute is persisted and synced with `audio.setMuted` in `App`.

## 8. Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: zero type errors, zero lint errors, 11 tests passing, successful Vite build.

Then:

```bash
npm run preview -- --port 4173
node scripts/smoke.mjs
```

The smoke test drives the real UI (reward, add task, place, rotate, right-click remove, buy, hide UI, reload persistence, reset) and fails on any browser console error. It complements the store tests.

In a browser verify:

1. Starter: 60 coins, 3 tasks, grass/pine in tray, Build mode, grass selected.
2. Complete a Quick task → +10, toast, sound (once), task moves to Completed.
3. Add a task with each tier; delete one; clear completed.
4. Buy an item; insufficient funds is blocked.
5. Hover empty → green ghost; hover occupied → red.
6. Place; bounce; inventory decrements. Press R; rotate. Right-click; item returns. Use Remove mode.
7. Camera orbit/pan/zoom/reset; polar/distance clamps.
8. Hide UI → clean View; Show interface returns.
9. Reload → coins, tasks, inventory, pieces, mute persist.
10. Reset world → starter state.
11. Resize to 1280 × 720; check no overlap/cut-off.

## 9. Screenshots

`scripts/capture.mjs` is dependency-free (Node fetch + WebSocket + CDP). It:

1. Verifies the preview server.
2. Launches headless Chrome with software WebGL.
3. Sets a demo save in `localStorage` (245 coins, 24 placed pieces).
4. Reloads, injects a CSS rule to settle animations.
5. Captures overview (View), build (green ghost at cell 5,2), shop, clean hidden-UI, and a hero without the “Show interface” button.
6. Fails on browser console errors.

Run:

```bash
node scripts/capture.mjs
VIEWPORT=1280x720 SHOT_SUFFIX=-1280 node scripts/capture.mjs
```

Review the images in `docs/`. The final release uses 1440 × 900 images plus one 1280 × 720 layout check.

## 10. Documentation set

Create:

- `README.md` — hero, badges, features, quick start, controls, economy, architecture, persistence, checks, docs index, credits.
- `AGENTS.md` — agent handoff, invariants, pitfalls, publishing, definition of done.
- `docs/PRODUCT_SPEC.md` — original brief + interpretations + acceptance checklist.
- `docs/ARCHITECTURE.md` — data model, scene, interactions, UI, audio, testing, decisions.
- `docs/REPRODUCTION.md` — this file.
- `docs/QA.md` — results and limitations.
- `docs/DESIGN_SYSTEM.md` — palette, type, surfaces, motion, 3D direction.
- `docs/STATE_FORMAT.md` — save schema and sanitization.
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`, `LICENSE`.
- `.github/workflows/ci.yml`, issue templates, PR template.
- `docs/banner.svg`, screenshots, `STATE.md`.

## 11. Capture session state

Find the current OpenCode session:

```bash
sqlite3 -readonly ~/.local/share/opencode/opencode.db "
SELECT id, title, version, model, cost,
       tokens_input, tokens_output, tokens_reasoning,
       tokens_cache_read, tokens_cache_write,
       datetime(time_created/1000,'unixepoch') AS created_utc,
       datetime(time_updated/1000,'unixepoch') AS updated_utc
FROM session
ORDER BY time_created DESC
LIMIT 5;"
```

Write `STATE.md` with:

- session start and snapshot timestamps;
- wall-clock elapsed;
- OpenCode version and model id;
- input/output/reasoning/cache-read/cache-write totals and raw total;
- provider cost;
- test count, source/doc line counts, commit count, repo URLs;
- phase timeline;
- caveats about snapshot lag and cached-token accounting;
- credits.

The original session id was `ses_e06610ecfffeFs84z17RtxGY8S`; replace it when continuing.

## 12. Publish without keychain churn

The original macOS environment used `credential.helper=store` and a keyring-backed `gh`. To avoid repeated prompts:

```bash
export GH_TOKEN="$(gh auth token)"   # one access
```

Create the repo via the API:

```bash
curl -sS -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/user/repos \
  -d '{"name":"pocket-grove","description":"A cozy 3D isometric task and miniature world builder.","private":false,"has_issues":true,"has_wiki":false}'
```

Initialize and push without storing the token:

```bash
git init -b main
git add .
git commit -m "feat: release Pocket Grove 1.0.0"
git remote add origin https://github.com/yx0128/pocket-grove.git
git -c credential.helper= \
    -c credential.helper='!f() { echo username=x-access-token; echo "password=${GH_TOKEN}"; }; f' \
    push -u origin main
```

If you need a later push in the same shell, repeat the credential-helper override (or use an askpass script that reads `GH_TOKEN`); do not embed the token in the remote URL.

## 13. Publish the skill

Create `skill/pocket-grove/SKILL.md` (see [the in-repo skill](../skill/pocket-grove/SKILL.md)) and a separate backup repo:

```bash
mkdir -p /tmp/pocket-grove-skill
cp -R skill/pocket-grove/. /tmp/pocket-grove-skill/
cd /tmp/pocket-grove-skill
git init -b main
git add .
git commit -m "feat: publish Pocket Grove builder skill"
git remote add origin https://github.com/yx0128/pocket-grove-skill.git
git -c credential.helper= \
    -c credential.helper='!f() { echo username=x-access-token; echo "password=${GH_TOKEN}"; }; f' \
    push -u origin main
```

Create the skill repo with the same API pattern before pushing. Optionally install locally:

```bash
mkdir -p ~/.claude/skills/pocket-grove-builder
cp -R skill/pocket-grove/. ~/.claude/skills/pocket-grove-builder/
```

## 14. Final acceptance

- [ ] App runs from a clean `npm install` + `npm run dev`.
- [ ] Typecheck, lint, 11+ tests, build pass.
- [ ] Browser console clean at 1440 × 900 and 1280 × 720.
- [ ] All product invariants preserved.
- [ ] Screenshots regenerated and reviewed.
- [ ] Docs complete and internally linked.
- [ ] `STATE.md` has the current session metrics and credits.
- [ ] Both GitHub repos exist and are public.
- [ ] Skill installed/mirrored and backed up.
- [ ] `git status` clean; no secrets, debug screenshots, `node_modules`, or `dist` committed.

## 15. Original prompt skeleton

If you need to regenerate the project from scratch, use the full [PRODUCT_SPEC.md](PRODUCT_SPEC.md) as the prompt. Add these process constraints:

> Build this in a new project under `~/Projects`. Use React 18 + TypeScript + Vite, Three.js/R3F/drei, Tailwind, lucide-react, and Zustand persist. Implement all ten procedural 1 × 1 assets, the 8 × 8 grid, shop, hotbar, task economy, ghost/rotation/removal, camera, audio, and local persistence with no placeholders. Test and build it. Capture professional screenshots. Write README, AGENTS.md, architecture, reproduction, QA, design, state-format, contributing, security, license, changelog, and CI. Publish the app to GitHub. Package the process as a skill and publish a backup repo. Record wall-clock time, token usage, provider cost, and credits in STATE.md. Avoid repeated keychain prompts.
