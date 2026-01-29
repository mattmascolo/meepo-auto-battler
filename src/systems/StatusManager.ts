import type { StatusEffect, StatusType } from '../types';

export class StatusManager {
  addStatus(statuses: StatusEffect[], type: StatusType, value: number, duration: number): void {
    const existing = statuses.find(s => s.type === type);
    if (existing) {
      existing.value = value;
      existing.duration = duration;
    } else {
      statuses.push({ type, value, duration });
    }
  }

  tickStatuses(statuses: StatusEffect[]): void {
    for (let i = statuses.length - 1; i >= 0; i--) {
      statuses[i].duration--;
      if (statuses[i].duration <= 0) {
        statuses.splice(i, 1);
      }
    }
  }

  calculateDotDamage(statuses: StatusEffect[]): number {
    return statuses
      .filter(s => s.type === 'burn' || s.type === 'poison')
      .reduce((sum, s) => sum + s.value, 0);
  }

  getWeakenAmount(statuses: StatusEffect[]): number {
    const weaken = statuses.find(s => s.type === 'weaken');
    return weaken?.value ?? 0;
  }

  getRegenAmount(statuses: StatusEffect[]): number {
    const regen = statuses.find(s => s.type === 'regen');
    return regen?.value ?? 0;
  }

  hasStatus(statuses: StatusEffect[], type: StatusType): boolean {
    return statuses.some(s => s.type === type);
  }

  clearStatuses(statuses: StatusEffect[]): void {
    statuses.length = 0;
  }
}
