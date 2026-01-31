import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EffectSystem } from './EffectSystem';
import { AnimationQueue } from './AnimationQueue';
import { TurnPhaseManager } from './TurnPhaseManager';
import { DiceRoller } from './DiceRoller';
import { collectCombatantEffects } from '../data/effects';
import type { EffectContext } from '../types/effects';
import type { CombatEvent } from '../types/events';

describe('Systems Integration', () => {
  let diceRoller: DiceRoller;
  let effectSystem: EffectSystem;
  let animationQueue: AnimationQueue;
  let phaseManager: TurnPhaseManager;

  beforeEach(() => {
    diceRoller = new DiceRoller();
    effectSystem = new EffectSystem(diceRoller);
    animationQueue = new AnimationQueue();
    phaseManager = new TurnPhaseManager(animationQueue);
  });

  it('should collect and evaluate effects for Pang with Flame Stick', () => {
    const effects = collectCombatantEffects('pang', 'flame-stick');

    // Should have Frost Aura passive + Flame Stick burn proc
    expect(effects).toHaveLength(2);

    // Test Frost Aura evaluation
    const frostAura = effects.find(e => e.id === 'pang-frost-aura');
    expect(frostAura).toBeDefined();

    const context: EffectContext = {
      owner: { currentHP: 16, maxHP: 16, attackMod: 4, armor: 9 },
      opponent: { currentHP: 20, maxHP: 20, attackMod: 2, armor: 12 },
      trigger: 'always',
    };

    const result = effectSystem.evaluate(frostAura!, context);
    expect(result.applied).toBe(true);
    expect(result.modifiers?.attackMod).toBe(-1);
    expect(result.target).toBe('enemy');
  });

  it('should emit phase events during turn execution', async () => {
    const events: CombatEvent[] = [];
    animationQueue.subscribe((event) => events.push(event));

    await phaseManager.executeTurn('player');

    const phaseEvents = events.filter(e => e.type === 'phase');
    expect(phaseEvents).toHaveLength(4);
    expect(phaseEvents.map(e => e.type === 'phase' && e.phase)).toEqual([
      'pre_attack',
      'attack',
      'post_attack',
      'turn_end',
    ]);
  });

  it('should evaluate conditional effects based on HP', () => {
    const effects = collectCombatantEffects('moo-man');
    const milkPower = effects.find(e => e.id === 'moo-man-milk-power');
    expect(milkPower).toBeDefined();

    // Above 50% HP - should not trigger
    const contextAbove: EffectContext = {
      owner: { currentHP: 20, maxHP: 26, attackMod: 2, armor: 12 },
      trigger: 'hp_below',
    };
    const resultAbove = effectSystem.evaluate(milkPower!, contextAbove);
    expect(resultAbove.applied).toBe(false);

    // Below 50% HP - should trigger
    const contextBelow: EffectContext = {
      owner: { currentHP: 10, maxHP: 26, attackMod: 2, armor: 12 },
      trigger: 'hp_below',
    };
    const resultBelow = effectSystem.evaluate(milkPower!, contextBelow);
    expect(resultBelow.applied).toBe(true);
    expect(resultBelow.healing).toBe(2);
  });

  it('should handle proc chance effects', () => {
    vi.spyOn(diceRoller, 'checkProc').mockReturnValue(true);

    const effects = collectCombatantEffects('toad', 'flame-stick');
    const burnProc = effects.find(e => e.id === 'flame-stick-burn');
    expect(burnProc).toBeDefined();

    const context: EffectContext = {
      owner: { currentHP: 28, maxHP: 28, attackMod: 1, armor: 11 },
      trigger: 'on_hit',
      damageDealt: 4,
    };

    const result = effectSystem.evaluate(burnProc!, context);
    expect(result.applied).toBe(true);
    expect(result.status?.type).toBe('burn');
    expect(diceRoller.checkProc).toHaveBeenCalledWith(40);
  });

  it('should process animation queue events in order', async () => {
    const processed: string[] = [];

    animationQueue.enqueue({
      type: 'phase',
      timestamp: 1,
      phase: 'attack',
      combatantId: 'player',
    });
    animationQueue.enqueue({
      type: 'damage',
      timestamp: 2,
      targetId: 'cpu',
      sourceId: 'player',
      amount: 5,
      damageType: 'physical',
      source: 'attack',
    });
    animationQueue.enqueue({
      type: 'status',
      timestamp: 3,
      targetId: 'cpu',
      statusType: 'burn',
      action: 'applied',
      value: 2,
      duration: 3,
    });

    await animationQueue.processAll(async (event) => {
      processed.push(`${event.type}-${event.timestamp}`);
    });

    expect(processed).toEqual(['phase-1', 'damage-2', 'status-3']);
  });
});
