# Save Format

Pocket Grove saves through Zustand `persist` under this localStorage key:

```text
pocket-grove-v1
```

The value is a JSON string with a `state` object and a `version` number. Only the fields in `state` below are written; UI flags and actions are not persisted.

## Example

```json
{
  "state": {
    "coins": 60,
    "tasks": [
      {
        "id": "starter-water",
        "title": "Drink a glass of water",
        "tier": "quick",
        "completed": false,
        "createdAt": 1763653304000
      }
    ],
    "inventory": {
      "grass": 1,
      "cobblestone": 0,
      "pond": 0,
      "pine": 1,
      "cherry": 0,
      "bench": 0,
      "cottage": 0,
      "windmill": 0,
      "campfire": 0,
      "fountain": 0
    },
    "placed": [
      {
        "id": "piece_...",
        "itemId": "grass",
        "col": 3,
        "row": 4,
        "rotation": 0,
        "placedAt": 1763653305000
      }
    ],
    "muted": false
  },
  "version": 1
}
```

## Persisted fields

| Field | Type | Rules on hydration |
| --- | --- | --- |
| `coins` | number | Finite; floored; minimum 0; otherwise 60 |
| `tasks` | Task[] | Unknown-shape entries dropped; tier must be quick/standard/deep; title trimmed to 90 chars; missing array → 3 starter tasks; empty array remains empty |
| `inventory` | Record<ItemId, number> | Every known id present; only positive finite values kept; floored; capped at 999; missing/malformed object → starter inventory |
| `placed` | PlacedItem[] | Known item id; integer `col`/`row` in 0..7; unique cell; rotation normalized to 0..3; max 64; malformed → `[]` |
| `muted` | boolean | Non-boolean → false |

## Session-only fields

These reset on every load:

| Field | Default |
| --- | --- |
| `mode` | `build` |
| `selectedItemId` | first item with inventory > 0, else `null` |
| `rotation` | `0` |
| `hideUI` | `false` |
| `cameraReset` | `0` |
| `toasts` | `[]` |
| `sidebarOpen` | `true` |
| `shopOpen` | `false` |
| `completedOpen` | `false` |

Resetting mode/selection prevents a user from loading into a hidden UI, an open modal, or a stale ghost preview after items were removed.

## Versioning

`PERSIST_VERSION` is currently `1`. If the schema changes:

1. Bump `PERSIST_VERSION` in `src/data/catalog.ts`.
2. Extend `mergePersisted()` so both old and new shapes repair safely.
3. Add a migration path if the meaning of an existing field changes.
4. Add tests for malformed/legacy saves.
5. Update this file and `AGENTS.md`.

Zustand calls `merge` with the parsed persisted value and the current in-memory state. `mergePersisted` returns a complete valid `WorldState`, preserving all action functions from `current`.

## Tampering and repair

The save is treated as untrusted because it can be hand-edited or left over from an older build. The sanitizer is deliberately conservative: it drops unknown items, out-of-bounds cells, duplicate cells, malformed tasks, and non-positive counts. It never throws; a corrupt save degrades to the starter experience.

Coins are not tied to task history on load. If you need anti-cheat semantics, prefer a server or a signed save; this is a single-player local toy, so the goal is resilience rather than tamper-proofing.

## Reset

The task panel footer’s **Reset world** calls `resetWorld()`, which replaces the persisted data with `createDefaultData()` and preserves only the mute preference. It also emits an “A fresh grove is ready for you.” toast.
