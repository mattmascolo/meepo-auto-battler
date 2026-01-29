import Phaser from 'phaser';
import type { Combatant } from '../types';
import { gameStateManager } from '../GameStateManager';
import { CombatSystem, DiceRoller, StatusManager, type CombatEvent } from '../systems';

const TURN_DELAY = 2000; // ms between turns (slower for readability)
const DICE_ROLL_DURATION = 800; // ms for dice animation
const SHAKE_DURATION = 100; // ms for shake animation
const SHAKE_INTENSITY = 5; // pixels

export class BattleScene extends Phaser.Scene {
  private player: Combatant | null = null;
  private cpu: Combatant | null = null;

  private combatSystem: CombatSystem;
  private diceRoller: DiceRoller;
  private statusManager: StatusManager;

  private playerSprite: Phaser.GameObjects.Image | null = null;
  private cpuSprite: Phaser.GameObjects.Image | null = null;

  private playerHPText: Phaser.GameObjects.Text | null = null;
  private cpuHPText: Phaser.GameObjects.Text | null = null;
  private playerStatusText: Phaser.GameObjects.Text | null = null;
  private cpuStatusText: Phaser.GameObjects.Text | null = null;

  private logText: Phaser.GameObjects.Text | null = null;
  private battleLog: string[] = [];

