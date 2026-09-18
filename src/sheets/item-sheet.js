import { ITEM_FIELDS, ITEM_TYPES, parseWeaponSpecials, resolveWeaponSpecialDisplay } from "../config.js";

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
    await this.document.update(data);
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.document;
    context.item = item;
    context.system = item.system;
    context.typeLabel = game.i18n.localize(ITEM_TYPES[item.type] ?? item.type);
    context.fields = (ITEM_FIELDS[item.type] ?? []).map((field) => {
      const raw = foundry.utils.getProperty(item, `system.${field.path}`);
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
