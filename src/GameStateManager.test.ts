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
      const rat = getAnimalById('rat')!;
      const dagger = getWeaponById('rusty-dagger')!;
      const acorn = getAccessoryById('iron-acorn')!;

      const state = manager.createNewRun(rat, dagger, acorn);

      expect(state.player.animal.id).toBe('rat');
      expect(state.player.weapon?.id).toBe('rusty-dagger');
      expect(state.player.accessory?.id).toBe('iron-acorn');
      expect(state.player.currentHP).toBe(24); // 20 + 4 from iron acorn
      expect(state.player.maxHP).toBe(24);
      expect(state.run.currentCPU).toBe(1);
      expect(state.run.cpuDefeated).toEqual([false, false, false]);
    });

    it('should handle null weapon and accessory', () => {
      const rat = getAnimalById('rat')!;

      const state = manager.createNewRun(rat, null, null);

      expect(state.player.weapon).toBeNull();
      expect(state.player.accessory).toBeNull();
      expect(state.player.currentHP).toBe(20);
    });
  });

  describe('getCurrentCPUCombatant', () => {
    it('should return CPU 1 (Beetle) at start', () => {
      const rat = getAnimalById('rat')!;
      manager.createNewRun(rat, null, null);

      const cpu = manager.getCurrentCPUCombatant();

      expect(cpu?.animal.id).toBe('beetle');
      expect(cpu?.weapon?.id).toBe('rusty-dagger');
      expect(cpu?.accessory?.id).toBe('iron-acorn');
    });
  });

  describe('markCPUDefeated and advanceToNextCPU', () => {
    it('should track defeated CPUs and advance', () => {
      const rat = getAnimalById('rat')!;
      manager.createNewRun(rat, null, null);

      expect(manager.getState()?.run.currentCPU).toBe(1);

      manager.markCPUDefeated();
      expect(manager.getState()?.run.cpuDefeated[0]).toBe(true);

      const advanced = manager.advanceToNextCPU();
      expect(advanced).toBe(true);
      expect(manager.getState()?.run.currentCPU).toBe(2);

      const cpu2 = manager.getCurrentCPUCombatant();
      expect(cpu2?.animal.id).toBe('rat');
    });

    it('should not advance past CPU 3', () => {
      const rat = getAnimalById('rat')!;
      manager.createNewRun(rat, null, null);

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
      const rat = getAnimalById('rat')!;
      manager.createNewRun(rat, null, null);

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
      const rat = getAnimalById('rat')!;
      manager.createNewRun(rat, null, null);

      expect(manager.isRunFailed()).toBe(false);

      manager.getState()!.player.currentHP = 0;
      expect(manager.isRunFailed()).toBe(true);
    });
  });

  describe('equipWeapon', () => {
    it('should change equipped weapon', () => {
      const rat = getAnimalById('rat')!;
      const dagger = getWeaponById('rusty-dagger')!;
      manager.createNewRun(rat, null, null);

      manager.equipWeapon(dagger);

      expect(manager.getState()?.player.weapon?.id).toBe('rusty-dagger');
    });
  });

  describe('equipAccessory', () => {
    it('should change equipped accessory and adjust HP', () => {
      const rat = getAnimalById('rat')!;
      const acorn = getAccessoryById('iron-acorn')!;
      manager.createNewRun(rat, null, null);

      expect(manager.getState()?.player.maxHP).toBe(20);

      manager.equipAccessory(acorn);

      expect(manager.getState()?.player.accessory?.id).toBe('iron-acorn');
      expect(manager.getState()?.player.maxHP).toBe(24);
      expect(manager.getState()?.player.currentHP).toBe(24);
    });

    it('should handle HP adjustment when swapping from HP accessory', () => {
      const rat = getAnimalById('rat')!;
      const acorn = getAccessoryById('iron-acorn')!;
      const pebble = getAccessoryById('lucky-pebble')!;
      manager.createNewRun(rat, null, acorn);

      expect(manager.getState()?.player.currentHP).toBe(24);

      // Simulate damage
      manager.getState()!.player.currentHP = 15;

      // Swap to non-HP accessory
      manager.equipAccessory(pebble);

      expect(manager.getState()?.player.maxHP).toBe(20);
      expect(manager.getState()?.player.currentHP).toBe(11); // 15 - 4
    });
  });

  describe('clearStatuses', () => {
    it('should remove all status effects', () => {
      const rat = getAnimalById('rat')!;
      manager.createNewRun(rat, null, null);
      manager.getState()!.player.statuses = [
        { type: 'burn', value: 2, duration: 3 },
        { type: 'weaken', value: 2, duration: 2 },
      ];

      manager.clearStatuses();

      expect(manager.getState()?.player.statuses).toEqual([]);
    });
  });
});
