import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TurnPhaseManager } from './TurnPhaseManager';
import { AnimationQueue } from './AnimationQueue';
import type { TurnPhase } from '../types/events';

describe('TurnPhaseManager', () => {
  let phaseManager: TurnPhaseManager;
  let animationQueue: AnimationQueue;

  beforeEach(() => {
    animationQueue = new AnimationQueue();
    phaseManager = new TurnPhaseManager(animationQueue);
  });

  describe('phase transitions', () => {
    it('should start at pre_attack phase', () => {
      expect(phaseManager.currentPhase).toBe('pre_attack');
    });

    it('should transition through phases in order', () => {
      phaseManager.startTurn('player');
      expect(phaseManager.currentPhase).toBe('pre_attack');

      phaseManager.nextPhase();
      expect(phaseManager.currentPhase).toBe('attack');

      phaseManager.nextPhase();
      expect(phaseManager.currentPhase).toBe('post_attack');

      phaseManager.nextPhase();
      expect(phaseManager.currentPhase).toBe('turn_end');
    });

    it('should emit phase events to animation queue', () => {
      const events: TurnPhase[] = [];
      animationQueue.subscribe((event) => {
        if (event.type === 'phase') {
          events.push(event.phase);
        }
      });

      phaseManager.startTurn('player');
      phaseManager.nextPhase();
      phaseManager.nextPhase();
      phaseManager.nextPhase();

      expect(events).toEqual(['pre_attack', 'attack', 'post_attack', 'turn_end']);
    });
  });

  describe('phase hooks', () => {
    it('should call registered hooks for each phase', async () => {
      const preAttackHook = vi.fn().mockResolvedValue(undefined);
      const attackHook = vi.fn().mockResolvedValue(undefined);

      phaseManager.registerHook('pre_attack', preAttackHook);
      phaseManager.registerHook('attack', attackHook);

      phaseManager.startTurn('player');
      await phaseManager.executeCurrentPhase();
      expect(preAttackHook).toHaveBeenCalledWith('player');

      phaseManager.nextPhase();
      await phaseManager.executeCurrentPhase();
      expect(attackHook).toHaveBeenCalledWith('player');
    });

    it('should call multiple hooks in registration order', async () => {
      const order: number[] = [];
      const hook1 = vi.fn().mockImplementation(async () => { order.push(1); });
      const hook2 = vi.fn().mockImplementation(async () => { order.push(2); });

      phaseManager.registerHook('attack', hook1);
      phaseManager.registerHook('attack', hook2);

      phaseManager.startTurn('player');
      phaseManager.nextPhase(); // Move to attack phase
      await phaseManager.executeCurrentPhase();

      expect(order).toEqual([1, 2]);
    });

    it('should allow unregistering hooks', async () => {
      const hook = vi.fn().mockResolvedValue(undefined);
      const unregister = phaseManager.registerHook('pre_attack', hook);

      unregister();

      phaseManager.startTurn('player');
      await phaseManager.executeCurrentPhase();
      expect(hook).not.toHaveBeenCalled();
    });
  });

  describe('executeTurn', () => {
    it('should execute all phases in sequence', async () => {
      const phases: TurnPhase[] = [];

      phaseManager.registerHook('pre_attack', async () => { phases.push('pre_attack'); });
      phaseManager.registerHook('attack', async () => { phases.push('attack'); });
      phaseManager.registerHook('post_attack', async () => { phases.push('post_attack'); });
      phaseManager.registerHook('turn_end', async () => { phases.push('turn_end'); });

      await phaseManager.executeTurn('player');

      expect(phases).toEqual(['pre_attack', 'attack', 'post_attack', 'turn_end']);
    });

    it('should track active combatant', async () => {
      let capturedCombatant: string | null = null;
      phaseManager.registerHook('attack', async (combatantId) => {
        capturedCombatant = combatantId;
      });

      await phaseManager.executeTurn('cpu');
      expect(capturedCombatant).toBe('cpu');
    });
  });

  describe('isPhaseComplete', () => {
    it('should track phase completion', () => {
      phaseManager.startTurn('player');
      expect(phaseManager.isPhaseComplete).toBe(false);

      phaseManager.markPhaseComplete();
      expect(phaseManager.isPhaseComplete).toBe(true);

      phaseManager.nextPhase();
      expect(phaseManager.isPhaseComplete).toBe(false);
    });
  });
});
