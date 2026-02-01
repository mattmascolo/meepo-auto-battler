import type { AnimalPassive } from '../../../types';
import type { PassiveTurnEndContext, TurnEndEffect } from '../types';

export function statConditionalTurnEndHandler(
  passive: AnimalPassive,
  context: PassiveTurnEndContext
): TurnEndEffect {
  const result: TurnEndEffect = {};

  // Require both trigger and regen effect
  if (!passive.trigger?.hpBelow || !passive.effect.regen) {
    return result;
  }

  const threshold = context.combatant.maxHP * (passive.trigger.hpBelow / 100);
  const isTriggered = context.combatant.currentHP < threshold;

  if (!isTriggered) {
    return result;
  }

  const missingHP = context.combatant.maxHP - context.combatant.currentHP;
  result.regen = Math.min(passive.effect.regen, missingHP);

  return result;
}
