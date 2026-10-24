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
  NAVIGATOR_MUTATION_TABLE_NAME,
  PSY_SOURCES,
  PSY_LEVELS,
  PSYCHIC_PHENOMENA,
  WARP_DANGERS,
  skillHelpText,
  SIZES,
  AIM_OPTIONS,
  RANGE_OPTIONS,
  FIRE_MODES,
  MELEE_ATTACK_TYPES,
  CRAFTSMANSHIP,
  resolveWeaponSpecialDisplay,
  weaponCombatKind,
  weaponClassDef,
  craftsmanshipDef,
  normalizeCraftsmanship
} from "../config.js";
import {
  rangedJamResult,
  rangedHitCount,
  rollWeaponDamage,
  weaponHasSpecial,
  aimMod,
  rangeMod,
  meleeAttackMod
} from "../combat.js";
import { normalizeGroupRows } from "../documents/actor.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { DialogV2 } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
const { ChatMessage, Item } = foundry.documents;
const { Roll } = foundry.dice;

// Auxiliary per-actor lists edited in row blocks (talents/progression on the
// XP tab; lineage benefits, mutations, navigator powers and psyker powers on
// the Psykana tab). The psykana lists live under system.psykana, hence the
// path map.
const AUX_LISTS = ["talents", "progression", "traits", "criticalWounds", "lineageBenefits", "mutations", "powers", "psyPowers"];
const AUX_LIST_PATHS = {
  talents: "talents",
  progression: "progression",
  traits: "traits",
  criticalWounds: "criticalWounds",
  lineageBenefits: "psykana.lineageBenefits",
  mutations: "psykana.mutations",
  powers: "psykana.powers",
  psyPowers: "psykana.psyPowers"
};

// Psyker mode: effective Psy Rating of a power.
// Bound: PR/2 rounded up (+1 if the power's discipline is mastered);
// Unbound: PR; Push N: PR + N. The power's PR modifier and the sustained
// powers penalty apply afterwards (sustaining 2+ powers: -1 per power).
function psyEffectiveRating(system, row) {
  const psy = system.psykana ?? {};
  const pr = Number(psy.pr) || 0;
  const level = row.level ?? "bound";
  let ep;
  if (level === "bound") {
    ep = Math.ceil(pr / 2);
    const disc = Number(row.discipline ?? 0);
    if (psy.disciplinesMastered?.[disc]) ep += 1;
  } else if (level === "unbound") {
    ep = pr;
  } else {
    ep = pr + Number(level.slice(4));
  }
  ep += Number(row.modPr) || 0;
  const sustainedCount = (psy.psyPowers ?? []).filter((p) => p.sustain).length;
  if (sustainedCount >= 2) ep -= sustainedCount;
  return Math.max(0, ep);
}

