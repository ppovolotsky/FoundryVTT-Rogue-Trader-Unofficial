import { ITEM_FIELDS, ITEM_TYPES } from "../config.js";

export class RTItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["rogue-trader", "sheet", "item", "rt-item-sheet"],
      template: "systems/rogue-trader/templates/items/item-sheet.hbs",
      width: 520,
      height: "auto"
    });
  }

  async getData(options) {
    const context = await super.getData(options);
    context.typeLabel = game.i18n.localize(ITEM_TYPES[this.item.type] ?? this.item.type);

    const fields = ITEM_FIELDS[this.item.type] ?? [];
    context.fields = fields.map((field) => ({
      name: `system.${field.path}`,
      label: field.label,
      input: field.input,
      value: foundry.utils.getProperty(this.item, `system.${field.path}`) ?? ""
    }));

    context.enrichedDescription = await TextEditor.enrichHTML(this.item.system.description ?? "", { async: true });
    return context;
  }
}
