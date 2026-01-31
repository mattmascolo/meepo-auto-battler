import type { Animal } from '../types';

export const ANIMALS: Animal[] = [
  {
    id: 'pang',
    name: 'Pang',
    stats: { hp: 16, attackMod: 4, armor: 9 },
    unarmedAttack: {
      name: 'Ice Shard',
      damage: 3,
      effectChance: 30,
      effectType: 'weaken',
      effectValue: 2,
    },
    passive: {
      name: 'Frost Aura',
      description: 'Enemies have -1 Atk Mod',
      type: 'stat_flat',
      effect: { enemyAttackMod: -1 },
    },
  },
  {
    id: 'humphrey',
    name: 'Humphrey',
    stats: { hp: 28, attackMod: 1, armor: 11 },
    unarmedAttack: {
      name: 'Tail Slap',
      damage: 3,
      effectChance: 30,
      effectType: 'weaken',
      effectValue: 2,
    },
    passive: {
      name: 'Thick Skin',
      description: 'Regen 1 HP per turn',
      type: 'per_turn',
      effect: { regen: 1 },
    },
  },
  {
    id: 'beep-boop',
    name: 'Beep-Boop',
    stats: { hp: 18, attackMod: 3, armor: 11 },
    unarmedAttack: {
      name: 'Laser Zap',
      damage: 4,
      effectChance: 25,
      effectType: 'burn',
      effectValue: 2,
    },
    passive: {
      name: 'Metal Plating',
      description: 'Take -1 damage from all hits',
      type: 'on_attacked',
      effect: { damageReduction: 1 },
    },
  },
  {
    id: 'moo-man',
    name: 'Moo-Man',
    stats: { hp: 26, attackMod: 2, armor: 12 },
    unarmedAttack: {
      name: 'Stampede',
      damage: 5,
    },
    passive: {
      name: 'Milk Power',
      description: 'Regen 2 HP when below 50% HP',
      type: 'stat_conditional',
      trigger: { hpBelow: 50 },
      effect: { regen: 2 },
    },
  },
  {
    id: 'sarah',
    name: 'Sarah',
    stats: { hp: 24, attackMod: 0, armor: 14 },
    unarmedAttack: {
      name: 'Shell Bash',
      damage: 5,
    },
    passive: {
      name: 'Hard Shell',
      description: 'Take -1 damage from all hits',
      type: 'on_attacked',
      effect: { damageReduction: 1 },
    },
  },
  {
    id: 'wilber',
    name: 'Wilber',
    stats: { hp: 22, attackMod: 3, armor: 11 },
    unarmedAttack: {
      name: 'Tusk Gore',
      damage: 5,
      effectChance: 25,
      effectType: 'poison',
      effectValue: 2,
    },
    passive: {
      name: 'Berserker Rage',
      description: '+2 Atk Mod when below 50% HP',
      type: 'stat_conditional',
      trigger: { hpBelow: 50 },
      effect: { attackMod: 2 },
    },
  },
  {
    id: 'geezer',
    name: 'Geezer',
    stats: { hp: 32, attackMod: 4, armor: 13 },
    unarmedAttack: {
      name: 'Ancient Strike',
      damage: 6,
      effectChance: 35,
      effectType: 'weaken',
      effectValue: 3,
    },
    passive: {
      name: 'Wisdom of Ages',
      description: 'Regen 2 HP per turn',
      type: 'per_turn',
      effect: { regen: 2 },
    },
  },
  {
    id: 'stranger',
    name: 'Stranger',
    stats: { hp: 20, attackMod: 2, armor: 10 },
    unarmedAttack: {
      name: 'Shadow Strike',
      damage: 4,
      effectChance: 20,
      effectType: 'poison',
      effectValue: 3,
    },
    passive: {
      name: 'Evasive',
      description: '15% chance to dodge attacks',
      type: 'on_attacked',
      effect: { dodgeChance: 15 },
    },
  },
];

// Enemy-only animals (not selectable by player)
const ENEMY_ONLY_IDS = new Set(['wilber', 'geezer', 'sarah', 'humphrey']);

// Playable animals for character selection
export const PLAYABLE_ANIMALS: Animal[] = ANIMALS.filter(a => !ENEMY_ONLY_IDS.has(a.id));

export function getAnimalById(id: string): Animal | undefined {
  return ANIMALS.find(a => a.id === id);
}
