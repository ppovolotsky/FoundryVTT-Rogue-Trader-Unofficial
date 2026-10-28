import {
  craftsmanshipDef,
  resolveWeaponSpecialDisplay,
  AIM_OPTIONS,
  RANGE_OPTIONS,
  FIRE_MODES,
  MELEE_ATTACK_TYPES
} from "./config.js";

const { Roll } = foundry.dice;

/**
 * Resolve special ids/params from a weapon item.
 */
export function weaponHasSpecial(item, id) {
  const rows = resolveWeaponSpecialDisplay(item.system?.specialQualities, item.system?.specialText);
  return rows.find((s) => s.id === id) || null;
}

export function weaponSpecialParam(item, id) {
  const row = weaponHasSpecial(item, id);
  if (!row) return null;
  const qualities = Array.isArray(item.system?.specialQualities) ? item.system.specialQualities : [];
  const q = qualities.find((x) => x.id === id);
  return q?.param ?? null;
}

/**
 * Jam / overheat check after a ranged attack roll (RT + Best craftsmanship).
 * Best quality: ignore Unreliable; jam only on natural 100.
 */
export function rangedJamResult(item, rollValue, { criticalSuccess = false } = {}) {
  if (criticalSuccess) return { jam: false, jamKey: "" };
  const craft = craftsmanshipDef(item.system?.craftsmanship);
  const flags = item.system?.special ?? {};
  const has = (id) => !!weaponHasSpecial(item, id) || !!flags[id];
  const isBest = craft.id === "best";

  if (has("overheats") && rollValue >= 91) {
    return { jam: true, jamKey: "RT.Combat.Overheat" };
  }
  if (isBest) {
    if (rollValue === 100) return { jam: true, jamKey: "RT.Combat.Jam" };
    return { jam: false, jamKey: "" };
  }
  if (has("unreliable") && rollValue >= 94) {
    return { jam: true, jamKey: "RT.Combat.Jam" };
  }
  if (has("reliable")) {
    if (rollValue === 100) return { jam: true, jamKey: "RT.Combat.Jam" };
    return { jam: false, jamKey: "" };
  }
  if (rollValue >= 96) return { jam: true, jamKey: "RT.Combat.Jam" };
  return { jam: false, jamKey: "" };
}

/**
 * Hits from RoF / DoS (RT Core). Semi: 1 + floor(DoS/2). Full/Suppressing: 1 + DoS.
 * Storm doubles (capped).
 */
export function rangedHitCount(item, fireMode, degrees, success) {
  if (!success) return 0;
  const def = FIRE_MODES.find((o) => o.id === fireMode) ?? FIRE_MODES[0];
  const rule = def.hitRule || fireMode;
  const rof = item.system?.rateOfFire ?? {};
  let hits = 1;
  if (rule === "semi") {
    const maxHits = Math.max(1, Number(rof.burst) || 1);
    hits = Math.min(maxHits, 1 + Math.floor(degrees / 2));
  } else if (rule === "full") {
    const maxHits = Math.max(1, Number(rof.full) || 1);
    hits = Math.min(maxHits, 1 + degrees);
  }
  if (weaponHasSpecial(item, "storm") && hits > 0 && (rule === "semi" || rule === "full")) {
    const cap = rule === "semi" ? Number(rof.burst) || hits : Number(rof.full) || hits;
    hits = Math.min(hits * 2, Math.max(cap, hits) * 2);
  }
  return hits;
}

export function rangedAttackMod(fireModeId) {
  return FIRE_MODES.find((o) => o.id === fireModeId)?.mod ?? 0;
}

/**
 * Parse a simple damage formula like "1d10+3" or "2d10".
 * Returns { dice: n, faces: 10, flat }.
 */
export function parseDamageFormula(raw) {
  const text = String(raw ?? "").trim().toLowerCase().replace(/\s+/g, "");
  const m = text.match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (!m) return null;
  return {
    dice: Number(m[1] || 1),
    faces: Number(m[2]),
    flat: Number(m[3] || 0)
  };
}

