import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from './GameStateManager';
import { getAnimalById } from './data/animals';
import { getWeaponById } from './data/weapons';
import { getAccessoryById } from './data/accessories';

describe('GameStateManager', () => {
  let manager: GameStateManager;

  beforeEach(() => {
    manager = new GameStateManager();
  });

  describe('createNewRun', () => {
    it('should create a new run with player loadout', () => {
      const humphrey = getAnimalById('humphrey')!;
      const dagger = getWeaponById('rusty-dagger')!;
      const acorn = getAccessoryById('iron-acorn')!;

      const state = manager.createNewRun(humphrey, dagger, acorn);

      expect(state.player.animal.id).toBe('humphrey');
      expect(state.player.weapon?.id).toBe('rusty-dagger');
      expect(state.player.accessory?.id).toBe('iron-acorn');
      expect(state.player.currentHP).toBe(32); // 28 + 4 from iron acorn
      expect(state.player.maxHP).toBe(32);
      expect(state.run.currentCPU).toBe(1);
      expect(state.run.cpuDefeated).toEqual([false, false, false]);
    });

    it('should handle null weapon and accessory', () => {
      const humphrey = getAnimalById('humphrey')!;

      const state = manager.createNewRun(humphrey, null, null);

      expect(state.player.weapon).toBeNull();
      expect(state.player.accessory).toBeNull();
      expect(state.player.currentHP).toBe(28);
    });
  });

  describe('getCurrentCPUCombatant', () => {
    it('should return CPU 1 (Sarah) at start', () => {
      const humphrey = getAnimalById('humphrey')!;
      manager.createNewRun(humphrey, null, null);

      const cpu = manager.getCurrentCPUCombatant();

      expect(cpu?.animal.id).toBe('sarah');
      expect(cpu?.weapon?.id).toBe('rusty-dagger');
      expect(cpu?.accessory?.id).toBe('iron-acorn');
    });
  });

  describe('markCPUDefeated and advanceToNextCPU', () => {
    it('should track defeated CPUs and advance', () => {
      const humphrey = getAnimalById('humphrey')!;
      manager.createNewRun(humphrey, null, null);

      expect(manager.getState()?.run.currentCPU).toBe(1);

      manager.markCPUDefeated();
      expect(manager.getState()?.run.cpuDefeated[0]).toBe(true);

      const advanced = manager.advanceToNextCPU();
      expect(advanced).toBe(true);
      expect(manager.getState()?.run.currentCPU).toBe(2);

      const cpu2 = manager.getCurrentCPUCombatant();
      expect(cpu2?.animal.id).toBe('humphrey');
    });

    it('should not advance past CPU 3', () => {
      const humphrey = getAnimalById('humphrey')!;
      manager.createNewRun(humphrey, null, null);

      manager.markCPUDefeated();
      manager.advanceToNextCPU();
      manager.markCPUDefeated();
      manager.advanceToNextCPU();
      manager.markCPUDefeated();

      const advanced = manager.advanceToNextCPU();
      expect(advanced).toBe(false);
      expect(manager.getState()?.run.currentCPU).toBe(3);
    });
  });

  describe('isRunComplete', () => {
    it('should return true when all CPUs defeated', () => {
      const humphrey = getAnimalById('humphrey')!;
      manager.createNewRun(humphrey, null, null);

      expect(manager.isRunComplete()).toBe(false);

      manager.markCPUDefeated();
      manager.advanceToNextCPU();
      manager.markCPUDefeated();
      manager.advanceToNextCPU();
      manager.markCPUDefeated();

      expect(manager.isRunComplete()).toBe(true);
    });
  });

  describe('isRunFailed', () => {
    it('should return true when player HP <= 0', () => {
      const humphrey = getAnimalById('humphrey')!;
      manager.createNewRun(humphrey, null, null);

      expect(manager.isRunFailed()).toBe(false);

      manager.getState()!.player.currentHP = 0;
      expect(manager.isRunFailed()).toBe(true);
    });
  });

  describe('equipWeapon', () => {
    it('should change equipped weapon', () => {
      const humphrey = getAnimalById('humphrey')!;
      const dagger = getWeaponById('rusty-dagger')!;
      manager.createNewRun(humphrey, null, null);

      manager.equipWeapon(dagger);

      expect(manager.getState()?.player.weapon?.id).toBe('rusty-dagger');
    });
  });

  describe('equipAccessory', () => {
    it('should change equipped accessory and adjust HP', () => {
      const humphrey = getAnimalById('humphrey')!;
      const acorn = getAccessoryById('iron-acorn')!;
      manager.createNewRun(humphrey, null, null);

      expect(manager.getState()?.player.maxHP).toBe(28);

      manager.equipAccessory(acorn);

      expect(manager.getState()?.player.accessory?.id).toBe('iron-acorn');
      expect(manager.getState()?.player.maxHP).toBe(32);
      expect(manager.getState()?.player.currentHP).toBe(32);
    });

    it('should handle HP adjustment when swapping from HP accessory', () => {
      const humphrey = getAnimalById('humphrey')!;
      const acorn = getAccessoryById('iron-acorn')!;
      const pebble = getAccessoryById('lucky-pebble')!;
      manager.createNewRun(humphrey, null, acorn);

      expect(manager.getState()?.player.currentHP).toBe(32);

      // Simulate damage
      manager.getState()!.player.currentHP = 20;

      // Swap to non-HP accessory
      manager.equipAccessory(pebble);

      expect(manager.getState()?.player.maxHP).toBe(28);
      expect(manager.getState()?.player.currentHP).toBe(16); // 20 - 4
    });
  });

  describe('clearStatuses', () => {
    it('should remove all status effects', () => {
      const humphrey = getAnimalById('humphrey')!;
      manager.createNewRun(humphrey, null, null);
      manager.getState()!.player.statuses = [
        { type: 'burn', value: 2, duration: 3 },
        { type: 'weaken', value: 2, duration: 2 },
      ];

      manager.clearStatuses();

      expect(manager.getState()?.player.statuses).toEqual([]);
    });
  });
});
