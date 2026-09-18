---
name: sync-i18n
description: Add or rename user-facing strings in the Rogue Trader Foundry system while keeping en.json and ru.json in sync. Use whenever a UI label, hint, dialog, or chat string is added or changed, or when localization keys drift between languages.
---

# sync-i18n

All UI text is `game.i18n.localize("RT....")` / `{{localize "RT...."}}`. Keys live in `lang/en.json` and `lang/ru.json` and must stay symmetric.

## Workflow

1. Pick a key under the right group: `RT.<Area>.<Name>` (e.g. `RT.Skills.Dodge`, `RT.Settings.Edition.Name`). Match the naming of nearby keys.
2. Locate the insertion point without reading whole files — grep a sibling key:
   - `rg "RT.Skills." lang/en.json`
3. Add the key to **both** files:
   - `lang/en.json`: source wording.
   - `lang/ru.json`: real Russian translation (not a copy of English).
4. Reference it in code/template as `RT....` (never hardcode the text).
5. Validate: `node scripts/check-i18n.mjs`. It exits non-zero and lists keys missing on either side. Fix and rerun until clean.

## Rules

- Never edit only one language file.
- Keep values as short mechanical labels; no rulebook prose (IP).
- Renaming a key = update the key in both JSON files AND every `RT....` reference in `src/` and `templates/`.

## Check

```bash
node scripts/check-i18n.mjs
```
