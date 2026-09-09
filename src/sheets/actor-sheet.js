import { showRollDialog } from "../dice.js";
import { CHARACTERISTICS } from "../config.js";

export class RTCharacterSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["rogue-trader", "sheet", "actor", "rt-character-sheet"],
      template: "systems/rogue-trader/templates/actors/character-sheet.hbs",
      width: 640,
      height: "auto"
    });
  }

  async getData(options) {
    const context = await super.getData(options);
    context.characteristics = Object.entries(CHARACTERISTICS).map(([key, cfg]) => ({
      key,
      abbr: cfg.abbr,
      label: game.i18n.localize(cfg.label),
      value: this.actor.system.characteristics?.[key]?.value ?? 0
    }));
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".rt-characteristic").on("click", async (event) => {
      if (event.target.closest("input, select, textarea, button")) return;
      const key = event.currentTarget.dataset.key;
      const cfg = CHARACTERISTICS[key];
      if (!cfg) return;
      await showRollDialog({
        target: this.actor.system.characteristics?.[key]?.value ?? 0,
        label: game.i18n.localize(cfg.label),
        speaker: ChatMessage.getSpeaker({ actor: this.actor })
      });
    });
  }
}

// Общая заготовка для типов актёров, чьи листы будут реализованы позже (корабль, колония).
class RTStubActorSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["rogue-trader", "sheet", "actor", "rt-stub-sheet"],
      template: "systems/rogue-trader/templates/actors/stub-sheet.hbs",
      width: 560,
      height: "auto"
    });
  }

  async getData(options) {
    const context = await super.getData(options);
    context.enrichedDescription = await TextEditor.enrichHTML(this.actor.system.description ?? "", { async: true });
    return context;
  }
}

export class RTShipSheet extends RTStubActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["rogue-trader", "sheet", "actor", "rt-ship-sheet"]
    });
  }
}

export class RTColonySheet extends RTStubActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["rogue-trader", "sheet", "actor", "rt-colony-sheet"]
    });
  }
}
