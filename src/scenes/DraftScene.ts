import Phaser from 'phaser';
import type { Weapon, Accessory } from '../types';
import { WEAPONS, ACCESSORIES } from '../data';
import { gameStateManager } from '../GameStateManager';

interface DraftChoice {
  type: 'weapon' | 'accessory';
  item: Weapon | Accessory;
}

export class DraftScene extends Phaser.Scene {
  private choices: DraftChoice[] = [];
  private choiceButtons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'DraftScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const state = gameStateManager.getState();

    if (!state) {
      this.scene.start('MenuScene');
      return;
    }

    // Generate 3 random draft choices
    this.choices = this.generateDraftChoices();

    // Header
    const cpuNumber = state.run.currentCPU;
    this.add.text(width / 2, 40, `Prepare for Battle ${cpuNumber + 1}`, {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Current status
    this.add.text(width / 2, 90, `HP: ${state.player.currentHP} / ${state.player.maxHP}`, {
      fontSize: '20px',
      color: '#88ff88',
    }).setOrigin(0.5);

    // Current loadout
    const currentWeapon = state.player.weapon?.name ?? 'Unarmed';
    const currentAccessory = state.player.accessory?.name ?? 'None';
    this.add.text(width / 2, 120, `Weapon: ${currentWeapon}  |  Accessory: ${currentAccessory}`, {
      fontSize: '16px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Draft title
    this.add.text(width / 2, 170, 'Choose one upgrade (or skip):', {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Create choice buttons
    const startX = width / 2 - 280;
    this.choices.forEach((choice, index) => {
      const x = startX + (index * 200);
      this.createChoiceButton(choice, x, 220, index);
    });

    // Skip button
    const skipButton = this.add.text(width / 2, height - 80, 'Skip', {
      fontSize: '24px',
      color: '#888888',
      backgroundColor: '#333333',
      padding: { x: 30, y: 12 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    skipButton.on('pointerover', () => {
      skipButton.setStyle({ backgroundColor: '#444444' });
    });

    skipButton.on('pointerout', () => {
      skipButton.setStyle({ backgroundColor: '#333333' });
    });

    skipButton.on('pointerdown', () => {
      this.continueToBattle();
    });
  }

  private generateDraftChoices(): DraftChoice[] {
    const choices: DraftChoice[] = [];
    const usedIds = new Set<string>();

    // Get current loadout to potentially exclude
    const state = gameStateManager.getState();
    if (state?.player.weapon) {
      usedIds.add(state.player.weapon.id);
    }
    if (state?.player.accessory) {
      usedIds.add(state.player.accessory.id);
    }

    // Generate 3 random choices
    while (choices.length < 3) {
      const isWeapon = Math.random() < 0.5;
      const pool = isWeapon ? WEAPONS : ACCESSORIES;
      const item = pool[Math.floor(Math.random() * pool.length)];

      if (!usedIds.has(item.id)) {
        usedIds.add(item.id);
        choices.push({
          type: isWeapon ? 'weapon' : 'accessory',
          item,
        });
      }
    }

    return choices;
  }

  private createChoiceButton(choice: DraftChoice, x: number, y: number, _index: number): void {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 180, 200, 0x3a3a5a)
      .setStrokeStyle(2, 0x5a5a7a);

    const typeLabel = this.add.text(0, -80, choice.type.toUpperCase(), {
      fontSize: '12px',
      color: choice.type === 'weapon' ? '#ff8888' : '#88ff88',
    }).setOrigin(0.5);

    const nameLabel = this.add.text(0, -55, choice.item.name, {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const descText = this.getItemDescription(choice);
    const descLabel = this.add.text(0, 0, descText, {
      fontSize: '12px',
      color: '#aaaaaa',
      wordWrap: { width: 160 },
      align: 'center',
    }).setOrigin(0.5);

    container.add([bg, typeLabel, nameLabel, descLabel]);

    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      bg.setFillStyle(0x5a5a7a);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x3a3a5a);
    });

    bg.on('pointerdown', () => {
      this.selectChoice(choice);
    });

    this.choiceButtons.push(container);
  }

  private getItemDescription(choice: DraftChoice): string {
    if (choice.type === 'weapon') {
      const weapon = choice.item as Weapon;
      let desc = `${weapon.damage} damage`;
      if (weapon.attackModModifier) {
        desc += `\n${weapon.attackModModifier > 0 ? '+' : ''}${weapon.attackModModifier} attack`;
      }
      if (weapon.effectType && weapon.effectChance) {
        desc += `\n${weapon.effectChance}% ${weapon.effectType}`;
      }
      if (weapon.healOnHit) {
        desc += `\nHeal ${weapon.healOnHit} on hit`;
      }
      return desc;
    } else {
      const accessory = choice.item as Accessory;
      let desc = '';
      if (accessory.effect.hp) desc += `+${accessory.effect.hp} HP\n`;
      if (accessory.effect.attackMod) desc += `+${accessory.effect.attackMod} attack\n`;
      if (accessory.effect.damageOnHit) desc += `Deal ${accessory.effect.damageOnHit} when hit\n`;
      if (accessory.effect.attackModWhenLow) {
        desc += `+${accessory.effect.attackModWhenLow} atk below ${accessory.effect.lowHpThreshold}%\n`;
      }
      if (accessory.effect.burnChance) desc += `${accessory.effect.burnChance}% burn`;
      return desc.trim();
    }
  }

  private selectChoice(choice: DraftChoice): void {
    if (choice.type === 'weapon') {
      gameStateManager.equipWeapon(choice.item as Weapon);
    } else {
      gameStateManager.equipAccessory(choice.item as Accessory);
    }

    this.continueToBattle();
  }

  private continueToBattle(): void {
    gameStateManager.advanceToNextCPU();
    this.scene.start('BattleScene');
  }
}
