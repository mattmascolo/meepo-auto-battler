import Phaser from 'phaser';
import type { Weapon, Accessory } from '../types';
import { gameStateManager } from '../GameStateManager';
import { isWeapon, DRAFT_WEAPONS, DRAFT_ACCESSORIES } from '../data/draftGear';
import { WEAPONS, ACCESSORIES } from '../data';
import { hasAnimatedSprite, SPRITE_CONFIGS } from '../config/spriteConfig';

interface StatChoice {
  type: 'heal' | 'maxHp' | 'attack' | 'armor';
  label: string;
  description: string;
  value: number;
  color: number;
  icon: string;
}

interface GearChoice {
  type: 'weapon' | 'accessory';
  item: Weapon | Accessory;
  isRare: boolean;
}

export class DraftScene extends Phaser.Scene {
  private statChoices: StatChoice[] = [];
  private gearChoices: GearChoice[] = [];
  private selectedStat: StatChoice | null = null;
  private selectedGear: GearChoice | null = null;
  private continueButton: Phaser.GameObjects.Text | null = null;
  private statCards: Phaser.GameObjects.Container[] = [];
  private gearCards: Phaser.GameObjects.Container[] = [];

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

    // Reset
    this.selectedStat = null;
    this.selectedGear = null;
    this.statCards = [];
    this.gearCards = [];

    // Generate choices
    this.statChoices = this.generateStatChoices(state.player.currentHP, state.player.maxHP);
    this.gearChoices = this.generateGearChoices();

