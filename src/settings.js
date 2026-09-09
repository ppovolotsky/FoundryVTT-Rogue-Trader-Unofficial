import { SYSTEM_ID, ROLL_MODES } from "./config.js";

export function registerSettings() {
  game.settings.register(SYSTEM_ID, "defaultRollMode", {
    name: "RT.Settings.DefaultRollMode.Name",
    hint: "RT.Settings.DefaultRollMode.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "1d100",
    choices: ROLL_MODES
  });

  game.settings.register(SYSTEM_ID, "edition", {
    name: "RT.Settings.Edition.Name",
    hint: "RT.Settings.Edition.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "rogue-trader",
    choices: {
      "rogue-trader": "RT.Editions.RogueTrader"
    }
  });
}