/**
 * Roll one damage die with Proven (min face) and Vengeful/RF threshold.
 * RT Righteous Fury: on threshold face, confirm with 1d10; on 10 (or >= threshold for Vengeful confirm — use 10 for RT confirm), add another die.
 * Simplified RT: RF triggers on natural 10 (or Vengeful X); confirm roll 1d10, success on 10 (RT Core).
 */
async function rollDamageDie(faces, { proven = null, vengeful = null } = {}) {
  const threshold = vengeful != null && Number.isFinite(Number(vengeful)) ? Number(vengeful) : 10;
  let total = 0;
  let notes = [];
  let pending = 1;
  let safety = 20;
  while (pending > 0 && safety-- > 0) {
    pending -= 1;
    const roll = await new Roll(`1d${faces}`).evaluate();
    let face = roll.total;
    if (proven != null && Number.isFinite(Number(proven)) && face < Number(proven)) {
      face = Number(proven);
      notes.push(`Proven(${proven})`);
    }
    total += face;
    if (face >= threshold) {
      const confirm = await new Roll("1d10").evaluate();
      if (confirm.total === 10) {
        notes.push("RF");
        pending += 1;
      }
    }
  }
  return { total, notes };
}

/**
 * Roll weapon damage with Tearing / Proven / Vengeful / RF (RT).
 * Returns { total, pen, detail, rolls }.
 */
export async function rollWeaponDamage(item, { degrees = 0, aimId = "none", psyRating = 0 } = {}) {
  const parsed = parseDamageFormula(item.system?.damage);
  if (!parsed) return null;

  let diceCount = parsed.dice;
  const accurate = weaponHasSpecial(item, "accurate");
  const isBasic = normalizeClassIsBasic(item);
  if (accurate && aimId !== "none" && isBasic && degrees >= 2) {
    const extra = Math.min(2, Math.floor(degrees / 2));
    diceCount += extra;
  }

  const tearing = !!weaponHasSpecial(item, "tearing");
  const proven = weaponSpecialParam(item, "proven");
  const vengeful = weaponSpecialParam(item, "vengeful");
  const dieOpts = { proven, vengeful };

  let sum = 0;
  const detail = [];
  for (let i = 0; i < diceCount; i++) {
    if (tearing) {
      const a = await rollDamageDie(parsed.faces, dieOpts);
      const b = await rollDamageDie(parsed.faces, dieOpts);
      const keep = a.total >= b.total ? a : b;
      sum += keep.total;
      detail.push(`Tearing ${a.total}/${b.total}→${keep.total}${keep.notes.length ? ` [${keep.notes.join(",")}]` : ""}`);
    } else {
      const d = await rollDamageDie(parsed.faces, dieOpts);
      sum += d.total;
      detail.push(`${d.total}${d.notes.length ? ` [${d.notes.join(",")}]` : ""}`);
    }
  }

  let flat = parsed.flat;
  let pen = Number(item.system?.penetration) || 0;
  if (weaponHasSpecial(item, "razorSharp") && degrees >= 2) pen *= 2;
  if (weaponHasSpecial(item, "force") && psyRating > 0) {
    flat += psyRating;
    pen += psyRating;
    detail.push(`Force +${psyRating}`);
  }

  return {
    total: sum + flat,
    pen,
    flat,
    diceDetail: detail.join(", "),
    formula: item.system.damage
  };
}

function normalizeClassIsBasic(item) {
  const c = String(item.system?.class ?? "").toLowerCase();
  return c === "basic";
}

export function aimMod(aimId) {
  return AIM_OPTIONS.find((o) => o.id === aimId)?.mod ?? 0;
}

export function rangeMod(rangeId) {
  return RANGE_OPTIONS.find((o) => o.id === rangeId)?.mod ?? 0;
}

export function meleeAttackMod(attackId) {
  return MELEE_ATTACK_TYPES.find((o) => o.id === attackId)?.mod ?? 0;
}

export function meleeAttackCount(attackId) {
  return MELEE_ATTACK_TYPES.find((o) => o.id === attackId)?.attacks ?? 1;
}

export { AIM_OPTIONS, RANGE_OPTIONS, FIRE_MODES, MELEE_ATTACK_TYPES };
