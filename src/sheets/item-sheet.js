import {
  ITEM_FIELDS,
  ITEM_TYPES,
  parseWeaponSpecials,
  resolveWeaponSpecialDisplay,
  normalizeWeaponClass,
  normalizeCraftsmanship,
  weaponClassDef,
  WEAPON_CLASSES
} from "../config.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class RTItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["rogue-trader", "sheet", "item", "rt-item-sheet"],
    window: {
      title: "RT.Sheets.Item",
      contentClasses: ["rogue-trader", "sheet", "item"]
    },
    position: { width: 520, height: "auto" },
    form: {
      handler: RTItemSheet.#onFormSubmit,
      submitOnChange: true,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    main: { template: "systems/rogue-trader/templates/items/item-sheet.hbs" }
  };

  static async #onFormSubmit(event, form, formData) {
    const data = foundry.utils.expandObject(formData.object);
    if (this.document.type === "weapon") {
      if (data.system?.specialText !== undefined) {
        const parsed = parseWeaponSpecials(data.system.specialText);
        foundry.utils.setProperty(data, "system.special", parsed.flags);
        foundry.utils.setProperty(data, "system.specialQualities", parsed.qualities);
        foundry.utils.setProperty(data, "system.specialText", parsed.specialText);
      }
      let cls = normalizeWeaponClass(
        data.system?.class ?? this.document.system.class,
        data.system?.range ?? this.document.system.range
      );
      data.system.class = cls;
      data.system.kind = weaponClassDef(cls, data.system?.range ?? this.document.system.range).kind;
      if (data.system?.craftsmanship !== undefined) {
        data.system.craftsmanship = normalizeCraftsmanship(data.system.craftsmanship);
      }
      if (data.system?.exotic !== undefined) data.system.exotic = !!data.system.exotic;
    }
    await this.document.update(data);
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.document;
    context.item = item;
    context.system = item.system;
    context.typeLabel = game.i18n.localize(ITEM_TYPES[item.type] ?? item.type);

    const weaponClass = item.type === "weapon"
      ? normalizeWeaponClass(item.system.class, item.system.range)
      : null;

    if (item.type === "weapon") {
      context.weaponClass = {
        value: weaponClass,
        options: WEAPON_CLASSES.map((c) => ({
          id: c.id,
          label: c.label,
          selected: weaponClass === c.id
        }))
      };
      context.weaponExotic = !!item.system.exotic;
    }

    context.fields = (ITEM_FIELDS[item.type] ?? [])
      .filter((field) => {
        if (!field.showFor) return true;
        return weaponClass !== null && field.showFor.includes(weaponClass);
      })
      .map((field) => {
        const raw = foundry.utils.getProperty(item, `system.${field.path}`);
        if (field.input === "select") {
          let value = String(raw ?? "");
          if (field.path === "craftsmanship") value = normalizeCraftsmanship(raw);
          return {
            name: `system.${field.path}`,
            label: field.label,
            input: "select",
            value,
            options: (field.options ?? []).map((opt) => ({
              id: opt.id,
              label: opt.label,
              selected: value === opt.id
            }))
          };
        }
        return {
          name: `system.${field.path}`,
          label: field.label,
          input: field.input,
          value: field.input === "checkbox" ? !!raw : (raw ?? "")
        };
      });
    context.specialRows = item.type === "weapon"
      ? resolveWeaponSpecialDisplay(item.system.specialQualities, item.system.specialText)
      : [];
    return context;
  }
}
