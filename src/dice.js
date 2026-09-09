import { SYSTEM_ID, ROLL_MODES } from "./config.js";

const { DialogV2 } = foundry.applications.api;
const { renderTemplate } = foundry.applications.handlebars;
const { Roll } = foundry.dice;
const { ChatMessage } = foundry.documents;

// Building the d100 value from two d10: the first die is tens, the second is units.
// A rolled "10" on a d10 reads as 0; the 0+0 combination is 100.
function rollTensAndUnits(rawTens, rawUnits) {
  const tens = rawTens % 10;
  const units = rawUnits % 10;
  const value = tens === 0 && units === 0 ? 100 : tens * 10 + units;
  return { tens, units, value };
}

/**
 * Basic test: success if the roll is less than or equal to the target.
 * Modes: "1d100" - a single percentile die; "2d10" - tens and units from two d10.
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

  // Natural 01 and 100: critical success and critical failure regardless of the target.
  const criticalSuccess = value === 1;
  const criticalFailure = value === 100;
  const success = criticalSuccess || (!criticalFailure && value <= finalTarget);

  // Degrees of success/failure (RT Core): every full ten points of difference
  // between the modified target and the roll equals one degree.
  const difference = Math.max(0, success ? finalTarget - value : value - finalTarget);
  const degrees = Math.floor(difference / 10);

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
    success,
    criticalSuccess,
    criticalFailure,
    degrees,
    degreesKey: success ? "RT.Roll.DegreesOfSuccess" : "RT.Roll.DegreesOfFailure"
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
 * Roll dialog: target and modifier. The roll mode (1d100 / 2d10) comes only
 * from the global system setting; it can only be overridden via the rollTest API.
 */
export async function showRollDialog({
  target = 0,
  modifier = 0,
  label = "",
  speaker = null,
  showTarget = true
} = {}) {
  const mode = game.settings.get(SYSTEM_ID, "defaultRollMode");

  const content = await renderTemplate("systems/rogue-trader/templates/dialog/roll-dialog.hbs", {
    label,
    target: Number(target),
    modifier: Number(modifier),
    showTarget
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
            mode,
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
