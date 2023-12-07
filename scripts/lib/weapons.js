class Weapon {
  constructor(
    category,
    martialWeapon,
    cost,
    attributes,
    accuracyBonus,
    damage,
    damageElementType,
    handedness,
    type,
    quality
  ) {
    this.category = category;
    this.martialWeapon = martialWeapon;
    this.cost = cost;
    this.attributes = attributes;
    this.accuracyBonus = accuracyBonus;
    this.damage = damage;
    this.damageElementType = damageElementType;
    this.handedness = handedness;
    this.type = type;
    this.quality = quality;
  }
  static categories = [
    "Arcane",
    "Bow",
    "Brawling",
    "Dagger",
    "Firearm",
    "Flail",
    "Heavy",
    "Spear",
    "Sword",
    "Thrown",
  ];
  static damageElementTypes = {
    Physical: 0,
    Fire: 100,
    Ice: 100,
    Bolt: 100,
    Dark: 100,
    Light: 100,
    Earth: 100,
    Air: 100,
  };
  static handednessOptions = ["One-Handed", "Two-Handed"];
  static typesOptions = ["Melee", "Ranged"];
  static qualitiesOptions = {
    Magical: 100,
    Hunter: 300,
    Piercing: 400,
    "Dual Hunter": 500,
    Multi: 1000,
    Status: 1500,
    "Status Plus": 2000,
  };
  static attributesOptions = ["WLP", "DEX", "INS", "MIG"];
  static martialOptions = [true, false];
}
