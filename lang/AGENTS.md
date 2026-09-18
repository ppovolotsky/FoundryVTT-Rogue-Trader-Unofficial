# lang/ — i18n (en + ru)

Two flat JSON files that must stay key-symmetric.

- Every key is prefixed `RT.*` and grouped by area (`RT.Characteristics.*`, `RT.Skills.*`, `RT.Acquisition.*`, `RT.Roll.*`, `RT.Settings.*`, ...).
- Any added/removed/renamed key must be applied to **both** `en.json` and `ru.json`. Never edit one alone.
- Don't read whole files to add a key — grep the nearest sibling key and insert next to it.
- After changes run `node scripts/check-i18n.mjs`; it exits non-zero on key drift. Fix drift before finishing.
- English is the source wording; provide a real Russian translation, not a copy of the English value.
- Keep translations as short mechanical labels; no rulebook prose.
