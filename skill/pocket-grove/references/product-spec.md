# Product Specification — 3D Isometric Task & Miniature World Builder

> This is the complete product brief used for the build. It is intentionally preserved so another agent or contributor can reproduce the project without the original conversation. Implementation notes and documented interpretations follow the specification.

## Project

Build a polished, responsive **3D desktop browser web application** where PC and laptop users complete real-world tasks to earn coins, and spend those coins to buy and place **1 × 1 grid-based 3D miniature items** onto a floating diorama island.

---

## 1. Tech Stack & Dependencies

- **Framework:** React 18+ with TypeScript and Vite
- **3D Engine:** Three.js with `@react-three/fiber` and `@react-three/drei`
- **Styling & UI:** Tailwind CSS + `lucide-react` icons (clean, cozy, modern glassmorphism HUD overlays)
- **State & Persistence:** Zustand (with `persist` middleware saving tasks, coin balance, inventory, and 3D grid state to `localStorage`)

---

## 2. Core Gameplay & Productivity Loop

1. **Create & Complete Tasks:** Users add tasks with a difficulty/reward tier (**Quick = 10 coins**, **Standard = 25 coins**, **Deep Work = 50 coins**). Checking off a task awards coins with a crisp visual/sound celebration.
2. **Shop for 1 × 1 Miniatures:** Users open the **Build Shop** to spend coins on 1 × 1 grid tiles and props.
3. **Build the Diorama:** Users select an owned item from their inventory/hotbar, hover over the 3D grid to preview placement, rotate it, and click to snap it onto a `1 × 1` cell.

---

## 3. Detailed Feature Specifications

### A. 3D Diorama & 1 × 1 Grid System

- **Base Island:** Render a stylized floating island baseplate divided into an **8 × 8 grid** (each cell is `1 × 1` world units), with subtle grid lines visible when in **Build Mode** and hidden in **View/Photo Mode**.
- **Raycasting & Placement Preview:**
  - Hovering over any grid cell shows a translucent **ghost preview** of the selected 1 × 1 item snapped cleanly to the center of that cell.
  - Highlight the cell **green** if empty (valid) or **red** if occupied (invalid).
  - Clicking an empty cell places the item with a satisfying **scale-up bounce animation** and deducts 1 from the user's inventory.
- **Rotation & Removal:**
  - Pressing **`R`** (or clicking a Rotate HUD button) rotates the ghost preview by **90-degree increments** (`0°`, `90°`, `180°`, `270°`).
  - Provide a **Bulldoze / Store Tool** (or Right-Click on a placed item) that removes the item from the grid and returns it to the user's inventory.
- **Desktop Camera Controls (`OrbitControls`):**
  - Left-click drag (when not placing an item) to orbit; Right-click drag to pan; Scroll wheel to zoom smoothly.
  - Clamp polar angle (`maxPolarAngle = Math.PI / 2.2`) and zoom distance so the user never clips underneath the island.
  - Include a **"Reset Camera"** button in the HUD.

### B. Stylized Procedural 3D Asset Library (All 1 × 1 Footprint)

To ensure zero broken external model links, build a modular catalog of **10+ distinct, charming low-poly 3D assets** composed of Three.js geometries (`BoxGeometry`, `CylinderGeometry`, `ConeGeometry`, `SphereGeometry`, `DodecahedronGeometry`) with cohesive pastel/cozy materials and shadows enabled:

1. **Grass Patch / Meadow** (10 coins) – Lush green base with tiny wildflowers.
2. **Cobblestone Path** (15 coins) – Stone tile connecting builds.
3. **Water Pond / Canal** (20 coins) – Translucent blue water tile with lily pads.
4. **Pine Tree** (25 coins) – Layered conical foliage with a wooden trunk.
5. **Cherry Blossom Tree** (35 coins) – Soft pink canopy with fallen petals on the tile.
6. **Wooden Park Bench & Lamppost** (30 coins) – Cozy street furniture with a warm emissive lantern glow.
7. **Cozy Cottage** (75 coins) – Miniature house with pitched roof, chimney, and glowing windows.
8. **Windmill** (100 coins) – Tall tower with continuously rotating blades (`useFrame`).
9. **Campfire Site** (45 coins) – Logs, stones, and an animated flickering flame.
10. **Fountain Plaza** (90 coins) – Tiered stone fountain with animated water particles.

*(Note: Ensure every asset strictly fits inside a `1.0 × 1.0` unit boundary so adjacent tiles never overlap or z-fight.)*

### C. Desktop HUD & Task Panel Layout

Optimize the screen layout for widescreen laptop/PC viewports (`1280 × 720` and above) so the 3D canvas occupies 100% of the background viewport:

- **Top Bar:**
  - App title + current **Coin Balance** badge (with animated counter increments).
  - Mode toggle pills: **View Mode** vs. **Build Mode** vs. **Store/Remove Mode**.
  - **"Hide UI"** toggle button so users can admire their miniature world cleanly.
