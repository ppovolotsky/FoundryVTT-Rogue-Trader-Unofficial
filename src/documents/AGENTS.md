# src/documents/ — actor & item documents

`RTActor extends Actor`, `RTItem extends Item`. Classic schema in `../../template.json`.

- All computed values go in `RTActor.prepareDerivedData()` (gated by actor type). Read raw fields from `this.system`, write derived keys back onto `system`. Don't compute in sheets.
- Don't remove or rename existing `system.*` paths; other code, templates and lang keys depend on them.
- `normalizeGroupRows(value)` is the single normalizer for array-ish fields (`groupSkills`, `talents`, `progression`) that form expansion may turn into sparse objects. Reuse it; don't reimplement.
- Free XP is intentionally allowed to go negative (overspend stays visible) — keep that behavior.
- Do NOT migrate to `foundry.abstract.TypeDataModel`. If a schema field is added, edit `template.json` (skill `change-document-schema`).
- `packs/**/**.yml` are drafts with older shapes; not authoritative schema.
