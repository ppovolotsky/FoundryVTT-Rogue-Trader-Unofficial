# Rogue Trader (Unofficial) — agent index

Foundry VTT **game system** `rogue-trader`. This file is the map. Do not re-scan the tree; jump to the one or two files below.

## Identity

- Foundry VTT **v14 only** (`system.json`: min/verified/max = 14). No backports.
- Plain **ES modules**, no bundler, no npm, no tests. Entry: `src/rogue-trader.js`.
- Document data schema lives in `template.json` (classic template, NOT DataModel).
- Sheets are Foundry **Application V2** (`ActorSheetV2` / `ItemSheetV2` + `HandlebarsApplicationMixin`).
- UI is bilingual: `lang/en.json` + `lang/ru.json`, keys prefixed `RT.*`.
- License CC BY-NC 4.0; W40K/Rogue Trader are GW/FFG IP — see "Hard rules".

## Status (what exists vs stub)

- Done: d100 test engine, character/NPC sheet, Inventory tab, XP/skills/acquisition, dual i18n; pack YAML drafts under `packs/` (source of truth for inventory item drafts).
- Stubs — do NOT flesh out unless the task explicitly asks: `combat`, `psykana`, `ship`, `colony` tabs/sheets; compendium `.db` packs (yml drafts under `packs/` only).

## Hard rules (always)

- Stay on the current stack: **no TypeScript, no build tooling, no TypeDataModel migration, no legacy `ActorSheet`/`FormApplication`.**
- Never paste rulebook prose into code/packs/lang; keep mechanical summaries and `RT.*` keys only. No commercial packaging.
- Every user-facing string gets a `RT.*` key in **both** `lang/en.json` and `lang/ru.json`. Never touch just one.
- Don't break existing `system.*` paths in `template.json`; derived values go in `prepareDerivedData`.
- Prefer copying the pattern from a neighboring file over inventing a new Foundry API.

## Routing: task -> files -> skill

| Task | Read first | Skill |
|------|------------|-------|
| Add/rename a UI string | grep the key in `lang/en.json` | `sync-i18n` |
| Add tab / button / field on a sheet | `src/sheets/actor-sheet.js` | `extend-foundry-sheet` |
| New actor/item field | `template.json`, `src/documents/actor.js` | `change-document-schema` |
| Roll / test mechanics | `src/dice.js` | — |
| Rules catalogs (skills, acquisition, item fields) | `src/config.js` | — |
| Unfamiliar Foundry v14 API | `docs/agent/foundry-v14.md` | — |

## File map (one line each)

- `system.json` — manifest: id, v14 compat, esmodules/styles/langs, pack declarations.
- `template.json` — actor (`character`/`npc`/`ship`/`colony`) + item (`weapon`/`armour`/`gear`/`ammo`) schema.
- `src/rogue-trader.js` — `init`/`ready` hooks, document + sheet registration, `game.rogueTrader` API.
- `src/config.js` — `CHARACTERISTICS`, `SKILLS`, `SKILL_GROUPS`, `ACQUISITION`, `ROLL_MODES`, `ITEM_FIELDS`, `WEAPON_SPECIALS`, `registerConfig`.
- `src/settings.js` — world settings `defaultRollMode`, `edition`.
- `src/dice.js` — `rollTest` / `showRollDialog`: d100 (`1d100` or `2d10`), degrees, crits, chat card.
- `src/documents/actor.js` — `RTActor.prepareDerivedData`, `normalizeGroupRows` (array<->object repair).
- `src/documents/item.js` — `RTItem` (empty subclass).
- `src/sheets/actor-sheet.js` — `RTCharacterSheet` (+ `RTShipSheet`/`RTColonySheet` stubs): PARTS, `actions`, tabs (incl. Inventory).
- `src/sheets/item-sheet.js` — `RTItemSheet`, fields from `ITEM_FIELDS`.
- `templates/**/*.hbs` — sheet PARTS, roll dialog, chat cards.
- `css/rogue-trader.css` — single stylesheet, `rt-*` classes, `--rt-*` vars.
- `lang/en.json`, `lang/ru.json` — i18n, must stay key-symmetric (`scripts/check-i18n.mjs`).
- `packs/**/*.yml` — Item pack drafts (weapons, armour, tools, cybernetics, ammo, weapon-mods); source of truth until `.db` packs exist.
- `scripts/check-i18n.mjs` — en/ru key symmetry check.

## Conventions & guidance live next to the code

Folder-scoped `AGENTS.md` files (`src/`, `src/sheets/`, `src/documents/`, `templates/`, `lang/`) carry the detailed rules and load only when you touch that folder. Read them there, not here.

## Keeping this index fresh

When you add a new actor/item type, sheet, hook, or config catalog, add one line to the file map and (if it changes a workflow) a routing row. Keep entries to a single line.
