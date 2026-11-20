# Design System

## Mood

A tabletop miniature garden at golden hour: soft clay, rounded edges, sage and cream, warm lamp light, and a sky that is blue at the top and peach at the horizon. The HUD should feel like translucent stationery laid over the world, never a dashboard.

## Palette

| Token | Hex | Use |
| --- | --- | --- |
| `cream` | `#fdf7ea` | Glass panels, cards, text surfaces |
| `parchment` | `#f3e7cf` | Warm card fills |
| `sand` | `#e7d5b8` | Borders, secondary fills |
| `sage` | `#a9c69b` | Soft accents, hover fills |
| `sage-soft` | `#d4e5c9` | Badges, selected soft fills |
| `sage-deep` | `#6d8f63` | Muted labels, outlines |
| `forest` | `#3d6048` | Primary actions, brand, active pills |
| `moss` | `#7e9b72` | Secondary greenery |
| `terracotta` | `#d17c5b` | Roofs, warm accents |
| `coral` | `#e08a68` | Lantern light, highlights |
| `sky` | `#bfe3ef` | Sky base |
| `sky-deep` | `#8fc7dd` | Water, cool details |
| `sunset` | `#f8d9b8` | Horizon warmth |
| `ink` | `#2f3a34` | Primary text |
| `ink-soft` | `#5d6b62` | Secondary text |
| `gold` | `#e9b949` | Coins |
| `gold-deep` | `#c8942b` | Coin text on light |
| `water` | `#7cc6d8` | Ponds and fountains |
| `blossom` | `#f4b8c8` | Cherry canopy, flowers |

### 3D material colours

- Grass: `#9fc48d`, `#aecfa0`, `#8fc47a`, `#88b974`
- Dirt/stone: `#b98a5a`, `#7f6b5a`, `#6d5b4c`, `#cfc0a6`, `#d8cbb4`
- Wood: `#8a5f3f`, `#7d5237`, `#a9744f`
- Evergreen: `#4f8a63`, `#5f9d72`, `#74ac82`
- Blossom: `#f4b8c8`, `#f8cdd8`, `#f2adc3`
- Water: `#7cc6d8`, `#b8ecf5`, `#a9e8f3`
- Warm emissive: `#ffc46b`, `#ffd98a`, `#ffb703`
- Fire: `#f28b3c`, `#ffd166`, `#fff0b3`
- Clouds: `#fffaf0`

## Typography

- Family: `SF Pro Rounded`, `Nunito`, `ui-rounded`, `Avenir Next`, `Segoe UI`, sans-serif. No webfont request.
- Brand: 17 px / 900 / tight tracking; subtitle 10 px uppercase 0.18em.
- Section titles: 14 px / 900.
- Body: 11–13 px; task titles 13 px / 600.
- Numeric: tabular, black weight for coins.
- Uppercase micro-labels: 8–10 px / 900 / tracking 0.08–0.18em.

## Surfaces

- Glass panel: `border-white/60 bg-cream/75 backdrop-blur-xl shadow-glass`.
- Inner card: `border-white/70 bg-white/45` with a hover to `bg-white/70`.
- Shop card: `bg-white/60`, hover lift `-translate-y-0.5`, soft shadow.
- Modal panel: `bg-cream/95`, `rounded-[2rem]`, border `white/70`, large shadow.
- Backdrop: `bg-ink/35 backdrop-blur-sm`.
- Shadows:
  - glass: `0 18px 45px -24px rgba(47,58,52,.45)` + inset white highlight
  - float: `0 16px 35px -20px rgba(47,58,52,.5)`
  - coin: `0 8px 22px -10px rgba(200,148,43,.75)`

## Shape

- HUD panels: 24–32 px radius (`rounded-3xl`, `rounded-[1.7rem]`, `rounded-[2rem]`).
- Buttons/pills: full radius.
- Hotbar slots: 16 px radius, 50 × 52 px.
- Shop cards: 16 px radius.
- 3D: rounded boxes, low-poly dodecahedrons, flat shading, no sharp chrome.

## Components

### Top bar

