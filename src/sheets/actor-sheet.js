import { showRollDialog } from "../dice.js";
import { CHARACTERISTICS } from "../config.js";

const { ApplicationV2, DocumentSheetMixin } = foundry.applications.api;

export class RTCharacterSheet extends DocumentSheetMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["rogue-trader", "sheet", "actor", "rt-character-sheet"],
    window: {
      title: "RT.Sheets.Character",
      contentClasses: ["rogue-trader", "sheet", "actor"]
    },
    position: { width: 640, height: "auto" },
    form: {
      handler: RTCharacterSheet.#onFormSubmit,
      submitOnChange: true,
      closeOnSubmit: false
    },
    actions: {
      rollCharacteristic: RTCharacterSheet.#onRollCharacteristic
    }
  };

  static PARTS = {
    main: { template: "systems/rogue-trader/templates/actors/character-sheet.hbs" }
  };

  get title() {
    return this.document.name || super.title;
  }

  static async #onFormSubmit(event, form, formData) {
    await this.document.update(formData.object);
  }

  static async #onRollCharacteristic(event, target) {
    if (event.target.closest("input, select, textarea, button, a")) return;
    const key = target.dataset.key;
    const cfg = CHARACTERISTICS[key];
    if (!cfg) return;
    await showRollDialog({
      target: this.document.system.characteristics?.[key]?.value ?? 0,
      label: game.i18n.localize(cfg.label),
      speaker: ChatMessage.getSpeaker({ actor: this.document })
    });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.document;
    context.system = this.document.system;
    context.characteristics = Object.entries(CHARACTERISTICS).map(([key, cfg]) => ({
      key,
      abbr: cfg.abbr,
      label: game.i18n.localize(cfg.label),
      value: this.document.system.characteristics?.[key]?.value ?? 0
    }));
    return context;
  }
}

// Общая заготовка для типов актёров, чьи листы будут реализованы позже (корабль, колония).
class RTStubActorSheet extends DocumentSheetMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["rogue-trader", "sheet", "actor", "rt-stub-sheet"],
    window: {
      title: "RT.Sheet.Name",
      contentClasses: ["rogue-trader", "sheet", "actor"]
    },
    position: { width: 560, height: "auto" },
    form: {
      handler: RTStubActorSheet.#onFormSubmit,
      submitOnChange: true,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    main: { template: "systems/rogue-trader/templates/actors/stub-sheet.hbs" }
  };

  get title() {
    return this.document.name || super.title;
  }

  static async #onFormSubmit(event, form, formData) {
    await this.document.update(formData.object);
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.document;
    context.system = this.document.system;
    return context;
  }
}

export class RTShipSheet extends RTStubActorSheet {
  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      classes: ["rogue-trader", "sheet", "actor", "rt-ship-sheet"],
      window: { title: "RT.ActorTypes.Ship" }
    });
  }
}

export class RTColonySheet extends RTStubActorSheet {
  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      classes: ["rogue-trader", "sheet", "actor", "rt-colony-sheet"],
      window: { title: "RT.ActorTypes.Colony" }
    });
  }
}
