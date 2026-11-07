import { SYSTEM_ID } from "./config.js";
import { rollWeaponDamage, weaponHasSpecial } from "./combat.js";

/**
 * Wire chat-card buttons (attack → damage with DoS/aim from message flags).
 */
function bindWeaponDamageButtons(message, root) {
  if (!root?.querySelectorAll) return;
  root.querySelectorAll("[data-rt-action='weapon-damage']").forEach((btn) => {
    if (btn.dataset.rtBound) return;
    btn.dataset.rtBound = "1";
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onChatWeaponDamage(message, btn).catch((err) => {
        console.error("Rogue Trader | chat weapon damage failed", err);
      });
    });
  });
}

export function registerChatListeners() {
  // v13+/v14 HTML Application chat render
  Hooks.on("renderChatMessageHTML", (message, html) => {
    const root = html instanceof HTMLElement ? html : html?.[0] ?? html;
    bindWeaponDamageButtons(message, root);
  });
  // Fallback older signature (jQuery / element)
  Hooks.on("renderChatMessage", (message, html) => {
    const root = html instanceof HTMLElement ? html : html?.[0] ?? html;
    bindWeaponDamageButtons(message, root);
  });
}

async function onChatWeaponDamage(message, button) {
  const flags = message.flags?.[SYSTEM_ID]?.weaponAttack ?? {};
  const actorUuid = button.dataset.actorUuid || flags.actorUuid;
  const itemId = button.dataset.itemId || flags.itemId;
  const degrees = Number(button.dataset.degrees ?? flags.degrees ?? 0);
  const aimId = button.dataset.aimId || flags.aimId || "none";

  const actor = actorUuid
    ? await fromUuid(actorUuid)
    : game.actors.get(message.speaker?.actor);
  if (!actor) {
    ui.notifications.warn(game.i18n.localize("RT.Combat.DamageNoActor"));
    return;
  }
  if (!actor.isOwner && !game.user.isGM) {
    ui.notifications.warn(game.i18n.localize("RT.Combat.DamageNoPermission"));
    return;
  }

  const item = actor.items.get(itemId);
  if (!item || item.type !== "weapon") {
    ui.notifications.warn(game.i18n.localize("RT.Combat.DamageNoWeapon"));
    return;
  }

  const result = await rollWeaponDamage(item, {
    degrees,
    aimId,
    psyRating: Number(actor.system.psykana?.pr) || 0
  });
  if (!result) {
    ui.notifications.error(game.i18n.localize("RT.Combat.DamageFormulaInvalid"));
    return;
  }

  const shocking = weaponHasSpecial(item, "shocking")
    ? game.i18n.localize("RT.Combat.SpecialNote.Shocking")
    : "";
  const content = await foundry.applications.handlebars.renderTemplate(
    "systems/rogue-trader/templates/dice/weapon-damage-card.hbs",
    {
      label: item.name,
      formula: result.formula,
      total: result.total,
      pen: result.pen,
      detail: result.diceDetail,
      shocking
    }
  );
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    flavor: `${item.name} — ${game.i18n.localize("RT.Combat.Damage")}`
  });
}
