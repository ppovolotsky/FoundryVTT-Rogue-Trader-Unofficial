---
name: extend-foundry-sheet
description: Add a tab, button, control, or field to a Rogue Trader actor or item sheet in Foundry VTT v14. Use when extending sheet UI or wiring a new click/roll action, following the project's Application V2 + Handlebars conventions.
---

# extend-foundry-sheet

Sheets are `HandlebarsApplicationMixin(ActorSheetV2 | ItemSheetV2)`. Reference implementation: `src/sheets/actor-sheet.js` (`DEFAULT_OPTIONS`, `PARTS`, `#onFormSubmit`, the `#on...` handlers). Item sheet: `src/sheets/item-sheet.js`.

## Add an interactive control (button / roll / toggle)

1. Add a static handler method on the sheet class: `static async #onDoThing(event, target) { ... }` (read `target.dataset.*` for params).
2. Register it in `static DEFAULT_OPTIONS.actions`: `doThing: MySheet.#onDoThing`.
3. In the template, mark the element: `<button data-action="doThing" data-key="...">`.
4. Mutate state via `this.document.update({ "system.path": value })`; read via `foundry.utils.getProperty(this.document, path)`.

## Add a tab

1. Add a PART: `foo: { template: "systems/rogue-trader/templates/actors/tab-foo.hbs" }` in `static PARTS`.
2. Create `templates/actors/tab-foo.hbs` (copy an existing tab for structure/classes).
3. Wire it into the tab nav (`character-tabs.hbs`) and the `switchTab` action / `activeTabs` state.

## Add a displayed field

- If the value is stored: also do `change-document-schema` (edit `template.json`).
- If derived: compute in `RTActor.prepareDerivedData`, then render read-only.

## Guardrails

- If binding raw DOM listeners in `_onRender`, guard with `this._rtListenersBound` (double-bind freezes the sheet).
- Array rows (`groupSkills`, `talents`, `progression`): normalize with `normalizeGroupRows` and prefer direct row `document.update` over form-bound arrays.
- Use existing `rt-*` classes / `.rogue-trader` scope; add styles in `css/rogue-trader.css` (`--rt-*`).
- Every label via `{{localize}}` with keys in both lang files (skill `sync-i18n`).
- v14 APIs only — no legacy `ActorSheet`/`FormApplication`. Unsure of an API? See `docs/agent/foundry-v14.md`.
