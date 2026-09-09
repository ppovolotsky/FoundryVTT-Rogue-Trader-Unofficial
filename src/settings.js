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

  // Заготовка под будущую функциональность: сейчас ни на что не влияет.
  game.settings.register(SYSTEM_ID, "autoSuccessFail", {
    name: "RT.Settings.AutoSuccessFail.Name",
    hint: "RT.Settings.AutoSuccessFail.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
}
