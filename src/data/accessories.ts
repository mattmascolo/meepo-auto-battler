import type { Accessory } from '../types';

export const ACCESSORIES: Accessory[] = [
  {
    id: 'iron-acorn',
    name: 'Iron Acorn',
    type: 'stat',
    effect: {
      hp: 4,
    },
  },
  {
    id: 'lucky-pebble',
    name: 'Lucky Pebble',
    type: 'stat',
    effect: {
      attackMod: 1,
    },
  },
  {
    id: 'spiked-collar',
    name: 'Spiked Collar',
    type: 'reactive',
    effect: {
      damageOnHit: 2,
    },
  },
  {
    id: 'adrenaline-gland',
    name: 'Adrenaline Gland',
    type: 'reactive',
    effect: {
      attackModWhenLow: 3,
      lowHpThreshold: 25,
    },
  },
  {
    id: 'ember-charm',
    name: 'Ember Charm',
    type: 'buff',
    effect: {
      burnChance: 20,
    },
  },
];

export function getAccessoryById(id: string): Accessory | undefined {
  return ACCESSORIES.find(a => a.id === id);
}
