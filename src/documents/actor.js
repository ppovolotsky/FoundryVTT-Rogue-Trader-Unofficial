import { SKILLS, SKILL_GROUPS, ACQUISITION, acquisitionModifier } from "../config.js";

const SKILLS_BY_KEY = Object.fromEntries(SKILLS.map((skill) => [skill.key, skill]));
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
      state.char = def.char;
      state.basic = def.basic;
      state.total = skillValue(def.char, state, def.basic || (state.asBasic ?? false));
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

    system.xp.spent = xpSpent;
    // Free XP is intentionally allowed to go negative so overspending stays visible.
    system.xp.free = (system.xp.total ?? 0) - xpSpent;
    // Per-source breakdown shown in the Progression tab.
    system.xp.characteristics = xpChars;
    system.xp.skills = xpSkills;
    system.xp.talents = xpTalents;
    system.xp.misc = xpMisc;

    // Movement in meters from the Agility bonus (Ag/10): half / full / charge / run.
    const ab = system.characteristics?.ag?.bonus ?? 0;
    system.movement = {
      half: Math.floor(ab / 2),
      full: ab,
      charge: ab * 2,
      run: ab * 4
    };
  }
}
