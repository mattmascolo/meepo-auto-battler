import { describe, it, expect } from 'vitest';
import type {
  CombatEvent,
  AttackEvent,
  DamageEvent,
  HealEvent,
  StatusEvent,
  DeathEvent,
  PhaseEvent,
} from './events';

describe('Combat Event types', () => {
  it('should define attack event', () => {
    const event: AttackEvent = {
      type: 'attack',
      timestamp: Date.now(),
      attackerId: 'player',
      defenderId: 'cpu',
      attackName: 'Slash',
      roll: 15,
      modifier: 3,
      total: 18,
      targetArmor: 12,
      hit: true,
    };
    expect(event.type).toBe('attack');
    expect(event.hit).toBe(true);
  });

  it('should define damage event', () => {
    const event: DamageEvent = {
      type: 'damage',
      timestamp: Date.now(),
      targetId: 'cpu',
      sourceId: 'player',
      amount: 5,
      damageType: 'physical',
      source: 'attack',
    };
    expect(event.type).toBe('damage');
    expect(event.damageType).toBe('physical');
  });

  it('should define heal event', () => {
    const event: HealEvent = {
      type: 'heal',
      timestamp: Date.now(),
      targetId: 'player',
      amount: 3,
      source: 'lifesteal',
    };
    expect(event.type).toBe('heal');
  });

  it('should define status event', () => {
    const event: StatusEvent = {
      type: 'status',
      timestamp: Date.now(),
      targetId: 'cpu',
      statusType: 'burn',
      action: 'applied',
      value: 2,
      duration: 3,
    };
    expect(event.type).toBe('status');
    expect(event.action).toBe('applied');
  });

  it('should define death event', () => {
    const event: DeathEvent = {
      type: 'death',
      timestamp: Date.now(),
      combatantId: 'cpu',
      killerId: 'player',
    };
    expect(event.type).toBe('death');
  });

  it('should define phase event', () => {
    const event: PhaseEvent = {
      type: 'phase',
      timestamp: Date.now(),
      phase: 'attack',
      combatantId: 'player',
    };
    expect(event.type).toBe('phase');
    expect(event.phase).toBe('attack');
  });

  it('should use CombatEvent union type', () => {
    const events: CombatEvent[] = [
      { type: 'phase', timestamp: Date.now(), phase: 'pre_attack', combatantId: 'player' },
      { type: 'attack', timestamp: Date.now(), attackerId: 'player', defenderId: 'cpu', attackName: 'Slash', roll: 15, modifier: 3, total: 18, targetArmor: 12, hit: true },
      { type: 'damage', timestamp: Date.now(), targetId: 'cpu', sourceId: 'player', amount: 5, damageType: 'physical', source: 'attack' },
    ];
    expect(events).toHaveLength(3);
  });
});
