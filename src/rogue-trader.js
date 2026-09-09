import { SYSTEM_ID, registerConfig } from "./config.js";
import { registerSettings } from "./settings.js";
import { RTActor } from "./documents/actor.js";
import { RTItem } from "./documents/item.js";
import { RTCharacterSheet, RTShipSheet, RTColonySheet } from "./sheets/actor-sheet.js";
import { RTItemSheet } from "./sheets/item-sheet.js";
import { rollTest, showRollDialog } from "./dice.js";

Hooks.once("init", () => {
  console.log("Rogue Trader (Unofficial) | Initializing system");

  registerConfig();
  registerSettings();

  CONFIG.Actor.documentClass = RTActor;
  CONFIG.Item.documentClass = RTItem;

  Actors.registerSheet(SYSTEM_ID, RTCharacterSheet, {
    types: ["character", "npc"],
    makeDefault: true,
    label: "RT.Sheets.Character"
  });
  Actors.registerSheet(SYSTEM_ID, RTShipSheet, {
    types: ["ship"],
    makeDefault: true,
    label: "RT.Sheets.Ship"
  });
  Actors.registerSheet(SYSTEM_ID, RTColonySheet, {
    types: ["colony"],
    makeDefault: true,
    label: "RT.Sheets.Colony"
  });
  Items.registerSheet(SYSTEM_ID, RTItemSheet, {
    types: ["weapon", "armour", "gear", "ammo"],
    makeDefault: true,
    label: "RT.Sheets.Item"
  });

  loadTemplates([
    "systems/rogue-trader/templates/dialog/roll-dialog.hbs",
    "systems/rogue-trader/templates/dice/roll-card.hbs",
    "systems/rogue-trader/templates/actors/character-sheet.hbs",
    "systems/rogue-trader/templates/actors/stub-sheet.hbs",
    "systems/rogue-trader/templates/items/item-sheet.hbs"
  ]);
});

Hooks.once("ready", () => {
  // Публичный API для макросов: game.rogueTrader.roll({target, modifier, mode}) и game.rogueTrader.rollDialog({...}).
  game.rogueTrader = { roll: rollTest, rollDialog: showRollDialog };
});
