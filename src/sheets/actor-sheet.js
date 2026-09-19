import { showRollDialog, rollRawD100, rollTest } from "../dice.js";
import {
  SYSTEM_ID,
  CHARACTERISTICS,
  ADVANCE_STEPS,
  SKILLS,
  SKILL_GROUPS,
  ACQUISITION,
  acquisitionModifier,
  ROLL_MODES,
  NAVIGATOR_MUTATIONS,
  NAVIGATOR_MUTATION_TABLE_NAME
} from "../config.js";
import { normalizeGroupRows } from "../documents/actor.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
const { ChatMessage, Item } = foundry.documents;
const { Roll } = foundry.dice;

// Auxiliary per-actor lists edited in row blocks (talents/progression on the
// XP tab; lineage benefits and mutations on the Psykana tab). The psykana
// lists live under system.psykana, hence the path map.
const AUX_LISTS = ["talents", "progression", "lineageBenefits", "mutations", "powers"];
const AUX_LIST_PATHS = {
  talents: "talents",
  progression: "progression",
  lineageBenefits: "psykana.lineageBenefits",
  mutations: "psykana.mutations",
  powers: "psykana.powers"
};

// Navigator powers: what the power test rolls against. Psyniscience uses the
// final skill total from the Skills tab (trained marks, +10/+20, talent).
const POWER_SOURCES = [
  { id: "per", abbrKey: "RT.CharacteristicsAbbr.Per" },
  { id: "wp", abbrKey: "RT.CharacteristicsAbbr.WP" },
  { id: "psyniscience", abbrKey: "RT.Psykana.SourcePsyniscience" }
];

function powerTestTotal(system, row) {
  const base = row.source === "psyniscience"
    ? system.skills?.psyniscience?.total ?? 0
    : system.characteristics?.[row.source]?.total ?? 0;
  return base + (row.adept ? 10 : 0) + (row.master ? 10 : 0) + (Number(row.mod) || 0);
}

// The navigator mutation RollTable shipped in the system's Tables compendium.
async function findNavigatorMutationTable() {
  const pack = game.packs.get(`${SYSTEM_ID}.tables`);
  if (!pack) return null;
  try {
    const entry = pack.index.find((i) => i.name === NAVIGATOR_MUTATION_TABLE_NAME);
    return entry ? await pack.getDocument(entry._id) : null;
  } catch {
    return null;
  }
}

