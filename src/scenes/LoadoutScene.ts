import Phaser from 'phaser';
import type { Animal, Weapon, Accessory } from '../types';
import { PLAYABLE_ANIMALS, WEAPONS, ACCESSORIES } from '../data';
import { gameStateManager } from '../GameStateManager';
import { hasAnimatedSprite, SPRITE_CONFIGS } from '../config/spriteConfig';

export class LoadoutScene extends Phaser.Scene {
  private selectedAnimal: Animal | null = null;
  private selectedWeapon: Weapon | null = null;
  private selectedAccessory: Accessory | null = null;

  private startButton: Phaser.GameObjects.Text | null = null;
  private previewContainer: Phaser.GameObjects.Container | null = null;
  private previewSprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image | null = null;
  private previewStatsText: Phaser.GameObjects.Text | null = null;
  private previewGearText: Phaser.GameObjects.Text | null = null;

  private animalCards: Phaser.GameObjects.Container[] = [];
  private weaponCards: Phaser.GameObjects.Container[] = [];
  private accessoryCards: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'LoadoutScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Reset selections
    this.selectedAnimal = null;
    this.selectedWeapon = null;
    this.selectedAccessory = null;
    this.animalCards = [];
    this.weaponCards = [];
    this.accessoryCards = [];

