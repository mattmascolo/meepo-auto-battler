import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DiceRoller } from './DiceRoller';

describe('DiceRoller', () => {
  let roller: DiceRoller;

  beforeEach(() => {
    roller = new DiceRoller();
  });

  describe('rollD20', () => {
    it('should return a number between 1 and 20', () => {
      for (let i = 0; i < 100; i++) {
        const result = roller.rollD20();
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(20);
      }
    });
  });

  describe('rollToHit', () => {
    it('should return hit when roll + modifier >= armor', () => {
      vi.spyOn(roller, 'rollD20').mockReturnValue(10);
      const result = roller.rollToHit(5, 15); // 10 + 5 = 15 >= 15
      expect(result.hit).toBe(true);
      expect(result.roll).toBe(10);
      expect(result.total).toBe(15);
    });

    it('should return miss when roll + modifier < armor', () => {
      vi.spyOn(roller, 'rollD20').mockReturnValue(10);
      const result = roller.rollToHit(4, 15); // 10 + 4 = 14 < 15
      expect(result.hit).toBe(false);
      expect(result.roll).toBe(10);
      expect(result.total).toBe(14);
    });

    it('should handle negative modifiers', () => {
      vi.spyOn(roller, 'rollD20').mockReturnValue(15);
      const result = roller.rollToHit(-2, 12); // 15 + (-2) = 13 >= 12
      expect(result.hit).toBe(true);
      expect(result.total).toBe(13);
    });
  });

  describe('rollPercentage', () => {
    it('should return a number between 1 and 100', () => {
      for (let i = 0; i < 100; i++) {
        const result = roller.rollPercentage();
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('checkProc', () => {
    it('should return true when roll <= chance', () => {
      vi.spyOn(roller, 'rollPercentage').mockReturnValue(30);
      expect(roller.checkProc(40)).toBe(true);
    });

    it('should return false when roll > chance', () => {
      vi.spyOn(roller, 'rollPercentage').mockReturnValue(50);
      expect(roller.checkProc(40)).toBe(false);
    });

    it('should handle 0% chance', () => {
      expect(roller.checkProc(0)).toBe(false);
    });

    it('should handle 100% chance', () => {
      expect(roller.checkProc(100)).toBe(true);
    });
  });

  describe('coinFlip', () => {
    it('should return true or false', () => {
      const results = new Set<boolean>();
      for (let i = 0; i < 100; i++) {
        results.add(roller.coinFlip());
      }
      expect(results.has(true)).toBe(true);
      expect(results.has(false)).toBe(true);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
