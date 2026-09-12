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

// Fixed skill catalog. Grouped skills (ciphers, lore, languages, trade...)
// are not listed here: they live in per-group tables where the player adds rows.
export const SKILLS = [
  // Basic
  { key: "awareness", name: "RT.Skills.Awareness", desc: "RT.SkillDesc.Awareness", char: "per", basic: true },
  { key: "barter", name: "RT.Skills.Barter", desc: "RT.SkillDesc.Barter", char: "fel", basic: true },
  { key: "carouse", name: "RT.Skills.Carouse", desc: "RT.SkillDesc.Carouse", char: "t", basic: true },
  { key: "charm", name: "RT.Skills.Charm", desc: "RT.SkillDesc.Charm", char: "fel", basic: true },
  { key: "command", name: "RT.Skills.Command", desc: "RT.SkillDesc.Command", char: "fel", basic: true },
  { key: "climb", name: "RT.Skills.Climb", desc: "RT.SkillDesc.Climb", char: "s", basic: true },
  { key: "concealment", name: "RT.Skills.Concealment", desc: "RT.SkillDesc.Concealment", char: "ag", basic: true },
  { key: "disguise", name: "RT.Skills.Disguise", desc: "RT.SkillDesc.Disguise", char: "ag", basic: true },
  { key: "contortionist", name: "RT.Skills.Contortionist", desc: "RT.SkillDesc.Contortionist", char: "ag", basic: true },
  { key: "deceive", name: "RT.Skills.Deceive", desc: "RT.SkillDesc.Deceive", char: "fel", basic: true },
  { key: "dodge", name: "RT.Skills.Dodge", desc: "RT.SkillDesc.Dodge", char: "ag", basic: true },
  { key: "evaluate", name: "RT.Skills.Evaluate", desc: "RT.SkillDesc.Evaluate", char: "int", basic: true },
  { key: "gamble", name: "RT.Skills.Gamble", desc: "RT.SkillDesc.Gamble", char: "int", basic: true },
  { key: "inquiry", name: "RT.Skills.Inquiry", desc: "RT.SkillDesc.Inquiry", char: "fel", basic: true },
  { key: "intimidate", name: "RT.Skills.Intimidate", desc: "RT.SkillDesc.Intimidate", char: "fel", basic: true },
  { key: "logic", name: "RT.Skills.Logic", desc: "RT.SkillDesc.Logic", char: "int", basic: true },
  { key: "scrutiny", name: "RT.Skills.Scrutiny", desc: "RT.SkillDesc.Scrutiny", char: "per", basic: true },
  { key: "search", name: "RT.Skills.Search", desc: "RT.SkillDesc.Search", char: "per", basic: true },
  { key: "silentMove", name: "RT.Skills.SilentMove", desc: "RT.SkillDesc.SilentMove", char: "ag", basic: true },
  { key: "swim", name: "RT.Skills.Swim", desc: "RT.SkillDesc.Swim", char: "s", basic: true },
  // Advanced
  { key: "acrobatics", name: "RT.Skills.Acrobatics", desc: "RT.SkillDesc.Acrobatics", char: "ag", basic: false },
  { key: "gossip", name: "RT.Skills.Gossip", desc: "RT.SkillDesc.Gossip", char: "fel", basic: false },
  { key: "chemUse", name: "RT.Skills.ChemUse", desc: "RT.SkillDesc.ChemUse", char: "int", basic: false },
  { key: "commerce", name: "RT.Skills.Commerce", desc: "RT.SkillDesc.Commerce", char: "fel", basic: false },
  { key: "demolition", name: "RT.Skills.Demolition", desc: "RT.SkillDesc.Demolition", char: "int", basic: false },
  { key: "interrogation", name: "RT.Skills.Interrogation", desc: "RT.SkillDesc.Interrogation", char: "fel", basic: false },
  { key: "invocation", name: "RT.Skills.Invocation", desc: "RT.SkillDesc.Invocation", char: "wp", basic: false },
  { key: "literacy", name: "RT.Skills.Literacy", desc: "RT.SkillDesc.Literacy", char: "int", basic: false },
  { key: "medicae", name: "RT.Skills.Medicae", desc: "RT.SkillDesc.Medicae", char: "int", basic: false },
  { key: "psyniscience", name: "RT.Skills.Psyniscience", desc: "RT.SkillDesc.Psyniscience", char: "wp", basic: false },
  { key: "security", name: "RT.Skills.Security", desc: "RT.SkillDesc.Security", char: "ag", basic: false },
  { key: "shadowing", name: "RT.Skills.Shadowing", desc: "RT.SkillDesc.Shadowing", char: "fel", basic: false },
  { key: "sleightOfHand", name: "RT.Skills.SleightOfHand", desc: "RT.SkillDesc.SleightOfHand", char: "ag", basic: false },
  { key: "survival", name: "RT.Skills.Survival", desc: "RT.SkillDesc.Survival", char: "int", basic: false },
  { key: "techUse", name: "RT.Skills.TechUse", desc: "RT.SkillDesc.TechUse", char: "int", basic: false },
  { key: "tracking", name: "RT.Skills.Tracking", desc: "RT.SkillDesc.Tracking", char: "per", basic: false },
  { key: "animalTraining", name: "RT.Skills.AnimalTraining", desc: "RT.SkillDesc.AnimalTraining", char: "int", basic: false }
];

