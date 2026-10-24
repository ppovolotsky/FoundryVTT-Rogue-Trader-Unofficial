import {
  SKILLS,
  SKILL_GROUPS,
  encumbranceForBonus,
  SIZES
} from "../config.js";

const GROUPS_BY_KEY = Object.fromEntries(SKILL_GROUPS.map((group) => [group.key, group]));

// Form expansion can turn groupSkills into an object (checkbox omissions leave
// key gaps); every consumer reads it through this normalizer.
export function normalizeGroupRows(value) {
  if (Array.isArray(value)) return value.filter((row) => row && typeof row === "object");
  if (value && typeof value === "object") {
    return Object.values(value).filter((row) => row && typeof row === "object");
  }
  return [];
}

function itemCarryWeight(item) {
  // Powered armour worn does not count against carrying capacity.
  if (item.type === "armour" && item.system?.powered && item.system?.equipped) return 0;
  const w = Number(item.system?.weight) || 0;
  const qty = ["gear", "ammo"].includes(item.type) ? Math.max(1, Number(item.system?.quantity) || 1) : 1;
  return w * qty;
}

export class RTActor extends Actor {
  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    if (this.type !== "character" && this.type !== "npc") return;

    const system = this.system;
    const penalty = system.fatigue?.penalty ? 10 : 0;
    let xpSpent = 0;
    let xpChars = 0;
    let xpSkills = 0;
    let xpTalents = 0;
    let xpMisc = 0;

    for (const key of Object.keys(system.characteristics ?? {})) {
      const characteristic = system.characteristics[key];
      const base = characteristic.value ?? 0;
      const advance = characteristic.advance ?? 0;
      const reduction = characteristic.reduction ?? 0;

      // Value without the fatigue penalty; the fatigue limit is derived from it.
      characteristic.unpenalized = Math.max(0, base + advance - reduction);
      characteristic.total = Math.max(0, characteristic.unpenalized - penalty);
      characteristic.baseBonus = Math.floor(base / 10);

      // The bonus modifier is flat (added to the bonus): sources of unnatural
      // characteristics and homebrew grant fixed bonuses rather than multipliers.
      // The fatigue penalty lowers characteristic values (all tests) but does not
      // change characteristic bonuses.
      characteristic.bonus = Math.max(0, Math.floor(characteristic.unpenalized / 10)) + (characteristic.bonusMod ?? 0);

      xpSpent += characteristic.xp ?? 0;
      xpChars += characteristic.xp ?? 0;
    }

    // The fatigue limit equals the natural Toughness bonus and is unaffected by the fatigue penalty.
    system.fatigue.limit = Math.floor((system.characteristics?.t?.unpenalized ?? 0) / 10);

    // Skill value: trained = full characteristic; untrained basic (or advanced
    // taken as basic) = half the characteristic rounded down; untrained advanced
    // = 0. Training marks, talent and the free modifier add on top.
    const skillValue = (char, state, basic) => {
      const charTotal = system.characteristics?.[char]?.total ?? 0;
      let value = state.trained ? charTotal : Math.floor(charTotal / 2);
      if (!basic && !state.trained) value = 0;
      value += (state.plus10 ? 10 : 0) + (state.plus20 ? 20 : 0) + (Number(state.talent) || 0) + (state.modifier ?? 0);
      return value;
    };

    for (const def of SKILLS) {
      const state = system.skills?.[def.key];
      if (!state) continue;
      state.char = state.characteristic ?? def.char;
      state.basic = def.basic;
      state.total = skillValue(state.char, state, def.basic || (state.asBasic ?? false));
      xpSpent += state.xp ?? 0;
      xpSkills += state.xp ?? 0;
    }

    const groupRows = normalizeGroupRows(system.groupSkills);
    system.groupSkills = groupRows;

