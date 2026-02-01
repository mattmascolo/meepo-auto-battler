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
  {
    id: 'oswald',
    name: 'Oswald',
    stats: { hp: 18, attackMod: 5, armor: 8 },
    unarmedAttack: {
      name: 'Talon Swipe',
      damage: 4,
      effectChance: 25,
      effectType: 'weaken',
      effectValue: 2,
    },
    passive: {
      name: 'Keen Eye',
      description: '+2 Armor',
      type: 'stat_flat',
      effect: { armor: 2 },
    },
  },
  {
    id: 'quatack',
    name: 'Quatack',
    stats: { hp: 22, attackMod: 1, armor: 12 },
    unarmedAttack: {
      name: 'Wing Slap',
      damage: 3,
      effectChance: 30,
      effectType: 'weaken',
      effectValue: 2,
    },
    passive: {
      name: 'Feathered Armor',
      description: 'Take -1 damage from all hits',
      type: 'on_attacked',
      effect: { damageReduction: 1 },
    },
  },
  {
    id: 'thomas',
    name: 'Thomas',
    stats: { hp: 20, attackMod: 3, armor: 10 },
    unarmedAttack: {
      name: 'Pounce',
      damage: 4,
    },
    passive: {
      name: 'Nine Lives',
      description: 'Regen 1 HP per turn',
      type: 'per_turn',
      effect: { regen: 1 },
    },
  },
  {
    id: 'wyatt',
    name: 'Wyatt',
    stats: { hp: 19, attackMod: 4, armor: 9 },
    unarmedAttack: {
      name: 'Fang Bite',
      damage: 5,
      effectChance: 25,
      effectType: 'poison',
      effectValue: 2,
    },
    passive: {
      name: 'Pack Tactics',
      description: '+2 Atk Mod when below 50% HP',
      type: 'stat_conditional',
      trigger: { hpBelow: 50 },
      effect: { attackMod: 2 },
    },
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    stats: { hp: 21, attackMod: 4, armor: 10 },
    unarmedAttack: {
      name: 'Card Slash',
      damage: 4,
      effectChance: 21,
      effectType: 'burn',
      effectValue: 2,
    },
    passive: {
      name: 'Lucky Draw',
      description: '+2 Atk Mod when below 50% HP',
      type: 'stat_conditional',
      trigger: { hpBelow: 50 },
      effect: { attackMod: 2 },
    },
  },
  {
    id: 'finn',
    name: 'Finn',
    stats: { hp: 20, attackMod: 3, armor: 11 },
    unarmedAttack: {
      name: 'Fin Slap',
      damage: 4,
      effectChance: 25,
      effectType: 'weaken',
      effectValue: 2,
    },
    passive: {
      name: 'Slippery',
      description: '10% chance to dodge attacks',
      type: 'on_attacked',
      effect: { dodgeChance: 10 },
    },
  },
  {
    id: 'murder',
    name: 'Murder',
    stats: { hp: 17, attackMod: 5, armor: 8 },
    unarmedAttack: {
      name: 'Assassinate',
      damage: 6,
      effectChance: 30,
      effectType: 'poison',
      effectValue: 3,
    },
    passive: {
      name: 'Bloodthirst',
      description: 'Regen 2 HP when below 50% HP',
      type: 'stat_conditional',
      trigger: { hpBelow: 50 },
      effect: { regen: 2 },
    },
  },
  {
    id: 'pooty',
    name: 'Pooty',
    stats: { hp: 24, attackMod: 2, armor: 12 },
    unarmedAttack: {
      name: 'Stink Bomb',
      damage: 3,
      effectChance: 40,
      effectType: 'weaken',
      effectValue: 3,
    },
    passive: {
      name: 'Toxic Aura',
      description: 'Enemies have -1 Atk Mod',
      type: 'stat_flat',
      effect: { enemyAttackMod: -1 },
    },
  },
  {
    id: 'esmeralda',
    name: 'Esmeralda',
    stats: { hp: 19, attackMod: 4, armor: 10 },
    unarmedAttack: {
      name: 'Crystal Blast',
      damage: 5,
      effectChance: 25,
      effectType: 'burn',
      effectValue: 2,
    },
    passive: {
      name: 'Mystic Shield',
      description: '15% chance to dodge attacks',
      type: 'on_attacked',
      effect: { dodgeChance: 15 },
    },
  },
  {
    id: 'sir-pokesalot',
    name: 'Sir Pokesalot',
    stats: { hp: 21, attackMod: 3, armor: 13 },
    unarmedAttack: {
      name: 'Lance Thrust',
      damage: 5,
      effectChance: 20,
      effectType: 'weaken',
      effectValue: 2,
    },
    passive: {
      name: 'Knight\'s Valor',
      description: '+2 Armor when below 50% HP',
      type: 'stat_conditional',
      trigger: { hpBelow: 50 },
      effect: { armor: 2 },
    },
  },
];

// Enemy-only animals (not selectable by player)
// Playable: pang, moo-man, oswald, finn, wyatt, quatack, sir-pokesalot, beep-boop
const ENEMY_ONLY_IDS = new Set(['stranger', 'wilber', 'geezer', 'sarah', 'humphrey', 'thomas', 'blackjack', 'murder', 'pooty']);

// Playable animals for character selection (in specific order for pagination)
const PLAYABLE_ORDER = ['pang', 'moo-man', 'oswald', 'finn', 'wyatt', 'quatack', 'sir-pokesalot', 'beep-boop', 'esmeralda'];
export const PLAYABLE_ANIMALS: Animal[] = PLAYABLE_ORDER
  .map(id => ANIMALS.find(a => a.id === id))
  .filter((a): a is Animal => a !== undefined && !ENEMY_ONLY_IDS.has(a.id));

export function getAnimalById(id: string): Animal | undefined {
  return ANIMALS.find(a => a.id === id);
}
