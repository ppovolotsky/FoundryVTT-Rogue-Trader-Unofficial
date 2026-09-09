export class RTActor extends Actor {
  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    if (this.type !== "character" && this.type !== "npc") return;

    // Перемещение в метрах от бонуса Ловкости (Ag/10): половинное / полное / рывок / бег.
    const ab = Math.floor((this.system.characteristics?.ag?.value ?? 0) / 10);
    this.system.movement = {
      half: Math.floor(ab / 2),
      full: ab,
      charge: ab * 2,
      run: ab * 4
    };
  }
}
