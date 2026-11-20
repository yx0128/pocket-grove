# Changelog

All notable changes are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses semantic versioning.

## [1.0.0] — 2026-11-21

### Added

- Desktop-first React 18 + TypeScript + Vite app with Tailwind glass HUD.
- 3D floating 8 × 8 diorama with orbit/pan/zoom camera, soft sun shadows, drifting clouds, and floating rocks.
- Ten procedural 1 × 1 miniatures: grass, cobblestone, pond, pine, cherry blossom, bench & lamppost, cottage, windmill, campfire, fountain.
- Task economy with Quick (+10), Standard (+25), and Deep Work (+50) tiers.
- Build Shop with descriptions, prices, owned counts, affordability states, and Place actions.
- Ghost placement preview, green/red validity tint, 90° rotation, bounce/puff animation, Remove mode, and right-click pick-up.
- Animated coin counter, synthesized Web Audio effects, mute, and hide-UI photo mode.
- Zustand persistence with defensive hydration and a full starter state (60 coins, 2 tiles, 3 tasks).
- Eleven Vitest store tests, ESLint, strict TypeScript, production build, and GitHub Actions CI.
- Professional README, product spec, architecture, reproduction guide, QA report, design system, save format, contributing, security, changelog, license, issue/PR templates.
- Headless Chrome screenshot pipeline with deterministic demo state and console-error checks.
- Reusable `pocket-grove-builder` skill and a separate GitHub backup repository.
- `STATE.md` recording session wall-clock time, token buckets, provider cost, model, and reproduction SQL.

### Fixed during release QA

- RoundedBox grass cap radius inflated the island top to `y=0.304`, hiding every flat tile. Reduced the radius to `0.06`.
- Replaced the world-space sky dome with a CSS gradient + sun glow so the top-down view is blue-to-cream rather than all sunset.
- Raised cell highlights above flat ground assets (`HIGHLIGHT_Y=0.103`).
- Added non-raycast guards to ghost/highlight meshes so the pointer plane consistently receives placement events.
- Settled CSS animations in headless screenshots; the shop modal previously captured mid-fade and looked transparent.
- Added an in-memory localStorage shim for Node 26 + jsdom tests.
