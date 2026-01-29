import { describe, it, expect } from 'vitest';
import { ACCESSORIES, getAccessoryById } from './accessories';

describe('accessories data', () => {
  it('should have exactly 5 accessories', () => {
    expect(ACCESSORIES.length).toBe(5);
  });

  it('should include all MVP accessories', () => {
    const ids = ACCESSORIES.map(a => a.id);
    expect(ids).toContain('iron-acorn');
    expect(ids).toContain('lucky-pebble');
    expect(ids).toContain('spiked-collar');
    expect(ids).toContain('adrenaline-gland');
    expect(ids).toContain('ember-charm');
  });

  it('should retrieve iron acorn by id', () => {
    const acorn = getAccessoryById('iron-acorn');
    expect(acorn).toBeDefined();
    expect(acorn?.name).toBe('Iron Acorn');
    expect(acorn?.type).toBe('stat');
    expect(acorn?.effect.hp).toBe(4);
  });

  it('should have valid types', () => {
    for (const accessory of ACCESSORIES) {
      expect(accessory.name).toBeTruthy();
      expect(['stat', 'reactive', 'buff']).toContain(accessory.type);
    }
  });

  it('spiked collar should deal damage when hit', () => {
    const collar = getAccessoryById('spiked-collar');
    expect(collar?.type).toBe('reactive');
    expect(collar?.effect.damageOnHit).toBe(2);
  });
});
