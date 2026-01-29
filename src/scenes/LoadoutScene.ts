import Phaser from 'phaser';
import type { Animal, Weapon, Accessory } from '../types';
import { ANIMALS, WEAPONS, ACCESSORIES } from '../data';
import { gameStateManager } from '../GameStateManager';

export class LoadoutScene extends Phaser.Scene {
  private selectedAnimal: Animal | null = null;
  private selectedWeapon: Weapon | null = null;
  private selectedAccessory: Accessory | null = null;

  private startButton: Phaser.GameObjects.Text | null = null;
  private previewText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'LoadoutScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Reset selections
    this.selectedAnimal = null;
    this.selectedWeapon = null;
    this.selectedAccessory = null;

    // Title
    this.add.text(width / 2, 30, 'Choose Your Loadout', {
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Animals section
    this.add.text(50, 80, 'Animal:', {
      fontSize: '20px',
      color: '#ffffff',
    });

    this.createSelectionButtons(ANIMALS, 50, 110, 'animal');

    // Weapons section
    this.add.text(50, 200, 'Weapon (optional):', {
      fontSize: '20px',
      color: '#ffffff',
    });

    this.createSelectionButtons(WEAPONS, 50, 230, 'weapon');

    // Accessories section
    this.add.text(50, 320, 'Accessory (optional):', {
      fontSize: '20px',
      color: '#ffffff',
    });

    this.createSelectionButtons(ACCESSORIES, 50, 350, 'accessory');

    // Preview area
    this.add.text(width - 250, 80, 'Preview:', {
      fontSize: '20px',
      color: '#ffffff',
    });

    this.previewText = this.add.text(width - 250, 110, 'Select an animal to start', {
      fontSize: '14px',
      color: '#aaaaaa',
      wordWrap: { width: 200 },
    });

    // Start button (disabled until animal selected)
    this.startButton = this.add.text(width / 2, height - 60, 'Begin Gauntlet', {
      fontSize: '28px',
      color: '#666666',
      backgroundColor: '#333333',
      padding: { x: 25, y: 12 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.startButton.on('pointerdown', () => {
      if (this.selectedAnimal) {
        gameStateManager.createNewRun(
          this.selectedAnimal,
          this.selectedWeapon,
          this.selectedAccessory
        );
        this.scene.start('BattleScene');
      }
    });

    this.updateStartButton();
  }

  private createSelectionButtons(
    items: (Animal | Weapon | Accessory)[],
    x: number,
    y: number,
    type: 'animal' | 'weapon' | 'accessory'
  ): Phaser.GameObjects.Text[] {
    const buttons: Phaser.GameObjects.Text[] = [];

    items.forEach((item, index) => {
      const btn = this.add.text(x + (index * 140), y, item.name, {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#3a3a5a',
        padding: { x: 12, y: 8 },
      })
        .setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => {
        if (!this.isSelected(item, type)) {
          btn.setStyle({ backgroundColor: '#5a5a7a' });
        }
        this.showItemTooltip(item, type);
      });

      btn.on('pointerout', () => {
        if (!this.isSelected(item, type)) {
          btn.setStyle({ backgroundColor: '#3a3a5a' });
        }
      });

      btn.on('pointerdown', () => {
        this.selectItem(item, type, buttons);
      });

      buttons.push(btn);
    });

    return buttons;
  }

  private isSelected(item: Animal | Weapon | Accessory, type: string): boolean {
    switch (type) {
      case 'animal':
        return this.selectedAnimal?.id === item.id;
      case 'weapon':
        return this.selectedWeapon?.id === item.id;
      case 'accessory':
        return this.selectedAccessory?.id === item.id;
      default:
        return false;
    }
  }

  private selectItem(
    item: Animal | Weapon | Accessory,
    type: 'animal' | 'weapon' | 'accessory',
    buttons: Phaser.GameObjects.Text[]
  ): void {
    // Reset all buttons in this category
    buttons.forEach(btn => btn.setStyle({ backgroundColor: '#3a3a5a' }));

    // Check if clicking same item (deselect for weapon/accessory)
    const isCurrentlySelected = this.isSelected(item, type);

    if (type === 'animal') {
      this.selectedAnimal = item as Animal;
      // Find and highlight the selected button
      const index = ANIMALS.findIndex(a => a.id === item.id);
      if (index >= 0) {
        buttons[index].setStyle({ backgroundColor: '#7a7aaa' });
      }
    } else if (type === 'weapon') {
      if (isCurrentlySelected) {
        this.selectedWeapon = null;
      } else {
        this.selectedWeapon = item as Weapon;
        const index = WEAPONS.findIndex(w => w.id === item.id);
        if (index >= 0) {
          buttons[index].setStyle({ backgroundColor: '#7a7aaa' });
        }
      }
    } else if (type === 'accessory') {
      if (isCurrentlySelected) {
        this.selectedAccessory = null;
      } else {
        this.selectedAccessory = item as Accessory;
        const index = ACCESSORIES.findIndex(a => a.id === item.id);
        if (index >= 0) {
          buttons[index].setStyle({ backgroundColor: '#7a7aaa' });
        }
      }
    }

    this.updatePreview();
    this.updateStartButton();
  }

  private showItemTooltip(item: Animal | Weapon | Accessory, type: string): void {
    if (!this.previewText) return;

    let text = '';

    if (type === 'animal') {
      const animal = item as Animal;
      text = `${animal.name}\n\n`;
      text += `HP: ${animal.stats.hp}\n`;
      text += `Attack: +${animal.stats.attackMod}\n`;
      text += `Armor: ${animal.stats.armor}\n\n`;
      text += `Attack: ${animal.unarmedAttack.name}\n`;
      text += `  ${animal.unarmedAttack.damage} damage\n\n`;
      text += `Passive: ${animal.passive.name}\n`;
      text += `  ${animal.passive.description}`;
    } else if (type === 'weapon') {
      const weapon = item as Weapon;
      text = `${weapon.name}\n\n`;
      text += `Damage: ${weapon.damage}\n`;
      if (weapon.attackModModifier) {
        text += `Attack Mod: ${weapon.attackModModifier}\n`;
      }
      if (weapon.effectType && weapon.effectChance) {
        text += `${weapon.effectChance}% ${weapon.effectType}\n`;
      }
      if (weapon.healOnHit) {
        text += `Heal ${weapon.healOnHit} on hit\n`;
      }
    } else if (type === 'accessory') {
      const accessory = item as Accessory;
      text = `${accessory.name}\n\n`;
      text += `Type: ${accessory.type}\n\n`;
      if (accessory.effect.hp) text += `+${accessory.effect.hp} HP\n`;
      if (accessory.effect.attackMod) text += `+${accessory.effect.attackMod} Attack\n`;
      if (accessory.effect.damageOnHit) text += `Deal ${accessory.effect.damageOnHit} when hit\n`;
      if (accessory.effect.attackModWhenLow) {
        text += `+${accessory.effect.attackModWhenLow} Attack below ${accessory.effect.lowHpThreshold}% HP\n`;
      }
      if (accessory.effect.burnChance) text += `${accessory.effect.burnChance}% burn chance\n`;
    }

    this.previewText.setText(text);
  }

  private updatePreview(): void {
    if (!this.previewText || !this.selectedAnimal) {
      if (this.previewText) {
        this.previewText.setText('Select an animal to start');
      }
      return;
    }

    const animal = this.selectedAnimal;
    let text = `${animal.name}\n\n`;

    // Calculate effective stats
    const bonusHP = this.selectedAccessory?.effect.hp ?? 0;
    const bonusAtk = this.selectedAccessory?.effect.attackMod ?? 0;
    const weaponAtkMod = this.selectedWeapon?.attackModModifier ?? 0;

    text += `HP: ${animal.stats.hp + bonusHP}\n`;
    text += `Attack: +${animal.stats.attackMod + bonusAtk + weaponAtkMod}\n`;
    text += `Armor: ${animal.stats.armor}\n\n`;

    if (this.selectedWeapon) {
      text += `Weapon: ${this.selectedWeapon.name}\n`;
      text += `  ${this.selectedWeapon.damage} damage\n`;
    } else {
      text += `Attack: ${animal.unarmedAttack.name}\n`;
      text += `  ${animal.unarmedAttack.damage} damage\n`;
    }

    text += `\nPassive: ${animal.passive.name}`;

    this.previewText.setText(text);
  }

  private updateStartButton(): void {
    if (!this.startButton) return;

    if (this.selectedAnimal) {
      this.startButton.setStyle({
        color: '#ffffff',
        backgroundColor: '#4a4a6a',
      });
    } else {
      this.startButton.setStyle({
        color: '#666666',
        backgroundColor: '#333333',
      });
    }
  }
}
