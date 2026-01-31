import type { CPULoadout } from '../types';
import { getAnimalById } from './animals';

interface CPULoadoutDef {
  difficulty: 1 | 2 | 3 | 4;
  animalId: string;
}

const CPU_LOADOUT_DEFS: CPULoadoutDef[] = [
  { difficulty: 1, animalId: 'sarah' },
  { difficulty: 2, animalId: 'humphrey' },
  { difficulty: 3, animalId: 'humphrey' },
  { difficulty: 4, animalId: 'geezer' },
];

export const CPU_LOADOUTS: CPULoadout[] = CPU_LOADOUT_DEFS.map(def => {
  const animal = getAnimalById(def.animalId);

  if (!animal) {
    throw new Error(`Invalid CPU loadout definition for difficulty ${def.difficulty}`);
  }

  return { animal, weapon: null, accessory: null };
});

export function getCPULoadout(difficulty: 1 | 2 | 3 | 4): CPULoadout | undefined {
  return CPU_LOADOUTS[difficulty - 1];
}
