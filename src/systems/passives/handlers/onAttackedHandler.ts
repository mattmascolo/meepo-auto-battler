import type { AnimalPassive } from '../../../types';
import type {
  PassiveStatContext,
  PassiveAttackContext,
  StatModification,
  AttackModification,
} from '../types';

/**
 * Handles stat modifications from on_attacked passives (e.g., damage reduction)
 */
export function onAttackedStatHandler(
  passive: AnimalPassive,
  _context: PassiveStatContext
): StatModification {
  const result: StatModification = {};

  if (passive.effect.damageReduction) {
    result.damageReduction = passive.effect.damageReduction;
  }

  return result;
}

/**
 * Handles dodge chance from on_attacked passives
 */
export function onAttackedDodgeHandler(
  passive: AnimalPassive,
  _context: PassiveAttackContext,
  checkProc: (chance: number) => boolean
): AttackModification {
  const result: AttackModification = {};

  if (passive.effect.dodgeChance) {
    if (checkProc(passive.effect.dodgeChance)) {
      result.dodged = true;
    }
  }

  return result;
}
