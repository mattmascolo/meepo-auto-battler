import { describe, it, expect } from 'vitest';
import { WEAPONS, getWeaponById } from './weapons';

describe('weapons data', () => {
  it('should have exactly 5 weapons', () => {
    expect(WEAPONS.length).toBe(5);
  });

  it('should include all MVP weapons', () => {
    const ids = WEAPONS.map(w => w.id);
    expect(ids).toContain('rusty-dagger');
    expect(ids).toContain('flame-stick');
    expect(ids).toContain('venom-fang');
    expect(ids).toContain('heavy-rock');
    expect(ids).toContain('sapping-thorn');
  });

  it('should retrieve rusty dagger by id', () => {
    const dagger = getWeaponById('rusty-dagger');
    expect(dagger).toBeDefined();
    expect(dagger?.name).toBe('Rusty Dagger');
    expect(dagger?.damage).toBe(5);
  });

  it('should have valid damage values', () => {
    for (const weapon of WEAPONS) {
      expect(weapon.name).toBeTruthy();
      expect(weapon.damage).toBeGreaterThan(0);
    }
  });

  it('flame stick should have burn effect', () => {
    const flameStick = getWeaponById('flame-stick');
    expect(flameStick?.effectType).toBe('burn');
    expect(flameStick?.effectChance).toBe(40);
  });
});
