# Release checklist

## Code

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test` (10+ tests; reference has 11)
- [ ] `npm run build`
- [ ] `npm run preview -- --port 4173`
- [ ] 1440×900 screenshots inspected
- [ ] 1280×720 screenshot inspected
- [ ] Console clean (capture and smoke scripts enforce this)
- [ ] `node scripts/smoke.mjs` passes 25/25

## Product

- [ ] 8×8 grid; grid only in Build/Remove
- [ ] Ten procedural 1×1 assets; no external assets
- [ ] Prices 10/15/20/25/30/35/45/75/90/100
- [ ] Rewards 10/25/50; one-shot
- [ ] Starter 60 coins, 1 Grass + 1 Pine, 3 tasks
- [ ] Green/red ghost; R rotation; bounce; stock decrement
- [ ] Remove mode + right-click return
- [ ] Orbit/pan/zoom/reset with clamps
- [ ] Shop affordability states; Place for owned
- [ ] Hide UI clean view; Show interface restores
- [ ] Mute persists; sounds work after gesture
- [ ] Reload persistence; corrupt-save repair; reset

## Docs

- [ ] README with hero, badges, controls, economy, architecture, docs index, credits
- [ ] AGENTS.md with invariants, map, pitfalls, extension, publish, definition of done
- [ ] docs/PRODUCT_SPEC.md complete
- [ ] docs/ARCHITECTURE.md
- [ ] docs/REPRODUCTION.md
- [ ] docs/QA.md with real results
- [ ] docs/DESIGN_SYSTEM.md
- [ ] docs/STATE_FORMAT.md
- [ ] CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CHANGELOG, LICENSE
- [ ] CI, issue templates, PR template
- [ ] banner + screenshots
- [ ] STATE.md with session metrics and credits

## Git

- [ ] `git status` only intended files
- [ ] no `node_modules`, `dist`, `.env`, tokens, debug screenshots
- [ ] commit message matches repo style
- [ ] branch `main`

## GitHub (avoid repeated keychain prompts)

- [ ] `export GH_TOKEN="$(gh auth token)"` once
- [ ] create app repo via API
- [ ] push with transient credential helper
- [ ] verify Actions CI passes
- [ ] create skill repo via API
- [ ] push skill backup
- [ ] verify both URLs are public

## Skill

- [ ] SKILL.md frontmatter name/description
- [ ] references + capture script included
- [ ] README + LICENSE in skill repo
- [ ] installed at `~/.claude/skills/<name>/`
- [ ] app README links both repos

## State

- [ ] session id, version, model captured
- [ ] start/snapshot UTC and local time
- [ ] elapsed wall-clock
- [ ] input/output/reasoning/cache read/cache write
- [ ] raw total and provider cost
- [ ] caveat that the row updates after the closing message
- [ ] credits to OpenCode + model
- [ ] final state commit/push
