export class RTActor extends Actor {
  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    if (this.type !== "character" && this.type !== "npc") return;

    const system = this.system;
    const penalty = system.fatigue?.penalty ? 10 : 0;

    for (const key of Object.keys(system.characteristics ?? {})) {
      const characteristic = system.characteristics[key];
      const base = characteristic.value ?? 0;
      characteristic.total = Math.max(0, base + (characteristic.advance ?? 0) - penalty);
      characteristic.baseBonus = Math.floor(base / 10);
      characteristic.bonus = Math.max(0, Math.floor(characteristic.total / 10)) + (characteristic.bonusMod ?? 0);
    }

    // The fatigue limit equals the Toughness bonus.
    system.fatigue.limit = system.characteristics?.t?.bonus ?? 0;

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
