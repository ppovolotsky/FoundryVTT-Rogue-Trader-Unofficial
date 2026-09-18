# src/sheets/ — Application V2 sheets

Sheets extend `HandlebarsApplicationMixin(ActorSheetV2 | ItemSheetV2)`. Follow `actor-sheet.js` as the reference.

- Register UI handlers in `static DEFAULT_OPTIONS.actions` and mark clickable elements with `data-action="..."`; don't attach ad-hoc listeners in templates.
- Layout is `static PARTS = { name: { template: "systems/rogue-trader/templates/..." } }`. A new tab = new PART + template + a routing entry, plus a `data-action` if interactive.
- If you must bind DOM listeners in `_onRender`, guard with `this._rtListenersBound` so re-renders don't double-bind (a repeat bind freezes the sheet).
- Array fields (`groupSkills`, `talents`, `progression`) survive form expansion via `normalizeGroupRows` from `../documents/actor.js`; also normalize in the submit handler. Prefer direct `document.update` for row edits over form-bound arrays.
- Prefer `this.document.update({ "system.path": value })` and `foundry.utils.getProperty(this.document, path)`.
- Use existing `rt-*` classes / `.rogue-trader` scope; styles go in `css/rogue-trader.css` (`--rt-*` vars) — don't read the whole CSS, match a neighbor.
- Every label is `{{localize "RT...."}}` with keys in both lang files (skill `sync-i18n`).