    // Title
    this.add.text(width / 2, 25, 'Build Your Fighter', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Left side - Selection panels
    const leftX = 20;

    // Animals section
    this.add.text(leftX, 55, '1. Choose Your Animal', {
      fontSize: '16px',
      color: '#88ff88',
    });

    this.createAnimalCards(leftX, 80);

    // Weapons section
    this.add.text(leftX, 215, '2. Choose Weapon (optional)', {
      fontSize: '16px',
      color: '#ff9966',
    });

    this.createWeaponCards(leftX, 240);

    // Accessories section
    this.add.text(leftX, 340, '3. Choose Accessory (optional)', {
      fontSize: '16px',
      color: '#66ff99',
    });

    this.createAccessoryCards(leftX, 365);

    // Right side - Preview panel
    this.createPreviewPanel(width - 180, 55);

    // Start button
    this.startButton = this.add.text(width / 2, height - 35, '⚔️  Begin Gauntlet  ⚔️', {
      fontSize: '24px',
      color: '#666666',
      backgroundColor: '#333333',
      padding: { x: 30, y: 12 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.startButton.on('pointerover', () => {
      if (this.selectedAnimal) {
        this.startButton?.setStyle({ backgroundColor: '#5a7a5a' });
      }
    });

    this.startButton.on('pointerout', () => {
      this.updateStartButton();
    });

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

  private getWeaponEmoji(weaponId: string): string {
    const emojiMap: Record<string, string> = {
      'rusty-dagger': '🗡️',
      'flame-stick': '🔥',
      'venom-fang': '🐍',
      'heavy-rock': '🪨',
      'sapping-thorn': '🌿',
    };
    return emojiMap[weaponId] || '⚔️';
  }

  private getAccessoryEmoji(accessoryId: string): string {
    const emojiMap: Record<string, string> = {
      'lucky-pebble': '🍀',
      'thick-hide': '🛡️',
      'spiked-collar': '📍',
      'ember-charm': '🔥',
      'adrenaline-gland': '💉',
    };
    return emojiMap[accessoryId] || '💎';
  }

  private createAnimalCards(startX: number, startY: number): void {
    const cardWidth = 110;
    const cardHeight = 120;
    const spacing = 8;

    PLAYABLE_ANIMALS.forEach((animal, index) => {
      const x = startX + (index * (cardWidth + spacing)) + cardWidth / 2;
      const y = startY + cardHeight / 2;

      const container = this.add.container(x, y);

      // Card background
      const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x2a2a4a)
        .setStrokeStyle(2, 0x4a4a6a);

      // Animal sprite (animated if available)
      let sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
      if (hasAnimatedSprite(animal.id)) {
        const config = SPRITE_CONFIGS[animal.id];
        const firstFramePath = config.animations.idle?.frames[0] || config.animations.attack?.frames[0];
        const firstFrameKey = `${animal.id}-${firstFramePath?.replace(/[\/\.]/g, '-')}`;
        sprite = this.add.sprite(0, -25, firstFrameKey).setDisplaySize(60, 60);
        if (config.animations.idle) {
          (sprite as Phaser.GameObjects.Sprite).play(config.animations.idle.key);
        }
      } else {
        sprite = this.add.image(0, -25, animal.id).setDisplaySize(60, 60);
      }

      // Animal name
      const name = this.add.text(0, 20, animal.name, {
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Stats preview
      const stats = this.add.text(0, 40, `❤️${animal.stats.hp} ⚔️+${animal.stats.attackMod} 🛡️${animal.stats.armor}`, {
        fontSize: '10px',
        color: '#aaaaaa',
      }).setOrigin(0.5);

      container.add([bg, sprite, name, stats]);

      // Interactivity
      bg.setInteractive({ useHandCursor: true });

      bg.on('pointerover', () => {
        if (this.selectedAnimal?.id !== animal.id) {
          bg.setFillStyle(0x3a3a5a);
        }
        this.showAnimalTooltip(animal);
      });

      bg.on('pointerout', () => {
        if (this.selectedAnimal?.id !== animal.id) {
          bg.setFillStyle(0x2a2a4a);
        }
      });

      bg.on('pointerdown', () => {
        this.selectAnimal(animal, index);
      });

      this.animalCards.push(container);
      (container as any)._bg = bg;
    });
  }

  private createWeaponCards(startX: number, startY: number): void {
    const cardWidth = 110;
    const cardHeight = 85;
    const spacing = 8;

    WEAPONS.forEach((weapon, index) => {
      const x = startX + (index * (cardWidth + spacing)) + cardWidth / 2;
      const y = startY + cardHeight / 2;

      const container = this.add.container(x, y);

      // Card background
      const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x2a2a4a)
        .setStrokeStyle(2, 0x6a4a4a);

      // Weapon emoji
      const emoji = this.add.text(0, -22, this.getWeaponEmoji(weapon.id), {
        fontSize: '28px',
      }).setOrigin(0.5);

      // Weapon name
      const name = this.add.text(0, 8, weapon.name, {
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Damage
      const dmg = this.add.text(0, 26, `💥 ${weapon.damage} dmg`, {
        fontSize: '10px',
        color: '#ff9966',
      }).setOrigin(0.5);

      container.add([bg, emoji, name, dmg]);

      // Interactivity
      bg.setInteractive({ useHandCursor: true });

      bg.on('pointerover', () => {
        if (this.selectedWeapon?.id !== weapon.id) {
          bg.setFillStyle(0x3a3a5a);
        }
        this.showWeaponTooltip(weapon);
      });

      bg.on('pointerout', () => {
        if (this.selectedWeapon?.id !== weapon.id) {
          bg.setFillStyle(0x2a2a4a);
        }
      });

      bg.on('pointerdown', () => {
        this.selectWeapon(weapon, index);
      });

      this.weaponCards.push(container);
      (container as any)._bg = bg;
    });
  }

  private createAccessoryCards(startX: number, startY: number): void {
    const cardWidth = 110;
    const cardHeight = 85;
    const spacing = 8;

    ACCESSORIES.forEach((accessory, index) => {
      const x = startX + (index * (cardWidth + spacing)) + cardWidth / 2;
      const y = startY + cardHeight / 2;

      const container = this.add.container(x, y);

      // Card background
      const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x2a2a4a)
        .setStrokeStyle(2, 0x4a6a4a);

      // Accessory emoji
      const emoji = this.add.text(0, -22, this.getAccessoryEmoji(accessory.id), {
        fontSize: '28px',
      }).setOrigin(0.5);

      // Accessory name
      const name = this.add.text(0, 8, accessory.name, {
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Main effect
      let effectText = '';
      if (accessory.effect.hp) effectText = `+${accessory.effect.hp} HP`;
      else if (accessory.effect.attackMod) effectText = `+${accessory.effect.attackMod} Atk`;
      else if (accessory.effect.damageOnHit) effectText = `${accessory.effect.damageOnHit} reflect`;
      else if (accessory.effect.burnChance) effectText = `${accessory.effect.burnChance}% burn`;
      else if (accessory.effect.attackModWhenLow) effectText = `+${accessory.effect.attackModWhenLow} Atk low`;

      const effect = this.add.text(0, 26, effectText, {
        fontSize: '10px',
        color: '#66ff99',
      }).setOrigin(0.5);

      container.add([bg, emoji, name, effect]);

      // Interactivity
      bg.setInteractive({ useHandCursor: true });

      bg.on('pointerover', () => {
        if (this.selectedAccessory?.id !== accessory.id) {
          bg.setFillStyle(0x3a3a5a);
        }
        this.showAccessoryTooltip(accessory);
      });

      bg.on('pointerout', () => {
        if (this.selectedAccessory?.id !== accessory.id) {
          bg.setFillStyle(0x2a2a4a);
        }
      });

      bg.on('pointerdown', () => {
        this.selectAccessory(accessory, index);
      });

      this.accessoryCards.push(container);
      (container as any)._bg = bg;
    });
  }

  private createPreviewPanel(x: number, y: number): void {
    const panelWidth = 160;
    const panelHeight = 400;

    this.previewContainer = this.add.container(x + panelWidth / 2, y);

    // Panel background
    const panelBg = this.add.rectangle(0, panelHeight / 2, panelWidth, panelHeight, 0x1a1a2a)
      .setStrokeStyle(2, 0x5a5a7a);

    // Title
    const title = this.add.text(0, 15, 'Your Fighter', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Placeholder sprite area (will be replaced when animal selected)
    this.previewSprite = this.add.sprite(0, 90, 'rat')
      .setDisplaySize(100, 100)
      .setAlpha(0.3);

    // "Select Animal" prompt
    const selectPrompt = this.add.text(0, 90, '?', {
      fontSize: '48px',
      color: '#666666',
    }).setOrigin(0.5);
    (this.previewContainer as any)._selectPrompt = selectPrompt;

    // Stats text
    this.previewStatsText = this.add.text(0, 160, 'Select an animal\nto begin', {
      fontSize: '12px',
      color: '#888888',
      align: 'center',
    }).setOrigin(0.5, 0);

    // Gear text
    this.previewGearText = this.add.text(0, 280, '', {
      fontSize: '11px',
      color: '#aaaaaa',
      align: 'center',
      wordWrap: { width: panelWidth - 20 },
    }).setOrigin(0.5, 0);

    this.previewContainer.add([panelBg, title, this.previewSprite, selectPrompt, this.previewStatsText, this.previewGearText]);
  }

  private selectAnimal(animal: Animal, index: number): void {
    // Clear previous selection
    this.animalCards.forEach(card => {
      const bg = (card as any)._bg as Phaser.GameObjects.Rectangle;
      bg.setFillStyle(0x2a2a4a);
      bg.setStrokeStyle(2, 0x4a4a6a);
    });

    // Select new
    this.selectedAnimal = animal;
    const bg = (this.animalCards[index] as any)._bg as Phaser.GameObjects.Rectangle;
    bg.setFillStyle(0x4a4a6a);
    bg.setStrokeStyle(3, 0x88ff88);

    this.updatePreview();
    this.updateStartButton();
  }

  private selectWeapon(weapon: Weapon, index: number): void {
    const wasSelected = this.selectedWeapon?.id === weapon.id;

    // Clear previous selection
    this.weaponCards.forEach(card => {
      const bg = (card as any)._bg as Phaser.GameObjects.Rectangle;
      bg.setFillStyle(0x2a2a4a);
      bg.setStrokeStyle(2, 0x6a4a4a);
    });

    if (wasSelected) {
      // Deselect
      this.selectedWeapon = null;
    } else {
      // Select new
      this.selectedWeapon = weapon;
      const bg = (this.weaponCards[index] as any)._bg as Phaser.GameObjects.Rectangle;
      bg.setFillStyle(0x4a4a6a);
      bg.setStrokeStyle(3, 0xff9966);
    }

    this.updatePreview();
  }

  private selectAccessory(accessory: Accessory, index: number): void {
    const wasSelected = this.selectedAccessory?.id === accessory.id;

    // Clear previous selection
    this.accessoryCards.forEach(card => {
      const bg = (card as any)._bg as Phaser.GameObjects.Rectangle;
      bg.setFillStyle(0x2a2a4a);
      bg.setStrokeStyle(2, 0x4a6a4a);
    });

    if (wasSelected) {
      // Deselect
      this.selectedAccessory = null;
    } else {
      // Select new
      this.selectedAccessory = accessory;
      const bg = (this.accessoryCards[index] as any)._bg as Phaser.GameObjects.Rectangle;
      bg.setFillStyle(0x4a4a6a);
      bg.setStrokeStyle(3, 0x66ff99);
    }

    this.updatePreview();
  }

  private showAnimalTooltip(animal: Animal): void {
    if (!this.previewStatsText) return;

    let text = `${animal.name}\n\n`;
    text += `Passive: ${animal.passive.name}\n`;
    text += `${animal.passive.description}\n\n`;
    text += `Attack: ${animal.unarmedAttack.name}\n`;
    text += `${animal.unarmedAttack.damage} damage`;

    if (animal.unarmedAttack.effectType) {
      text += `\n${animal.unarmedAttack.effectChance}% ${animal.unarmedAttack.effectType}`;
    }

    this.previewStatsText.setText(text);
  }

  private showWeaponTooltip(weapon: Weapon): void {
    if (!this.previewGearText) return;

    let text = `${this.getWeaponEmoji(weapon.id)} ${weapon.name}\n`;
    text += `${weapon.damage} damage`;

    if (weapon.attackModModifier) {
      text += `\n${weapon.attackModModifier > 0 ? '+' : ''}${weapon.attackModModifier} Attack`;
    }
    if (weapon.effectType && weapon.effectChance) {
      text += `\n${weapon.effectChance}% ${weapon.effectType}`;
    }
    if (weapon.healOnHit) {
      text += `\nHeal ${weapon.healOnHit} on hit`;
    }

    this.previewGearText.setText(text);
  }

  private showAccessoryTooltip(accessory: Accessory): void {
    if (!this.previewGearText) return;

    let text = `${this.getAccessoryEmoji(accessory.id)} ${accessory.name}\n`;

    if (accessory.effect.hp) text += `+${accessory.effect.hp} Max HP\n`;
    if (accessory.effect.armor) text += `+${accessory.effect.armor} Armor\n`;
    if (accessory.effect.attackMod) text += `+${accessory.effect.attackMod} Attack\n`;
    if (accessory.effect.damageOnHit) text += `Deal ${accessory.effect.damageOnHit} when hit\n`;
    if (accessory.effect.burnChance) text += `${accessory.effect.burnChance}% burn on attack\n`;
    if (accessory.effect.attackModWhenLow) {
      text += `+${accessory.effect.attackModWhenLow} Attack below ${accessory.effect.lowHpThreshold}% HP`;
    }

    this.previewGearText.setText(text);
  }

  private updatePreview(): void {
    if (!this.previewSprite || !this.previewStatsText || !this.previewGearText || !this.previewContainer) return;

    const selectPrompt = (this.previewContainer as any)._selectPrompt as Phaser.GameObjects.Text;

    if (!this.selectedAnimal) {
      this.previewSprite.setAlpha(0.3);
      selectPrompt.setVisible(true);
      this.previewStatsText.setText('Select an animal\nto begin');
      this.previewGearText.setText('');
      return;
    }

    // Show selected animal
    selectPrompt.setVisible(false);

    // Handle animated vs static sprites
    if (hasAnimatedSprite(this.selectedAnimal.id)) {
      const config = SPRITE_CONFIGS[this.selectedAnimal.id];
      const firstFramePath = config.animations.idle?.frames[0] || config.animations.attack?.frames[0];
      const firstFrameKey = `${this.selectedAnimal.id}-${firstFramePath?.replace(/[\/\.]/g, '-')}`;
      this.previewSprite.setTexture(firstFrameKey);
      if (this.previewSprite instanceof Phaser.GameObjects.Sprite && config.animations.idle) {
        this.previewSprite.play(config.animations.idle.key);
      }
    } else {
      this.previewSprite.setTexture(this.selectedAnimal.id);
      if (this.previewSprite instanceof Phaser.GameObjects.Sprite) {
        this.previewSprite.stop();
      }
    }
    this.previewSprite.setAlpha(1);

    // Calculate effective stats
    const bonusHP = this.selectedAccessory?.effect.hp ?? 0;
    const bonusArmor = this.selectedAccessory?.effect.armor ?? 0;
    const bonusAtk = this.selectedAccessory?.effect.attackMod ?? 0;
    const weaponAtkMod = this.selectedWeapon?.attackModModifier ?? 0;
    const totalHP = this.selectedAnimal.stats.hp + bonusHP;
    const totalAtk = this.selectedAnimal.stats.attackMod + bonusAtk + weaponAtkMod;
    const totalArmor = this.selectedAnimal.stats.armor + bonusArmor;

    let statsText = `${this.selectedAnimal.name}\n\n`;
    statsText += `❤️ HP: ${totalHP}\n`;
    statsText += `⚔️ Attack: +${totalAtk}\n`;
    statsText += `🛡️ Armor: ${totalArmor}\n\n`;
    statsText += `Passive:\n${this.selectedAnimal.passive.name}`;

    this.previewStatsText.setText(statsText);

    // Show gear
    let gearText = '';

    if (this.selectedWeapon) {
      gearText += `${this.getWeaponEmoji(this.selectedWeapon.id)} ${this.selectedWeapon.name}\n`;
      gearText += `${this.selectedWeapon.damage} damage\n`;
    } else {
      gearText += `👊 ${this.selectedAnimal.unarmedAttack.name}\n`;
      gearText += `${this.selectedAnimal.unarmedAttack.damage} damage\n`;
    }

    if (this.selectedAccessory) {
      gearText += `\n${this.getAccessoryEmoji(this.selectedAccessory.id)} ${this.selectedAccessory.name}`;
    }

    this.previewGearText.setText(gearText);
  }

  private updateStartButton(): void {
    if (!this.startButton) return;

    if (this.selectedAnimal) {
      this.startButton.setStyle({
        color: '#ffffff',
        backgroundColor: '#4a6a4a',
      });
    } else {
      this.startButton.setStyle({
        color: '#666666',
        backgroundColor: '#333333',
      });
    }
  }
}
