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

// Navigator mutations (The Navis Primer): d100 ranges map onto the
// "Мутации навигатора" table. The same table ships in the Tables
// compendium; result documents carry the mutationKey flag.
export const NAVIGATOR_MUTATIONS = [
  { key: "weirdLimbs", min: 1, max: 15, name: "RT.Psykana.Mutations.WeirdLimbs.Name", desc: "RT.Psykana.Mutations.WeirdLimbs.Desc" },
  { key: "stretchedForm", min: 16, max: 30, name: "RT.Psykana.Mutations.StretchedForm.Name", desc: "RT.Psykana.Mutations.StretchedForm.Desc" },
  { key: "paleFlesh", min: 31, max: 45, name: "RT.Psykana.Mutations.PaleFlesh.Name", desc: "RT.Psykana.Mutations.PaleFlesh.Desc" },
  { key: "voidEyes", min: 46, max: 55, name: "RT.Psykana.Mutations.VoidEyes.Name", desc: "RT.Psykana.Mutations.VoidEyes.Desc" },
  { key: "witheredFrame", min: 56, max: 60, name: "RT.Psykana.Mutations.WitheredFrame.Name", desc: "RT.Psykana.Mutations.WitheredFrame.Desc" },
  { key: "bloatedFrame", min: 61, max: 65, name: "RT.Psykana.Mutations.BloatedFrame.Name", desc: "RT.Psykana.Mutations.BloatedFrame.Desc" },
  { key: "webbedDevelopment", min: 66, max: 70, name: "RT.Psykana.Mutations.WebbedDevelopment.Name", desc: "RT.Psykana.Mutations.WebbedDevelopment.Desc" },
  { key: "inhumanFace", min: 71, max: 75, name: "RT.Psykana.Mutations.InhumanFace.Name", desc: "RT.Psykana.Mutations.InhumanFace.Desc" },
  { key: "clawedFingers", min: 76, max: 80, name: "RT.Psykana.Mutations.ClawedFingers.Name", desc: "RT.Psykana.Mutations.ClawedFingers.Desc" },
  { key: "needleTeeth", min: 81, max: 85, name: "RT.Psykana.Mutations.NeedleTeeth.Name", desc: "RT.Psykana.Mutations.NeedleTeeth.Desc" },
  { key: "eerieGrace", min: 86, max: 90, name: "RT.Psykana.Mutations.EerieGrace.Name", desc: "RT.Psykana.Mutations.EerieGrace.Desc" },
  { key: "strangeVitality", min: 91, max: 95, name: "RT.Psykana.Mutations.StrangeVitality.Name", desc: "RT.Psykana.Mutations.StrangeVitality.Desc" },
  { key: "unnaturalPresence", min: 96, max: 100, name: "RT.Psykana.Mutations.UnnaturalPresence.Name", desc: "RT.Psykana.Mutations.UnnaturalPresence.Desc" }
];

export const NAVIGATOR_MUTATION_TABLE_NAME = "Мутации навигатора";

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

