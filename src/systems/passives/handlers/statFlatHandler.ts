import type { AnimalPassive } from '../../../types';
import type { PassiveStatContext, StatModification } from '../types';

export function statFlatHandler(
  passive: AnimalPassive,
  _context: PassiveStatContext
): StatModification {
  const result: StatModification = {};

  if (passive.effect.armor) {
    result.armor = passive.effect.armor;
  }

  if (passive.effect.enemyAttackMod) {
    result.enemyAttackMod = passive.effect.enemyAttackMod;
  }

  return result;
}
