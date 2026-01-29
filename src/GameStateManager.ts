import type { Animal, Weapon, Accessory, Combatant, GameState } from './types';
import { getCPULoadout } from './data';

export class GameStateManager {
  private state: GameState | null = null;

  createNewRun(animal: Animal, weapon: Weapon | null, accessory: Accessory | null): GameState {
    const bonusHP = accessory?.effect.hp ?? 0;
    const maxHP = animal.stats.hp + bonusHP;

    this.state = {
      player: {
        animal,
        weapon,
        accessory,
        currentHP: maxHP,
        maxHP,
        statuses: [],
      },
      run: {
        currentCPU: 1,
        cpuDefeated: [false, false, false],
      },
    };

    return this.state;
  }

  getState(): GameState | null {
    return this.state;
  }

  getPlayerCombatant(): Combatant | null {
    return this.state?.player ?? null;
  }

  getCurrentCPUCombatant(): Combatant | null {
    if (!this.state) return null;

    const loadout = getCPULoadout(this.state.run.currentCPU);
    if (!loadout) return null;

    const bonusHP = loadout.accessory.effect.hp ?? 0;
    const maxHP = loadout.animal.stats.hp + bonusHP;

    return {
      animal: loadout.animal,
      weapon: loadout.weapon,
      accessory: loadout.accessory,
      currentHP: maxHP,
      maxHP,
      statuses: [],
    };
  }

  markCPUDefeated(): void {
    if (!this.state) return;

    const cpuIndex = this.state.run.currentCPU - 1;
    this.state.run.cpuDefeated[cpuIndex] = true;
  }

  advanceToNextCPU(): boolean {
    if (!this.state) return false;

    if (this.state.run.currentCPU < 3) {
      this.state.run.currentCPU = (this.state.run.currentCPU + 1) as 1 | 2 | 3;
      return true;
    }
    return false;
  }

  isRunComplete(): boolean {
    if (!this.state) return false;
    return this.state.run.cpuDefeated.every(d => d);
  }

  isRunFailed(): boolean {
    if (!this.state) return false;
    return this.state.player.currentHP <= 0;
  }

  equipWeapon(weapon: Weapon | null): void {
    if (!this.state) return;
    this.state.player.weapon = weapon;
  }

  equipAccessory(accessory: Accessory | null): void {
    if (!this.state) return;

    const oldBonusHP = this.state.player.accessory?.effect.hp ?? 0;
    const newBonusHP = accessory?.effect.hp ?? 0;
    const hpDiff = newBonusHP - oldBonusHP;

    this.state.player.accessory = accessory;
    this.state.player.maxHP += hpDiff;
    this.state.player.currentHP = Math.min(this.state.player.currentHP + hpDiff, this.state.player.maxHP);

    // Ensure HP doesn't go below 1 when swapping to lower HP accessory
    if (this.state.player.currentHP < 1) {
      this.state.player.currentHP = 1;
    }
  }

  clearStatuses(): void {
    if (!this.state) return;
    this.state.player.statuses = [];
  }

  resetRun(): void {
    this.state = null;
  }
}

export const gameStateManager = new GameStateManager();