Single floating glass bar at top with brand badge, animated coin pill, mode pills, and icon buttons. Below `md`, the mode pills drop to a second centered row.

### Mode pills

Inactive: transparent, `text-ink-soft`, hover white. Active: `bg-forest text-cream` + float shadow. Icons: Eye, Hammer, Trash2.

### Task panel

Header with clipboard badge and done/remaining count. Add form: rounded input + forest add button. Tier picker: three compact cards; selected tier uses forest background and cream text. Active rows: custom circular checkbox, title, tier badge, coin reward, hover-only delete. Completed section is collapsible with strike-through rows and clear action. Tip card has a dashed sage border. Footer has local-save note and reset link.

### Hotbar

Floating dock. Each slot has a key label, item icon in an accent-wash tile, and a quantity badge. Selected: forest background + cream icon + gold quantity. Empty: 25% opacity. Rotate button mirrors slot size; Shop button is a forest pill.

### Shop

Header with shopping bag badge, title, subtitle, coin pill, close. Three-column card grid. Card: accent icon tile, name, category chip, 2-line description, price pill, owned count, 1 × 1 badge, Place (if owned) + Buy. Buy disabled at insufficient funds.

### Toasts

Top-center, max three, cream glass, 1 px tone bar on the left, icon, message, close. Slide up 260 ms; auto-dismiss 2.8 s.

### Animated number

rAF cubic ease over 520 ms; a keyed span replays `coin-pop` (scale/rotate) on each change.

## Motion

- `toast-in` / `modal-in`: 260 ms cubic-bezier(0.22, 1, 0.36, 1), translate + scale + fade.
- `coin-pop`: 380 ms scale/rotate.
- `soft-float`: 5 s for decorative idle.
- `slide-in`: sidebar 220 ms.
- 3D bounce: 520 ms ease-out with 16% sine overshoot.
- Placement puff: 700 ms expanding ring + six dots.
- Windmill: 0.55 rad/s. Campfire flicker: 7–10 Hz sine mixture. Fountain droplets: 0.9 rad/s orbit with vertical bob.
- Respect reduced motion? Not currently implemented; CSS animations are decorative and short.

## 3D art direction

- **Footprint:** every miniature is designed inside a 1 × 1 cell; keep X/Z within ±0.5, with a little breathing room.
- **Scale:** ground assets are ~0.04–0.10 high; props 0.3–0.9 high; no asset taller than ~1.0.
- **Material:** `roughness 0.82–0.98`, `metalness ~0.02`, `flatShading: true`; emissive only for lanterns, windows, fire, and water sparkle.
- **Composition:** one hero per tile (tree, cottage, windmill, fountain); ground tiles stay low so adjacent props read.
- **Shadows:** cast on major forms, receive on bases; 2048² PCFSoft sun.
- **Ghost:** 68% opacity, no depth write, lifted 0.06, green/red cell within 0.103.
- **Palette harmony:** greens dominate; terracotta and blossom are accents; gold is reserved for economy; water is the only cool saturated surface.

## Layout

- Canvas fills the viewport at all sizes.
- Top bar: 12–16 px inset, ~64–72 px tall.
- Task panel: left 12–16 px, top 96 px, bottom 112 px, 342 px max width.
- Hotbar: centered bottom 12–16 px, max width `100vw - 24px`.
- Mode hint: centered, 6.1 rem from bottom (above hotbar), hidden below `sm`.
- Shop: centered, max 1024 px, max 88dvh, scrollable body.
- Target viewports: 1280 × 720 and above.

## Iconography

Lucide, 3–5 px stroke at 14–20 px. Item mapping: Sprout, Route, Waves, TreePine, Flower2, Armchair, Home, Wind, Flame, Droplets. Modes: Eye, Hammer, Trash2. Economy: Coins. Tasks: Zap, Clock, Brain. Utility: Volume2/VolumeX, EyeOff, RotateCcw, ShoppingBag, Sparkles.

## Voice

Short, warm, concrete. “Finish one small task, then place one miniature. A grove grows one tile at a time.” Avoid productivity guilt, streak pressure, or corporate language.
