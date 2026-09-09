import { SYSTEM_ID, ROLL_MODES } from "./config.js";

// Формирование значения стогранника из двух d10: первый куб — десятки, второй — единицы.
// Выпавшая «10» на d10 читается как 0; комбинация 0+0 — это 100.
function rollTensAndUnits(rawTens, rawUnits) {
  const tens = rawTens % 10;
  const units = rawUnits % 10;
  const value = tens === 0 && units === 0 ? 100 : tens * 10 + units;
  return { tens, units, value };
}

/**
 * Базовый тест: успех, если результат броска меньше или равен цели.
 * Режимы: "1d100" — обычный стогранник; "2d10" — десятки и единицы двумя d10.
 */
export async function rollTest({
  target = 0,
  modifier = 0,
  mode = null,
  label = "",
  speaker = null,
  createMessage = true
} = {}) {
  if (!mode) mode = game.settings.get(SYSTEM_ID, "defaultRollMode");
  if (!Object.keys(ROLL_MODES).includes(mode)) mode = "1d100";

  const finalTarget = Number(target) + Number(modifier || 0);

  let roll;
  let tens = null;
  let units = null;
  let value = 0;

  if (mode === "2d10") {
    roll = await new Roll("1d10 + 1d10").evaluate();
    ({ tens, units, value } = rollTensAndUnits(roll.dice[0].total, roll.dice[1].total));
  } else {
    roll = await new Roll("1d100").evaluate();
    value = roll.total;
  }

  const test = {
    label,
    mode,
    modeLabel: ROLL_MODES[mode],
    target: Number(target),
    modifier: Number(modifier || 0),
    finalTarget,
    tens,
    units,
    value,
    success: value <= finalTarget
  };

  if (createMessage) {
    const content = await renderTemplate("systems/rogue-trader/templates/dice/roll-card.hbs", test);
    await ChatMessage.create({
      speaker: speaker ?? ChatMessage.getSpeaker(),
      content,
      rolls: [roll],
      flags: { [SYSTEM_ID]: { test } }
    });
  }

  return test;
}

/**
 * Диалог броска: цель, модификатор и переключение режима 1d100 / 2d10.
 * По умолчанию режим берётся из настроек системы.
 */
export async function showRollDialog({
  target = 0,
  modifier = 0,
  mode = null,
  label = "",
  speaker = null
} = {}) {
  if (!mode) mode = game.settings.get(SYSTEM_ID, "defaultRollMode");

  const content = await renderTemplate("systems/rogue-trader/templates/dialog/roll-dialog.hbs", {
    label,
    target: Number(target),
    modifier: Number(modifier),
    mode
  });

  return DialogV2.wait({
    window: { title: label || game.i18n.localize("RT.Dialog.Title") },
    content,
    default: "roll",
    buttons: [
      {
        action: "roll",
        label: game.i18n.localize("RT.Dialog.Roll"),
        icon: "fas fa-dice-d100",
        callback: async (event, button, dialog) => {
          const data = Object.fromEntries(new FormData(dialog.element.querySelector("form")));
          return rollTest({
            target: Number(data.target || 0),
            modifier: Number(data.modifier || 0),
            mode: data.mode,
            label,
            speaker
          });
        }
      },
      {
        action: "cancel",
        label: game.i18n.localize("RT.Dialog.Cancel"),
        icon: "fas fa-xmark"
      }
    ]
  });
}
