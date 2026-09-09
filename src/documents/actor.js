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

      // Bonus modifier acts as the unnatural multiplier (1 = normal, 2 = x2, ...).
      const multiplier = Math.max(1, characteristic.bonusMod ?? 1);
      characteristic.bonus = Math.max(0, Math.floor(characteristic.total / 10)) * multiplier;

      xpSpent += characteristic.xp ?? 0;
    }

    // The fatigue limit equals the natural Toughness bonus and is unaffected by the fatigue penalty.
    system.fatigue.limit = Math.floor((system.characteristics?.t?.unpenalized ?? 0) / 10);

    system.xp.spent = xpSpent;
    system.xp.free = Math.max(0, (system.xp.total ?? 0) - xpSpent);

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
