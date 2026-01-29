import { describe, it, expect } from 'vitest';
import { CPU_LOADOUTS, getCPULoadout } from './cpuLoadouts';

describe('CPU loadouts data', () => {
  it('should have exactly 3 CPU loadouts', () => {
    expect(CPU_LOADOUTS.length).toBe(3);
  });

  it('should have easy, medium, hard difficulties', () => {
    expect(getCPULoadout(1)).toBeDefined();
    expect(getCPULoadout(2)).toBeDefined();
    expect(getCPULoadout(3)).toBeDefined();
  });

  it('CPU 1 (easy) should be Beetle', () => {
    const cpu1 = getCPULoadout(1);
    expect(cpu1?.animal.id).toBe('beetle');
    expect(cpu1?.weapon.id).toBe('rusty-dagger');
    expect(cpu1?.accessory.id).toBe('iron-acorn');
  });

  it('CPU 2 (medium) should be Rat', () => {
    const cpu2 = getCPULoadout(2);
    expect(cpu2?.animal.id).toBe('rat');
    expect(cpu2?.weapon.id).toBe('flame-stick');
    expect(cpu2?.accessory.id).toBe('lucky-pebble');
  });

  it('CPU 3 (hard) should be Spider', () => {
    const cpu3 = getCPULoadout(3);
    expect(cpu3?.animal.id).toBe('spider');
    expect(cpu3?.weapon.id).toBe('venom-fang');
    expect(cpu3?.accessory.id).toBe('adrenaline-gland');
  });

  it('all loadouts should have valid animal, weapon, accessory', () => {
    for (const loadout of CPU_LOADOUTS) {
      expect(loadout.animal).toBeDefined();
      expect(loadout.animal.stats).toBeDefined();
      expect(loadout.weapon).toBeDefined();
      expect(loadout.weapon.damage).toBeGreaterThan(0);
      expect(loadout.accessory).toBeDefined();
    }
  });
});