// Fields shown on the item sheet (nested paths use dotted system.* keys).
export const ITEM_FIELDS = {
  weapon: [
    { path: "class", label: "RT.Items.Weapon.Class", input: "text" },
    { path: "weaponType", label: "RT.Items.Weapon.WeaponType", input: "text" },
    { path: "range", label: "RT.Items.Weapon.Range", input: "number" },
    { path: "damage", label: "RT.Items.Weapon.Damage", input: "text" },
    { path: "damageType", label: "RT.Items.Weapon.DamageType", input: "text" },
    { path: "penetration", label: "RT.Items.Weapon.Penetration", input: "number" },
    { path: "rateOfFire.single", label: "RT.Items.Weapon.RoFSingle", input: "number" },
    { path: "rateOfFire.burst", label: "RT.Items.Weapon.RoFBurst", input: "number" },
    { path: "rateOfFire.full", label: "RT.Items.Weapon.RoFFull", input: "number" },
    { path: "clip.value", label: "RT.Items.Weapon.ClipValue", input: "number" },
    { path: "clip.max", label: "RT.Items.Weapon.ClipMax", input: "number" },
    { path: "reload", label: "RT.Items.Weapon.Reload", input: "text" },
    { path: "special.tearing", label: "RT.Items.Weapon.Special.Tearing", input: "checkbox" },
    { path: "special.accurate", label: "RT.Items.Weapon.Special.Accurate", input: "checkbox" },
    { path: "special.reliable", label: "RT.Items.Weapon.Special.Reliable", input: "checkbox" },
    { path: "special.unreliable", label: "RT.Items.Weapon.Special.Unreliable", input: "checkbox" },
    { path: "specialText", label: "RT.Items.Weapon.SpecialText", input: "text" },
    { path: "craftsmanship", label: "RT.Items.Craftsmanship", input: "text" },
    { path: "equipped", label: "RT.Items.Equipped", input: "checkbox" },
    { path: "availability", label: "RT.Items.Availability", input: "text" },
    { path: "weight", label: "RT.Items.Weight", input: "number" },
    { path: "cost", label: "RT.Items.Cost", input: "text" },
    { path: "source", label: "RT.Items.Source", input: "text" }
  ],
  armour: [
    { path: "armourType", label: "RT.Items.Armour.ArmourType", input: "text" },
    { path: "locations.head", label: "RT.Items.Armour.Head", input: "number" },
    { path: "locations.body", label: "RT.Items.Armour.Body", input: "number" },
    { path: "locations.leftArm", label: "RT.Items.Armour.LeftArm", input: "number" },
    { path: "locations.rightArm", label: "RT.Items.Armour.RightArm", input: "number" },
    { path: "locations.leftLeg", label: "RT.Items.Armour.LeftLeg", input: "number" },
    { path: "locations.rightLeg", label: "RT.Items.Armour.RightLeg", input: "number" },
    { path: "maxAgilityPenalty", label: "RT.Items.Armour.MaxAgilityPenalty", input: "number" },
    { path: "equipped", label: "RT.Items.Equipped", input: "checkbox" },
    { path: "availability", label: "RT.Items.Availability", input: "text" },
    { path: "weight", label: "RT.Items.Weight", input: "number" },
    { path: "cost", label: "RT.Items.Cost", input: "text" },
    { path: "source", label: "RT.Items.Source", input: "text" }
  ],
  gear: [
    { path: "category", label: "RT.Items.Category", input: "text" },
    { path: "usedFor", label: "RT.Items.UsedFor", input: "text" },
    { path: "quantity", label: "RT.Items.Quantity", input: "number" },
    { path: "availability", label: "RT.Items.Availability", input: "text" },
    { path: "weight", label: "RT.Items.Weight", input: "number" },
    { path: "cost", label: "RT.Items.Cost", input: "text" },
    { path: "source", label: "RT.Items.Source", input: "text" }
  ],
  ammo: [
    { path: "weaponType", label: "RT.Items.Weapon.WeaponType", input: "text" },
    { path: "usedFor", label: "RT.Items.UsedFor", input: "text" },
    { path: "quantity", label: "RT.Items.Quantity", input: "number" },
    { path: "availability", label: "RT.Items.Availability", input: "text" },
    { path: "weight", label: "RT.Items.Weight", input: "number" },
    { path: "cost", label: "RT.Items.Cost", input: "text" },
    { path: "source", label: "RT.Items.Source", input: "text" }
  ]
};

/** Gear category values used by inventory grouping and pack drafts. */
export const GEAR_CATEGORIES = {
  gear: "RT.Inventory.Categories.Gear",
  cybernetic: "RT.Inventory.Categories.Cybernetic",
  weaponMod: "RT.Inventory.Categories.WeaponMod",
  consumable: "RT.Inventory.Categories.Consumable",
  tool: "RT.Inventory.Categories.Tool"
};

