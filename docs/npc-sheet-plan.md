# NPC sheet — feature plan (GM-focused)

Status: plan only. Characters and NPCs still share `RTCharacterSheet` until this is approved and implemented.

## Goal

Give the GM a fast sheet for adversaries and allies: enough to run combat and skill tests without career bookkeeping.

## Keep (same as character)

- Header: name, wounds, fate (optional), fatigue toggle
- Characteristics + click-to-roll
- Skills tab (trained marks; free skill rolls setting)
- Combat: wounds, critical wounds, movement/size, equipped armour AP, equipped weapons + attack helpers
- Inventory: equipped gear that matters in the scene (weapons/armour); drag from packs
- Psykana: only when the NPC is a psyker/navigator (same dual mode)

## Simplify / hide for NPC

- XP tab: hide Rank / advancement tables / talent XP costs (or collapse to a single “notes / abilities” list without XP math)
- Acquisition / Profit Factor: hide (PC dynasty tools)
- Ship tab: hide (use ship actors instead)
- Journal: keep a short Notes + Traits; drop Goals / Allies / full identity row by default
- Player name field: hide or relabel as “GM note”

## Possible NPC-only fields (later)

- Threat / role label (minion, elite, master)
- Horde magnitude (if horde rules are added)
- Quick “clone as combatant” from a template actor

## Implementation sketch

1. Branch in `RTCharacterSheet._prepareContext` / tab nav on `actor.type === "npc"` to set `context.isNpc` and hide PARTS/tabs.
2. Optional separate `RTNpcSheet` only if branching becomes too noisy.
3. No schema fork: keep shared `living` template; unused XP fields simply stay at 0.

## Out of scope for first NPC pass

- Full career advancement
- Colony/ship embedding
- Automated bestiary import from books