    // Header
    const cpuNumber = state.run.currentCPU;
    this.add.text(width / 2, 20, `Victory! Prepare for Battle ${cpuNumber + 1}`, {
      fontSize: '24px',
      color: '#88ff88',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Current fighter preview panel (left side)
    this.createFighterPreview(20, 50, state);

    // Selection area (right side)
    const selectionX = 200;

    // HP Status bar
    const hpPercent = Math.round((state.player.currentHP / state.player.maxHP) * 100);
    const hpColor = hpPercent > 50 ? '#88ff88' : hpPercent > 25 ? '#ffff88' : '#ff8888';

    this.add.text(selectionX + 250, 55, `Current HP: ${state.player.currentHP} / ${state.player.maxHP}`, {
      fontSize: '16px',
      color: hpColor,
    }).setOrigin(0.5);

    // Stat section
    this.add.text(selectionX, 85, '1. Choose a Bonus', {
      fontSize: '16px',
      color: '#ffff88',
    });

    this.createStatCards(selectionX, 110);

    // Gear section
    this.add.text(selectionX, 240, '2. Choose New Gear', {
      fontSize: '16px',
      color: '#ffaa44',
    });

    this.createGearCards(selectionX, 270);

    // Continue button
    this.continueButton = this.add.text(width / 2, height - 35, '⚔️  Continue to Battle  ⚔️', {
      fontSize: '22px',
      color: '#666666',
      backgroundColor: '#333333',
      padding: { x: 25, y: 12 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.continueButton.on('pointerover', () => {
      if (this.selectedStat && this.selectedGear) {
        this.continueButton?.setStyle({ backgroundColor: '#5a7a5a' });
      }
    });

    this.continueButton.on('pointerout', () => {
      this.updateContinueButton();
    });

    this.continueButton.on('pointerdown', () => {
      if (this.selectedStat && this.selectedGear) {
        this.applyChoicesAndContinue();
      }
    });

    this.updateContinueButton();
  }

  private createFighterPreview(x: number, y: number, state: any): void {
    const panelWidth = 160;
    const panelHeight = 420;
    const container = this.add.container(x + panelWidth / 2, y);

    // Panel background
    const bg = this.add.rectangle(0, panelHeight / 2, panelWidth, panelHeight, 0x1a1a2a)
      .setStrokeStyle(2, 0x5a5a7a);

    // Title
    const title = this.add.text(0, 15, 'Your Fighter', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Animal sprite - handle animated vs static
    const animalId = state.player.animal.id;
    let sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;

    if (hasAnimatedSprite(animalId)) {
      const config = SPRITE_CONFIGS[animalId];
      const firstFramePath = config.animations.idle?.frames[0] || config.animations.jump?.frames[0];
      const frameKey = `${animalId}-${firstFramePath?.replace(/[\/\.]/g, '-')}`;
      sprite = this.add.sprite(0, 80, frameKey).setDisplaySize(90, 90);
      if (config.animations.idle) {
        (sprite as Phaser.GameObjects.Sprite).play(config.animations.idle.key);
      }
    } else {
      sprite = this.add.image(0, 80, animalId).setDisplaySize(90, 90);
    }

    // Animal name
    const name = this.add.text(0, 140, state.player.animal.name, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Stats
    const statsText = `❤️ ${state.player.currentHP}/${state.player.maxHP}\n⚔️ +${state.player.animal.stats.attackMod}\n🛡️ ${state.player.animal.stats.armor}`;
    const stats = this.add.text(0, 180, statsText, {
      fontSize: '12px',
      color: '#aaaaaa',
      align: 'center',
    }).setOrigin(0.5, 0);

    // Current weapon
    const weaponEmoji = state.player.weapon ? this.getWeaponEmoji(state.player.weapon.id) : '👊';
    const weaponName = state.player.weapon?.name || 'Unarmed';
    const weaponText = this.add.text(0, 250, `${weaponEmoji} ${weaponName}`, {
      fontSize: '11px',
      color: '#ff9966',
    }).setOrigin(0.5);

    // Current accessory
    let accText: Phaser.GameObjects.Text | null = null;
    if (state.player.accessory) {
      const accEmoji = this.getAccessoryEmoji(state.player.accessory.id);
      accText = this.add.text(0, 275, `${accEmoji} ${state.player.accessory.name}`, {
        fontSize: '11px',
        color: '#66ff99',
      }).setOrigin(0.5);
    }

    // Passive
    const passive = this.add.text(0, 310, `Passive:\n${state.player.animal.passive.name}`, {
      fontSize: '10px',
      color: '#888888',
      align: 'center',
    }).setOrigin(0.5, 0);

    container.add([bg, title, sprite, name, stats, weaponText, passive]);
    if (accText) container.add(accText);
  }

  private getWeaponEmoji(weaponId: string): string {
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

  private getAccessoryEmoji(accessoryId: string): string {
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

  private generateStatChoices(currentHP: number, maxHP: number): StatChoice[] {
    const choices: StatChoice[] = [];
    const missingHP = maxHP - currentHP;

    // Healing option if not at full HP
    if (missingHP > 0) {
      const healAmount = Math.min(missingHP, Math.ceil(maxHP * 0.5));
      choices.push({
        type: 'heal',
        label: `+${healAmount}`,
        description: 'Restore HP',
        value: healAmount,
        color: 0x88ff88,
        icon: '❤️‍🩹',
      });
    } else {
      choices.push({
        type: 'maxHp',
        label: '+2',
        description: 'Max HP',
        value: 2,
        color: 0xff88ff,
        icon: '💜',
      });
    }

    choices.push({
      type: 'maxHp',
      label: '+4',
      description: 'Max HP',
      value: 4,
      color: 0xff88ff,
      icon: '💗',
    });

    choices.push({
      type: 'attack',
      label: '+1',
      description: 'Attack',
      value: 1,
      color: 0xffaa44,
      icon: '⚔️',
    });

    choices.push({
      type: 'armor',
      label: '+1',
      description: 'Armor',
      value: 1,
      color: 0x44aaff,
      icon: '🛡️',
    });

    return choices;
  }

  private generateGearChoices(): GearChoice[] {
    const state = gameStateManager.getState();
    const excludeIds = new Set<string>();

    if (state?.player.weapon) excludeIds.add(state.player.weapon.id);
    if (state?.player.accessory) excludeIds.add(state.player.accessory.id);

    const allWeapons = [...WEAPONS, ...DRAFT_WEAPONS];
    const allAccessories = [...ACCESSORIES, ...DRAFT_ACCESSORIES];
    const allGear = [...allWeapons, ...allAccessories];

    const available = allGear.filter(item => !excludeIds.has(item.id));
    const shuffled = available.sort(() => Math.random() - 0.5);

    return shuffled.slice(0, 3).map(item => {
      const isRare = DRAFT_WEAPONS.some(w => w.id === item.id) ||
                     DRAFT_ACCESSORIES.some(a => a.id === item.id);
      return {
        type: isWeapon(item) ? 'weapon' : 'accessory',
        item,
        isRare,
      };
    });
  }

  private createStatCards(startX: number, startY: number): void {
    const cardWidth = 115;
    const cardHeight = 110;
    const spacing = 10;

    this.statChoices.forEach((choice, index) => {
      const x = startX + (index * (cardWidth + spacing)) + cardWidth / 2;
      const y = startY + cardHeight / 2;

      const container = this.add.container(x, y);

      const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x2a2a4a)
        .setStrokeStyle(2, choice.color);

      const icon = this.add.text(0, -30, choice.icon, {
        fontSize: '32px',
      }).setOrigin(0.5);

      const label = this.add.text(0, 15, choice.label, {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      const desc = this.add.text(0, 40, choice.description, {
        fontSize: '11px',
        color: '#aaaaaa',
      }).setOrigin(0.5);

      container.add([bg, icon, label, desc]);

      bg.setInteractive({ useHandCursor: true });

      bg.on('pointerover', () => {
        if (this.selectedStat !== choice) {
          bg.setFillStyle(0x3a3a5a);
        }
      });

      bg.on('pointerout', () => {
        if (this.selectedStat !== choice) {
          bg.setFillStyle(0x2a2a4a);
        }
      });

      bg.on('pointerdown', () => {
        this.selectStat(choice, index);
      });

      this.statCards.push(container);
      (choice as any)._bg = bg;
    });
  }

  private createGearCards(startX: number, startY: number): void {
    const cardWidth = 170;
    const cardHeight = 180;
    const spacing = 12;

    this.gearChoices.forEach((choice, index) => {
      const x = startX + (index * (cardWidth + spacing)) + cardWidth / 2;
      const y = startY + cardHeight / 2;

      const container = this.add.container(x, y);

      const borderColor = choice.isRare ? 0xffaa00 : (choice.type === 'weapon' ? 0xff6666 : 0x66ff66);
      const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x2a2a4a)
        .setStrokeStyle(choice.isRare ? 3 : 2, borderColor);

      // Rarity badge
      if (choice.isRare) {
        const badge = this.add.text(0, -75, '✨ RARE ✨', {
          fontSize: '10px',
          color: '#ffaa00',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        container.add(badge);
      }

      // Type label
      const typeColor = choice.type === 'weapon' ? '#ff9966' : '#66ff99';
      const typeLabel = this.add.text(0, choice.isRare ? -58 : -70, choice.type.toUpperCase(), {
        fontSize: '10px',
        color: typeColor,
      }).setOrigin(0.5);

      // Emoji
      const emoji = choice.type === 'weapon'
        ? this.getWeaponEmoji(choice.item.id)
        : this.getAccessoryEmoji(choice.item.id);
      const emojiText = this.add.text(0, -30, emoji, {
        fontSize: '36px',
      }).setOrigin(0.5);

      // Name
      const nameLabel = this.add.text(0, 10, choice.item.name, {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Description
      const descText = this.getGearDescription(choice);
      const descLabel = this.add.text(0, 55, descText, {
        fontSize: '10px',
        color: '#aaaaaa',
        wordWrap: { width: cardWidth - 20 },
        align: 'center',
      }).setOrigin(0.5);

      container.add([bg, typeLabel, emojiText, nameLabel, descLabel]);

      bg.setInteractive({ useHandCursor: true });

      bg.on('pointerover', () => {
        if (this.selectedGear !== choice) {
          bg.setFillStyle(0x3a3a5a);
        }
      });

      bg.on('pointerout', () => {
        if (this.selectedGear !== choice) {
          bg.setFillStyle(0x2a2a4a);
        }
      });

      bg.on('pointerdown', () => {
        this.selectGear(choice, index);
      });

      this.gearCards.push(container);
      (choice as any)._bg = bg;
    });
  }

  private getGearDescription(choice: GearChoice): string {
    if (choice.type === 'weapon') {
      const weapon = choice.item as Weapon;
      let desc = `💥 ${weapon.damage} damage`;
      if (weapon.attackModModifier) {
        desc += `\n⚔️ ${weapon.attackModModifier > 0 ? '+' : ''}${weapon.attackModModifier} attack`;
      }
      if (weapon.effectType && weapon.effectChance) {
        desc += `\n${weapon.effectChance}% ${weapon.effectType}`;
      }
      if (weapon.healOnHit) {
        desc += `\n❤️ Heal ${weapon.healOnHit} on hit`;
      }
      return desc;
    } else {
      const acc = choice.item as Accessory;
      const parts: string[] = [];
      if (acc.effect.hp) parts.push(`❤️ +${acc.effect.hp} HP`);
      if (acc.effect.armor) parts.push(`🛡️ +${acc.effect.armor} Armor`);
      if (acc.effect.attackMod) parts.push(`⚔️ +${acc.effect.attackMod} Attack`);
      if (acc.effect.damageOnHit) parts.push(`📍 ${acc.effect.damageOnHit} reflect`);
      if (acc.effect.burnChance) parts.push(`🔥 ${acc.effect.burnChance}% burn`);
      if (acc.effect.attackModWhenLow) {
        parts.push(`💢 +${acc.effect.attackModWhenLow} Atk <${acc.effect.lowHpThreshold}%`);
      }
      return parts.join('\n');
    }
  }

  private selectStat(choice: StatChoice, _index: number): void {
    // Clear all
    this.statCards.forEach((_card, i) => {
      const ch = this.statChoices[i];
      const bg = (ch as any)._bg as Phaser.GameObjects.Rectangle;
      bg.setFillStyle(0x2a2a4a);
      bg.setStrokeStyle(2, ch.color);
    });

    // Select new
    this.selectedStat = choice;
    const bg = (choice as any)._bg as Phaser.GameObjects.Rectangle;
    bg.setFillStyle(0x4a4a6a);
    bg.setStrokeStyle(4, choice.color);

    this.updateContinueButton();
  }

  private selectGear(choice: GearChoice, _index: number): void {
    // Clear all
    this.gearCards.forEach((_card, i) => {
      const ch = this.gearChoices[i];
      const bg = (ch as any)._bg as Phaser.GameObjects.Rectangle;
      bg.setFillStyle(0x2a2a4a);
      const borderColor = ch.isRare ? 0xffaa00 : (ch.type === 'weapon' ? 0xff6666 : 0x66ff66);
      bg.setStrokeStyle(ch.isRare ? 3 : 2, borderColor);
    });

    // Select new
    this.selectedGear = choice;
    const bg = (choice as any)._bg as Phaser.GameObjects.Rectangle;
    bg.setFillStyle(0x4a4a6a);
    const selectedColor = choice.isRare ? 0xffdd44 : (choice.type === 'weapon' ? 0xff9999 : 0x99ff99);
    bg.setStrokeStyle(4, selectedColor);

    this.updateContinueButton();
  }

  private updateContinueButton(): void {
    if (!this.continueButton) return;

    if (this.selectedStat && this.selectedGear) {
      this.continueButton.setStyle({
        color: '#ffffff',
        backgroundColor: '#4a6a4a',
      });
    } else {
      this.continueButton.setStyle({
        color: '#666666',
        backgroundColor: '#333333',
      });
    }
  }

  private applyChoicesAndContinue(): void {
    if (this.selectedStat) {
      switch (this.selectedStat.type) {
        case 'heal':
          gameStateManager.healPlayer(this.selectedStat.value);
          break;
        case 'maxHp':
          gameStateManager.boostMaxHP(this.selectedStat.value);
          break;
        case 'attack':
          gameStateManager.boostAttack(this.selectedStat.value);
          break;
        case 'armor':
          gameStateManager.boostArmor(this.selectedStat.value);
          break;
      }
    }

    if (this.selectedGear) {
      if (this.selectedGear.type === 'weapon') {
        gameStateManager.equipWeapon(this.selectedGear.item as Weapon);
      } else {
        gameStateManager.equipAccessory(this.selectedGear.item as Accessory);
      }
    }

    gameStateManager.advanceToNextCPU();
    this.scene.start('BattleScene');
  }
}