/**
 * Weapon special quality catalog (labels + summary i18n keys — no rulebook prose).
 * `param` qualities accept a numeric X (Blast (2), Felling (1), …).
 * Boolean flags in system.special sync for tearing/accurate/reliable/unreliable.
 */
export const WEAPON_SPECIALS = [
  { id: "accurate", label: "Accurate", param: false, flag: "accurate", summaryKey: "RT.WeaponSpecials.Accurate.Summary" },
  { id: "balanced", label: "Balanced", param: false, summaryKey: "RT.WeaponSpecials.Balanced.Summary" },
  { id: "blast", label: "Blast", param: true, summaryKey: "RT.WeaponSpecials.Blast.Summary" },
  { id: "cleansingFire", label: "Cleansing Fire", param: false, summaryKey: "RT.WeaponSpecials.CleansingFire.Summary" },
  { id: "concussive", label: "Concussive", param: false, summaryKey: "RT.WeaponSpecials.Concussive.Summary" },
  { id: "corrosive", label: "Corrosive", param: false, summaryKey: "RT.WeaponSpecials.Corrosive.Summary" },
  { id: "customized", label: "Customized", param: false, summaryKey: "RT.WeaponSpecials.Customized.Summary" },
  { id: "crippling", label: "Crippling", param: true, summaryKey: "RT.WeaponSpecials.Crippling.Summary" },
  { id: "daemonbane", label: "Daemonbane", param: false, summaryKey: "RT.WeaponSpecials.Daemonbane.Summary" },
  { id: "deadlySnare", label: "Deadly Snare", param: false, summaryKey: "RT.WeaponSpecials.DeadlySnare.Summary" },
  { id: "decay", label: "Decay", param: true, summaryKey: "RT.WeaponSpecials.Decay.Summary" },
  { id: "defensive", label: "Defensive", param: false, summaryKey: "RT.WeaponSpecials.Defensive.Summary" },
  { id: "devastating", label: "Devastating", param: true, summaryKey: "RT.WeaponSpecials.Devastating.Summary" },
  { id: "disintegrate", label: "Disintegrate", param: false, summaryKey: "RT.WeaponSpecials.Disintegrate.Summary" },
  { id: "excruciating", label: "Excruciating", param: false, summaryKey: "RT.WeaponSpecials.Excruciating.Summary" },
  { id: "fast", label: "Fast", param: false, summaryKey: "RT.WeaponSpecials.Fast.Summary" },
  { id: "felling", label: "Felling", param: true, summaryKey: "RT.WeaponSpecials.Felling.Summary" },
  { id: "flame", label: "Flame", param: false, summaryKey: "RT.WeaponSpecials.Flame.Summary" },
  { id: "flexible", label: "Flexible", param: false, summaryKey: "RT.WeaponSpecials.Flexible.Summary" },
  { id: "force", label: "Force", param: false, summaryKey: "RT.WeaponSpecials.Force.Summary" },
  { id: "gauss", label: "Gauss", param: false, summaryKey: "RT.WeaponSpecials.Gauss.Summary" },
  { id: "graviton", label: "Graviton", param: false, summaryKey: "RT.WeaponSpecials.Graviton.Summary" },
  { id: "gyroStabilised", label: "Gyro-Stabilised", param: false, summaryKey: "RT.WeaponSpecials.GyroStabilised.Summary" },
  { id: "hallucinogenic", label: "Hallucinogenic", param: true, summaryKey: "RT.WeaponSpecials.Hallucinogenic.Summary" },
  { id: "haywire", label: "Haywire", param: true, summaryKey: "RT.WeaponSpecials.Haywire.Summary" },
  { id: "inaccurate", label: "Inaccurate", param: false, summaryKey: "RT.WeaponSpecials.Inaccurate.Summary" },
  { id: "indirect", label: "Indirect", param: true, summaryKey: "RT.WeaponSpecials.Indirect.Summary" },
  { id: "integrated", label: "Integrated", param: false, summaryKey: "RT.WeaponSpecials.Integrated.Summary" },
  { id: "irradiated", label: "Irradiated", param: true, summaryKey: "RT.WeaponSpecials.Irradiated.Summary" },
  { id: "lance", label: "Lance", param: false, summaryKey: "RT.WeaponSpecials.Lance.Summary" },
  { id: "livingWeapon", label: "Living Weapon", param: false, summaryKey: "RT.WeaponSpecials.LivingWeapon.Summary" },
  { id: "maximal", label: "Maximal", param: false, summaryKey: "RT.WeaponSpecials.Maximal.Summary" },
  { id: "melta", label: "Melta", param: false, summaryKey: "RT.WeaponSpecials.Melta.Summary" },
  { id: "ogrynProof", label: "Ogryn-Proof", param: false, summaryKey: "RT.WeaponSpecials.OgrynProof.Summary" },
  { id: "overcharge", label: "Overcharge", param: true, summaryKey: "RT.WeaponSpecials.Overcharge.Summary" },
  { id: "overheats", label: "Overheats", param: false, summaryKey: "RT.WeaponSpecials.Overheats.Summary" },
  { id: "powerField", label: "Power Field", param: false, summaryKey: "RT.WeaponSpecials.PowerField.Summary" },
  { id: "primitive", label: "Primitive", param: true, summaryKey: "RT.WeaponSpecials.Primitive.Summary" },
  { id: "proven", label: "Proven", param: true, summaryKey: "RT.WeaponSpecials.Proven.Summary" },
  { id: "razorSharp", label: "Razor Sharp", param: false, summaryKey: "RT.WeaponSpecials.RazorSharp.Summary" },
  { id: "reactive", label: "Reactive", param: false, summaryKey: "RT.WeaponSpecials.Reactive.Summary" },
  { id: "recharge", label: "Recharge", param: false, summaryKey: "RT.WeaponSpecials.Recharge.Summary" },
  { id: "reliable", label: "Reliable", param: false, flag: "reliable", summaryKey: "RT.WeaponSpecials.Reliable.Summary" },
  { id: "sanctified", label: "Sanctified", param: false, summaryKey: "RT.WeaponSpecials.Sanctified.Summary" },
  { id: "scatter", label: "Scatter", param: false, summaryKey: "RT.WeaponSpecials.Scatter.Summary" },
  { id: "shocking", label: "Shocking", param: false, summaryKey: "RT.WeaponSpecials.Shocking.Summary" },
  { id: "smoke", label: "Smoke", param: true, summaryKey: "RT.WeaponSpecials.Smoke.Summary" },
  { id: "snare", label: "Snare", param: true, summaryKey: "RT.WeaponSpecials.Snare.Summary" },
  { id: "spray", label: "Spray", param: false, summaryKey: "RT.WeaponSpecials.Spray.Summary" },
  { id: "storm", label: "Storm", param: false, summaryKey: "RT.WeaponSpecials.Storm.Summary" },
  { id: "tainted", label: "Tainted", param: false, summaryKey: "RT.WeaponSpecials.Tainted.Summary" },
  { id: "tearing", label: "Tearing", param: false, flag: "tearing", summaryKey: "RT.WeaponSpecials.Tearing.Summary" },
  { id: "temporalLeech", label: "Temporal Leech", param: false, summaryKey: "RT.WeaponSpecials.TemporalLeech.Summary" },
  { id: "toxic", label: "Toxic", param: true, summaryKey: "RT.WeaponSpecials.Toxic.Summary" },
  { id: "twinLinked", label: "Twin-Linked", param: false, summaryKey: "RT.WeaponSpecials.TwinLinked.Summary" },
  { id: "tyranidWeapon", label: "Tyranid Weapon", param: false, summaryKey: "RT.WeaponSpecials.TyranidWeapon.Summary" },
  { id: "unbalanced", label: "Unbalanced", param: false, summaryKey: "RT.WeaponSpecials.Unbalanced.Summary" },
  { id: "unreliable", label: "Unreliable", param: false, flag: "unreliable", summaryKey: "RT.WeaponSpecials.Unreliable.Summary" },
  { id: "unstable", label: "Unstable", param: false, summaryKey: "RT.WeaponSpecials.Unstable.Summary" },
  { id: "unwieldy", label: "Unwieldy", param: false, summaryKey: "RT.WeaponSpecials.Unwieldy.Summary" },
  { id: "vengeful", label: "Vengeful", param: true, summaryKey: "RT.WeaponSpecials.Vengeful.Summary" },
  { id: "volatile", label: "Volatile", param: false, summaryKey: "RT.WeaponSpecials.Volatile.Summary" },
  { id: "warpWeapon", label: "Warp Weapon", param: false, summaryKey: "RT.WeaponSpecials.WarpWeapon.Summary" },
  { id: "witchEdge", label: "Witch-Edge", param: false, summaryKey: "RT.WeaponSpecials.WitchEdge.Summary" }
];

