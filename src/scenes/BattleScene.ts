import Phaser from 'phaser';
import type { Combatant } from '../types';
import { gameStateManager } from '../GameStateManager';
import { CombatSystem, DiceRoller, StatusManager, type CombatEvent } from '../systems';

const TURN_DELAY = 1200; // ms between turns

export class BattleScene extends Phaser.Scene {
  private player: Combatant | null = null;
  private cpu: Combatant | null = null;

  private combatSystem: CombatSystem;
  private diceRoller: DiceRoller;
  private statusManager: StatusManager;

  private playerHPText: Phaser.GameObjects.Text | null = null;
  private cpuHPText: Phaser.GameObjects.Text | null = null;
  private playerStatusText: Phaser.GameObjects.Text | null = null;
  private cpuStatusText: Phaser.GameObjects.Text | null = null;

  private logText: Phaser.GameObjects.Text | null = null;
  private battleLog: string[] = [];

  private isPlayerTurn: boolean = true;
  private battleEnded: boolean = false;
  private cpuNumber: 1 | 2 | 3 = 1;

  constructor() {
    super({ key: 'BattleScene' });
    this.diceRoller = new DiceRoller();
    this.statusManager = new StatusManager();
    this.combatSystem = new CombatSystem(this.diceRoller, this.statusManager);
  }