const INVENTORY_SECTIONS = [
  { key: "weapons", label: "RT.Inventory.Weapons", type: "weapon", category: "", newName: "RT.Inventory.NewWeapon" },
  { key: "armour", label: "RT.Inventory.Armour", type: "armour", category: "", newName: "RT.Inventory.NewArmour" },
  { key: "gear", label: "RT.Inventory.Gear", type: "gear", category: "gear", newName: "RT.Inventory.NewGear" },
  { key: "cybernetics", label: "RT.Inventory.Cybernetics", type: "gear", category: "cybernetic", newName: "RT.Inventory.NewCybernetic" },
  { key: "ammo", label: "RT.Inventory.Ammo", type: "ammo", category: "", newName: "RT.Inventory.NewAmmo" },
  { key: "weaponMods", label: "RT.Inventory.WeaponMods", type: "gear", category: "weaponMod", newName: "RT.Inventory.NewWeaponMod" }
];

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
    // Allow dropping Items from the sidebar / compendiums onto the sheet.
    dragDrop: [{ dragSelector: ".rt-inventory-row", dropSelector: null }],
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
      rollAcquisition: RTCharacterSheet.#onRollAcquisition,
      addListRow: RTCharacterSheet.#onAddListRow,
      deleteListRow: RTCharacterSheet.#onDeleteListRow,
      moveListRow: RTCharacterSheet.#onMoveListRow,
      toggleListEdit: RTCharacterSheet.#onToggleListEdit,
      toggleRowExpand: RTCharacterSheet.#onToggleRowExpand,
      sendRowToChat: RTCharacterSheet.#onSendRowToChat,
      rollMutationTest: RTCharacterSheet.#onRollMutationTest,
      rollMutationTable: RTCharacterSheet.#onRollMutationTable,
      rollPower: RTCharacterSheet.#onRollPower,
      rollPowerDamage: RTCharacterSheet.#onRollPowerDamage,
      createInventoryItem: RTCharacterSheet.#onCreateInventoryItem,
      editInventoryItem: RTCharacterSheet.#onEditInventoryItem,
      deleteInventoryItem: RTCharacterSheet.#onDeleteInventoryItem,
      toggleItemEquipped: RTCharacterSheet.#onToggleItemEquipped,
      adjustItemQuantity: RTCharacterSheet.#onAdjustItemQuantity
    }
  };

  // Currently displayed tabs per group; switched directly via DOM classes (see #onSwitchTab).
  activeTabs = { main: "skills", xp: "characteristics" };

  // Group tables currently in row-editing mode (keyed by group key).
  groupEdit = {};

  // Auxiliary lists (talents, progression, psykana lists) in row-editing mode.
  listEdit = { talents: false, progression: false, lineageBenefits: false, mutations: false, powers: false };

  // Expanded description windows, keyed "list:index" — re-applied after renders.
  expandedRows = {};

  static PARTS = {
    header: { template: "systems/rogue-trader/templates/actors/character-header.hbs" },
    tabs: { template: "systems/rogue-trader/templates/actors/character-tabs.hbs" },
    skills: { template: "systems/rogue-trader/templates/actors/tab-skills.hbs" },
    combat: { template: "systems/rogue-trader/templates/actors/tab-combat.hbs" },
    inventory: { template: "systems/rogue-trader/templates/actors/tab-inventory.hbs" },
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
    // Disabling free skill tests resets every skill characteristic to the
    // catalog default.
    if (data.system?.settings?.freeSkillChars === false) {
      for (const def of SKILLS) {
        if (data.system?.skills?.[def.key]) data.system.skills[def.key].characteristic = def.char;
      }
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
      actor: this.document,
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
      actor: this.document,
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
      actor: this.document,
      showTarget: false
    });
  }

  static async #onAddGroupSkill(event, target) {
    const group = SKILL_GROUPS.find((g) => g.key === target.dataset.group);
    if (!group) return;
    const rows = normalizeGroupRows(this.document.system.groupSkills);
    rows.push({
      group: group.key,
      name: "",
      characteristic: group.chars[0],
      asBasic: false,
      trained: false,
      plus10: false,
      plus20: false,
      talent: 0,
      modifier: 0,
      xp: 0
    });
    await this.document.update({ "system.groupSkills": rows });
  }

  static async #onDeleteGroupSkill(event, target) {
    const index = Number(target.dataset.index);
    const rows = normalizeGroupRows(this.document.system.groupSkills);
    if (index < 0 || index >= rows.length) return;
    rows.splice(index, 1);
    await this.document.update({ "system.groupSkills": rows });
  }

  static async #onMoveGroupSkill(event, target) {
    const index = Number(target.dataset.index);
    const delta = Number(target.dataset.delta || 0);
    const rows = normalizeGroupRows(this.document.system.groupSkills);
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

  static async #onAddListRow(event, target) {
    const list = target.dataset.list;
    if (!AUX_LISTS.includes(list)) return;
    const rows = RTCharacterSheet.#auxListRows(this.document, list);
    // Psykana lists carry no XP cost field.
    rows.push(list === "lineageBenefits" || list === "mutations"
      ? { name: "", description: "" }
      : list === "powers"
        ? {
            name: "", source: "per", novice: false, adept: false, master: false,
            mod: 0, activation: "", range: "", damage: "", type: "",
            descNovice: "", descAdept: "", descMaster: ""
          }
        : { name: "", description: "", xp: 0 });
    await this.document.update({ [`system.${AUX_LIST_PATHS[list]}`]: rows }).catch(() => {});
  }

  static async #onDeleteListRow(event, target) {
    const list = target.dataset.list;
    if (!AUX_LISTS.includes(list)) return;
    const rows = RTCharacterSheet.#auxListRows(this.document, list);
    const index = Number(target.dataset.index);
    if (index < 0 || index >= rows.length) return;
    rows.splice(index, 1);
    await this.document.update({ [`system.${AUX_LIST_PATHS[list]}`]: rows }).catch(() => {});
  }

  static async #onMoveListRow(event, target) {
    const list = target.dataset.list;
    if (!AUX_LISTS.includes(list)) return;
    const rows = RTCharacterSheet.#auxListRows(this.document, list);
    const index = Number(target.dataset.index);
    const next = index + Number(target.dataset.delta || 0);
    if (index < 0 || index >= rows.length || next < 0 || next >= rows.length) return;
    [rows[index], rows[next]] = [rows[next], rows[index]];
    await this.document.update({ [`system.${AUX_LIST_PATHS[list]}`]: rows }).catch(() => {});
  }

  // Normalized rows of an auxiliary list, addressed by its data-list key.
  static #auxListRows(sheet, list) {
    return normalizeGroupRows(foundry.utils.getProperty(sheet.system, AUX_LIST_PATHS[list]));
  }

  static #onToggleListEdit(event, target) {
    const list = target.dataset.listShell || target.dataset.list;
    if (!list) return;
    this.listEdit[list] = !this.listEdit[list];
    const shell = this.element.querySelector(`[data-list-shell="${list}"]`);
    if (!shell) return;
    shell.classList.toggle("editing");
  }

  static #onToggleRowExpand(event, target) {
    const block = target.closest(".rt-talent-block");
    const shell = target.closest("[data-list-shell]");
    const body = block?.querySelector(".rt-talent-block__body");
    if (!body) return;
    // The sheet re-renders on every change submit (submitOnChange), so the
    // expanded state must survive renders or the body collapses on blur.
    const hidden = body.classList.toggle("rt-hidden");
    const list = shell?.dataset.listShell;
    const index = block.dataset.blockIndex;
    if (list && index !== undefined) {
      if (hidden) delete this.expandedRows[`${list}:${index}`];
      else this.expandedRows[`${list}:${index}`] = true;
    }
  }

  static async #onSendRowToChat(event, target) {
    const shell = target.closest("[data-list-shell]");
    const list = shell?.dataset.listShell;
    if (!AUX_LISTS.includes(list)) return;
    const index = Number(target.dataset.index);
    const row = RTCharacterSheet.#auxListRows(this.document, list)[index];
    if (!row || !row.name) return;
    const localize = (key) => game.i18n.localize(key);
    // Navigator powers: the description is split by progression level.
    const content = await foundry.applications.handlebars.renderTemplate(
      list === "powers"
        ? "systems/rogue-trader/templates/chat/power-card.hbs"
        : "systems/rogue-trader/templates/chat/row-card.hbs",
      list === "powers"
        ? {
            name: row.name,
            levels: [
              { label: localize("RT.Psykana.LevelNovice"), text: row.descNovice ?? "" },
              { label: localize("RT.Psykana.LevelAdept"), text: row.descAdept ?? "" },
              { label: localize("RT.Psykana.LevelMaster"), text: row.descMaster ?? "" }
            ]
          }
        : { name: row.name, description: row.description ?? "" }
    );
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.document }),

      content
    });
  }

  static async #onRollPower(event, target) {
    const row = RTCharacterSheet.#auxListRows(this.document, "powers")[Number(target.dataset.index)];
    if (!row) return;
    await showRollDialog({
      target: powerTestTotal(this.document.system, row),
      label: row.name || game.i18n.localize("RT.Psykana.NavigatorPowers"),
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      actor: this.document,
      showTarget: false
    });
  }

  static async #onRollPowerDamage(event, target) {
    const row = RTCharacterSheet.#auxListRows(this.document, "powers")[Number(target.dataset.index)];
    if (!row) return;
    const formula = (row.damage ?? "").trim();
    if (!formula) return;
    let roll;
    try {
      roll = await new Roll(formula).evaluate();
    } catch {
      ui.notifications.error(game.i18n.localize("RT.Psykana.DamageFormulaInvalid"));
      return;
    }
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      flavor: `${row.name} — ${game.i18n.localize("RT.Psykana.PowerDamage")}`,
      rolls: [roll]
    });
  }

  static async #onRollMutationTest(event) {
    const system = this.document.system;
    await rollTest({
      target: system.characteristics?.t?.total ?? 0,
      modifier: system.psykana?.mutationMod ?? 0,
      mode: system.settings?.rollMode || null,
      label: game.i18n.localize("RT.Psykana.MutationTest"),
      speaker: ChatMessage.getSpeaker({ actor: this.document })
    });
  }

  static async #onRollMutationTable(event) {
    // The roll honors the actor's mode override, otherwise the system default.
    const mode = this.document.system.settings?.rollMode || null;
    const { mode: resolvedMode, roll, tens, units, value } = await rollRawD100({ mode });

    let name = "";
    let description = "";
    // Prefer the compendium table; fall back to the built-in catalog.
    const table = await findNavigatorMutationTable();
    if (table) {
      const [result] = table.results.filter(
        (r) => value >= r.range?.[0] && value <= r.range?.[1]
      );
      if (result) {
        const nameKey = result.getFlag?.(SYSTEM_ID, "mutationName");
        const descKey = result.getFlag?.(SYSTEM_ID, "mutationDesc");
        if (nameKey && game.i18n.has(nameKey)) name = game.i18n.localize(nameKey);
        else name = result.text;
        if (descKey && game.i18n.has(descKey)) description = game.i18n.localize(descKey);
      }
    } else {
      const entry = NAVIGATOR_MUTATIONS.find((m) => value >= m.min && value <= m.max);
      if (entry) {
        name = game.i18n.localize(entry.name);
        description = game.i18n.localize(entry.desc);
      }
    }

    const content = await foundry.applications.handlebars.renderTemplate("systems/rogue-trader/templates/dice/table-card.hbs", {
      label: game.i18n.localize("RT.Psykana.MutationsTableName"),
      mode: resolvedMode,
      modeLabel: ROLL_MODES[resolvedMode],
      tens,
      units,
      value,
      name,
      description
    });
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      content,
      rolls: [roll]
    });
  }

  static async #onRollAcquisition(event) {
    const system = this.document.system;
    // The dropdown modifiers are baked into the base target; the dialog's
    // modifier field stays free for a manual adjustment only.
    const base = (system.profitFactor ?? 0) + acquisitionModifier(system.acquisition);
    await showRollDialog({
      target: base,
      label: game.i18n.localize("RT.Acquisition.Roll"),
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      actor: this.document,
      showTarget: false
    });
  }

  static async #onCreateInventoryItem(event, target) {
    const type = target.dataset.type || "gear";
    const category = target.dataset.category || "";
    const section = INVENTORY_SECTIONS.find(
      (s) => s.type === type && (s.category || "") === category
    );
    const name = game.i18n.localize(section?.newName ?? "RT.Inventory.NewGear");
    const data = { name, type, img: "icons/svg/item-bag.svg" };
    if (type === "gear" && category) data.system = { category };
    await this.document.createEmbeddedDocuments("Item", [data]);
  }

  static async #onEditInventoryItem(event, target) {
    const item = this.document.items.get(target.dataset.itemId);
    item?.sheet?.render(true);
  }

  static async #onDeleteInventoryItem(event, target) {
    const item = this.document.items.get(target.dataset.itemId);
    if (!item) return;
    await item.delete();
  }

  static async #onToggleItemEquipped(event, target) {
    const item = this.document.items.get(target.dataset.itemId);
    if (!item || !["weapon", "armour"].includes(item.type)) return;
    await item.update({ "system.equipped": !item.system.equipped });
  }

  static async #onAdjustItemQuantity(event, target) {
    const item = this.document.items.get(target.dataset.itemId);
    if (!item || !["gear", "ammo"].includes(item.type)) return;
    const delta = Number(target.dataset.delta || 0);
    const current = Number(item.system.quantity ?? 0);
    await item.update({ "system.quantity": Math.max(0, current + delta) });
  }

  #prepareInventorySections() {
    const items = this.document.items.contents.slice().sort((a, b) => a.name.localeCompare(b.name));
    return INVENTORY_SECTIONS.map((section) => {
      const filtered = items.filter((item) => {
        if (item.type !== section.type) return false;
        if (section.type !== "gear") return true;
        const cat = item.system.category || "gear";
        if (section.category === "gear") {
          return !["cybernetic", "weaponMod"].includes(cat);
        }
        return cat === section.category;
      });
      return {
        ...section,
        items: filtered.map((item) => {
          const showEquipped = item.type === "weapon" || item.type === "armour";
          const showQuantity = item.type === "gear" || item.type === "ammo";
          let summary = "";
          if (item.type === "weapon") {
            const bits = [item.system.damage, item.system.specialText].filter(Boolean);
            summary = bits.join(" · ");
          } else if (item.type === "armour") {
            const loc = item.system.locations ?? {};
            summary = `AP ${loc.body ?? 0}`;
          }
          return {
            id: item.id,
            name: item.name,
            img: item.img,
            equipped: !!item.system.equipped,
            quantity: item.system.quantity ?? 0,
            showEquipped,
            showQuantity,
            summary
          };
        })
      };
    });
  }

  /**
   * Accept Item drops from the sidebar / compendiums onto the sheet.
   */
  async _onDrop(event) {
    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    if (!data || data.type !== "Item") {
      return super._onDrop?.(event);
    }
    const item = await Item.implementation.fromDropData(data);
    if (!item) return;
    const keepId = data.uuid?.startsWith("Compendium.") ? false : undefined;
    return this.document.createEmbeddedDocuments("Item", [item.toObject()], { keepId });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.document;
    context.system = this.document.system;
    context.activeTab = this.activeTabs.main;
    context.activeXpTab = this.activeTabs.xp;
    context.inventorySections = this.#prepareInventorySections();

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

    context.freeSkillChars = this.document.system.settings?.freeSkillChars ?? false;
    // The color scheme is not a registered setting in v14: read the applied
    // theme from the body class instead.
    context.skillsBasic = [];
    context.skillsAdvanced = [];
    for (const def of SKILLS) {
      const state = this.document.system.skills?.[def.key] ?? {};
      const currentChar = state.characteristic ?? def.char;
      const allowedChars = context.freeSkillChars
        ? Object.keys(CHARACTERISTICS)
        : [...new Set([currentChar, def.char])];
      const entry = {
        key: def.key,
        name: game.i18n.localize(def.name),
        desc: game.i18n.localize(def.desc),
        charAbbr: charAbbr(currentChar),
        charOptions: allowedChars.map((cKey) => ({
          id: cKey,
          abbr: charAbbr(cKey),
          selected: currentChar === cKey
        })),
        trained: state.trained ?? false,
        plus10: state.plus10 ?? false,
        plus20: state.plus20 ?? false,
        talent: Number(state.talent) || 0,
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

    context.talents = normalizeGroupRows(this.document.system.talents)
      .map((row, index) => ({ ...row, index }));
    context.progression = normalizeGroupRows(this.document.system.progression)
      .map((row, index) => ({ ...row, index }));
    context.lineageBenefits = normalizeGroupRows(this.document.system.psykana?.lineageBenefits)
      .map((row, index) => ({ ...row, index }));
    context.mutations = normalizeGroupRows(this.document.system.psykana?.mutations)
      .map((row, index) => ({ ...row, index }));
    context.powers = normalizeGroupRows(this.document.system.psykana?.powers)
      .map((row, index) => ({
        ...row,
        index,
        total: powerTestTotal(this.document.system, row),
        sources: POWER_SOURCES.map((s) => ({
          id: s.id,
          abbr: game.i18n.localize(s.abbrKey),
          selected: (row.source ?? "per") === s.id
        }))
      }));
    context.listEdit = this.listEdit;

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
        selected: this.document.system.acquisition?.scale === option.id
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

    // Re-apply transient UI state after every (re)render.
    for (const [key, on] of Object.entries(this.expandedRows)) {
      const sep = key.indexOf(":");
      const body = this.element.querySelector(
        `[data-list-shell="${key.slice(0, sep)}"] .rt-talent-block[data-block-index="${key.slice(sep + 1)}"] .rt-talent-block__body`
      );
      body?.classList.toggle("rt-hidden", !on);
    }
    for (const [list, on] of Object.entries(this.listEdit)) {
      this.element.querySelector(`[data-list-shell="${list}"]`)?.classList.toggle("editing", on);
    }

    // The root element is reused between renders: bind the delegated
    // listeners exactly once, or they pile up and freeze the window.
    if (this._rtListenersBound) return;
    this._rtListenersBound = true;

    // The edition list lives in world settings, not in actor data.
    this.element.querySelector(".rt-edition-select")?.addEventListener("change", async (event) => {
      await game.settings.set(SYSTEM_ID, "edition", event.target.value);
    });
    // The edition list lives in world settings, not in actor data.
    this.element.querySelector(".rt-edition-select")?.addEventListener("change", async (event) => {
      await game.settings.set(SYSTEM_ID, "edition", event.target.value);
    });
    // Group skill rows are not form-bound: each field updates its row directly,
    // keeping them safe from form expansion quirks.
    this.element.addEventListener("change", async (event) => {
      const el = event.target;
      const index = el.dataset.gindex;
      const field = el.dataset.gfield;
      if (index === undefined || field === undefined) return;
      const rows = normalizeGroupRows(this.document.system.groupSkills);
      const row = rows[Number(index)];
      if (!row) return;
      row[field] = el.type === "checkbox" ? el.checked : el.type === "number" ? Number(el.value || 0) : el.value;
      await this.document.update({ "system.groupSkills": rows }).catch(() => {});
    });
    // Auxiliary lists (talents, progression, psykana lists) update their rows
    // the same way.
    this.element.addEventListener("change", async (event) => {
      const el = event.target;
      const list = el.dataset.jlist;
      const index = el.dataset.jindex;
      const field = el.dataset.jfield;
      if (!list || index === undefined || field === undefined) return;
      if (!AUX_LISTS.includes(list)) return;
      const rows = RTCharacterSheet.#auxListRows(this.document, list);
      const row = rows[Number(index)];
      if (!row) return;
      row[field] = el.type === "checkbox" ? el.checked : el.type === "number" ? Number(el.value || 0) : el.value;
      await this.document.update({ [`system.${AUX_LIST_PATHS[list]}`]: rows }).catch(() => {});
    });
    // Acquisition controls are not form-bound either (avoids save races).
    this.element.addEventListener("change", async (event) => {
      const el = event.target;
      const field = el.dataset.acq;
      if (!field) return;
      const value = el.type === "number" ? Number(el.value || 0) : el.value;
      const path = field === "profitFactor" ? "system.profitFactor" : `system.acquisition.${field}`;
      await this.document.update({ [path]: value }).catch(() => {});
    });
    // Inventory equipped toggles (checkbox is not form-bound to avoid item/actor form races).
    this.element.addEventListener("change", async (event) => {
      const el = event.target;
      if (!el.dataset.equipToggle) return;
      const item = this.document.items.get(el.dataset.itemId);
      if (!item || !["weapon", "armour"].includes(item.type)) return;
      await item.update({ "system.equipped": !!el.checked }).catch(() => {});
    });
    // Repair actors whose groupSkills were saved as an object by older versions.
    if (this.document.system.groupSkills && !Array.isArray(this.document.system.groupSkills)) {
      this.document
        .update({ "system.groupSkills": normalizeGroupRows(this.document.system.groupSkills) })
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
