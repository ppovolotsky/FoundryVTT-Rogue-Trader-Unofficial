---
name: change-document-schema
description: Add or change a stored field on a Rogue Trader actor or item document in Foundry VTT. Use when introducing new persisted system data, editing template.json, or wiring derived values, keeping the classic template.json approach (no TypeDataModel).
---

# change-document-schema

Data schema is the classic `template.json` (Foundry loads it as the default document data). No `TypeDataModel`.

## Workflow

1. Edit `template.json`:
   - Actor types: `character`, `npc`, `ship`, `colony`. Shared groups live under `templates` (`common`, `living`) and are pulled in via each type's `templates: [...]`.
   - Item types: `weapon`, `armour`, `gear`, `ammo` (shared `common`).
   - Add the field with a sensible default (`0`, `""`, `false`, `[]`). Put shared fields in the right template group, not on each type.
2. If the field is computed from others, add the derivation in `RTActor.prepareDerivedData()` (`src/documents/actor.js`) — don't compute in sheets. Read raw from `this.system`, write the derived key back onto `system`.
3. Surface it in the sheet/template if needed — skill `extend-foundry-sheet`.
4. Item sheet fields are declared in `ITEM_FIELDS` (`src/config.js`); add an entry there for item types.
5. Labels/strings — skill `sync-i18n` (both lang files).

## Rules

- Don't rename/remove existing `system.*` paths; templates, code and lang keys depend on them.
- Array-ish fields (`groupSkills`, `talents`, `progression`) go through `normalizeGroupRows`.
- Keep free-XP-can-go-negative and other intentional behaviors intact.
- `packs/**/**.yml` drafts may use older shapes — don't treat them as the schema.
- Do NOT migrate to `foundry.abstract.TypeDataModel`.
