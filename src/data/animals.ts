import type { Animal } from '../types';

export const ANIMALS: Animal[] = [
  {
    id: 'rat',
    name: 'Rat',
    stats: { hp: 20, attackMod: 3, armor: 10 },
    unarmedAttack: {
      name: 'Bite',
      damage: 4,
    },
    passive: {
      name: 'Scrappy',
      description: '+2 Atk Mod when below 50% HP',
      type: 'stat_conditional',
      trigger: { hpBelow: 50 },
      effect: { attackMod: 2 },
    },
  },
  {
    id: 'toad',
    name: 'Toad',
    stats: { hp: 28, attackMod: 1, armor: 11 },
    unarmedAttack: {
      name: 'Tongue Whip',
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
    id: 'spider',
    name: 'Spider',
    stats: { hp: 16, attackMod: 4, armor: 9 },
    unarmedAttack: {
      name: 'Venomous Bite',
      damage: 3,
      effectChance: 40,
      effectType: 'poison',
      effectValue: 2,
    },
    passive: {
      name: 'Web Trap',
      description: 'Enemies have -1 Atk Mod',
      type: 'stat_flat',
      effect: { enemyAttackMod: -1 },
    },
  },
  {
    id: 'mosquito',
    name: 'Mosquito',
    stats: { hp: 12, attackMod: 5, armor: 8 },
    unarmedAttack: {
      name: 'Blood Drain',
      damage: 2,
      healOnHit: 2,
    },
    passive: {
      name: 'Evasive',
      description: '20% chance to dodge attacks',
      type: 'on_attacked',
      effect: { dodgeChance: 20 },
    },
  },
  {
    id: 'beetle',
    name: 'Beetle',
    stats: { hp: 24, attackMod: 0, armor: 14 },
    unarmedAttack: {
      name: 'Horn Ram',
      damage: 5,
    },
    passive: {
      name: 'Hard Shell',
      description: 'Take -1 damage from all hits',
      type: 'on_attacked',
      effect: { damageReduction: 1 },
    },
  },
];

export function getAnimalById(id: string): Animal | undefined {
  return ANIMALS.find(a => a.id === id);
}
