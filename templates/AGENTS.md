# templates/ — Handlebars (.hbs)

Rendered by Application V2 PARTS (see `src/sheets/`) and by `renderTemplate` for dialog/chat cards.

- Same UI contract as sheets: every label via `{{localize "RT...."}}`, interactive elements carry `data-action="..."` matching a handler in the sheet's `actions` map.
- Reuse existing `rt-*` classes and the `.rogue-trader` scope; styling lives in `css/rogue-trader.css` (`--rt-*` vars) — match a neighboring template, don't inline styles or read the whole CSS.
- Full template paths are `systems/rogue-trader/templates/...` (that's how PARTS and `renderTemplate` reference them).
- New strings need `RT.*` keys in both `lang/en.json` and `lang/ru.json` (skill `sync-i18n`).
- Stub tabs (`tab-combat`, `tab-psykana`, `tab-ship`, `stub-sheet`) show `RT.Sheet.StubNote`; keep them stubs unless the task says otherwise.