  // Dice display
  private diceText: Phaser.GameObjects.Text | null = null;
  private diceContainer: Phaser.GameObjects.Container | null = null;

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
    this.add.text(width / 2, 20, `Battle ${this.cpuNumber} of 3`, {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Player side (left) - sprite and info
    this.add.text(150, 50, 'YOUR ANIMAL', {
      fontSize: '14px',
      color: '#88ff88',
    }).setOrigin(0.5);

    // Player sprite
    const playerAnimalId = this.player.animal.id;
    this.playerSprite = this.add.image(150, 140, playerAnimalId)
      .setDisplaySize(100, 100);

    this.add.text(150, 200, this.getDisplayName(this.player), {
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.playerHPText = this.add.text(150, 225, this.getHPDisplay(this.player), {
      fontSize: '18px',
      color: '#88ff88',
    }).setOrigin(0.5);

    this.playerStatusText = this.add.text(150, 250, '', {
      fontSize: '12px',
      color: '#ffaa00',
    }).setOrigin(0.5);

    // CPU side (right) - sprite and info
    this.add.text(width - 150, 50, `CPU ${this.cpuNumber}`, {
      fontSize: '14px',
      color: '#ff8888',
    }).setOrigin(0.5);

    // CPU sprite (flipped to face player)
    const cpuAnimalId = this.cpu.animal.id;
    this.cpuSprite = this.add.image(width - 150, 140, cpuAnimalId)
      .setDisplaySize(100, 100)
      .setFlipX(true); // Face the player

    this.add.text(width - 150, 200, this.getDisplayName(this.cpu), {
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.cpuHPText = this.add.text(width - 150, 225, this.getHPDisplay(this.cpu), {
      fontSize: '18px',
      color: '#ff8888',
    }).setOrigin(0.5);

    this.cpuStatusText = this.add.text(width - 150, 250, '', {
      fontSize: '12px',
      color: '#ffaa00',
    }).setOrigin(0.5);

    // Stats panels for each combatant
    this.createStatsPanel(this.player, 150, 275);
    this.createStatsPanel(this.cpu, width - 150, 275);

    // Dice display in center
    this.createDiceDisplay(width / 2, 140);

    // Battle log
    this.add.text(width / 2, 350, 'Battle Log', {
      fontSize: '16px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.logText = this.add.text(width / 2, 370, '', {
      fontSize: '13px',
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

  private createDiceDisplay(x: number, y: number): void {
    this.diceContainer = this.add.container(x, y);

    // Dice background (d20 shape approximation - hexagon-ish)
    const diceBg = this.add.graphics();
    diceBg.fillStyle(0x2a2a4a, 1);
    diceBg.lineStyle(3, 0x6a6a9a, 1);
    diceBg.fillRoundedRect(-40, -40, 80, 80, 8);
    diceBg.strokeRoundedRect(-40, -40, 80, 80, 8);

    // "d20" label
    const d20Label = this.add.text(0, -55, 'd20', {
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5);

    // Dice number
    this.diceText = this.add.text(0, 0, '--', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.diceContainer.add([diceBg, d20Label, this.diceText]);
    this.diceContainer.setAlpha(0.5);
  }

  private async animateDiceRoll(finalValue: number, modifier: number, targetArmor: number): Promise<void> {
    if (!this.diceText || !this.diceContainer) return;

    // Make dice visible
    this.diceContainer.setAlpha(1);

    // Animate rolling through random numbers
    const rollCount = 10;
    const rollInterval = DICE_ROLL_DURATION / rollCount;

    for (let i = 0; i < rollCount; i++) {
      const randomNum = Math.floor(Math.random() * 20) + 1;
      this.diceText.setText(String(randomNum));

      // Flash colors during roll
      this.diceText.setColor(i % 2 === 0 ? '#ffff88' : '#ffffff');

      await this.delay(rollInterval);
    }

    // Show final value with color based on result
    const total = finalValue + modifier;
    const isHit = total >= targetArmor;
    const isCrit = finalValue === 20;
    const isFumble = finalValue === 1;

    if (isCrit) {
      this.diceText.setText('20!');
      this.diceText.setColor('#ffff00'); // Gold for crit
    } else if (isFumble) {
      this.diceText.setText('1');
      this.diceText.setColor('#ff4444'); // Red for fumble
    } else {
      this.diceText.setText(String(finalValue));
      this.diceText.setColor(isHit ? '#88ff88' : '#ff8888');
    }

    // Brief pause to show result
    await this.delay(400);

    // Fade out
    this.tweens.add({
      targets: this.diceContainer,
      alpha: 0.5,
      duration: 300,
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => this.time.delayedCall(ms, resolve));
  }

  private getDisplayName(combatant: Combatant): string {
    return combatant.animal.name;
  }

  private getWeaponEmoji(weaponId: string | undefined): string {
    if (!weaponId) return '👊';
    const emojiMap: Record<string, string> = {
      'rusty-dagger': '🗡️',
      'flame-stick': '🔥',
      'venom-fang': '🐍',
      'heavy-rock': '🪨',
      'sapping-thorn': '🌿',
      'thunderclaw': '⚡',
      'vampiric_fang': '🦇',
      'blazing_brand': '🔥',
      'frozen_blade': '❄️',
      'assassins_needle': '🎯',
    };
    return emojiMap[weaponId] || '⚔️';
  }

  private getAccessoryEmoji(accessoryId: string | undefined): string {
    if (!accessoryId) return '';
    const emojiMap: Record<string, string> = {
      'lucky-pebble': '🍀',
      'thick-hide': '🛡️',
      'spiked-collar': '📍',
      'ember-charm': '🔥',
      'adrenaline-gland': '💉',
      'giants_heart': '💜',
      'berserker_totem': '😤',
      'mirror_shield': '🪞',
      'phoenix_charm': '🔆',
      'dragons_scale': '🐉',
      'inferno_ring': '💍',
    };
    return emojiMap[accessoryId] || '💎';
  }

  private createStatsPanel(combatant: Combatant, x: number, y: number): void {
    const attackMod = this.combatSystem.getEffectiveAttackMod(combatant, null);
    const armor = this.combatSystem.getEffectiveArmor(combatant);
    const damage = this.combatSystem.getAttackDamage(combatant);

    // Stats line
    this.add.text(x, y, `⚔️ +${attackMod}  🛡️ ${armor}  💥 ${damage}`, {
      fontSize: '12px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Weapon line
    const weaponEmoji = this.getWeaponEmoji(combatant.weapon?.id);
    const weaponName = combatant.weapon?.name || 'Unarmed';
    let weaponDesc = `${weaponEmoji} ${weaponName}`;
    if (combatant.weapon?.effectType) {
      weaponDesc += ` (${combatant.weapon.effectChance}% ${combatant.weapon.effectType})`;
    }
    if (combatant.weapon?.healOnHit) {
      weaponDesc += ` (+${combatant.weapon.healOnHit} heal)`;
    }
    this.add.text(x, y + 18, weaponDesc, {
      fontSize: '11px',
      color: '#ff9966',
    }).setOrigin(0.5);

    // Accessory line
    if (combatant.accessory) {
      const accEmoji = this.getAccessoryEmoji(combatant.accessory.id);
      let accDesc = `${accEmoji} ${combatant.accessory.name}`;
      const effect = combatant.accessory.effect;
      const parts: string[] = [];
      if (effect.hp) parts.push(`+${effect.hp} HP`);
      if (effect.armor) parts.push(`+${effect.armor} Armor`);
      if (effect.attackMod) parts.push(`+${effect.attackMod} Atk`);
      if (effect.damageOnHit) parts.push(`${effect.damageOnHit} reflect`);
      if (effect.burnChance) parts.push(`${effect.burnChance}% burn`);
      if (effect.attackModWhenLow) parts.push(`+${effect.attackModWhenLow} Atk <${effect.lowHpThreshold}%`);
      if (parts.length > 0) {
        accDesc += ` (${parts.join(', ')})`;
      }
      this.add.text(x, y + 36, accDesc, {
        fontSize: '11px',
        color: '#66ff99',
      }).setOrigin(0.5);
    }
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
    if (this.battleLog.length > 6) {
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

  /** Shake animation for attacking (quick horizontal shake) */
  private shakeAttack(sprite: Phaser.GameObjects.Image): Promise<void> {
    return new Promise(resolve => {
      const originalX = sprite.x;
      const direction = sprite === this.playerSprite ? 1 : -1; // Attack towards opponent

      this.tweens.add({
        targets: sprite,
        x: originalX + (SHAKE_INTENSITY * 2 * direction),
        duration: SHAKE_DURATION / 2,
        yoyo: true,
        repeat: 1,
        ease: 'Power1',
        onComplete: () => {
          sprite.x = originalX;
          resolve();
        }
      });
    });
  }

  /** Shake animation for taking damage (quick vibration) */
  private shakeDamage(sprite: Phaser.GameObjects.Image): Promise<void> {
    return new Promise(resolve => {
      const originalX = sprite.x;
      const originalY = sprite.y;

      // Flash red briefly
      sprite.setTint(0xff6666);

      this.tweens.add({
        targets: sprite,
        x: originalX + SHAKE_INTENSITY,
        duration: SHAKE_DURATION / 4,
        yoyo: true,
        repeat: 3,
        ease: 'Power1',
        onComplete: () => {
          sprite.x = originalX;
          sprite.y = originalY;
          sprite.clearTint();
          resolve();
        }
      });
    });
  }

  private async executeTurn(): Promise<void> {
    if (this.battleEnded || !this.player || !this.cpu) return;

    const attacker = this.isPlayerTurn ? this.player : this.cpu;
    const defender = this.isPlayerTurn ? this.cpu : this.player;
    const attackerName = this.isPlayerTurn ? 'You' : 'CPU';
    const defenderName = this.isPlayerTurn ? 'CPU' : 'You';
    const attackerSprite = this.isPlayerTurn ? this.playerSprite : this.cpuSprite;
    const defenderSprite = this.isPlayerTurn ? this.cpuSprite : this.playerSprite;

    // Animate attacker
    if (attackerSprite) {
      await this.shakeAttack(attackerSprite);
    }

    // Execute attack (get the roll info)
    const attackEvent = this.combatSystem.executeAttack(attacker, defender);

    // Animate dice roll if it was an attack
    if (attackEvent.type === 'attack') {
      await this.animateDiceRoll(attackEvent.roll, attackEvent.modifier, attackEvent.targetArmor);
    }

    this.logAttackEvent(attackEvent, attackerName, defenderName);

    // Animate defender if hit
    if (attackEvent.type === 'attack' && attackEvent.hit && defenderSprite) {
      await this.shakeDamage(defenderSprite);
    }

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
