import { describe, it, expect } from 'vitest';
import { PassiveRegistry } from './PassiveRegistry';
import type { PassiveStatHandler, PassiveAttackHandler, PassiveTurnEndHandler } from './types';

describe('PassiveRegistry', () => {
  describe('registerStatHandler', () => {
    it('should register and retrieve a stat handler', () => {
      const registry = new PassiveRegistry();
      const mockHandler: PassiveStatHandler = () => ({ attackMod: 1 });

      registry.registerStatHandler('stat_flat', mockHandler);
      const handlers = registry.getStatHandlers('stat_flat');

      expect(handlers).toHaveLength(1);
      expect(handlers[0]).toBe(mockHandler);
    });
  });

  describe('getStatHandlers', () => {
    it('should return empty array for unregistered type', () => {
      const registry = new PassiveRegistry();
      const handlers = registry.getStatHandlers('on_hit');

      expect(handlers).toEqual([]);
    });
  });

  describe('registerAttackHandler', () => {
    it('should register and retrieve an attack handler', () => {
      const registry = new PassiveRegistry();
      const mockHandler: PassiveAttackHandler = () => ({ dodged: true });

      registry.registerAttackHandler('on_attacked', mockHandler);
      const handlers = registry.getAttackHandlers('on_attacked');

      expect(handlers).toHaveLength(1);
      expect(handlers[0]).toBe(mockHandler);
    });
  });

  describe('registerTurnEndHandler', () => {
    it('should register and retrieve a turn end handler', () => {
      const registry = new PassiveRegistry();
      const mockHandler: PassiveTurnEndHandler = () => ({ regen: 2 });

      registry.registerTurnEndHandler('per_turn', mockHandler);
      const handlers = registry.getTurnEndHandlers('per_turn');

      expect(handlers).toHaveLength(1);
      expect(handlers[0]).toBe(mockHandler);
    });
  });
});
