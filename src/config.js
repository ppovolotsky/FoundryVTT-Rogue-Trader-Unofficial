export const SYSTEM_ID = "rogue-trader";

export const CHARACTERISTICS = {
  ws: { abbr: "WS", label: "RT.Characteristics.WS" },
  bs: { abbr: "BS", label: "RT.Characteristics.BS" },
  s: { abbr: "S", label: "RT.Characteristics.S" },
  t: { abbr: "T", label: "RT.Characteristics.T" },
  ag: { abbr: "Ag", label: "RT.Characteristics.Ag" },
  int: { abbr: "Int", label: "RT.Characteristics.Int" },
  per: { abbr: "Per", label: "RT.Characteristics.Per" },
  wp: { abbr: "WP", label: "RT.Characteristics.WP" },
  fel: { abbr: "Fel", label: "RT.Characteristics.Fel" }
};

export const ROLL_MODES = {
  "1d100": "RT.Modes.OneD100",
  "2d10": "RT.Modes.TwoD10"
};

export const ACTOR_TYPES = {
  character: "RT.ActorTypes.Character",
  npc: "RT.ActorTypes.Npc",
  ship: "RT.ActorTypes.Ship",
  colony: "RT.ActorTypes.Colony"
};

export const ITEM_TYPES = {
  weapon: "RT.ItemTypes.Weapon",
  armour: "RT.ItemTypes.Armour",
  gear: "RT.ItemTypes.Gear",
  ammo: "RT.ItemTypes.Ammo"
};

// Плоские поля, выводимые на заглушке листа предмета; вложенные (rateOfFire, clip, locations, special) — на следующих этапах.
export const ITEM_FIELDS = {
  weapon: [
    { path: "class", label: "RT.Items.Weapon.Class", input: "text" },
    { path: "weaponType", label: "RT.Items.Weapon.WeaponType", input: "text" },
    { path: "range", label: "RT.Items.Weapon.Range", input: "number" },
    { path: "damage", label: "RT.Items.Weapon.Damage", input: "text" },
    { path: "damageType", label: "RT.Items.Weapon.DamageType", input: "text" },
    { path: "penetration", label: "RT.Items.Weapon.Penetration", input: "number" },
    { path: "reload", label: "RT.Items.Weapon.Reload", input: "text" },
    { path: "craftsmanship", label: "RT.Items.Craftsmanship", input: "text" },
    { path: "availability", label: "RT.Items.Availability", input: "text" },
    { path: "weight", label: "RT.Items.Weight", input: "number" },
    { path: "source", label: "RT.Items.Source", input: "text" }
  ],
  armour: [
    { path: "armourType", label: "RT.Items.Armour.ArmourType", input: "text" },
    { path: "maxAgilityPenalty", label: "RT.Items.Armour.MaxAgilityPenalty", input: "number" },
    { path: "availability", label: "RT.Items.Availability", input: "text" },
    { path: "weight", label: "RT.Items.Weight", input: "number" },
    { path: "source", label: "RT.Items.Source", input: "text" }
  ],
  gear: [
    { path: "quantity", label: "RT.Items.Quantity", input: "number" },
    { path: "availability", label: "RT.Items.Availability", input: "text" },
    { path: "weight", label: "RT.Items.Weight", input: "number" },
    { path: "source", label: "RT.Items.Source", input: "text" }
  ],
  ammo: [
    { path: "weaponType", label: "RT.Items.Weapon.WeaponType", input: "text" },
    { path: "quantity", label: "RT.Items.Quantity", input: "number" },
    { path: "availability", label: "RT.Items.Availability", input: "text" },
    { path: "source", label: "RT.Items.Source", input: "text" }
  ]
};

export function registerConfig() {
  CONFIG.ROGUE_TRADER = {
    SYSTEM_ID,
    characteristics: CHARACTERISTICS,
    rollModes: ROLL_MODES,
    actorTypes: ACTOR_TYPES,
    itemTypes: ITEM_TYPES,
    itemFields: ITEM_FIELDS
  };

  CONFIG.Actor.typeLabels = {
    ...CONFIG.Actor.typeLabels,
    ...ACTOR_TYPES
  };

  CONFIG.Item.typeLabels = {
    ...CONFIG.Item.typeLabels,
    ...ITEM_TYPES
  };
}
