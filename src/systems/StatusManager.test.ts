import { describe, it, expect, beforeEach } from 'vitest';
import { StatusManager } from './StatusManager';
import type { StatusEffect } from '../types';

describe('StatusManager', () => {
  let manager: StatusManager;

  beforeEach(() => {
    manager = new StatusManager();
  });

  describe('addStatus', () => {
    it('should add a new status effect', () => {
      const statuses: StatusEffect[] = [];
      manager.addStatus(statuses, 'burn', 2, 3);
      expect(statuses.length).toBe(1);
      expect(statuses[0].type).toBe('burn');
      expect(statuses[0].value).toBe(2);
      expect(statuses[0].duration).toBe(3);
    });

    it('should refresh duration if status already exists', () => {
      const statuses: StatusEffect[] = [{ type: 'burn', value: 2, duration: 1 }];
      manager.addStatus(statuses, 'burn', 3, 3);
      expect(statuses.length).toBe(1);
      expect(statuses[0].duration).toBe(3);
      expect(statuses[0].value).toBe(3);
    });

    it('should allow multiple different status types', () => {
      const statuses: StatusEffect[] = [];
      manager.addStatus(statuses, 'burn', 2, 3);
      manager.addStatus(statuses, 'poison', 2, 3);
      expect(statuses.length).toBe(2);
    });
  });

  describe('tickStatuses', () => {
    it('should decrease duration of all statuses', () => {
      const statuses: StatusEffect[] = [
        { type: 'burn', value: 2, duration: 3 },
        { type: 'weaken', value: 2, duration: 2 },
      ];
      manager.tickStatuses(statuses);
      expect(statuses[0].duration).toBe(2);
      expect(statuses[1].duration).toBe(1);
    });

    it('should remove statuses with 0 duration', () => {
      const statuses: StatusEffect[] = [
        { type: 'burn', value: 2, duration: 1 },
        { type: 'weaken', value: 2, duration: 2 },
      ];
      manager.tickStatuses(statuses);
      expect(statuses.length).toBe(1);
      expect(statuses[0].type).toBe('weaken');
    });
  });

  describe('calculateDotDamage', () => {
    it('should sum burn and poison damage', () => {
      const statuses: StatusEffect[] = [
        { type: 'burn', value: 2, duration: 3 },
        { type: 'poison', value: 3, duration: 2 },
      ];
      expect(manager.calculateDotDamage(statuses)).toBe(5);
    });

    it('should return 0 if no DoT statuses', () => {
      const statuses: StatusEffect[] = [
        { type: 'weaken', value: 2, duration: 2 },
      ];
      expect(manager.calculateDotDamage(statuses)).toBe(0);
    });
  });

  describe('getWeakenAmount', () => {
    it('should return total weaken value', () => {
      const statuses: StatusEffect[] = [
        { type: 'weaken', value: 2, duration: 2 },
      ];
      expect(manager.getWeakenAmount(statuses)).toBe(2);
    });

    it('should return 0 if not weakened', () => {
      const statuses: StatusEffect[] = [];
      expect(manager.getWeakenAmount(statuses)).toBe(0);
    });
  });

  describe('getRegenAmount', () => {
    it('should return regen value', () => {
      const statuses: StatusEffect[] = [
        { type: 'regen', value: 3, duration: 3 },
      ];
      expect(manager.getRegenAmount(statuses)).toBe(3);
    });

    it('should return 0 if no regen', () => {
      const statuses: StatusEffect[] = [];
      expect(manager.getRegenAmount(statuses)).toBe(0);
    });
  });

  describe('hasStatus', () => {
    it('should return true if status exists', () => {
      const statuses: StatusEffect[] = [{ type: 'burn', value: 2, duration: 3 }];
      expect(manager.hasStatus(statuses, 'burn')).toBe(true);
    });

    it('should return false if status does not exist', () => {
      const statuses: StatusEffect[] = [];
      expect(manager.hasStatus(statuses, 'burn')).toBe(false);
    });
  });
});
