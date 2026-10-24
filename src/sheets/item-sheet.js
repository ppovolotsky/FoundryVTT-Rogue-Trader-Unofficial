import {
  ITEM_FIELDS,
  ITEM_TYPES,
  parseWeaponSpecials,
  resolveWeaponSpecialDisplay,
  normalizeWeaponClass
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
    if (this.document.type === "weapon" && data.system?.specialText !== undefined) {
      const parsed = parseWeaponSpecials(data.system.specialText);
      foundry.utils.setProperty(data, "system.special", parsed.flags);
      foundry.utils.setProperty(data, "system.specialQualities", parsed.qualities);
      foundry.utils.setProperty(data, "system.specialText", parsed.specialText);
    }
    if (this.document.type === "weapon" && data.system?.class !== undefined) {
      data.system.class = normalizeWeaponClass(data.system.class, data.system.range ?? this.document.system.range);
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

    context.fields = (ITEM_FIELDS[item.type] ?? [])
      .filter((field) => {
        if (!field.showFor) return true;
        return weaponClass !== null && field.showFor.includes(weaponClass);
      })
      .map((field) => {
        const raw = foundry.utils.getProperty(item, `system.${field.path}`);
        if (field.input === "select") {
          const value = field.path === "class"
            ? (weaponClass ?? normalizeWeaponClass(raw, item.system.range))
            : String(raw ?? "");
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
