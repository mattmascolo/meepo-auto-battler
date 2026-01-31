import { describe, it, expect } from 'vitest';
import type { Effect } from './effects';

describe('Effect types', () => {
  it('should define stat modifier effect', () => {
    const effect: Effect = {
      id: 'frost-aura',
      name: 'Frost Aura',
      type: 'stat_modifier',
      target: 'enemy',
      trigger: 'always',
      modifiers: { attackMod: -1 },
    };
    expect(effect.type).toBe('stat_modifier');
    expect(effect.modifiers?.attackMod).toBe(-1);
  });

  it('should define conditional effect with hp trigger', () => {
    const effect: Effect = {
      id: 'scrappy',
      name: 'Scrappy',
      type: 'stat_modifier',
      target: 'self',
      trigger: 'hp_below',
      triggerValue: 50,
      modifiers: { attackMod: 2 },
    };
    expect(effect.trigger).toBe('hp_below');
    expect(effect.triggerValue).toBe(50);
  });

  it('should define on_hit effect', () => {
    const effect: Effect = {
      id: 'lifesteal',
      name: 'Lifesteal',
      type: 'heal',
      target: 'self',
      trigger: 'on_hit',
      value: 2,
    };
    expect(effect.trigger).toBe('on_hit');
    expect(effect.value).toBe(2);
  });

  it('should define on_attacked effect', () => {
    const effect: Effect = {
      id: 'spiked-collar',
      name: 'Spiked Collar',
      type: 'damage',
      target: 'attacker',
      trigger: 'on_attacked',
      value: 2,
    };
    expect(effect.trigger).toBe('on_attacked');
    expect(effect.target).toBe('attacker');
  });

  it('should define proc chance effect', () => {
    const effect: Effect = {
      id: 'burn-chance',
      name: 'Burn Chance',
      type: 'apply_status',
      target: 'enemy',
      trigger: 'on_hit',
      procChance: 40,
      status: { type: 'burn', value: 2, duration: 3 },
    };
    expect(effect.procChance).toBe(40);
    expect(effect.status?.type).toBe('burn');
  });

  it('should define turn end effect', () => {
    const effect: Effect = {
      id: 'regen',
      name: 'Regeneration',
      type: 'heal',
      target: 'self',
      trigger: 'turn_end',
      value: 1,
    };
    expect(effect.trigger).toBe('turn_end');
  });
});