  create(): void {
    const { width } = this.cameras.main;
    const state = gameStateManager.getState();

    if (!state) {
      this.scene.start('MenuScene');
      return;
    }

    // Reset battle state
    this.battleLog = [];
    this.battleEnded = false;
    this.cpuNumber = state.run.currentCPU;

    // Get combatants
    this.player = state.player;
    this.cpu = gameStateManager.getCurrentCPUCombatant();

    if (!this.cpu) {
      this.scene.start('MenuScene');
      return;
    }

    // Battle header
    this.add.text(width / 2, 30, `Battle ${this.cpuNumber} of 3`, {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Player side (left)
    this.add.text(150, 100, 'YOUR ANIMAL', {
      fontSize: '14px',
      color: '#88ff88',
    }).setOrigin(0.5);

    this.add.text(150, 130, this.getDisplayName(this.player), {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.playerHPText = this.add.text(150, 160, this.getHPDisplay(this.player), {
      fontSize: '18px',
      color: '#88ff88',
    }).setOrigin(0.5);

    this.playerStatusText = this.add.text(150, 185, '', {
      fontSize: '12px',
      color: '#ffaa00',
    }).setOrigin(0.5);

    // CPU side (right)
    this.add.text(width - 150, 100, `CPU ${this.cpuNumber}`, {
      fontSize: '14px',
      color: '#ff8888',
    }).setOrigin(0.5);

    this.add.text(width - 150, 130, this.getDisplayName(this.cpu), {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.cpuHPText = this.add.text(width - 150, 160, this.getHPDisplay(this.cpu), {
      fontSize: '18px',
      color: '#ff8888',
    }).setOrigin(0.5);

    this.cpuStatusText = this.add.text(width - 150, 185, '', {
      fontSize: '12px',
      color: '#ffaa00',
    }).setOrigin(0.5);

    // Battle log
    this.add.text(width / 2, 240, 'Battle Log', {
      fontSize: '16px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.logText = this.add.text(width / 2, 260, '', {
      fontSize: '14px',
      color: '#ffffff',
      wordWrap: { width: 600 },
      align: 'center',
    }).setOrigin(0.5, 0);

    // Determine first turn
    this.isPlayerTurn = this.diceRoller.coinFlip();
    this.addLog(`${this.isPlayerTurn ? 'You' : 'CPU'} go${this.isPlayerTurn ? '' : 'es'} first!`);

    // Start combat loop
    this.time.delayedCall(TURN_DELAY, () => this.executeTurn());
  }

  private getDisplayName(combatant: Combatant): string {
    let name = combatant.animal.name;
    if (combatant.weapon) {
      name += ` + ${combatant.weapon.name}`;
    }
    return name;
  }

  private getHPDisplay(combatant: Combatant): string {
    return `HP: ${Math.max(0, combatant.currentHP)} / ${combatant.maxHP}`;
  }

  private getStatusDisplay(combatant: Combatant): string {
    if (combatant.statuses.length === 0) return '';
    return combatant.statuses
      .map(s => `${s.type.toUpperCase()}(${s.duration})`)
      .join(' ');
  }

  private addLog(message: string): void {
    this.battleLog.unshift(message);
    if (this.battleLog.length > 8) {
      this.battleLog.pop();
    }
    this.logText?.setText(this.battleLog.join('\n'));
  }

  private updateDisplay(): void {
    if (this.player && this.playerHPText) {
      this.playerHPText.setText(this.getHPDisplay(this.player));
      this.playerStatusText?.setText(this.getStatusDisplay(this.player));
    }
    if (this.cpu && this.cpuHPText) {
      this.cpuHPText.setText(this.getHPDisplay(this.cpu));
      this.cpuStatusText?.setText(this.getStatusDisplay(this.cpu));
    }
  }

  private executeTurn(): void {
    if (this.battleEnded || !this.player || !this.cpu) return;

    const attacker = this.isPlayerTurn ? this.player : this.cpu;
    const defender = this.isPlayerTurn ? this.cpu : this.player;
    const attackerName = this.isPlayerTurn ? 'You' : 'CPU';
    const defenderName = this.isPlayerTurn ? 'CPU' : 'You';

    // Execute attack
    const attackEvent = this.combatSystem.executeAttack(attacker, defender);
    this.logAttackEvent(attackEvent, attackerName, defenderName);
    this.updateDisplay();

    // Check for death after attack
    if (this.combatSystem.isCombatantDead(defender)) {
      this.endBattle(this.isPlayerTurn);
      return;
    }

    // Execute turn end (DoT, regen)
    const turnEndEvent = this.combatSystem.executeTurnEnd(attacker);
    this.logTurnEndEvent(turnEndEvent, attackerName);
    this.updateDisplay();

    // Check for self-death (DoT)
    if (this.combatSystem.isCombatantDead(attacker)) {
      this.endBattle(!this.isPlayerTurn);
      return;
    }

    // Switch turns
    this.isPlayerTurn = !this.isPlayerTurn;

    // Continue combat
    this.time.delayedCall(TURN_DELAY, () => this.executeTurn());
  }

  private logAttackEvent(
    event: CombatEvent,
    attackerName: string,
    defenderName: string
  ): void {
    if (event.type !== 'attack') return;

    let msg = `${attackerName} use${attackerName === 'You' ? '' : 's'} ${event.attackName}! `;
    msg += `(${event.roll}+${event.modifier}=${event.total} vs ${event.targetArmor})`;

    if (event.dodged) {
      msg += ` - ${defenderName} dodged!`;
    } else if (event.hit) {
      msg += ` - HIT for ${event.damage} damage!`;
      if (event.statusApplied) {
        msg += ` Applied ${event.statusApplied}!`;
      }
      if (event.healing) {
        msg += ` Healed ${event.healing}!`;
      }
      if (event.reflectDamage) {
        msg += ` Took ${event.reflectDamage} reflect!`;
      }
    } else {
      msg += ` - MISS!`;
    }

    this.addLog(msg);
  }

  private logTurnEndEvent(event: CombatEvent, combatantName: string): void {
    if (event.type !== 'turn_end') return;

    if (event.dotDamage > 0) {
      this.addLog(`${combatantName} take${combatantName === 'You' ? '' : 's'} ${event.dotDamage} DoT damage!`);
    }
    if (event.regenHealing > 0) {
      this.addLog(`${combatantName} regenerate${combatantName === 'You' ? '' : 's'} ${event.regenHealing} HP!`);
    }
  }

  private endBattle(playerWon: boolean): void {
    this.battleEnded = true;

    if (playerWon) {
      this.addLog('--- VICTORY! ---');
      gameStateManager.markCPUDefeated();

      // Check if run is complete
      if (gameStateManager.isRunComplete()) {
        this.time.delayedCall(2000, () => {
          this.scene.start('ResultScene', { victory: true });
        });
      } else {
        // Clear statuses, go to draft
        gameStateManager.clearStatuses();
        this.time.delayedCall(2000, () => {
          this.scene.start('DraftScene');
        });
      }
    } else {
      this.addLog('--- DEFEAT ---');
      this.time.delayedCall(2000, () => {
        this.scene.start('ResultScene', { victory: false });
      });
    }
  }
}
