# src/ — Foundry v14 JS

Plain ES modules loaded by Foundry (`system.json` -> `esmodules`). Relative `.js` imports; Foundry globals via `foundry.*`, `game`, `CONFIG`, `Hooks`.

- Access APIs through the v14 namespaces already used here: `foundry.applications.*`, `foundry.applications.sheets.*`, `foundry.utils.*`, `foundry.dice.Roll`, `foundry.documents.*`. Don't reach for pre-v14 globals (`ActorSheet`, `FormApplication`, `mergeObject`).
- `Hooks.once("init"/"ready")` belong only in `rogue-trader.js` (bootstrap). Register documents/sheets there.
- Rules catalogs and type labels are data in `config.js`; add options there, not inline.
- Before using a Foundry API not already present in a sibling file, check `../docs/agent/foundry-v14.md`. Do not guess or web-search legacy signatures.
- No TypeScript, no TypeDataModel. Keep comments in English.
