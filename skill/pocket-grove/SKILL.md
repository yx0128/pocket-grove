---
name: pocket-grove-builder
description: Build and ship a polished, desktop-first 3D isometric task and miniature world builder with React, TypeScript, Three.js, @react-three/fiber, Zustand persistence, a coin economy, procedural 1x1 miniatures, a shop/hotbar glass HUD, headless visual QA, professional release docs, GitHub publishing, and session-state accounting. Use when someone asks for a cozy 3D task game, miniature diorama, world builder, gamified task manager, or a complete from-scratch web app with docs and release engineering.
---

# Pocket Grove Builder

A complete playbook for producing a cozy **3D isometric task & miniature world builder** in one session, with a playable app, verified tests, professional docs, screenshots, two GitHub repositories, and a transparent state file. The reference implementation is [yx0128/pocket-grove](https://github.com/yx0128/pocket-grove).

Use this skill when the user wants:

- a 3D task manager or productivity game;
- a floating diorama / miniature world builder;
- an 8×8 grid placement app with Three.js;
- a gamified personal dashboard with coins and a shop;
- a from-scratch React/Three app shipped like a real release.

## Outcomes

A finished session should leave:

1. A new project under `~/Projects/<name>`.
2. A playable React 18 + TypeScript + Vite app using Three.js/R3F/drei.
3. An 8×8 floating island with **ten** procedural 1×1 miniatures.
4. A task economy (10/25/50), Build Shop, hotbar, ghost placement, rotation, removal, camera controls, audio, and local saves.
5. Strict typecheck, ESLint, 10+ store tests, and a production build.
6. Four professional screenshots plus a 1280×720 QA frame.
7. README, AGENTS.md, product spec, architecture, reproduction, QA, design system, save format, contributing, security, license, changelog, CI, and templates.
8. `STATE.md` with wall-clock time, token buckets, provider cost, model, and reproduction SQL.
9. A public app repo and a separate public skill-backup repo.
10. A local skill install at `~/.claude/skills/<skill-name>/`.

## Non-negotiables

Lock these into the plan and re-check them at the end:

- **8×8 grid**, 1×1 world units per cell.
- **Every asset fits inside 1.0×1.0** in X/Z; height may vary.
- **Ten catalog items** at exactly 10, 15, 20, 25, 30, 35, 45, 75, 90, 100.
- Rewards: **Quick +10, Standard +25, Deep Work +50**.
- Starter: **60 coins, two tiles (Grass + Pine), three tasks**, Build mode.
- One-shot rewards; no un-checking completed tasks.
- View mode hides grid lines; Build/Remove show them.
- No external 3D models, HDRs, fonts, or runtime network calls.
- Persistence is local, validated, and repairs corrupt saves.
- Desktop-first; verify 1440×900 and 1280×720.

## Workflow

### Phase 0 — Recon and de-risk

1. Check `node -v`, `npm -v`, `gh auth status`, `ls ~/Projects`, `git config credential.helper`.
2. Look for prior attempts. If a previous folder exists but does not match the spec, **do not silently reuse it**; create a fresh project and state why.
3. Find the current OpenCode session id and metrics early:

```bash
sqlite3 -readonly ~/.local/share/opencode/opencode.db "
SELECT id,title,version,model,cost,tokens_input,tokens_output,tokens_reasoning,
       tokens_cache_read,tokens_cache_write,
       datetime(time_created/1000,'unixepoch'),
       datetime(time_updated/1000,'unixepoch')
FROM session ORDER BY time_created DESC LIMIT 5;"
```

4. Note macOS keychain risk. Prefer a single `export GH_TOKEN="$(gh auth token)"` and transient git credential helpers; never embed tokens in remotes or commit them.

### Phase 1 — Scaffold

Create the folder structure:

```bash
mkdir -p ~/Projects/<name>
cd ~/Projects/<name>
mkdir -p src/{components/{canvas,ui},data,lib,store,test} public docs scripts \
  .github/{workflows,ISSUE_TEMPLATE} skill/<skill-name>
```

Install:

```bash
npm install
```

Dependencies: `react@18`, `react-dom@18`, `three@0.170`, `@react-three/fiber@8`, `@react-three/drei@9`, `zustand@5`, `lucide-react`.
Dev: `vite@5`, `@vitejs/plugin-react`, `typescript@~5.6`, `tailwindcss@3`, `postcss`, `autoprefixer`, ESLint 9 + typescript-eslint + react-hooks + react-refresh, `vitest@2`, `jsdom`.

Use `vite.config.ts` with `test.environment: 'jsdom'`, setup file, and production preview port 4173. Use `tsc -b` project references with strict mode and `noUnusedLocals`/`noUnusedParameters`.

### Phase 2 — Data and economy first

Create `src/types.ts`, `src/data/catalog.ts`, `src/lib/grid.ts`, `src/lib/id.ts`, `src/lib/sound.ts`, then `src/store/useWorldStore.ts`.

Catalog is the single source of truth for:

- ten item entries with name/description/price/category/icon/accent;
- reward tiers;
- starter inventory (Grass 1, Pine 1);
- starter tasks (water/quick, desk/standard, focus/deep);
- constants: `GRID_SIZE=8`, `STARTING_COINS=60`, `STORAGE_KEY`, `PERSIST_VERSION`.

Grid constants:

```ts
TILE_TOP_Y = 0.06;
PROP_BASE_Y = 0.06;
HIGHLIGHT_Y = 0.103;
```

Store actions: add/complete/delete/clear tasks, buy/select item, set mode, rotate, place, remove, reset, mute, hide UI, reset camera, toast, sidebar/shop/completed flags.

Persistence: `persist` with `partialize` of coins/tasks/inventory/placed/muted, and a defensive `merge` that validates unknown data, drops duplicate/out-of-range cells, caps counts, and resets mode/selection on load.

Immediately write 10–12 Vitest store tests:

- starter state;
- reward amount;
- double-pay prevention;
- task whitespace/order;
- purchase;
- insufficient funds;
- select;
- place + stock advance;
- occupied/out-of-bounds rejection;
- remove returns one;
- reset.

**Node 26 + jsdom trap:** Node exposes an experimental `localStorage` global that can shadow jsdom's and make Zustand's storage adapter undefined. Add an in-memory `localStorage` shim in `src/test/setup.ts` with `Object.defineProperty(globalThis, 'localStorage', ...)` before importing the store.

### Phase 3 — Scene and island

Create `Scene.tsx`, `IslandGrid.tsx`, `GhostPreview.tsx`, `AssetMeshes.tsx`, `Clouds.tsx`.

Scene rules:

- `<Canvas shadows alpha dpr={[1,2]}>` with camera `[9.6,10,12.4]`, target `[0,0.25,0.5]`, fov 40.
- CSS sky gradient on the page (radial warm sun + blue→cream linear). Do **not** use a world-space sky shader: with a top-down camera it becomes all sunset.
- PCFSoft shadows, 2048²; warm sun directional + hemisphere + cool fill; fog 28–62.
- OrbitControls: damping, distance 7.5–28, polar 0.25–π/2.2, right pan, wheel zoom, left rotate except in Build with a selected item.
- Reset camera via a non-persisted counter.

Island:

- Grass RoundedBox 8.9×0.16×8.9, **radius 0.06**.
- Dirt RoundedBox 8.72×0.52×8.72, radius 0.22.
- Flipped cone(s) + perimeter boulders for the underside.
- 64 instanced 1×1 tiles at top 0.06, uniform sage.
- 18 thin grid bars at 0.064, only in Build/Remove.
- Invisible pointer plane at y=0.1, size 8×8.
- Validity plane at 0.103, raycast disabled.
- Placed pieces at group y=0.06; bounce only when `Date.now() - placedAt < 1400`.
- Right-click removal with a ≤6 px drag threshold; prevent the browser context menu at the root.

**Critical bug to avoid:** a RoundedBox radius larger than half the smallest dimension inflates geometry. A grass cap with height 0.16 and radius 0.18 produced `maxY=0.304` and buried every flat tile. Keep radius below half the minimum dimension.

**Raycast rule:** every asset is wrapped in `NoRaycast` (`object.raycast = () => {}` on descendants). All hover/click/right-click goes through the pointer plane. This avoids tall meshes stealing events and makes flat tiles behave identically.

### Phase 4 — Ten procedural assets

Build each in `AssetMeshes.tsx` with a shared `mat(color, ghost, options)` helper:

- roughness 0.82–0.98, metalness ~0.02, `flatShading: true`;
- emissive only for lanterns/windows/fire/water;
- ghost opacity ≈0.68 and `depthWrite: false`;
- scale within ±0.5 X/Z;
- shadows on major forms.

Assets and signatures:

1. Grass: slab + 4 flowers (stem/dodeca/centre) + 5 blades.
2. Cobblestone: slab + 11 scaled dodeca stones.
3. Pond: grass slab + translucent water + 9 rim stones + 3 lily pads + tiny flower.
4. Pine: mound + trunk + 3 cones + tip.
5. Cherry: mound + trunk + 2 branches + 4 dodeca canopy puffs + 6 fallen petals.
6. Bench & lamppost: pad, seat/back/legs, arm, pole, emissive lantern + point light.
7. Cottage: pad, body, 4-sided pitched roof, chimney, door, 2 emissive windows, step.
8. Windmill: pad, tapered tower, cap, door, hub, 4 sails + `useFrame` rotation.
9. Campfire: pad, 8 stones, crossed logs, flame cones + flickering point light.
10. Fountain: pad, basin, torus rim, water, pedestal, upper bowl, jet, 9 animated droplets.

**Ghost lift:** render the ghost at cell centre + 0.06 so the validity plane is visible under the asset.

### Phase 5 — HUD

Build `TopBar`, `TaskSidebar`, `ShopModal`, `BottomHotbar`, `ModeHint`, `Toasts`, `AnimatedNumber`, `ItemIcon`.

Requirements:

- Top bar: brand, animated coin badge, View/Build/Remove pills, reset camera, mute, hide UI.
- Sidebar: collapsible; add form with title + three tier buttons; active task list with custom checkbox, tier badge, reward, hover delete; collapsible Completed with clear; tip card; save note; reset world.
- Shop: z-70 backdrop, 3-column grid, description, price, owned count, 1×1 badge, Place (owned) + Buy (disabled if unaffordable).
- Hotbar: all ten items, keys 1–9 (tenth click-only), quantities, selected ring, Rotate, Shop.
- Hide UI: switch to View, hide HUD, leave a small “Show interface” button.
- Toasts: max 3, auto-dismiss 2.8 s.
- Keyboard: ignore inputs; Esc show UI/close shop/View; R/B/V/X; 1–9; ignore repeats.
- Cursor: grab vs crosshair.
- Glass surfaces: `bg-cream/75 backdrop-blur-xl border-white/60 shadow-glass`.

### Phase 6 — Verify

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

Fix everything. Add a CI workflow that runs all four on Node 22 and uploads `dist`.

### Phase 7 — Visual QA and screenshots

Use the included `scripts/capture.mjs` (also copied in this skill’s `scripts/`). It:

- assumes a preview server on port 4173;
- launches headless Chrome with software WebGL;
- writes a deterministic demo save;
- reloads and injects a CSS rule to settle animations;
- captures overview, build, shop, clean, and hero;
- checks console errors;
- supports `VIEWPORT` and `SHOT_SUFFIX`.

Run:

```bash
npm run preview -- --port 4173
node scripts/capture.mjs
VIEWPORT=1280x720 SHOT_SUFFIX=-1280 node scripts/capture.mjs
node scripts/smoke.mjs
```

`scripts/smoke.mjs` is a 25-assertion UI smoke test: completion reward, custom task, place, stock decrement, second placement, R rotation, right-click removal, shop purchase, hide/show UI, reload persistence, reset, and console cleanliness.

Inspect every screenshot. Look for: flat tiles disappearing, grid visible in View, ghost hidden, modal too transparent, text cut off at 1280×720, hotbar overflow, island clipped by HUD.

**Headless traps:**

- CSS animations can be throttled; the shop modal looked transparent mid-fade. Settle animations with an injected style.
- The modal can appear behind the HUD only if it is still at opacity 0; check computed z-index and opacity before “fixing” z-order.
- A world-space gradient sky becomes orange under a top-down camera. Use CSS.
- Use `?debug=1` to expose `window.__pocketGrove` for projecting world cells to screen coordinates in QA; do not expose it in normal production loads.

### Phase 8 — Documentation

Write, at minimum:

- `README.md` — hero, badges, features, quick start, controls, economy, architecture at a glance, persistence, checks, screenshots, docs index, credits.
- `AGENTS.md` — invariants, source map, pitfalls, extension steps, publishing, definition of done.
- `docs/PRODUCT_SPEC.md` — the full brief plus interpretation table and acceptance checklist.
- `docs/ARCHITECTURE.md` — data model, scene graph, interaction pipeline, persistence, audio, testing, decisions.
- `docs/REPRODUCTION.md` — exact rebuild steps, QA, GitHub, skill, metrics.
- `docs/QA.md` — results, interaction matrix, limitations, commands.
- `docs/DESIGN_SYSTEM.md` — palette, type, surfaces, motion, 3D direction.
- `docs/STATE_FORMAT.md` — save schema, sanitization, migration.
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`, `LICENSE`.
- `.github/workflows/ci.yml`, issue templates, PR template.
- `docs/banner.svg`, screenshots.

### Phase 9 — State file

Take a final metrics snapshot:

```bash
sqlite3 -readonly ~/.local/share/opencode/opencode.db "
SELECT id,title,version,model,cost,tokens_input,tokens_output,tokens_reasoning,
       tokens_cache_read,tokens_cache_write,
       datetime(time_created/1000,'unixepoch'),
       datetime(time_updated/1000,'unixepoch')
FROM session WHERE id='<session-id>';"
```

Write `STATE.md` with start/snapshot, elapsed, model, token buckets, raw total, cost, tests, source/doc line counts, commits, repo URLs, phase timeline, caveats (snapshot lag and cache-read dominance), and credits to OpenCode + the model. Never claim exact final totals; the session row updates after the closing message.

### Phase 10 — Publish

Use a single token export and transient credential helper:

```bash
export GH_TOKEN="$(gh auth token)"
```

Create repos via the API, then push:

```bash
git init -b main
git add .
git commit -m "feat: release <name> 1.0.0"
git remote add origin https://github.com/<user>/<repo>.git
git -c credential.helper= \
    -c credential.helper='!f() { echo username=x-access-token; echo "password=${GH_TOKEN}"; }; f' \
    push -u origin main
```

Repeat for the skill repo. Do not write the token to `.git/config` or a remote URL. Do not commit `node_modules`, `dist`, debug images, or secrets.

### Phase 11 — Skill backup and install

Copy `skill/<skill-name>/` into a separate repo (SKILL.md, references, scripts, README, LICENSE), commit, create via API, push. Install locally:

```bash
mkdir -p ~/.claude/skills/<skill-name>
cp -R skill/<skill-name>/. ~/.claude/skills/<skill-name>/
```

## Reusable prompt

> Build a polished, desktop-first 3D isometric task & miniature world builder in a new `~/Projects` folder. Use React 18 + TypeScript + Vite, Three.js/R3F/drei, Tailwind, lucide-react, and Zustand persist. Implement an 8×8 floating island, ten procedural 1×1 assets, a 10/25/50 task economy, Build Shop, hotbar, ghost preview, rotation, right-click/remove mode, camera controls, audio, and validated local saves with no placeholders. Add tests, typecheck, lint, and a production build. Capture 1440×900 and 1280×720 screenshots with headless Chrome. Write README, AGENTS.md, product spec, architecture, reproduction, QA, design system, save format, contributing, security, changelog, license, CI, and templates. Publish the app and a skill-backup repo to GitHub without repeated keychain prompts. Record wall-clock time, token usage, provider cost, model, and credits in STATE.md. Package the process as a reusable skill and install it locally.

## Acceptance checklist

- [ ] 8×8 grid, 1×1 footprints, ten assets.
- [ ] 60 coins, 2 starter tiles, 3 tasks.
- [ ] 10/25/50 rewards, one-shot completion.
- [ ] Build Shop prices and disabled unaffordable buys.
- [ ] Ghost green/red, R rotation, bounce, stock decrement.
- [ ] Remove mode + right-click return; drag threshold works.
- [ ] Orbit/pan/zoom/reset with clamps.
- [ ] View hides grid; Build shows it; Hide UI is clean.
- [ ] Coins animate; sounds play and mute persists.
- [ ] Reload persists; corrupt save repairs; reset works.
- [ ] Typecheck, lint, tests, build pass.
- [ ] Console clean at 1440×900 and 1280×720.
- [ ] Screenshots and docs complete.
- [ ] App + skill repos public; skill installed.
- [ ] STATE.md accurate to snapshot; credits included.

## References

- `references/pitfalls.md` — the release postmortem and exact fixes.
- `references/release-checklist.md` — publish and verify sequence.
- `scripts/capture.mjs` — dependency-free CDP screenshot pipeline.
- `scripts/smoke.mjs` — 25-assertion UI smoke test.
- Reference app: https://github.com/yx0128/pocket-grove
- Reference skill backup: https://github.com/yx0128/pocket-grove-skill
- React Three Fiber: https://r3f.docs.pmnd.rs
- drei: https://drei.docs.pmnd.rs
- Zustand persist: https://zustand.docs.pmnd.rs/integrations/persisting-store-data
