import type { AnimalPassive } from '../../../types';
import type { PassiveTurnEndContext, TurnEndEffect } from '../types';

export function perTurnHandler(
  passive: AnimalPassive,
  context: PassiveTurnEndContext
): TurnEndEffect {
  const result: TurnEndEffect = {};

  if (passive.effect.regen) {
    const missingHP = context.combatant.maxHP - context.combatant.currentHP;
    result.regen = Math.min(passive.effect.regen, missingHP);
  }

  return result;
}
