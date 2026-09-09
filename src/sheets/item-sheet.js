import { ITEM_FIELDS, ITEM_TYPES } from "../config.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { DocumentSheetV2 } = foundry.applications.sheets;

export class RTItemSheet extends HandlebarsApplicationMixin(DocumentSheetV2) {
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

  get title() {
    return this.document.name || super.title;
  }

  static async #onFormSubmit(event, form, formData) {
    await this.document.update(formData.object);
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.document;
    context.item = item;
    context.system = item.system;
    context.typeLabel = game.i18n.localize(ITEM_TYPES[item.type] ?? item.type);
    context.fields = (ITEM_FIELDS[item.type] ?? []).map((field) => ({
      name: `system.${field.path}`,
      label: field.label,
      input: field.input,
      value: foundry.utils.getProperty(item, `system.${field.path}`) ?? ""
    }));
    return context;
  }
}