/**
 * Resolve display rows for a weapon's special qualities (label + optional param + summary).
 */
export function resolveWeaponSpecialDisplay(specialQualities, specialText) {
  let qualities = Array.isArray(specialQualities) ? specialQualities : [];
  if (!qualities.length && specialText) {
    qualities = parseWeaponSpecials(specialText).qualities;
  }
  return qualities.map((q) => {
    const id = q.id || "";
    const def = id ? WEAPON_SPECIALS.find((s) => s.id === id) : WEAPON_SPECIALS.find(
      (s) => s.label.toLowerCase() === String(q.label || "").toLowerCase()
    );
    const label = def?.label || q.label || "";
    const param = q.param ?? null;
    const title = param !== null && param !== undefined && param !== "" ? `${label} (${param})` : label;
    const summary = def?.summaryKey ? game.i18n.localize(def.summaryKey) : "";
    return { id: def?.id || "", title, summary };
  });
}

/**
 * Parse a Special cell ("Reliable, Accurate, Blast (2)") into structured qualities.
 * Returns { qualities: [{id, label, param}], flags, specialText }.
 */
export function parseWeaponSpecials(raw) {
  const flags = { tearing: false, accurate: false, reliable: false, unreliable: false };
  const qualities = [];
  const text = String(raw ?? "").trim();
  if (!text || text === "-" || text === "—") {
    return { qualities, flags, specialText: "" };
  }

  const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const cleaned = part.replace(/\*$/, "").replace(/\s*\[[^\]]+\]\s*$/, "").trim();
    const withParam = cleaned.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    const baseLabel = withParam ? withParam[1].trim() : cleaned;
    const paramRaw = withParam ? withParam[2].trim() : null;
    const def = WEAPON_SPECIALS.find((s) => s.label.toLowerCase() === baseLabel.toLowerCase());
    if (def) {
      let param = null;
      if (paramRaw !== null && paramRaw !== "X" && paramRaw !== "x") {
        const n = Number(paramRaw);
        param = Number.isFinite(n) ? n : paramRaw;
      } else if (def.param && paramRaw && (paramRaw === "X" || paramRaw === "x")) {
        param = null;
      }
      qualities.push({ id: def.id, label: def.label, param });
      if (def.flag) flags[def.flag] = true;
    } else {
      qualities.push({ id: "", label: cleaned, param: null });
    }
  }

  const specialText = qualities
    .map((q) => (q.param !== null && q.param !== undefined ? `${q.label} (${q.param})` : q.label))
    .join(", ");
  return { qualities, flags, specialText };
}

export function registerConfig() {
  CONFIG.ROGUE_TRADER = {
    SYSTEM_ID,
    characteristics: CHARACTERISTICS,
    rollModes: ROLL_MODES,
    actorTypes: ACTOR_TYPES,
    itemTypes: ITEM_TYPES,
    itemFields: ITEM_FIELDS,
    gearCategories: GEAR_CATEGORIES,
    weaponSpecials: WEAPON_SPECIALS
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
