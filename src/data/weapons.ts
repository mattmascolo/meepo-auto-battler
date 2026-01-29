import type { Weapon } from '../types';

export const WEAPONS: Weapon[] = [
  {
    id: 'rusty-dagger',
    name: 'Rusty Dagger',
    damage: 5,
  },
  {
    id: 'flame-stick',
    name: 'Flame Stick',
    damage: 4,
    effectChance: 40,
    effectType: 'burn',
    effectValue: 2,
  },
  {
    id: 'venom-fang',
    name: 'Venom Fang',
    damage: 4,
    effectChance: 40,
    effectType: 'poison',
    effectValue: 2,
  },
  {
    id: 'heavy-rock',
    name: 'Heavy Rock',
    damage: 7,
    attackModModifier: -1,
  },
  {
    id: 'sapping-thorn',
    name: 'Sapping Thorn',
    damage: 3,
    healOnHit: 2,
  },
];

export function getWeaponById(id: string): Weapon | undefined {
  return WEAPONS.find(w => w.id === id);
}
