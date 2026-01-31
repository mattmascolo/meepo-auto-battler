import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EffectSystem } from './EffectSystem';
import { DiceRoller } from './DiceRoller';
import type { Effect, EffectContext } from '../types/effects';

describe('EffectSystem', () => {
  let effectSystem: EffectSystem;
  let diceRoller: DiceRoller;

  beforeEach(() => {
    diceRoller = new DiceRoller();
    effectSystem = new EffectSystem(diceRoller);
  });

  describe('shouldTrigger', () => {
    it('should return true for always trigger', () => {
      const effect: Effect = {
        id: 'test',
        name: 'Test',
        type: 'stat_modifier',
        target: 'self',
        trigger: 'always',
        modifiers: { attackMod: 1 },
      };
      const context: EffectContext = {
        owner: { currentHP: 10, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'always',
      };
      expect(effectSystem.shouldTrigger(effect, context)).toBe(true);
    });

    it('should return true for hp_below when HP is below threshold', () => {
      const effect: Effect = {
        id: 'test',
        name: 'Test',
        type: 'stat_modifier',
        target: 'self',
        trigger: 'hp_below',
        triggerValue: 50,
        modifiers: { attackMod: 2 },
      };
      const context: EffectContext = {
        owner: { currentHP: 8, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'hp_below',
      };
      expect(effectSystem.shouldTrigger(effect, context)).toBe(true);
    });

    it('should return false for hp_below when HP is above threshold', () => {
      const effect: Effect = {
        id: 'test',
        name: 'Test',
        type: 'stat_modifier',
        target: 'self',
        trigger: 'hp_below',
        triggerValue: 50,
        modifiers: { attackMod: 2 },
      };
      const context: EffectContext = {
        owner: { currentHP: 15, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'hp_below',
      };
      expect(effectSystem.shouldTrigger(effect, context)).toBe(false);
    });

    it('should check proc chance for on_hit effects', () => {
      vi.spyOn(diceRoller, 'checkProc').mockReturnValue(true);

      const effect: Effect = {
        id: 'test',
        name: 'Test',
        type: 'apply_status',
        target: 'enemy',
        trigger: 'on_hit',
        procChance: 40,
        status: { type: 'burn', value: 2, duration: 3 },
      };
      const context: EffectContext = {
        owner: { currentHP: 10, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'on_hit',
        damageDealt: 5,
      };
      expect(effectSystem.shouldTrigger(effect, context)).toBe(true);
      expect(diceRoller.checkProc).toHaveBeenCalledWith(40);
    });
  });

  describe('evaluate', () => {
    it('should return stat modifiers for stat_modifier effect', () => {
      const effect: Effect = {
        id: 'test',
        name: 'Test',
        type: 'stat_modifier',
        target: 'enemy',
        trigger: 'always',
        modifiers: { attackMod: -1 },
      };
      const context: EffectContext = {
        owner: { currentHP: 10, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'always',
      };
      const result = effectSystem.evaluate(effect, context);
      expect(result.applied).toBe(true);
      expect(result.modifiers).toEqual({ attackMod: -1 });
      expect(result.target).toBe('enemy');
    });

    it('should return damage for damage effect', () => {
      const effect: Effect = {
        id: 'test',
        name: 'Test',
        type: 'damage',
        target: 'attacker',
        trigger: 'on_attacked',
        value: 2,
      };
      const context: EffectContext = {
        owner: { currentHP: 10, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'on_attacked',
        damageTaken: 5,
      };
      const result = effectSystem.evaluate(effect, context);
      expect(result.applied).toBe(true);
      expect(result.damage).toBe(2);
      expect(result.target).toBe('attacker');
    });

    it('should return healing for heal effect', () => {
      const effect: Effect = {
        id: 'test',
        name: 'Test',
        type: 'heal',
        target: 'self',
        trigger: 'on_hit',
        value: 2,
      };
      const context: EffectContext = {
        owner: { currentHP: 10, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'on_hit',
        damageDealt: 5,
      };
      const result = effectSystem.evaluate(effect, context);
      expect(result.applied).toBe(true);
      expect(result.healing).toBe(2);
      expect(result.target).toBe('self');
    });

    it('should return status for apply_status effect', () => {
      vi.spyOn(diceRoller, 'checkProc').mockReturnValue(true);

      const effect: Effect = {
        id: 'test',
        name: 'Test',
        type: 'apply_status',
        target: 'enemy',
        trigger: 'on_hit',
        procChance: 40,
        status: { type: 'burn', value: 2, duration: 3 },
      };
      const context: EffectContext = {
        owner: { currentHP: 10, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'on_hit',
        damageDealt: 5,
      };
      const result = effectSystem.evaluate(effect, context);
      expect(result.applied).toBe(true);
      expect(result.status).toEqual({ type: 'burn', value: 2, duration: 3 });
    });

    it('should not apply when trigger conditions not met', () => {
      const effect: Effect = {
        id: 'test',
        name: 'Test',
        type: 'stat_modifier',
        target: 'self',
        trigger: 'hp_below',
        triggerValue: 25,
        modifiers: { attackMod: 3 },
      };
      const context: EffectContext = {
        owner: { currentHP: 15, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'hp_below',
      };
      const result = effectSystem.evaluate(effect, context);
      expect(result.applied).toBe(false);
    });
  });

  describe('evaluateAll', () => {
    it('should evaluate multiple effects and return combined results', () => {
      const effects: Effect[] = [
        {
          id: 'e1',
          name: 'Attack Boost',
          type: 'stat_modifier',
          target: 'self',
          trigger: 'always',
          modifiers: { attackMod: 1 },
        },
        {
          id: 'e2',
          name: 'Armor Boost',
          type: 'stat_modifier',
          target: 'self',
          trigger: 'always',
          modifiers: { armor: 2 },
        },
      ];
      const context: EffectContext = {
        owner: { currentHP: 10, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'always',
      };
      const results = effectSystem.evaluateAll(effects, context);
      expect(results).toHaveLength(2);
      expect(results.every(r => r.applied)).toBe(true);
    });

    it('should filter by trigger type', () => {
      const effects: Effect[] = [
        {
          id: 'e1',
          name: 'Always Active',
          type: 'stat_modifier',
          target: 'self',
          trigger: 'always',
          modifiers: { attackMod: 1 },
        },
        {
          id: 'e2',
          name: 'On Hit',
          type: 'heal',
          target: 'self',
          trigger: 'on_hit',
          value: 2,
        },
      ];
      const context: EffectContext = {
        owner: { currentHP: 10, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'always',
      };
      const results = effectSystem.evaluateAll(effects, context);
      // Only 'always' effect should be evaluated, 'on_hit' should not trigger
      expect(results.filter(r => r.applied)).toHaveLength(1);
    });
  });
});
