export const SYSTEM_ID = "rogue-trader";

export const CHARACTERISTICS = {
  bs: { abbrKey: "RT.CharacteristicsAbbr.BS", label: "RT.Characteristics.BS" },
  ws: { abbrKey: "RT.CharacteristicsAbbr.WS", label: "RT.Characteristics.WS" },
  s: { abbrKey: "RT.CharacteristicsAbbr.S", label: "RT.Characteristics.S" },
  t: { abbrKey: "RT.CharacteristicsAbbr.T", label: "RT.Characteristics.T" },
  ag: { abbrKey: "RT.CharacteristicsAbbr.Ag", label: "RT.Characteristics.Ag" },
  int: { abbrKey: "RT.CharacteristicsAbbr.Int", label: "RT.Characteristics.Int" },
  per: { abbrKey: "RT.CharacteristicsAbbr.Per", label: "RT.Characteristics.Per" },
  wp: { abbrKey: "RT.CharacteristicsAbbr.WP", label: "RT.Characteristics.WP" },
  fel: { abbrKey: "RT.CharacteristicsAbbr.Fel", label: "RT.Characteristics.Fel" }
};

// Characteristic advance steps: +0, +5, +10, +15, +20.
export const ADVANCE_STEPS = [0, 5, 10, 15, 20];

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

// Flat fields shown on the item sheet stub; nested ones (rateOfFire, clip, locations, special) come later.
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
