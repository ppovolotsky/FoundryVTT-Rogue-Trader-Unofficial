import { SYSTEM_ID, ACTOR_TYPES, registerConfig } from "./config.js";
import { registerSettings } from "./settings.js";
import { RTActor } from "./documents/actor.js";
import { RTItem } from "./documents/item.js";
import { RTCharacterSheet, RTShipSheet, RTColonySheet } from "./sheets/actor-sheet.js";
import { RTItemSheet } from "./sheets/item-sheet.js";
import { rollTest, showRollDialog } from "./dice.js";

const { Actors, Items } = foundry.documents.collections;

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
});

Hooks.once("ready", () => {
  // Public macro API: game.rogueTrader.roll({target, modifier, mode}) and game.rogueTrader.rollDialog({...}).
  game.rogueTrader = { roll: rollTest, rollDialog: showRollDialog };

  // Diagnostics: warn in the console if any actor type has no default sheet.
  for (const type of Object.keys(ACTOR_TYPES)) {
    const registered = CONFIG.Actor.sheetClasses[type] ?? {};
    if (!Object.values(registered).some((entry) => entry.default)) {
      console.warn(`Rogue Trader (Unofficial) | No default sheet registered for actor type "${type}"`);
    }
  }
});
