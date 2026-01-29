export interface RollResult {
  roll: number;
  modifier: number;
  total: number;
  target: number;
  hit: boolean;
}

export class DiceRoller {
  rollD20(): number {
    return Math.floor(Math.random() * 20) + 1;
  }

  rollToHit(attackMod: number, armor: number): RollResult {
    const roll = this.rollD20();
    const total = roll + attackMod;
    return {
      roll,
      modifier: attackMod,
      total,
      target: armor,
      hit: total >= armor,
    };
  }

  rollPercentage(): number {
    return Math.floor(Math.random() * 100) + 1;
  }

  checkProc(chance: number): boolean {
    if (chance <= 0) return false;
    if (chance >= 100) return true;
    return this.rollPercentage() <= chance;
  }

  coinFlip(): boolean {
    return Math.random() < 0.5;
  }
}
