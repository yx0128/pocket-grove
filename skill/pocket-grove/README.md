# Pocket Grove Builder skill

A reusable playbook for building and shipping a polished 3D isometric task & miniature world builder in one AI-assisted session.

- [`SKILL.md`](SKILL.md) — the main skill (frontmatter + 11-phase workflow + acceptance list).
- [`references/product-spec.md`](references/product-spec.md) — the full product brief and acceptance checklist.
- [`references/pitfalls.md`](references/pitfalls.md) — the actual release postmortem and fixes.
- [`references/release-checklist.md`](references/release-checklist.md) — code, product, docs, Git, GitHub, skill, and state checks.
- [`scripts/capture.mjs`](scripts/capture.mjs) — dependency-free headless Chrome screenshot/QA pipeline.

Reference app: [yx0128/pocket-grove](https://github.com/yx0128/pocket-grove)

## Install

Copy the folder into your Claude skills directory:

```bash
mkdir -p ~/.claude/skills/pocket-grove-builder
cp -R . ~/.claude/skills/pocket-grove-builder/
```

Or point your agent at this repository.

## Use

Ask for a cozy 3D task game, miniature diorama, 8×8 world builder, gamified task manager, or a complete from-scratch React/Three app with release docs. The skill covers:

- architecture and data model;
- procedural 1×1 asset library;
- placement/ghost/camera interactions;
- Zustand persistence and validation;
- glass HUD composition;
- headless visual QA;
- professional documentation;
- GitHub publishing without repeated keychain prompts;
- session time/token accounting;
- packaging the process as a skill.

## License

MIT. See [LICENSE](LICENSE).
