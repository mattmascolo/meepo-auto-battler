import { describe, it, expect } from 'vitest';
import { ANIMALS, getAnimalById } from './animals';

describe('animals data', () => {
  it('should have exactly 5 animals', () => {
    expect(ANIMALS.length).toBe(5);
  });

  it('should include all playable animals', () => {
    const ids = ANIMALS.map(a => a.id);
    expect(ids).toContain('pang');
    expect(ids).toContain('toad');
    expect(ids).toContain('beep-boop');
    expect(ids).toContain('moo-man');
    expect(ids).toContain('beetle');
  });

  it('should retrieve pang by id', () => {
    const pang = getAnimalById('pang');
    expect(pang).toBeDefined();
    expect(pang?.name).toBe('Pang');
    expect(pang?.stats.hp).toBe(16);
    expect(pang?.stats.attackMod).toBe(4);
    expect(pang?.stats.armor).toBe(9);
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
