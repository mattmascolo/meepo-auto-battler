import { describe, it, expect } from 'vitest';
import { ANIMALS, getAnimalById } from './animals';

describe('animals data', () => {
  it('should have exactly 5 animals', () => {
    expect(ANIMALS.length).toBe(5);
  });

  it('should include all MVP animals', () => {
    const ids = ANIMALS.map(a => a.id);
    expect(ids).toContain('rat');
    expect(ids).toContain('toad');
    expect(ids).toContain('spider');
    expect(ids).toContain('mosquito');
    expect(ids).toContain('beetle');
  });

  it('should retrieve rat by id', () => {
    const rat = getAnimalById('rat');
    expect(rat).toBeDefined();
    expect(rat?.name).toBe('Rat');
    expect(rat?.stats.hp).toBe(20);
    expect(rat?.stats.attackMod).toBe(3);
    expect(rat?.stats.armor).toBe(10);
  });

  it('should have valid unarmed attacks', () => {
    for (const animal of ANIMALS) {
      expect(animal.unarmedAttack.name).toBeTruthy();
      expect(animal.unarmedAttack.damage).toBeGreaterThanOrEqual(0);
    }
  });

  it('should have valid passives', () => {
    for (const animal of ANIMALS) {
      expect(animal.passive.name).toBeTruthy();
      expect(animal.passive.description).toBeTruthy();
    }
  });
});
