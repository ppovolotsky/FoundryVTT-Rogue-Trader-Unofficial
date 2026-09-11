import { SKILLS, SKILL_GROUPS, UNTRAINED_PENALTY_BASIC, UNTRAINED_PENALTY_ADVANCED } from "../config.js";

const SKILLS_BY_KEY = Object.fromEntries(SKILLS.map((skill) => [skill.key, skill]));
const GROUPS_BY_KEY = Object.fromEntries(SKILL_GROUPS.map((group) => [group.key, group]));

export class RTActor extends Actor {
  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    if (this.type !== "character" && this.type !== "npc") return;

    const system = this.system;
    const penalty = system.fatigue?.penalty ? 10 : 0;
    let xpSpent = 0;

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
    }

    // The fatigue limit equals the natural Toughness bonus and is unaffected by the fatigue penalty.
    system.fatigue.limit = Math.floor((system.characteristics?.t?.unpenalized ?? 0) / 10);

    // Skill totals: characteristic value + training (+10), advances (+10/+20),
    // talent (+10) and free modifier; untrained tests take a penalty.
    const skillTotal = (char, skillState, basic) => {
      const charTotal = system.characteristics?.[char]?.total ?? 0;
      let total = charTotal
        + (skillState.trained ? 10 : 0)
        + (skillState.plus10 ? 10 : 0)
        + (skillState.plus20 ? 20 : 0)
        + (skillState.talent ? 10 : 0)
        + (skillState.modifier ?? 0);
      if (!skillState.trained) total -= basic ? UNTRAINED_PENALTY_BASIC : UNTRAINED_PENALTY_ADVANCED;
      return total;
    };

    for (const def of SKILLS) {
      const state = system.skills?.[def.key];
      if (!state) continue;
      state.char = def.char;
      state.basic = def.basic;
      state.total = skillTotal(def.char, state, def.basic);
      xpSpent += state.xp ?? 0;
    }

    for (const groupSkill of system.groupSkills ?? []) {
      const group = GROUPS_BY_KEY[groupSkill.group];
      if (!group) continue;
      const char = groupSkill.characteristic ?? group.chars[0];
      groupSkill.char = char;
      groupSkill.basic = groupSkill.asBasic ?? false;
      groupSkill.total = skillTotal(char, groupSkill, groupSkill.basic);
      xpSpent += groupSkill.xp ?? 0;
    }

    system.xp.spent = xpSpent;
    // Free XP is intentionally allowed to go negative so overspending stays visible.
    system.xp.free = (system.xp.total ?? 0) - xpSpent;

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
