# Contributing

Thanks for helping Pocket Grove grow. This is a small, self-contained React/Three.js project; keep changes focused and preserve the cozy, asset-free art direction.

## Setup

```bash
git clone https://github.com/yx0128/pocket-grove.git
cd pocket-grove
npm install
npm run dev
```

Node 22+ is recommended. Open http://localhost:5173.

## Before opening a pull request

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

All four must pass. If you change rendering, also run the visual QA script and review the screenshots:

```bash
npm run preview -- --port 4173
node scripts/capture.mjs
```

## Product invariants

Do not change the 8 × 8 grid, the ten catalog prices, the 10/25/50 rewards, the 60-coin starter state, one-shot task rewards, the 1 × 1 asset footprint, or the local-only persistence model without discussing it first and updating the spec, tests, docs, and screenshots.

## Adding an item

Follow the checklist in [AGENTS.md](AGENTS.md#9-adding-an-item). In short: type id → catalog entry → icon mapping → asset mesh → register component → fit within 1 × 1 → test/screenshot/docs. All assets must remain procedural.

## Code style

- TypeScript strict; no `any` unless unavoidable.
- Zustand actions are the only mutation path.
- Keep catalog metadata in `src/data/catalog.ts`.
- Use the glass/sage/forest system in `docs/DESIGN_SYSTEM.md`.
- No new network requests, analytics, external 3D models, HDRs, or web fonts.
- No comments that restate the code; prefer clear names.
- Keep keyboard shortcuts working and ignoring focused inputs.

## Commits

- One logical change per commit.
- Use a short imperative subject, e.g. `feat: add mushroom grove miniature`, `fix: keep ghost above flat tiles`, `docs: clarify save migration`.
- Include tests for store behavior changes.
- Do not commit `node_modules`, `dist`, tokens, `.env`, or debug screenshots.

## Reporting bugs

Use the issue template and include:

- Viewport size and browser.
- Steps to reproduce.
- Expected vs actual.
- Console errors (if any).
- A screenshot or save export if possible.

## License

By contributing you agree that your contribution is licensed under the MIT license in [LICENSE](LICENSE).
