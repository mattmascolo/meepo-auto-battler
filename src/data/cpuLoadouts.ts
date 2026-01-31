import type { CPULoadout } from '../types';
import { getAnimalById } from './animals';
import { getWeaponById } from './weapons';
import { getAccessoryById } from './accessories';

interface CPULoadoutDef {
  difficulty: 1 | 2 | 3 | 4;
  animalId: string;
  weaponId: string;
  accessoryId: string;
}

const CPU_LOADOUT_DEFS: CPULoadoutDef[] = [
  {
    difficulty: 1,
    animalId: 'sarah',
    weaponId: 'rusty-dagger',
    accessoryId: 'iron-acorn',
  },
  {
    difficulty: 2,
    animalId: 'humphrey',
    weaponId: 'flame-stick',
    accessoryId: 'lucky-pebble',
  },
  {
    difficulty: 3,
    animalId: 'humphrey',
    weaponId: 'venom-fang',
    accessoryId: 'adrenaline-gland',
  },
  {
    difficulty: 4,
    animalId: 'geezer',
    weaponId: 'sapping-thorn',
    accessoryId: 'spiked-collar',
  },
];

export const CPU_LOADOUTS: CPULoadout[] = CPU_LOADOUT_DEFS.map(def => {
  const animal = getAnimalById(def.animalId);
  const weapon = getWeaponById(def.weaponId);
  const accessory = getAccessoryById(def.accessoryId);

  if (!animal || !weapon || !accessory) {
    throw new Error(`Invalid CPU loadout definition for difficulty ${def.difficulty}`);
  }

  return { animal, weapon, accessory };
});

export function getCPULoadout(difficulty: 1 | 2 | 3 | 4): CPULoadout | undefined {
  return CPU_LOADOUTS[difficulty - 1];
}
