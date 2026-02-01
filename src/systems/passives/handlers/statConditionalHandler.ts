import type { AnimalPassive } from '../../../types';
import type { PassiveStatContext, StatModification } from '../types';

export function statConditionalHandler(
  passive: AnimalPassive,
  context: PassiveStatContext
): StatModification {
  const result: StatModification = {};

  // Require hpBelow trigger
  if (!passive.trigger?.hpBelow) {
    return result;
  }

  const threshold = context.combatant.maxHP * (passive.trigger.hpBelow / 100);
  const isTriggered = context.combatant.currentHP < threshold;

  if (!isTriggered) {
    return result;
  }

  if (passive.effect.attackMod) {
    result.attackMod = passive.effect.attackMod;
  }

  if (passive.effect.armor) {
    result.armor = passive.effect.armor;
  }

  return result;
}
