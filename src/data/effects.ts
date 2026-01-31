import type { Effect } from '../types/effects';

/**
 * Animal passive effects indexed by animal ID.
 */
export const PASSIVE_EFFECTS: Record<string, Effect> = {
  'pang': {
    id: 'pang-frost-aura',
    name: 'Frost Aura',
    type: 'stat_modifier',
    target: 'enemy',
    trigger: 'always',
    modifiers: { attackMod: -1 },
  },
  'humphrey': {
    id: 'humphrey-thick-skin',
    name: 'Thick Skin',
    type: 'heal',
    target: 'self',
    trigger: 'turn_end',
    value: 1,
  },
  'beep-boop': {
    id: 'beep-boop-metal-plating',
    name: 'Metal Plating',
    type: 'damage_reduction',
    target: 'self',
    trigger: 'on_attacked',
    value: 1,
  },
  'moo-man': {
    id: 'moo-man-milk-power',
    name: 'Milk Power',
    type: 'heal',
    target: 'self',
    trigger: 'hp_below',
    triggerValue: 50,
    value: 2,
  },
  'sarah': {
    id: 'sarah-hard-shell',
    name: 'Hard Shell',
    type: 'damage_reduction',
    target: 'self',
    trigger: 'on_attacked',
    value: 1,
  },
};

/**
 * Weapon effects indexed by weapon ID.
 */
export const WEAPON_EFFECTS: Record<string, Effect[]> = {
  'rusty-dagger': [],
  'flame-stick': [
    {
      id: 'flame-stick-burn',
      name: 'Burn Proc',
      type: 'apply_status',
      target: 'enemy',
      trigger: 'on_hit',
      procChance: 40,
      status: { type: 'burn', value: 2, duration: 3 },
    },
  ],
  'venom-fang': [
    {
      id: 'venom-fang-poison',
      name: 'Poison Proc',
      type: 'apply_status',
      target: 'enemy',
      trigger: 'on_hit',
      procChance: 40,
      status: { type: 'poison', value: 2, duration: 3 },
    },
  ],
  'heavy-rock': [],
  'sapping-thorn': [
    {
      id: 'sapping-thorn-lifesteal',
      name: 'Lifesteal',
      type: 'heal',
      target: 'self',
      trigger: 'on_hit',
      value: 2,
    },
  ],
};

/**
 * Accessory effects indexed by accessory ID.
 */
export const ACCESSORY_EFFECTS: Record<string, Effect[]> = {
  'iron-acorn': [
    {
      id: 'iron-acorn-hp',
      name: 'HP Bonus',
      type: 'stat_modifier',
      target: 'self',
      trigger: 'always',
      modifiers: { maxHP: 4 },
    },
  ],
  'lucky-pebble': [
    {
      id: 'lucky-pebble-attack',
      name: 'Attack Bonus',
      type: 'stat_modifier',
      target: 'self',
      trigger: 'always',
      modifiers: { attackMod: 1 },
    },
  ],
  'spiked-collar': [
    {
      id: 'spiked-collar-reflect',
      name: 'Reflect Damage',
      type: 'damage',
      target: 'attacker',
      trigger: 'on_attacked',
      value: 2,
    },
  ],
  'adrenaline-gland': [
    {
      id: 'adrenaline-gland-boost',
      name: 'Adrenaline Boost',
      type: 'stat_modifier',
      target: 'self',
      trigger: 'hp_below',
      triggerValue: 25,
      modifiers: { attackMod: 3 },
    },
  ],
  'ember-charm': [
    {
      id: 'ember-charm-burn',
      name: 'Ember Burn',
      type: 'apply_status',
      target: 'enemy',
      trigger: 'on_hit',
      procChance: 20,
      status: { type: 'burn', value: 2, duration: 3 },
    },
  ],
};

/**
 * Get the passive effect for an animal.
 */
export function getPassiveEffect(animalId: string): Effect | undefined {
  return PASSIVE_EFFECTS[animalId];
}

/**
 * Get all effects for a weapon.
 */
export function getWeaponEffects(weaponId: string): Effect[] {
  return WEAPON_EFFECTS[weaponId] ?? [];
}

/**
 * Get all effects for an accessory.
 */
export function getAccessoryEffects(accessoryId: string): Effect[] {
  return ACCESSORY_EFFECTS[accessoryId] ?? [];
}

/**
 * Collect all effects for a combatant (passive + weapon + accessory).
 */
export function collectCombatantEffects(
  animalId: string,
  weaponId?: string,
  accessoryId?: string
): Effect[] {
  const effects: Effect[] = [];

  const passive = getPassiveEffect(animalId);
  if (passive) {
    effects.push(passive);
  }

  if (weaponId) {
    effects.push(...getWeaponEffects(weaponId));
  }

  if (accessoryId) {
    effects.push(...getAccessoryEffects(accessoryId));
  }

  return effects;
}
