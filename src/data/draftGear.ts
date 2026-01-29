import type { Weapon, Accessory } from '../types';

/**
 * Unique draft-only gear - rare and powerful items only found between battles
 * These are intentionally stronger than base gear to make drafting exciting
 */

export const DRAFT_WEAPONS: Weapon[] = [
  {
    id: 'thunderclaw',
    name: 'Thunderclaw',
    damage: 6, // Base weapons max at 7 (Heavy Rock with -1 attack)
    attackModModifier: 2,
    effectType: 'weaken',
    effectChance: 40,
  },
  {
    id: 'vampiric_fang',
    name: 'Vampiric Fang',
    damage: 5,
    healOnHit: 3, // Better healing than Sapping Thorn (2)
  },
  {
    id: 'blazing_brand',
    name: 'Blazing Brand',
    damage: 6,
    effectType: 'burn',
    effectChance: 60, // High burn chance vs Flame Stick (40%)
    effectValue: 3, // Stronger burn
  },
  {
    id: 'frozen_blade',
    name: 'Frozen Blade',
    damage: 8, // Very high damage
    attackModModifier: -1,
    effectType: 'weaken',
    effectChance: 50,
  },
  {
    id: 'assassins_needle',
    name: "Assassin's Needle",
    damage: 4,
    attackModModifier: 4, // Very accurate
    effectType: 'poison',
    effectChance: 50,
    effectValue: 3, // Strong poison
  },
];

export const DRAFT_ACCESSORIES: Accessory[] = [
  {
    id: 'giants_heart',
    name: "Giant's Heart",
    type: 'stat',
    effect: {
      hp: 12, // Massive HP boost
    },
  },
  {
    id: 'berserker_totem',
    name: 'Berserker Totem',
    type: 'buff',
    effect: {
      attackModWhenLow: 4, // +4 attack when low
      lowHpThreshold: 50, // Below 50% HP
    },
  },
  {
    id: 'mirror_shield',
    name: 'Mirror Shield',
    type: 'reactive',
    effect: {
      damageOnHit: 4, // Reflect 4 damage
    },
  },
  {
    id: 'phoenix_charm',
    name: 'Phoenix Charm',
    type: 'stat',
    effect: {
      hp: 6,
      attackMod: 1,
    },
  },
  {
    id: 'dragons_scale',
    name: "Dragon's Scale",
    type: 'stat',
    effect: {
      hp: 6,
      armor: 2, // Bonus armor
    },
  },
  {
    id: 'inferno_ring',
    name: 'Inferno Ring',
    type: 'buff',
    effect: {
      attackMod: 1,
      burnChance: 25, // Chance to burn on any attack
    },
  },
];

/**
 * Get a random selection of draft gear
 * @param count Number of items to return
 * @param excludeIds IDs of items the player already has
 */
export function getRandomDraftGear(count: number, excludeIds: Set<string>): (Weapon | Accessory)[] {
  const allGear = [...DRAFT_WEAPONS, ...DRAFT_ACCESSORIES];
  const available = allGear.filter(item => !excludeIds.has(item.id));

  // Shuffle and take count items
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Check if an item is a weapon
 */
export function isWeapon(item: Weapon | Accessory): item is Weapon {
  return 'damage' in item;
}