    for (const groupSkill of groupRows) {
      const group = GROUPS_BY_KEY[groupSkill.group];
      if (!group) continue;
      const char = groupSkill.characteristic ?? group.chars[0];
      groupSkill.char = char;
      groupSkill.total = skillValue(char, groupSkill, groupSkill.asBasic ?? false);
      xpSpent += groupSkill.xp ?? 0;
      xpSkills += groupSkill.xp ?? 0;
    }

    const talents = normalizeGroupRows(system.talents);
    system.talents = talents;
    for (const talent of talents) {
      xpSpent += talent.xp ?? 0;
      xpTalents += talent.xp ?? 0;
    }

    const progression = normalizeGroupRows(system.progression);
    system.progression = progression;
    for (const entry of progression) {
      xpSpent += entry.xp ?? 0;
      xpMisc += entry.xp ?? 0;
    }

    system.traits = normalizeGroupRows(system.traits);
    system.criticalWounds = normalizeGroupRows(system.criticalWounds);

    system.xp.spent = xpSpent;
    // Free XP is intentionally allowed to go negative so overspending stays visible.
    system.xp.free = (system.xp.total ?? 0) - xpSpent;
    // Per-source breakdown shown in the Progression tab.
    system.xp.characteristics = xpChars;
    system.xp.skills = xpSkills;
    system.xp.talents = xpTalents;
    system.xp.misc = xpMisc;

    // Rank grows with the total spent XP and caps at 8 (RT progression table).
    const RANK_THRESHOLDS = [5000, 7000, 10000, 13000, 17000, 21000, 25000, 30000];
    system.xp.rank = RANK_THRESHOLDS.filter((threshold) => xpSpent >= threshold).length;

    // Encumbrance: capacity from SB+TB; carried = item weights × quantity.
    const totalBonus = (system.characteristics?.s?.bonus ?? 0)
      + (system.characteristics?.t?.bonus ?? 0);
    const limits = encumbranceForBonus(totalBonus);
    let carried = 0;
    for (const item of this.items) {
      carried += itemCarryWeight(item);
    }
    carried = Math.round(carried * 100) / 100;
    let level = "normal";
    if (carried > limits.lift) level = "overloaded";
    else if (carried > limits.carry) level = "encumbered";
    system.encumbrance = {
      carried,
      carry: limits.carry,
      lift: limits.lift,
      push: limits.push,
      bonus: totalBonus,
      level
    };

    // Movement (RT Core table): natural Agility Bonus only (ignore Unnatural
    // Characteristic bonusMod). Half/Full/Charge/Run = AB / 2AB / 3AB / 6AB.
    // Unnatural Speed doubles AB for movement; Flyer doubles the resulting rates.
    let ab = Math.floor((system.characteristics?.ag?.unpenalized ?? 0) / 10);
    if (system.unnaturalSpeed) ab *= 2;

    let half = ab;
    let full = ab * 2;
    let charge = ab * 3;
    let run = ab * 6;

    const mode = system.movementMode || "normal";
    if (mode === "custom") {
      const custom = system.movementCustom ?? {};
      half = Number(custom.half) || 0;
      full = Number(custom.full) || 0;
      charge = Number(custom.charge) || 0;
      run = Number(custom.run) || 0;
    } else if (mode === "flyer") {
      half *= 2;
      full *= 2;
      charge *= 2;
      run *= 2;
    }

    if (level === "encumbered") {
      half = Math.floor(half / 2);
      full = Math.floor(full / 2);
      charge = Math.floor(charge / 2);
      run = Math.floor(run / 2);
    } else if (level === "overloaded") {
      half = 0;
      full = 0;
      charge = 0;
      run = 0;
    }

    system.movement = { half, full, charge, run, mode, naturalAb: Math.floor((system.characteristics?.ag?.unpenalized ?? 0) / 10) };

    const sizeDef = SIZES.find((s) => s.id === (system.size || "average")) ?? SIZES[3];
    system.sizeHitMod = sizeDef.hitMod;
  }
}
