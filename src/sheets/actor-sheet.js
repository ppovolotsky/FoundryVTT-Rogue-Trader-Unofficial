import { showRollDialog } from "../dice.js";
import {
  SYSTEM_ID,
  CHARACTERISTICS,
  ADVANCE_STEPS,
  SKILLS,
  SKILL_GROUPS,
  ACQUISITION,
  acquisitionModifier
} from "../config.js";
import { normalizeGroupRows } from "../documents/actor.js";

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
      contentClasses: ["rogue-trader", "sheet", "actor"],
      resizable: true
    },
    position: { width: 780, height: 560 },
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
      togglePsyType: RTCharacterSheet.#onTogglePsyType,
      rollSkill: RTCharacterSheet.#onRollSkill,
      rollGroupSkill: RTCharacterSheet.#onRollGroupSkill,
      addGroupSkill: RTCharacterSheet.#onAddGroupSkill,
      deleteGroupSkill: RTCharacterSheet.#onDeleteGroupSkill,
      moveGroupSkill: RTCharacterSheet.#onMoveGroupSkill,
      toggleGroupEdit: RTCharacterSheet.#onToggleGroupEdit,
      rollAcquisition: RTCharacterSheet.#onRollAcquisition
    }
  };

  // Currently displayed tabs per group; switched directly via DOM classes (see #onSwitchTab).
  activeTabs = { main: "skills", xp: "characteristics" };

  // Group tables currently in row-editing mode (keyed by group key).
  groupEdit = {};

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
    // Form expansion can turn the groupSkills array into an object when row
    // indices have gaps; normalize before persisting.
    const data = foundry.utils.deepClone(formData.object);
    const submitted = data.system?.groupSkills;
    if (submitted !== undefined && !Array.isArray(submitted)) {
      data.system.groupSkills = Object.values(submitted).filter((row) => row && typeof row === "object");
    }
    await this.document.update(data);
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

  static async #onRollSkill(event, target) {
    const def = SKILLS.find((skill) => skill.key === target.dataset.skill);
    if (!def) return;
    const state = this.document.system.skills?.[def.key] ?? {};
    await showRollDialog({
      target: state.total ?? 0,
      label: game.i18n.localize(def.name),
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      showTarget: false
    });
  }

  static async #onRollGroupSkill(event, target) {
    const index = Number(target.dataset.index);
    const row = (this.document.system.groupSkills ?? [])[index];
    if (!row) return;
    const group = SKILL_GROUPS.find((g) => g.key === row.group);
    await showRollDialog({
      target: row.total ?? 0,
      label: `${row.name} (${game.i18n.localize(group?.name ?? "")})`,
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      showTarget: false
    });
  }

  static async #onAddGroupSkill(event, target) {
    const group = SKILL_GROUPS.find((g) => g.key === target.dataset.group);
    if (!group) return;
    const rows = foundry.utils.deepClone(this.document.system.groupSkills ?? []);
    rows.push({
      group: group.key,
      name: "",
      characteristic: group.chars[0],
      asBasic: false,
      trained: false,
      plus10: false,
      plus20: false,
      talent: false,
      modifier: 0,
      xp: 0
    });
    await this.document.update({ "system.groupSkills": rows });
  }

  static async #onDeleteGroupSkill(event, target) {
    const index = Number(target.dataset.index);
    const rows = foundry.utils.deepClone(this.document.system.groupSkills ?? []);
    if (index < 0 || index >= rows.length) return;
    rows.splice(index, 1);
    await this.document.update({ "system.groupSkills": rows });
  }

  static async #onMoveGroupSkill(event, target) {
    const index = Number(target.dataset.index);
    const delta = Number(target.dataset.delta || 0);
    const rows = foundry.utils.deepClone(this.document.system.groupSkills ?? []);
    const next = index + delta;
    if (index < 0 || index >= rows.length || next < 0 || next >= rows.length) return;
    [rows[index], rows[next]] = [rows[next], rows[index]];
    await this.document.update({ "system.groupSkills": rows });
  }

  static #onToggleGroupEdit(event, target) {
    const group = target.dataset.group;
    this.groupEdit[group] = !this.groupEdit[group];
    this.render();
  }

  static async #onRollAcquisition(event) {
    const system = this.document.system;
    await showRollDialog({
      target: system.profitFactor ?? 0,
      modifier: acquisitionModifier(system.acquisition),
      label: game.i18n.localize("RT.Acquisition.Roll"),
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      showTarget: false
    });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.document;
    context.system = this.document.system;
    context.activeTab = this.activeTabs.main;
    context.activeXpTab = this.activeTabs.xp;

    const charAbbr = (key) => game.i18n.localize(CHARACTERISTICS[key]?.abbrKey ?? key);

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

    context.skillsBasic = [];
    context.skillsAdvanced = [];
    for (const def of SKILLS) {
      const state = this.document.system.skills?.[def.key] ?? {};
      const entry = {
        key: def.key,
        name: game.i18n.localize(def.name),
        desc: game.i18n.localize(def.desc),
        charAbbr: charAbbr(def.char),
        trained: state.trained ?? false,
        plus10: state.plus10 ?? false,
        plus20: state.plus20 ?? false,
        talent: state.talent ?? false,
        asBasic: state.asBasic ?? false,
        modifier: state.modifier ?? 0,
        xp: state.xp ?? 0,
        total: state.total ?? 0
      };
      (def.basic ? context.skillsBasic : context.skillsAdvanced).push(entry);
    }

    context.skillGroups = SKILL_GROUPS.map((group) => ({
      key: group.key,
      name: game.i18n.localize(group.name),
      desc: game.i18n.localize(group.desc),
      editing: !!this.groupEdit[group.key],
      chars: group.chars.map((c) => ({ id: c, abbr: charAbbr(c) })),
      rows: normalizeGroupRows(this.document.system.groupSkills)
        .map((row, index) => ({ ...row, index, charAbbr: charAbbr(row.char), total: row.total ?? 0 }))
        .filter((row) => row.group === group.key)
    }));

    context.acquisition = {
      availability: ACQUISITION.availability.map((option) => ({
        ...option,
        selected: this.document.system.acquisition?.availability === option.id
      })),
      scale: ACQUISITION.scale.map((option) => ({
        ...option,
        selected: this.document.system.acquisition?.scale === option.id
      })),
      components: ACQUISITION.components.map((option) => ({
        ...option,
        selected: this.document.system.acquisition?.component === option.id
      })),
      quality: ACQUISITION.quality.map((option) => ({
        ...option,
        selected: this.document.system.acquisition?.quality === option.id
      }))
    };

    return context;
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    // The edition list lives in world settings, not in actor data - handle it manually.
    this.element.querySelector(".rt-edition-select")?.addEventListener("change", async (event) => {
      await game.settings.set(SYSTEM_ID, "edition", event.target.value);
    });
    // Repair actors whose groupSkills were saved as an object by older versions.
    if (this.document.system.groupSkills && !Array.isArray(this.document.system.groupSkills)) {
      this.document
        .update({ "system.groupSkills": foundry.utils.deepClone(this.document.system.groupSkills) })
        .catch(() => {});
    }
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
