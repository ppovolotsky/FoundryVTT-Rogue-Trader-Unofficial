import { showRollDialog } from "../dice.js";
import { SYSTEM_ID, CHARACTERISTICS, ADVANCE_STEPS } from "../config.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
const { ChatMessage } = foundry.documents;
const { Roll } = foundry.dice;

export class RTCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["rogue-trader", "sheet", "actor", "rt-character-sheet"],
    window: {
      title: "RT.Sheets.Character",
      contentClasses: ["rogue-trader", "sheet", "actor"]
    },
    position: { width: 780, height: "auto" },
    form: {
      handler: RTCharacterSheet.#onFormSubmit,
      submitOnChange: true,
      closeOnSubmit: false
    },
    actions: {
      rollCharacteristic: RTCharacterSheet.#onRollCharacteristic,
      adjustValue: RTCharacterSheet.#onAdjustValue,
      toggleFatigue: RTCharacterSheet.#onToggleFatigue,
      rollD5: RTCharacterSheet.#onRollD5,
      openRollDialog: RTCharacterSheet.#onOpenRollDialog,
      switchTab: RTCharacterSheet.#onSwitchTab,
      togglePsyType: RTCharacterSheet.#onTogglePsyType
    }
  };

  // Currently displayed tabs per group; switched directly via DOM classes (see #onSwitchTab).
  activeTabs = { main: "skills", xp: "characteristics" };

  static PARTS = {
    header: { template: "systems/rogue-trader/templates/actors/character-header.hbs" },
    tabs: { template: "systems/rogue-trader/templates/actors/character-tabs.hbs" },
    skills: { template: "systems/rogue-trader/templates/actors/tab-skills.hbs" },
    combat: { template: "systems/rogue-trader/templates/actors/tab-combat.hbs" },
    psykana: { template: "systems/rogue-trader/templates/actors/tab-psykana.hbs" },
    ship: { template: "systems/rogue-trader/templates/actors/tab-ship.hbs" },
    journal: { template: "systems/rogue-trader/templates/actors/tab-journal.hbs" },
    xp: { template: "systems/rogue-trader/templates/actors/tab-xp.hbs" },
    settings: { template: "systems/rogue-trader/templates/actors/tab-settings.hbs" }
  };

  static async #onFormSubmit(event, form, formData) {
    await this.document.update(formData.object);
  }

  static async #onRollCharacteristic(event, target) {
    const key = target.dataset.key;
    const cfg = CHARACTERISTICS[key];
    if (!cfg) return;
    await showRollDialog({
      target: this.document.system.characteristics?.[key]?.total ?? 0,
      label: game.i18n.localize(cfg.label),
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      // The target is known, so the dialog only asks for the modifier.
      showTarget: false
    });
  }

  static async #onAdjustValue(event, target) {
    const path = target.dataset.path;
    const delta = Number(target.dataset.delta || 0);
    const current = Number(foundry.utils.getProperty(this.document, path) ?? 0);
    await this.document.update({ [path]: Math.max(0, current + delta) });
  }

  static async #onToggleFatigue(event) {
    const current = this.document.system.fatigue?.penalty ?? false;
    await this.document.update({ "system.fatigue.penalty": !current });
  }

  static async #onRollD5(event) {
    const roll = await new Roll("1d5").evaluate();
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      flavor: "1d5",
      rolls: [roll]
    });
  }

  static async #onOpenRollDialog(event) {
    await showRollDialog({
      speaker: ChatMessage.getSpeaker({ actor: this.document })
    });
  }

  static #onSwitchTab(event, target) {
    const group = target.dataset.group || "main";
    const tab = target.dataset.tab;
    this.activeTabs[group] = tab;
    const root = this.element;
    root.querySelectorAll(`.tab[data-group='${group}']`).forEach((section) => {
      section.classList.toggle("active", section.dataset.tab === tab);
    });
    root.querySelectorAll(`.rt-tab-button[data-group='${group}']`).forEach((button) => {
      button.classList.toggle("active", button.dataset.tab === tab);
    });
  }

  static async #onTogglePsyType(event) {
    const current = this.document.system.psykana?.type ?? "psyker";
    await this.document.update({ "system.psykana.type": current === "psyker" ? "navigator" : "psyker" });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.document;
    context.system = this.document.system;
    context.activeTab = this.activeTabs.main;
    context.activeXpTab = this.activeTabs.xp;
    context.characteristics = Object.entries(CHARACTERISTICS).map(([key, cfg]) => {
      const c = this.document.system.characteristics?.[key] ?? {};
      return {
        key,
        label: game.i18n.localize(cfg.label),
        abbr: game.i18n.localize(cfg.abbrKey),
        value: c.value ?? 0,
        advance: c.advance ?? 0,
        reduction: c.reduction ?? 0,
        xp: c.xp ?? 0,
        bonusMod: c.bonusMod ?? 0,
        baseBonus: c.baseBonus ?? 0,
        total: c.total ?? 0,
        bonus: c.bonus ?? 0,
        advanceOptions: ADVANCE_STEPS.map((step) => ({
          value: step,
          selected: (c.advance ?? 0) === step
        }))
      };
    });
    context.edition = game.settings.get(SYSTEM_ID, "edition");
    context.editions = [{ id: "rogue-trader", label: "RT.Editions.RogueTrader" }].map((edition) => ({
      ...edition,
      selected: context.edition === edition.id
    }));
    return context;
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    // The edition list lives in world settings, not in actor data - handle it manually.
    this.element.querySelector(".rt-edition-select")?.addEventListener("change", async (event) => {
      await game.settings.set(SYSTEM_ID, "edition", event.target.value);
    });
  }
}

// Common stub for actor types whose sheets will be implemented later (ship, colony).
class RTStubActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
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
