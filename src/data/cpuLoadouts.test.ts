import { describe, it, expect } from 'vitest';
import { CPU_LOADOUTS, getCPULoadout } from './cpuLoadouts';

describe('CPU loadouts data', () => {
  it('should have exactly 4 CPU loadouts', () => {
    expect(CPU_LOADOUTS.length).toBe(4);
  });

  it('should have all 4 difficulties', () => {
    expect(getCPULoadout(1)).toBeDefined();
    expect(getCPULoadout(2)).toBeDefined();
    expect(getCPULoadout(3)).toBeDefined();
    expect(getCPULoadout(4)).toBeDefined();
  });

  it('CPU 1 (easy) should be Sarah with no items', () => {
    const cpu1 = getCPULoadout(1);
    expect(cpu1?.animal.id).toBe('sarah');
    expect(cpu1?.weapon).toBeNull();
    expect(cpu1?.accessory).toBeNull();
  });

  it('CPU 2 (medium) should be Humphrey with no items', () => {
    const cpu2 = getCPULoadout(2);
    expect(cpu2?.animal.id).toBe('humphrey');
    expect(cpu2?.weapon).toBeNull();
    expect(cpu2?.accessory).toBeNull();
  });

  it('CPU 3 (hard) should be Humphrey with no items', () => {
    const cpu3 = getCPULoadout(3);
    expect(cpu3?.animal.id).toBe('humphrey');
    expect(cpu3?.weapon).toBeNull();
    expect(cpu3?.accessory).toBeNull();
  });

  it('CPU 4 (final boss) should be Geezer with no items', () => {
    const cpu4 = getCPULoadout(4);
    expect(cpu4?.animal.id).toBe('geezer');
    expect(cpu4?.weapon).toBeNull();
    expect(cpu4?.accessory).toBeNull();
  });

  it('all loadouts should have valid animal', () => {
    for (const loadout of CPU_LOADOUTS) {
      expect(loadout.animal).toBeDefined();
      expect(loadout.animal.stats).toBeDefined();
    }
  });
});