// The characteristic/skill total the power test rolls against.
function psySourceTotal(system, row) {
  if (row.source === "psyniscience") return system.skills?.psyniscience?.total ?? 0;
  return system.characteristics?.[row.source ?? "wp"]?.total ?? 0;
}

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
    position: { width: 960, height: 600 },
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
      psyRollPhenomena: RTCharacterSheet.#onPsyRollPhenomena,
      psyRollDangers: RTCharacterSheet.#onPsyRollDangers,
      psyRollDangersTable: RTCharacterSheet.#onPsyRollDangersTable,
      toggleDisciplineMastery: RTCharacterSheet.#onToggleDisciplineMastery,
      togglePsySustain: RTCharacterSheet.#onTogglePsySustain,
      applyPsyPower: RTCharacterSheet.#onApplyPsyPower,
      createInventoryItem: RTCharacterSheet.#onCreateInventoryItem,
      editInventoryItem: RTCharacterSheet.#onEditInventoryItem,
      deleteInventoryItem: RTCharacterSheet.#onDeleteInventoryItem,
      toggleItemEquipped: RTCharacterSheet.#onToggleItemEquipped,
      adjustItemQuantity: RTCharacterSheet.#onAdjustItemQuantity,
      rollWeaponAttack: RTCharacterSheet.#onRollWeaponAttack,
      rollWeaponDamage: RTCharacterSheet.#onRollWeaponDamage,
      adjustWeaponClip: RTCharacterSheet.#onAdjustWeaponClip,
      rollScatter: RTCharacterSheet.#onRollScatter,
      rollDamageReceived: RTCharacterSheet.#onRollDamageReceived,
      sendCritWoundHint: RTCharacterSheet.#onSendCritWoundHint,
      testForceField: RTCharacterSheet.#onTestForceField
    }
  };

  // Currently displayed tabs per group; switched directly via DOM classes (see #onSwitchTab).
  activeTabs = { main: "skills", xp: "characteristics" };

  // Group tables currently in row-editing mode (keyed by group key).
  groupEdit = {};

  // Auxiliary lists (talents, progression, psykana lists) in row-editing mode.
  listEdit = {
    talents: false,
    progression: false,
    traits: false,
    criticalWounds: false,
    lineageBenefits: false,
    mutations: false,
    powers: false,
    psyPowers: false
  };

  // Expanded description windows, keyed "list:index" — re-applied after renders.
  expandedRows = {};

  // Per-weapon combat modifiers (aim / fireMode / range / attackType), keyed by item id.
  weaponCombatMods = {};

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
    rows.push(list === "lineageBenefits" || list === "mutations" || list === "traits" || list === "criticalWounds"
      ? { name: "", description: "" }
      : list === "powers"
        ? {
            name: "", source: "per", novice: false, adept: false, master: false,
            mod: 0, activation: "", range: "", damage: "", type: "",
            descNovice: "", descAdept: "", descMaster: ""
          }
        : list === "psyPowers"
          ? {
              name: "", level: "bound", modPr: 0, activation: "", discipline: 0, source: "wp",
              rangeMult: 0, sustain: false, damage: "", damageMult: "none", damageType: "", pen: 0,
              description: ""
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
    // Navigator powers: the description is split by progression level, with
    // the activation time and range shown above it when filled.
    const metaParts = [];
    if (row.activation) metaParts.push(`${localize("RT.Psykana.PowerActivation")}: ${row.activation}`);
    if (row.range) metaParts.push(`${localize("RT.Psykana.PowerRange")}: ${row.range}`);
    const content = await foundry.applications.handlebars.renderTemplate(
      list === "powers"
        ? "systems/rogue-trader/templates/chat/power-card.hbs"
        : "systems/rogue-trader/templates/chat/row-card.hbs",
      list === "powers"
        ? {
            name: row.name,
            meta: metaParts.join(" · "),
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

  // ---------- Psyker mode ----------

  static async #onPsyRollPhenomena(event) {
    const sys = this.document.system;
    const localize = (key) => game.i18n.localize(key);
    const sustainedCount = (sys.psykana?.psyPowers ?? []).filter((p) => p.sustain).length;
    const autoMod = sustainedCount >= 2 ? (sustainedCount - 1) * 10 : 0;
    const label = localize("RT.Psykana.Phenomena");

    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/rogue-trader/templates/dialog/roll-dialog.hbs",
      { label, target: 0, modifier: autoMod, showTarget: false }
    );
    const modifier = await DialogV2.wait({
      window: { title: label },
      content,
      default: "roll",
      buttons: [
        {
          action: "roll",
          label: localize("RT.Dialog.Roll"),
          icon: "fas fa-dice-d100",
          callback: (event, button, dialog) => {
            const data = Object.fromEntries(new FormData(dialog.element.querySelector("form")));
            return Number(data.modifier || 0);
          }
        },
        { action: "cancel", label: localize("RT.Dialog.Cancel"), icon: "fas fa-xmark" }
      ]
    });
    if (typeof modifier !== "number" || Number.isNaN(modifier)) return;

    const raw = await rollRawD100({ mode: sys.settings?.rollMode || null });
    const total = raw.value + autoMod + modifier;
    const entry = PSYCHIC_PHENOMENA.find((p) => total >= p.min && total <= p.max);
    const card = await foundry.applications.handlebars.renderTemplate(
      "systems/rogue-trader/templates/dice/table-card.hbs",
      {
        label,
        mode: raw.mode,
        modeLabel: ROLL_MODES[raw.mode],
        tens: raw.tens,
        units: raw.units,
        value: total,
        name: entry?.name ?? "",
        description: entry?.desc ?? ""
      }
    );
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this.document }), content: card, rolls: [raw.roll] });
  }

  static async #onPsyRollDangers(event) {
    const sys = this.document.system;
    const localize = (key) => game.i18n.localize(key);
    const label = localize("RT.Psykana.Dangers");
    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/rogue-trader/templates/dialog/psy-dangers-dialog.hbs",
      {}
    );
    const sanctioned = await DialogV2.wait({
      window: { title: label },
      content,
      default: "roll",
      buttons: [
        {
          action: "roll",
          label: localize("RT.Dialog.Roll"),
          icon: "fas fa-dice-d100",
          callback: (event, button, dialog) => dialog.element.querySelector("[data-sanctioned]").value
        },
        { action: "cancel", label: localize("RT.Dialog.Cancel"), icon: "fas fa-xmark" }
      ]
    });
    if (sanctioned !== "yes" && sanctioned !== "no") return;

    if (sanctioned === "yes") {
      const roll = await new Roll("3d10").evaluate();
      const dice = roll.dice[0].results.map((r) => r.result);
      const card = await foundry.applications.handlebars.renderTemplate(
        "systems/rogue-trader/templates/dice/psy-dangers-card.hbs",
        { label, dice, note: localize("RT.Psykana.DangersPickCombo") }
      );
      await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this.document }), content: card, rolls: [roll] });
    } else {
      const raw = await rollRawD100({ mode: sys.settings?.rollMode || null });
      const card = await foundry.applications.handlebars.renderTemplate(
        "systems/rogue-trader/templates/dice/psy-dangers-card.hbs",
        {
          label,
          mode: raw.mode,
          modeLabel: ROLL_MODES[raw.mode],
          tens: raw.tens,
          units: raw.units,
          value: raw.value,
          note: localize("RT.Psykana.DangersLookUp")
        }
      );
      await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this.document }), content: card, rolls: [raw.roll] });
    }
  }

  static async #onPsyRollDangersTable(event) {
    const localize = (key) => game.i18n.localize(key);
    // No roll: the player enters the value and the matching table result
    // is shown (e.g. after picking a combination from 3d10).
    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/rogue-trader/templates/dialog/psy-dangers-value-dialog.hbs",
      {}
    );
    const value = await DialogV2.wait({
      window: { title: localize("RT.Psykana.DangersTable") },
      content,
      default: "roll",
      buttons: [
        {
          action: "roll",
          label: localize("RT.Dialog.Roll"),
          icon: "fas fa-dice-d100",
          callback: (event, button, dialog) => Number(dialog.element.querySelector("[data-dangers-value]").value)
        },
        { action: "cancel", label: localize("RT.Dialog.Cancel"), icon: "fas fa-xmark" }
      ]
    });
    if (typeof value !== "number" || Number.isNaN(value)) return;
    const v = Math.min(100, Math.max(1, Math.floor(value)));
    const entry = WARP_DANGERS.find((d) => v >= d.min && v <= d.max);
    const card = await foundry.applications.handlebars.renderTemplate(
      "systems/rogue-trader/templates/dice/table-card.hbs",
      {
        label: localize("RT.Psykana.DangersTableName"),
        mode: null,
        modeLabel: "",
        tens: null,
        units: null,
        value: v,
        name: entry?.name ?? "",
        description: entry?.desc ?? ""
      }
    );
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this.document }), content: card });
  }

  static async #onToggleDisciplineMastery(event, target) {
    const index = Number(target.dataset.index);
    if (!(index >= 0 && index <= 4)) return;
    const arr = [...(this.document.system.psykana?.disciplinesMastered ?? [false, false, false, false, false])];
    arr[index] = !arr[index];
    await this.document.update({ "system.psykana.disciplinesMastered": arr }).catch(() => {});
  }

  static async #onTogglePsySustain(event, target) {
    const rows = RTCharacterSheet.#auxListRows(this.document, "psyPowers");
    const row = rows[Number(target.dataset.index)];
    if (!row) return;
    row.sustain = !row.sustain;
    await this.document.update({ "system.psykana.psyPowers": rows }).catch(() => {});
  }

  static async #onApplyPsyPower(event, target) {
    const rows = RTCharacterSheet.#auxListRows(this.document, "psyPowers");
    const row = rows[Number(target.dataset.index)];
    if (!row) return;
    const sys = this.document.system;
    const localize = (key) => game.i18n.localize(key);

    const raw = await rollRawD100({ mode: sys.settings?.rollMode || null });
    const focusMod = Number(sys.psykana?.focusMod) || 0;
    const targetVal = psySourceTotal(sys, row) + focusMod;
    const value = raw.value;
    const criticalSuccess = value === 1;
    const criticalFailure = value === 100;
    const success = criticalSuccess || (!criticalFailure && value <= targetVal);

    // Doubles on 2d10 (or matching digits on 1d100, 00 included) manifest
    // phenomena for an unbound psyker.
    const doubles = raw.tens !== null
      ? raw.tens === raw.units
      : (value === 100 || Math.floor(value / 10) === value % 10);
    const level = row.level ?? "bound";
    const isPush = level.startsWith("push");

    const labels = [];
    let restrictionFail = false;
    if (level === "bound" && value >= 91) {
      restrictionFail = true;
    } else {
      if (level === "unbound" && doubles) labels.push(localize("RT.Psykana.PhenomenaManifest"));
      if (isPush) labels.push(localize("RT.Psykana.PhenomenaManifest"));
    }

    const ep = psyEffectiveRating(sys, row);
    let damage = null;
    if (!restrictionFail && success) {
      const formula = (row.damage ?? "").trim();
      if (formula) {
        const mult = row.damageMult ?? "none";
        const extra = mult === "none" ? 0 : ep * Number(mult);
        const full = extra > 0 ? `${formula} + ${extra}` : formula;
        try {
          const roll = await new Roll(full).evaluate();
          const detail = extra > 0
            ? `${formula} + ${extra} (${localize("RT.Psykana.EPRShort")} ${ep} × ${mult})`
            : formula;
          damage = { total: roll.total, pen: Number(row.pen) || 0, type: row.damageType ?? "", formula: roll.formula, detail };
        } catch {
          ui.notifications.error(localize("RT.Psykana.DamageFormulaInvalid"));
        }
      }
    }

    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/rogue-trader/templates/dice/psy-power-card.hbs",
      {
        name: row.name || localize("RT.Psykana.PsyPowers"),
        mode: raw.mode,
        modeLabel: ROLL_MODES[raw.mode],
        tens: raw.tens,
        units: raw.units,
        value,
        target: targetVal - focusMod,
        modifier: focusMod,
        success,
        criticalSuccess,
        criticalFailure,
        restrictionFail,
        restrictionText: localize("RT.Psykana.RestrictionFail"),
        damage,
        damageLabel: localize("RT.Psykana.PowerDamage"),
        penLabel: localize("RT.Psykana.Pen"),
        epLabel: localize("RT.Psykana.EPR"),
        ep,
        labels
      }
    );
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this.document }), content, rolls: [raw.roll] });
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

  static async #onRollWeaponAttack(event, target) {
    const item = this.document.items.get(target.dataset.itemId);
    if (!item || item.type !== "weapon") return;
    const localize = (key) => game.i18n.localize(key);
    const isMelee = weaponCombatKind(item) === "melee";
    const mods = this.#weaponModsFor(item.id);
    const aimId = mods.aim || "none";
    const rangeId = mods.range || "normal";
    const fireMode = isMelee ? "single" : (mods.fireMode || "single");
    const attackType = mods.attackType || "standard";
    const craft = craftsmanshipDef(item.system.craftsmanship);

    const charKey = isMelee ? "ws" : "bs";
    const base = Number(this.document.system.characteristics?.[charKey]?.total) || 0;
    let builtIn = craft.testMod;
    builtIn += aimMod(aimId);
    if (isMelee) builtIn += meleeAttackMod(attackType);
    else builtIn += rangeMod(rangeId);
    if (!isMelee && weaponHasSpecial(item, "accurate") && aimId !== "none") builtIn += 10;

    const test = await showRollDialog({
      target: base + builtIn,
      modifier: 0,
      label: item.name,
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      showTarget: false,
      actor: this.document,
      createMessage: false
    });
    if (!test || typeof test !== "object" || test.value === undefined) return;

    const hits = isMelee
      ? (test.success ? 1 : 0)
      : rangedHitCount(item, fireMode, test.degrees, test.success);
    const jamInfo = isMelee
      ? { jam: false, jamKey: "" }
      : rangedJamResult(item, test.value, { criticalSuccess: test.criticalSuccess });
    mods.lastDegrees = test.success ? test.degrees : 0;

    const specialNotes = [];
    if (test.success && weaponHasSpecial(item, "tearing")) specialNotes.push(localize("RT.Combat.SpecialNote.Tearing"));
    if (test.success && weaponHasSpecial(item, "force")) specialNotes.push(localize("RT.Combat.SpecialNote.Force"));
    if (test.success && weaponHasSpecial(item, "shocking")) specialNotes.push(localize("RT.Combat.SpecialNote.Shocking"));
    if (test.success && test.degrees >= 2 && weaponHasSpecial(item, "razorSharp")) {
      specialNotes.push(localize("RT.Combat.SpecialNote.RazorSharp"));
    }
    if (!isMelee && test.success && weaponHasSpecial(item, "accurate") && aimId !== "none" && test.degrees >= 1) {
      specialNotes.push(localize("RT.Combat.SpecialNote.Accurate"));
    }
    if (isMelee && attackType === "swift") specialNotes.push(localize("RT.Combat.MeleeAttack.SwiftNote"));
    if (isMelee && attackType === "lightning") specialNotes.push(localize("RT.Combat.MeleeAttack.LightningNote"));

    const classLabel = localize(weaponClassDef(item.system.class, item.system.range).label);
    const modsSummary = [
      classLabel,
      localize(craft.label),
      `${localize(CHARACTERISTICS[charKey].abbrKey)} ${base}`,
      builtIn ? `${builtIn > 0 ? "+" : ""}${builtIn}` : null,
      localize(AIM_OPTIONS.find((o) => o.id === aimId)?.label || "RT.Combat.Aim.None"),
      isMelee
        ? localize(MELEE_ATTACK_TYPES.find((o) => o.id === attackType)?.label || "RT.Combat.MeleeAttack.Standard")
        : null,
      !isMelee ? localize(RANGE_OPTIONS.find((o) => o.id === rangeId)?.label || "RT.Combat.Range.Normal") : null,
      !isMelee ? localize(FIRE_MODES.find((f) => f.id === fireMode)?.label || "RT.Combat.FireMode.Single") : null
    ].filter(Boolean).join(" · ");

    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/rogue-trader/templates/dice/weapon-attack-card.hbs",
      {
        label: item.name,
        target: test.target,
        modifier: test.modifier ? (test.modifier > 0 ? `+${test.modifier}` : `${test.modifier}`) : "",
        finalTarget: test.finalTarget,
        value: test.value,
        success: test.success,
        criticalSuccess: test.criticalSuccess,
        criticalFailure: test.criticalFailure,
        degrees: test.degrees,
        degreesKey: test.degreesKey,
        hits,
        jam: jamInfo.jam,
        jamKey: jamInfo.jamKey,
        specialNotes: specialNotes.join(" · "),
        modsSummary
      }
    );
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      content,
      rolls: test.roll ? [test.roll] : [],
      flavor: item.name,
      flags: {
        [SYSTEM_ID]: {
          weaponAttack: {
            itemId: item.id,
            degrees: test.degrees,
            success: test.success,
            aimId,
            hits
          }
        }
      }
    });
  }

  static async #onRollWeaponDamage(event, target) {
    const item = this.document.items.get(target.dataset.itemId);
    if (!item || item.type !== "weapon") return;
    const mods = this.#weaponModsFor(item.id);
    const degrees = Number(target.dataset.degrees ?? mods.lastDegrees ?? 0);
    const result = await rollWeaponDamage(item, {
      degrees,
      aimId: mods.aim || "none",
      psyRating: Number(this.document.system.psykana?.pr) || 0
    });
    if (!result) {
      ui.notifications.error(game.i18n.localize("RT.Combat.DamageFormulaInvalid"));
      return;
    }
    const shocking = weaponHasSpecial(item, "shocking")
      ? game.i18n.localize("RT.Combat.SpecialNote.Shocking")
      : "";
    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/rogue-trader/templates/dice/weapon-damage-card.hbs",
      {
        label: item.name,
        formula: result.formula,
        total: result.total,
        pen: result.pen,
        detail: result.diceDetail,
        shocking
      }
    );
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      content,
      flavor: `${item.name} — ${game.i18n.localize("RT.Combat.Damage")}`
    });
  }

  static async #onAdjustWeaponClip(event, target) {
    const item = this.document.items.get(target.dataset.itemId);
    if (!item || item.type !== "weapon") return;
    const delta = Number(target.dataset.delta || 0);
    const max = Number(item.system.clip?.max) || 0;
    const current = Number(item.system.clip?.value) || 0;
    const next = Math.max(0, max > 0 ? Math.min(max, current + delta) : current + delta);
    await item.update({ "system.clip.value": next });
  }

  static async #onTestForceField(event) {
    const ff = this.document.system.forceField ?? {};
    if (!ff.active) {
      ui.notifications.warn(game.i18n.localize("RT.Combat.ForceFieldInactive"));
      return;
    }
    const overload = Number(ff.overload) || 0;
    const rating = Number(ff.rating) || 0;
    const roll = await new Roll("1d100").evaluate();
    const overloaded = roll.total <= overload;
    const craft = craftsmanshipDef(ff.craftsmanship);
    const content = `<div class="rt-roll-card">
      <div class="rt-roll-card__label">${game.i18n.localize("RT.Combat.ForceField")}</div>
      <div class="rt-roll-card__row">${game.i18n.localize("RT.Combat.ForceFieldRating")}: ${rating} · ${game.i18n.localize(craft.label)}</div>
      <div class="rt-roll-card__row">1d100 = ${roll.total} vs ${game.i18n.localize("RT.Combat.ForceFieldOverload")} ${overload}</div>
      <div class="rt-roll-card__result ${overloaded ? "rt-roll-card__result--fail" : "rt-roll-card__result--ok"}">
        ${overloaded ? game.i18n.localize("RT.Combat.ForceFieldOverloaded") : game.i18n.localize("RT.Combat.ForceFieldHolds")}
      </div>
      ${!overloaded ? `<div class="rt-roll-card__row">${game.i18n.localize("RT.Combat.ForceFieldSoak")}: ${rating}</div>` : ""}
    </div>`;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      content,
      rolls: [roll]
    });
  }

  static async #onRollScatter(event) {
    const roll = await new Roll("1d10").evaluate();
    const dir = roll.total;
    const dirs = {
      1: "RT.Combat.ScatterDir.N",
      2: "RT.Combat.ScatterDir.NE",
      3: "RT.Combat.ScatterDir.SE",
      4: "RT.Combat.ScatterDir.S",
      5: "RT.Combat.ScatterDir.SW",
      6: "RT.Combat.ScatterDir.NW",
      7: "RT.Combat.ScatterDir.N",
      8: "RT.Combat.ScatterDir.NE",
      9: "RT.Combat.ScatterDir.SE",
      10: "RT.Combat.ScatterDir.S"
    };
    const content = `<div class="rt-roll-card"><div class="rt-roll-card__label">${game.i18n.localize("RT.Combat.Scatter")}</div><div class="rt-roll-card__row">1d10 = ${dir} → ${game.i18n.localize(dirs[dir] || "RT.Combat.ScatterDir.N")}</div><div class="rt-roll-card__muted">${game.i18n.localize("RT.Combat.ScatterHint")}</div></div>`;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      content,
      rolls: [roll]
    });
  }

  static async #onRollDamageReceived(event) {
    const localize = (key) => game.i18n.localize(key);
    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/rogue-trader/templates/dialog/damage-received-dialog.hbs",
      {}
    );
    const result = await DialogV2.wait({
      window: { title: localize("RT.Combat.DamageReceived") },
      content,
      default: "ok",
      buttons: [
        {
          action: "ok",
          label: localize("RT.Dialog.Roll"),
          icon: "fas fa-heart-pulse",
          callback: (event, button, dialog) => {
            const root = dialog.element;
            return {
              damage: Number(root.querySelector("[name='damage']")?.value || 0),
              pen: Number(root.querySelector("[name='pen']")?.value || 0),
              location: root.querySelector("[name='location']")?.value || "body"
            };
          }
        },
        { action: "cancel", label: localize("RT.Dialog.Cancel"), icon: "fas fa-xmark" }
      ]
    });
    if (!result || typeof result !== "object") return;
    const { damage, pen, location } = result;

    const locKey = {
      head: "RT.Items.Armour.Head",
      body: "RT.Items.Armour.Body",
      leftArm: "RT.Items.Armour.LeftArm",
      rightArm: "RT.Items.Armour.RightArm",
      leftLeg: "RT.Items.Armour.LeftLeg",
      rightLeg: "RT.Items.Armour.RightLeg"
    }[location] || "RT.Items.Armour.Body";

    let armour = 0;
    for (const item of this.document.items) {
      if (item.type !== "armour" || !item.system.equipped) continue;
      armour += Number(item.system.locations?.[location]) || 0;
    }
    const effectiveArmour = Math.max(0, armour - pen);
    const tb = Number(this.document.system.characteristics?.t?.bonus) || 0;
    const wounds = Math.max(0, damage - effectiveArmour - tb);

    const card = await foundry.applications.handlebars.renderTemplate(
      "systems/rogue-trader/templates/dice/damage-received-card.hbs",
      {
        locationLabel: localize(locKey),
        damage,
        pen,
        armour,
        effectiveArmour,
        tb,
        wounds
      }
    );
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      content: card
    });
  }

  static async #onSendCritWoundHint(event) {
    const localize = (key) => game.i18n.localize(key);
    const content = `<div class="rt-roll-card"><div class="rt-roll-card__label">${localize("RT.Combat.CritHint")}</div><div class="rt-roll-card__row">${localize("RT.Combat.CritHintBody")}</div></div>`;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      content
    });
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
            const classLabel = game.i18n.localize(weaponClassDef(item.system.class, item.system.range).label);
            const bits = [classLabel, item.system.damage, item.system.specialText].filter(Boolean);
            summary = bits.join(" · ");
          } else if (item.type === "armour") {
            const loc = item.system.locations ?? {};
            summary = `AP ${loc.body ?? 0}`;
          }
          const description = String(item.system.description ?? "").trim();
          const descriptionShort = description.length > 80 ? `${description.slice(0, 77)}…` : description;
          const unitWeight = Number(item.system.weight) || 0;
          const qty = showQuantity ? Math.max(1, Number(item.system.quantity) || 1) : 1;
          const totalWeight = Math.round(unitWeight * qty * 100) / 100;
          return {
            id: item.id,
            name: item.name,
            img: item.img,
            equipped: !!item.system.equipped,
            quantity: item.system.quantity ?? 0,
            showEquipped,
            showQuantity,
            summary,
            description,
            descriptionShort,
            weightLabel: `${totalWeight}`
          };
        })
      };
    });
  }

  #weaponModsFor(itemId) {
    if (!this.weaponCombatMods[itemId]) {
      this.weaponCombatMods[itemId] = {
        aim: "none",
        fireMode: "single",
        range: "normal",
        attackType: "standard"
      };
    }
    return this.weaponCombatMods[itemId];
  }

  #prepareCombatContext() {
    const size = this.document.system.size || "average";
    const movementMode = this.document.system.movementMode || "normal";
    const level = this.document.system.encumbrance?.level || "normal";
    const encumbranceLevelLabel = {
      normal: "RT.Encumbrance.Normal",
      encumbered: "RT.Encumbrance.Encumbered",
      overloaded: "RT.Encumbrance.Overloaded"
    }[level] || "RT.Encumbrance.Normal";

    const combatArmour = this.document.items
      .filter((i) => i.type === "armour" && i.system.equipped)
      .map((i) => {
        const loc = i.system.locations ?? {};
        return {
          id: i.id,
          name: i.name,
          head: loc.head ?? 0,
          body: loc.body ?? 0,
          leftArm: loc.leftArm ?? 0,
          rightArm: loc.rightArm ?? 0,
          leftLeg: loc.leftLeg ?? 0,
          rightLeg: loc.rightLeg ?? 0
        };
      });

    const mapWeapon = (i, isRanged) => {
      const classDef = weaponClassDef(i.system.class, i.system.range);
      const classId = classDef.id;
      const specials = resolveWeaponSpecialDisplay(i.system.specialQualities, i.system.specialText)
        .map((s) => s.title)
        .join(", ");
      const craft = craftsmanshipDef(i.system.craftsmanship);
      const pen = Number(i.system.penetration) || 0;
      const bits = [
        game.i18n.localize(classDef.label),
        i.system.damage,
        i.system.damageType,
        pen ? `Pen ${pen}` : null,
        game.i18n.localize(craft.label)
      ].filter(Boolean);
      const showClip = isRanged && ["pistol", "basic", "heavy"].includes(classId);
      const mods = this.#weaponModsFor(i.id);
      const description = String(i.system.description ?? "").trim();
      const row = {
        id: i.id,
        name: i.name,
        summary: bits.join(" · "),
        specials,
        classLabel: classDef.label,
        description,
        showClip,
        clipValue: Number(i.system.clip?.value) || 0,
        clipMax: Number(i.system.clip?.max) || 0,
        aimOptions: AIM_OPTIONS.map((o) => ({ ...o, selected: mods.aim === o.id }))
      };
      if (!isRanged) {
        return {
          ...row,
          attackTypes: MELEE_ATTACK_TYPES.map((o) => ({
            ...o,
            selected: mods.attackType === o.id
          }))
        };
      }
      const rof = i.system.rateOfFire ?? {};
      const singleOk = (Number(rof.single) || 0) > 0 || (!rof.burst && !rof.full);
      const semiOk = (Number(rof.burst) || 0) > 0;
      const fullOk = (Number(rof.full) || 0) > 0;
      return {
        ...row,
        rangeOptions: RANGE_OPTIONS.map((o) => ({ ...o, selected: mods.range === o.id })),
        fireModes: FIRE_MODES.map((o) => ({
          ...o,
          selected: mods.fireMode === o.id,
          disabled: o.id === "single" ? !singleOk && (semiOk || fullOk) : o.id === "semi" ? !semiOk : !fullOk
        }))
      };
    };

    const equippedWeapons = this.document.items.filter((i) => i.type === "weapon" && i.system.equipped);
    const combatMelee = equippedWeapons
      .filter((i) => weaponCombatKind(i) === "melee")
      .map((i) => mapWeapon(i, false));
    const combatRanged = equippedWeapons
      .filter((i) => weaponCombatKind(i) === "ranged")
      .map((i) => mapWeapon(i, true));

    const ff = this.document.system.forceField ?? {};
    const ffCraft = normalizeCraftsmanship(ff.craftsmanship);
    return {
      encumbranceLevelLabel,
      sizeOptions: SIZES.map((s) => ({ ...s, selected: size === s.id })),
      movementModes: [
        { id: "normal", label: "RT.Combat.MovementNormal", selected: movementMode === "normal" },
        { id: "flyer", label: "RT.Combat.MovementFlyer", selected: movementMode === "flyer" },
        { id: "custom", label: "RT.Combat.MovementCustom", selected: movementMode === "custom" }
      ],
      combatArmour,
      combatMelee,
      combatRanged,
      forceFieldCraftOptions: CRAFTSMANSHIP.map((c) => ({
        ...c,
        selected: ffCraft === c.id
      }))
    };
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
    Object.assign(context, this.#prepareCombatContext());

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
        desc: skillHelpText(def.name, def.desc),
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
      desc: skillHelpText(group.name, group.desc),
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
    context.traits = normalizeGroupRows(this.document.system.traits)
      .map((row, index) => ({ ...row, index }));
    context.criticalWounds = normalizeGroupRows(this.document.system.criticalWounds)
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

    // Psyker mode header and power list.
    const psy = this.document.system.psykana ?? {};
    const localizeKey = (key) => game.i18n.localize(key);
    const sustainedCount = (psy.psyPowers ?? []).filter((p) => p.sustain).length;
    context.psy = {
      focusMod: psy.focusMod ?? 0,
      pr: psy.pr ?? 0,
      // The counter starts changing from the second sustained power.
      sustained: Math.max(0, sustainedCount - 1),
      disciplines: [0, 1, 2, 3, 4].map((i) => ({
        i,
        n: i + 1,
        name: psy.disciplines?.[i] ?? "",
        mastered: !!psy.disciplinesMastered?.[i]
      }))
    };
    context.psyPowers = normalizeGroupRows(psy.psyPowers).map((row, index) => {
      const ep = psyEffectiveRating(this.document.system, row);
      return {
        ...row,
        index,
        ep,
        rangeTotal: (Number(row.rangeMult) || 0) * ep,
        levels: PSY_LEVELS.map((l) => ({
          id: l.id,
          label: localizeKey(l.label),
          selected: (row.level ?? "bound") === l.id
        })),
        sources: PSY_SOURCES.map((s) => ({
          id: s.id,
          label: localizeKey(s.label),
          selected: (row.source ?? "wp") === s.id
        })),
        disciplineOptions: [0, 1, 2, 3, 4].map((i) => ({
          id: i,
          label: psy.disciplines?.[i] || `${localizeKey("RT.Psykana.Discipline")} (${i + 1})`,
          selected: (Number(row.discipline) || 0) === i
        })),
        damageMults: ["none", "1", "2", "3", "4", "5"].map((m) => ({
          id: m,
          label: m === "none" ? "✗" : `${m}×${localizeKey("RT.Psykana.EPRShort")}`,
          selected: (row.damageMult ?? "none") === m
        }))
      };
    });
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
    // Psyker mode header: focus modifier, Psy Rating, discipline names.
    this.element.addEventListener("change", async (event) => {
      const el = event.target;
      if (el.dataset.psy !== undefined) {
        await this.document.update({
          [`system.psykana.${el.dataset.psy}`]: el.type === "number" ? Number(el.value || 0) : el.value
        }).catch(() => {});
        return;
      }
      if (el.dataset.psydisc !== undefined) {
        const discs = [...(this.document.system.psykana?.disciplines ?? ["", "", "", "", ""])];
        discs[Number(el.dataset.psydisc)] = el.value;
        await this.document.update({ "system.psykana.disciplines": discs }).catch(() => {});
      }
    });
    // Inventory equipped toggles (checkbox is not form-bound to avoid item/actor form races).
    this.element.addEventListener("change", async (event) => {
      const el = event.target;
      if (!el.dataset.equipToggle) return;
      const item = this.document.items.get(el.dataset.itemId);
      if (!item || !["weapon", "armour"].includes(item.type)) return;
      await item.update({ "system.equipped": !!el.checked }).catch(() => {});
    });
    // Combat weapon modifier dropdowns (sheet-local; not persisted).
    this.element.addEventListener("change", (event) => {
      const el = event.target;
      const field = el.dataset.combatMod;
      const itemId = el.dataset.itemId;
      if (!field || !itemId) return;
      const mods = this.#weaponModsFor(itemId);
      mods[field] = el.value;
    });
    // Combat clip value (firearms): direct edit of clip.value.
    this.element.addEventListener("change", async (event) => {
      const el = event.target;
      if (!el.dataset.itemClip) return;
      const item = this.document.items.get(el.dataset.itemId);
      if (!item || item.type !== "weapon") return;
      const max = Number(item.system.clip?.max) || 0;
      let next = Number(el.value) || 0;
      if (max > 0) next = Math.min(max, Math.max(0, next));
      else next = Math.max(0, next);
      await item.update({ "system.clip.value": next }).catch(() => {});
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