// Untrained penalties per the core rules.
export const UNTRAINED_PENALTY_BASIC = 10;
export const UNTRAINED_PENALTY_ADVANCED = 20;

// Grouped skills. chars = characteristics the group can be tested with;
// trade and special accept every characteristic (per-sub-skill choice).
export const SKILL_GROUPS = [
  { key: "ciphers", name: "RT.SkillGroups.Ciphers", desc: "RT.SkillGroupDesc.Ciphers", chars: ["int"] },
  { key: "commonLore", name: "RT.SkillGroups.CommonLore", desc: "RT.SkillGroupDesc.CommonLore", chars: ["int"] },
  { key: "drive", name: "RT.SkillGroups.Drive", desc: "RT.SkillGroupDesc.Drive", chars: ["ag"] },
  { key: "pilot", name: "RT.SkillGroups.Pilot", desc: "RT.SkillGroupDesc.Pilot", chars: ["ag"] },
  { key: "forbiddenLore", name: "RT.SkillGroups.ForbiddenLore", desc: "RT.SkillGroupDesc.ForbiddenLore", chars: ["int"] },
  { key: "navigation", name: "RT.SkillGroups.Navigation", desc: "RT.SkillGroupDesc.Navigation", chars: ["int"] },
  { key: "scholasticLore", name: "RT.SkillGroups.ScholasticLore", desc: "RT.SkillGroupDesc.ScholasticLore", chars: ["int"] },
  { key: "secretTongue", name: "RT.SkillGroups.SecretTongue", desc: "RT.SkillGroupDesc.SecretTongue", chars: ["int"] },
  { key: "speakLanguage", name: "RT.SkillGroups.SpeakLanguage", desc: "RT.SkillGroupDesc.SpeakLanguage", chars: ["int"] },
  {
    key: "trade",
    name: "RT.SkillGroups.Trade",
    desc: "RT.SkillGroupDesc.Trade",
    chars: ["ws", "bs", "s", "t", "ag", "int", "per", "wp", "fel"]
  },
  {
    key: "special",
    name: "RT.SkillGroups.Special",
    desc: "RT.SkillGroupDesc.Special",
    chars: ["ws", "bs", "s", "t", "ag", "int", "per", "wp", "fel"]
  }
];

// Acquisition test (Profit Factor): option tables with test modifiers.
export const ACQUISITION = {
  availability: [
    { id: "ubiquitous", mod: 70, label: "RT.Acquisition.Availability.Ubiquitous" },
    { id: "plentiful", mod: 50, label: "RT.Acquisition.Availability.Plentiful" },
    { id: "abundant", mod: 30, label: "RT.Acquisition.Availability.Abundant" },
    { id: "common", mod: 20, label: "RT.Acquisition.Availability.Common" },
    { id: "average", mod: 10, label: "RT.Acquisition.Availability.Average" },
    { id: "scarce", mod: 0, label: "RT.Acquisition.Availability.Scarce" },
    { id: "rare", mod: -10, label: "RT.Acquisition.Availability.Rare" },
    { id: "veryRare", mod: -20, label: "RT.Acquisition.Availability.VeryRare" },
    { id: "extremelyRare", mod: -30, label: "RT.Acquisition.Availability.ExtremelyRare" },
    { id: "almostUnique", mod: -50, label: "RT.Acquisition.Availability.AlmostUnique" },
    { id: "unique", mod: -70, label: "RT.Acquisition.Availability.Unique" }
  ],
  scale: [
    { id: "insignificant", mod: 30, label: "RT.Acquisition.Scale.Insignificant" },
    { id: "minor", mod: 20, label: "RT.Acquisition.Scale.Minor" },
    { id: "small", mod: 10, label: "RT.Acquisition.Scale.Small" },
    { id: "standard", mod: 0, label: "RT.Acquisition.Scale.Standard" },
    { id: "large", mod: -10, label: "RT.Acquisition.Scale.Large" },
    { id: "major", mod: -20, label: "RT.Acquisition.Scale.Major" },
    { id: "heavy", mod: -30, label: "RT.Acquisition.Scale.Heavy" }
  ],
  components: [
    { id: "military", mod: -30, label: "RT.Acquisition.Components.Military" },
    { id: "etheric", mod: -20, label: "RT.Acquisition.Components.Etheric" },
    { id: "power", mod: -10, label: "RT.Acquisition.Components.Power" },
    { id: "structural", mod: 0, label: "RT.Acquisition.Components.Structural" }
  ],
  quality: [
    { id: "poor", mod: 10, label: "RT.Acquisition.Quality.Poor" },
    { id: "standard", mod: 0, label: "RT.Acquisition.Quality.Standard" },
    { id: "good", mod: -10, label: "RT.Acquisition.Quality.Good" },
    { id: "best", mod: -30, label: "RT.Acquisition.Quality.Best" }
  ]
};

// Sum of the currently selected acquisition modifiers. The scale dropdown
// carries both quantity and ship-component options, so check both tables.
export function acquisitionModifier(acquisition) {
  const find = (options, id) => options.find((option) => option.id === id);
  const parts = ACQUISITION;
  let mod = 0;
  mod += find(parts.availability, acquisition?.availability)?.mod ?? 0;
  const scale = find(parts.scale, acquisition?.scale);
  if (scale) mod += scale.mod;
  else mod += find(parts.components, acquisition?.scale)?.mod ?? 0;
  mod += find(parts.quality, acquisition?.quality)?.mod ?? 0;
  return mod;
}

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
