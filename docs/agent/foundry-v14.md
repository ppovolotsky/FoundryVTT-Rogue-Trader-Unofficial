# Foundry VTT v14 — APIs this system uses

Scope: only the v14 surface `rogue-trader` actually relies on. Copy these patterns; don't reintroduce pre-v14 globals. Verified against the code in `src/`.

## Namespaces (destructure at module top)

```js
const { HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;
const { ActorSheetV2, ItemSheetV2 } = foundry.applications.sheets;
const { Actors, Items } = foundry.documents.collections;
const { ChatMessage } = foundry.documents;
const { Roll } = foundry.dice;
const { renderTemplate } = foundry.applications.handlebars;
```

Utilities: `foundry.utils.getProperty(doc, path)`, `foundry.utils.setProperty`, `foundry.utils.deepClone`, `foundry.utils.mergeObject`. (Do NOT use bare `mergeObject`/`duplicate`.)

## Sheets (Application V2)

```js
export class RTCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["rogue-trader", "sheet", "actor"],
    window: { title: "RT.Sheets.Character", resizable: true },
    position: { width: 780, height: 560 },
    form: { handler: RTCharacterSheet.#onFormSubmit, submitOnChange: true, closeOnSubmit: false },
    actions: { rollCharacteristic: RTCharacterSheet.#onRollCharacteristic }
  };
  static PARTS = { header: { template: "systems/rogue-trader/templates/actors/character-header.hbs" } };

  static async #onFormSubmit(event, form, formData) { await this.document.update(formData.object); }
  static async #onRollCharacteristic(event, target) { /* target.dataset.* -> params */ }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.system = this.document.system;
    return context;
  }
}
```

- Actions: methods are `static async #name(event, target)`; `target` is the clicked element (`data-action="name"`). `this` is the sheet instance.
- Form submit handler signature: `(event, form, formData)`; `formData.object` is the expanded data. Persist with `this.document.update(...)`.
- Item sheet is identical with `ItemSheetV2` and one `main` PART (see `src/sheets/item-sheet.js`).

## Registration (init hook only)

```js
Hooks.once("init", () => {
  CONFIG.Actor.documentClass = RTActor;
  CONFIG.Item.documentClass = RTItem;
  Actors.registerSheet("rogue-trader", RTCharacterSheet, { types: ["character", "npc"], makeDefault: true, label: "RT.Sheets.Character" });
  Items.registerSheet("rogue-trader", RTItemSheet, { types: ["weapon", "armour", "gear", "ammo"], makeDefault: true, label: "RT.Sheets.Item" });
});
```

## Documents & derived data

```js
export class RTActor extends Actor {
  prepareDerivedData() {
    super.prepareDerivedData();
    // read this.system.*, write derived keys back onto this.system
  }
}
```

- Data schema = `template.json` (classic template). NOT `foundry.abstract.TypeDataModel`.
- Update: `await this.document.update({ "system.wounds.value": n })`.

## Dialog, rolls, chat

```js
const roll = await new Roll("1d100").evaluate();     // roll.total, roll.dice[i].total
const content = await renderTemplate("systems/rogue-trader/templates/dice/roll-card.hbs", data);
await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content, rolls: [roll] });

await DialogV2.wait({
  window: { title: "..." },
  content,
  buttons: [{ action: "roll", label: "...", callback: (event, button, dialog) => {
    const fd = Object.fromEntries(new FormData(dialog.element.querySelector("form")));
  } }]
});
```

## i18n

- `game.i18n.localize("RT.Key")`, `game.i18n.format("RT.Key", { x })`; in hbs `{{localize "RT.Key"}}`. Keys in both `lang/en.json` and `lang/ru.json`.

## Settings

```js
game.settings.register("rogue-trader", "defaultRollMode", { scope: "world", config: true, type: String, default: "1d100", choices: ROLL_MODES });
game.settings.get("rogue-trader", "defaultRollMode");
```

## Do NOT use (pre-v14 / removed)

- Legacy `ActorSheet`, `ItemSheet`, `FormApplication`, `Application` (v1).
- Bare globals `mergeObject`, `duplicate`, `getProperty` — use the `foundry.utils.*` equivalents.
- `foundry.abstract.TypeDataModel` (this system stays on `template.json`).