- **Left Docked Glass Panel (Task Manager):**
  - Collapsible sidebar for adding new tasks (title + reward tier selector).
  - Active tasks list (check off to earn coins, delete task) + collapsible "Completed" section.
- **Bottom Dock (Inventory Hotbar & Shop Button):**
  - Quick-select slots (`1–9` keyboard shortcuts) showing owned 1 × 1 items and their quantities.
  - **"Open Shop"** button that opens a clean modal/drawer displaying all 1 × 1 items, descriptions, coin prices, and a "Buy" button (disabled if insufficient coins).

### D. Lighting, Atmosphere & Polish

- Use a soft sky-blue/warm-sunset gradient background, a `HemisphereLight`, and a shadow-casting `DirectionalLight` with soft shadows (`PCFSoftShadowMap`, `2048 × 2048` shadow map).
- Add subtle ambient details around the floating island (e.g., slow-drifting low-poly clouds).
- Add lightweight Web Audio API synthesized sound effects (soft click on task complete, coin chime, pop sound on tile placement) with a **Mute/Unmute** toggle in the top bar.

---

## 4. Initial State & Implementation Rules

- **Starter Experience:** Initialize a brand-new user with **60 starting coins**, **2 free Grass/Tree tiles** in their inventory, and **3 sample starter tasks** so they can immediately test placing items and completing tasks on first load.
- **Code Structure:** Organize cleanly into `/components/canvas/` (Scene, IslandGrid, GhostPreview, AssetMeshes), `/components/ui/` (TaskSidebar, ShopModal, BottomHotbar, TopBar), `/data/catalog.ts` (item metadata & prices), and `/store/useWorldStore.ts`.
- **No Placeholders:** Implement every asset mesh, interaction, and persistence layer completely so the app is immediately playable without missing assets or stubbed functions.

---

## Implementation interpretations

These choices resolve ambiguous parts of the brief and are the behavior the tests and docs describe.

| Question | Decision |
| --- | --- |
| Product name | **Pocket Grove** (the earlier abandoned attempt used “Tiny Meadow”; this repo is a fresh implementation) |
| “2 free Grass/Tree tiles” | One **Grass Patch** and one **Pine Tree**, i.e. exactly two starter miniatures |
| “10+ distinct” | Exactly the ten specified miniatures; every one is implemented, none are stubs |
| Grid | 8 × 8 cells, each 1 × 1 world unit; board cap is 8.9 units so a decorative border remains |
| Grid lines in View | Hidden; the instanced tiles are also a uniform colour so no checkerboard reads as a grid in View |
| Grid lines in Build/Remove | 18 thin bars at cell boundaries, above the tile surface |
| Store/Remove mode label | **Remove** in the HUD, with a trash icon; the bottom hint explains that clicking returns a miniature to the tray |
| Right-click removal | Implemented with a 6 px drag threshold so right-drag panning does not delete pieces; browser context menu is prevented at the app root |
| Completed task checkboxes | Completed tasks move to the collapsible Completed section and cannot be un-checked (prevents re-farming coins) |
| Hide UI | Switches to View mode and hides the grid and all HUD; a small “Show interface” button remains |
| Hotbar keyboard shortcuts | Keys **1–9** select the first nine catalog items; the tenth item is clickable, preserving the specified 1–9 shortcut contract |
| Local saves | Zustand `persist` under `pocket-grove-v1`; only coins, tasks, inventory, placed pieces, and mute are persisted |
| Audio | All effects are synthesized on demand with Web Audio; no audio assets; mute is persisted |
| External assets | None. No GLB, HDR, font, or CDN runtime dependency |
| Test environment | Vitest + jsdom with an explicit in-memory `localStorage` shim for Node 22+/26 compatibility |

## Acceptance checklist

- [x] React 18 + TypeScript + Vite
- [x] Three.js + React Three Fiber + drei
- [x] Tailwind CSS + lucide-react
- [x] Zustand persist with validated hydration
- [x] 8 × 8 grid, 1 × 1 cells, floating island
- [x] Green/red ghost preview snapped to cells
- [x] Bounce placement + inventory deduction
- [x] R rotation and Rotate HUD button
- [x] Remove mode + right-click removal returning items
- [x] Orbit/pan/zoom with polar and distance clamps
- [x] Reset camera
- [x] All ten procedural assets
- [x] Windmill and campfire animation
- [x] Fountain water animation
- [x] Top bar title, animated coins, mode pills, hide UI
- [x] Collapsible task panel with tiers, completed section, delete, reset
- [x] Bottom hotbar with 1–9 shortcuts, quantities, shop
- [x] Shop with descriptions, prices, disabled unaffordable purchases
- [x] Sky gradient, hemisphere + directional shadow light, clouds
- [x] Synthesized audio + mute
- [x] 60 starting coins, 2 starter tiles, 3 starter tasks
- [x] Required file structure
- [x] No placeholders
