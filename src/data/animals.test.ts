import { describe, it, expect } from 'vitest';
import { ANIMALS, getAnimalById } from './animals';

describe('animals data', () => {
  it('should have exactly 18 animals', () => {
    expect(ANIMALS.length).toBe(18);
  });

  it('should include all animals', () => {
    const ids = ANIMALS.map(a => a.id);
    expect(ids).toContain('pang');
    expect(ids).toContain('humphrey');
    expect(ids).toContain('beep-boop');
    expect(ids).toContain('moo-man');
    expect(ids).toContain('sarah');
    expect(ids).toContain('wilber');
    expect(ids).toContain('geezer');
    expect(ids).toContain('stranger');
    expect(ids).toContain('oswald');
    expect(ids).toContain('quatack');
    expect(ids).toContain('thomas');
    expect(ids).toContain('wyatt');
    expect(ids).toContain('blackjack');
    expect(ids).toContain('finn');
    expect(ids).toContain('murder');
    expect(ids).toContain('pooty');
    expect(ids).toContain('esmeralda');
    expect(ids).toContain('sir-pokesalot');
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
