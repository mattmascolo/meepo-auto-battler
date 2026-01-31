import type { DiceRoller } from './DiceRoller';
import type { Effect, EffectContext, EffectResult } from '../types/effects';

export class EffectSystem {
  constructor(private diceRoller: DiceRoller) {}

  /**
   * Check if an effect should trigger given the current context.
   */
  shouldTrigger(effect: Effect, context: EffectContext): boolean {
    // First, check if the context trigger matches the effect trigger
    // 'always' effects match any context trigger
    if (effect.trigger !== 'always' && effect.trigger !== context.trigger) {
      return false;
    }

    // Check conditional triggers
    switch (effect.trigger) {
      case 'always':
        return true;

      case 'hp_below':
        if (effect.triggerValue === undefined) return false;
        const hpPercentBelow = (context.owner.currentHP / context.owner.maxHP) * 100;
        return hpPercentBelow < effect.triggerValue;

      case 'hp_above':
        if (effect.triggerValue === undefined) return false;
        const hpPercentAbove = (context.owner.currentHP / context.owner.maxHP) * 100;
        return hpPercentAbove > effect.triggerValue;

      case 'on_hit':
      case 'on_attacked':
      case 'on_miss':
      case 'on_dodge':
      case 'turn_start':
      case 'turn_end':
      case 'battle_start':
      case 'battle_end':
        // Check proc chance if present
        if (effect.procChance !== undefined) {
          return this.diceRoller.checkProc(effect.procChance);
        }
        return true;

      default:
        return false;
    }
  }

  /**
   * Evaluate a single effect and return the result.
   */
  evaluate(effect: Effect, context: EffectContext): EffectResult {
    if (!this.shouldTrigger(effect, context)) {
      return { applied: false };
    }

    const result: EffectResult = {
      applied: true,
      target: effect.target,
    };

    switch (effect.type) {
      case 'stat_modifier':
        result.modifiers = effect.modifiers;
        break;

      case 'damage':
        result.damage = effect.value;
        break;

      case 'heal':
        result.healing = effect.value;
        break;

      case 'apply_status':
        result.status = effect.status;
        break;

      case 'damage_reduction':
        result.modifiers = { damage: -(effect.value ?? 0) };
        break;

      case 'dodge_chance':
        // Dodge chance is handled separately in combat
        break;
    }

    return result;
  }

  /**
   * Evaluate multiple effects and return all results.
   */
  evaluateAll(effects: Effect[], context: EffectContext): EffectResult[] {
    return effects.map(effect => this.evaluate(effect, context));
  }

  /**
   * Collect stat modifiers from all applied effects.
   */
  collectModifiers(results: EffectResult[]): { attackMod: number; armor: number; damage: number } {
    const totals = { attackMod: 0, armor: 0, damage: 0 };

    for (const result of results) {
      if (result.applied && result.modifiers) {
        totals.attackMod += result.modifiers.attackMod ?? 0;
        totals.armor += result.modifiers.armor ?? 0;
        totals.damage += result.modifiers.damage ?? 0;
      }
    }

    return totals;
  }
}
