import Phaser from 'phaser';
import type { Weapon, Accessory } from '../types';
import { gameStateManager } from '../GameStateManager';
import { isWeapon, DRAFT_WEAPONS, DRAFT_ACCESSORIES } from '../data/draftGear';
import { WEAPONS, ACCESSORIES } from '../data';
import { hasAnimatedSprite, SPRITE_CONFIGS } from '../config/spriteConfig';
import { audioManager } from '../systems/AudioManager';

interface StatChoice {
  type: 'heal' | 'maxHp' | 'attack' | 'armor';
  label: string;
  description: string;
  value: number;
  color: number;
  icon: string;
}

interface GearChoice {
  type: 'weapon' | 'accessory' | 'keep';
  item: Weapon | Accessory | null;
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

  // Live preview references
  private previewHpText: Phaser.GameObjects.Text | null = null;
  private previewAtkText: Phaser.GameObjects.Text | null = null;
  private previewArmorText: Phaser.GameObjects.Text | null = null;
  private weaponSlotBg: Phaser.GameObjects.Rectangle | null = null;
  private weaponSlotText: Phaser.GameObjects.Text | null = null;
  private accessorySlotBg: Phaser.GameObjects.Rectangle | null = null;
  private accessorySlotText: Phaser.GameObjects.Text | null = null;

  // Base values for preview calculations
  private baseCurrentHP: number = 0;
  private baseMaxHP: number = 0;
  private baseAttackMod: number = 0;
  private baseArmor: number = 0;
  private baseWeapon: Weapon | null = null;
  private baseAccessory: Accessory | null = null;

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

    // Store base values for preview
    this.baseCurrentHP = state.player.currentHP;
    this.baseMaxHP = state.player.maxHP;
    this.baseAttackMod = state.player.animal.stats.attackMod;
    this.baseArmor = state.player.animal.stats.armor;
    this.baseWeapon = state.player.weapon;
    this.baseAccessory = state.player.accessory;

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

    // Add mute button
    audioManager.createMuteButton(this);
  }

  private createFighterPreview(x: number, y: number, state: any): void {
    const panelWidth = 170;
    const panelHeight = 420;
    const container = this.add.container(x + panelWidth / 2, y);

    // Panel background
    const bg = this.add.rectangle(0, panelHeight / 2, panelWidth, panelHeight, 0x1a1a2a)
      .setStrokeStyle(2, 0x5a5a7a);
    container.add(bg);

    // Title
    const title = this.add.text(0, 15, 'Your Fighter', {
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5);
    container.add(title);

    // Animal sprite - handle animated vs static
    const animalId = state.player.animal.id;
    let sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;

    if (hasAnimatedSprite(animalId)) {
      const config = SPRITE_CONFIGS[animalId];
      const firstFramePath = config.animations.idle?.frames[0] || config.animations.jump?.frames[0];
      const frameKey = `${animalId}-${firstFramePath?.replace(/[\/\.]/g, '-')}`;
      sprite = this.add.sprite(0, 70, frameKey).setDisplaySize(80, 80);
      if (config.animations.idle) {
        (sprite as Phaser.GameObjects.Sprite).play(config.animations.idle.key);
      }
    } else {
      sprite = this.add.image(0, 70, animalId).setDisplaySize(80, 80);
    }
    container.add(sprite);

    // Animal name
    const name = this.add.text(0, 120, state.player.animal.name, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(name);

    // Stats row - store references for live updates
    let yPos = 145;
    const statsContainer = this.add.container(0, yPos);

    this.previewHpText = this.add.text(-50, 0, `❤️ ${state.player.currentHP}/${state.player.maxHP}`, {
      fontSize: '11px',
      color: '#ff6666',
    }).setOrigin(0.5);

    this.previewAtkText = this.add.text(25, 0, `⚔️ +${state.player.animal.stats.attackMod}`, {
      fontSize: '11px',
      color: '#ffaa66',
    }).setOrigin(0.5);

    this.previewArmorText = this.add.text(70, 0, `🛡️ ${state.player.animal.stats.armor}`, {
      fontSize: '11px',
      color: '#6699ff',
    }).setOrigin(0.5);

    statsContainer.add([this.previewHpText, this.previewAtkText, this.previewArmorText]);
    container.add(statsContainer);
    yPos += 25;

    // Divider
    const divider1 = this.add.rectangle(0, yPos, panelWidth - 20, 1, 0x4a4a6a);
    container.add(divider1);
    yPos += 12;

    // Attack section
    const attackLabel = this.add.text(0, yPos, 'ATTACK', {
      fontSize: '9px',
      color: '#ffcc66',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(attackLabel);
    yPos += 14;

    const unarmedAttack = state.player.animal.unarmedAttack;
    const attackName = this.add.text(0, yPos, `👊 ${unarmedAttack.name}`, {
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(attackName);
    yPos += 14;

    let attackDetails = `${unarmedAttack.damage} damage`;
    if (unarmedAttack.effectType && unarmedAttack.effectChance) {
      attackDetails += ` • ${unarmedAttack.effectChance}% ${unarmedAttack.effectType}`;
    }
    const attackDesc = this.add.text(0, yPos, attackDetails, {
      fontSize: '9px',
      color: '#aaaaaa',
    }).setOrigin(0.5);
    container.add(attackDesc);
    yPos += 20;

    // Divider
    const divider2 = this.add.rectangle(0, yPos, panelWidth - 20, 1, 0x4a4a6a);
    container.add(divider2);
    yPos += 12;

    // Equipment section
    const equipLabel = this.add.text(0, yPos, 'EQUIPMENT', {
      fontSize: '9px',
      color: '#8888aa',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(equipLabel);
    yPos += 16;

    // Weapon slot - store references for live updates
    const weaponSlotElements = this.createEquipmentSlotWithRefs(
      container, 0, yPos, panelWidth - 20, 22, '🗡️',
      state.player.weapon?.name || null,
      state.player.weapon ? '#ff9966' : '#444466'
    );
    this.weaponSlotBg = weaponSlotElements.bg;
    this.weaponSlotText = weaponSlotElements.text;
    yPos += 26;

    // Accessory slot - store references for live updates
    const accessorySlotElements = this.createEquipmentSlotWithRefs(
      container, 0, yPos, panelWidth - 20, 22, '💎',
      state.player.accessory?.name || null,
      state.player.accessory ? '#66ff99' : '#444466'
    );
    this.accessorySlotBg = accessorySlotElements.bg;
    this.accessorySlotText = accessorySlotElements.text;
    yPos += 30;

    // Divider
    const divider3 = this.add.rectangle(0, yPos, panelWidth - 20, 1, 0x4a4a6a);
    container.add(divider3);
    yPos += 12;

    // Passive section
    const passiveLabel = this.add.text(0, yPos, 'PASSIVE', {
      fontSize: '9px',
      color: '#88ff88',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(passiveLabel);
    yPos += 14;

    const passiveName = this.add.text(0, yPos, state.player.animal.passive.name, {
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(passiveName);
    yPos += 14;

    const passiveDesc = this.add.text(0, yPos, state.player.animal.passive.description, {
      fontSize: '9px',
      color: '#aaaaaa',
      align: 'center',
      wordWrap: { width: panelWidth - 20 },
    }).setOrigin(0.5, 0);
    container.add(passiveDesc);
  }

  private createEquipmentSlotWithRefs(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    width: number,
    height: number,
    icon: string,
    itemName: string | null,
    textColor: string
  ): { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text } {
    // Slot background
    const slotBg = this.add.rectangle(x, y, width, height, itemName ? 0x2a2a4a : 0x1a1a2a)
      .setStrokeStyle(1, itemName ? 0x5a5a7a : 0x333344);
    container.add(slotBg);

    // Icon on the left
    const iconText = this.add.text(x - width / 2 + 14, y, icon, {
      fontSize: '11px',
    }).setOrigin(0.5);
    container.add(iconText);

    // Item name or "Empty" indicator
    const displayText = itemName || 'Empty';
    const label = this.add.text(x + 8, y, displayText, {
      fontSize: '10px',
      color: textColor,
      fontStyle: itemName ? 'bold' : 'normal',
    }).setOrigin(0.5);
    container.add(label);

    return { bg: slotBg, text: label };
  }

  private updatePreview(): void {
    // Calculate previewed stats based on selections
    let previewCurrentHP = this.baseCurrentHP;
    let previewMaxHP = this.baseMaxHP;
    let previewAttack = this.baseAttackMod;
    let previewArmor = this.baseArmor;

    // Apply stat bonus preview
    if (this.selectedStat) {
      switch (this.selectedStat.type) {
        case 'heal':
          previewCurrentHP = Math.min(previewCurrentHP + this.selectedStat.value, previewMaxHP);
          break;
        case 'maxHp':
          previewMaxHP += this.selectedStat.value;
          previewCurrentHP += this.selectedStat.value; // Max HP boost also heals
          break;
        case 'attack':
          previewAttack += this.selectedStat.value;
          break;
        case 'armor':
          previewArmor += this.selectedStat.value;
          break;
      }
    }

    // Update stat texts with highlight for changes
    if (this.previewHpText) {
      const hpChanged = previewCurrentHP !== this.baseCurrentHP || previewMaxHP !== this.baseMaxHP;
      this.previewHpText.setText(`❤️ ${previewCurrentHP}/${previewMaxHP}`);
      this.previewHpText.setColor(hpChanged ? '#88ff88' : '#ff6666');
    }

    if (this.previewAtkText) {
      const atkChanged = previewAttack !== this.baseAttackMod;
      this.previewAtkText.setText(`⚔️ +${previewAttack}`);
      this.previewAtkText.setColor(atkChanged ? '#ffff88' : '#ffaa66');
    }

    if (this.previewArmorText) {
      const armorChanged = previewArmor !== this.baseArmor;
      this.previewArmorText.setText(`🛡️ ${previewArmor}`);
      this.previewArmorText.setColor(armorChanged ? '#88ffff' : '#6699ff');
    }

    // Update equipment slots based on gear selection
    let previewWeapon = this.baseWeapon;
    let previewAccessory = this.baseAccessory;

    if (this.selectedGear) {
      if (this.selectedGear.type === 'weapon') {
        previewWeapon = this.selectedGear.item as Weapon;
      } else if (this.selectedGear.type === 'accessory') {
        previewAccessory = this.selectedGear.item as Accessory;
      }
      // 'keep' means no change
    }

    // Update weapon slot
    if (this.weaponSlotBg && this.weaponSlotText) {
      const weaponName = previewWeapon?.name || null;
      const weaponChanged = previewWeapon !== this.baseWeapon;

      this.weaponSlotBg.setFillStyle(weaponName ? 0x2a2a4a : 0x1a1a2a);
      this.weaponSlotBg.setStrokeStyle(1, weaponChanged ? 0xffaa66 : (weaponName ? 0x5a5a7a : 0x333344));

      this.weaponSlotText.setText(weaponName || 'Empty');
      this.weaponSlotText.setColor(weaponChanged ? '#ffff88' : (weaponName ? '#ff9966' : '#444466'));
      this.weaponSlotText.setFontStyle(weaponName ? 'bold' : 'normal');
    }

    // Update accessory slot
    if (this.accessorySlotBg && this.accessorySlotText) {
      const accessoryName = previewAccessory?.name || null;
      const accessoryChanged = previewAccessory !== this.baseAccessory;

      this.accessorySlotBg.setFillStyle(accessoryName ? 0x2a2a4a : 0x1a1a2a);
      this.accessorySlotBg.setStrokeStyle(1, accessoryChanged ? 0x88ff88 : (accessoryName ? 0x5a5a7a : 0x333344));

      this.accessorySlotText.setText(accessoryName || 'Empty');
      this.accessorySlotText.setColor(accessoryChanged ? '#88ffff' : (accessoryName ? '#66ff99' : '#444466'));
      this.accessorySlotText.setFontStyle(accessoryName ? 'bold' : 'normal');
    }
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

    const choices: GearChoice[] = shuffled.slice(0, 2).map(item => {
      const isRare = DRAFT_WEAPONS.some(w => w.id === item.id) ||
                     DRAFT_ACCESSORIES.some(a => a.id === item.id);
      return {
        type: isWeapon(item) ? 'weapon' : 'accessory',
        item,
        isRare,
      };
    });

    // Add "Keep Current" option
    choices.push({
      type: 'keep',
      item: null,
      isRare: false,
    });

    return choices;
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

      // Handle "Keep Current" card differently
      if (choice.type === 'keep') {
        const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x2a2a4a)
          .setStrokeStyle(2, 0x8888aa);

        const typeLabel = this.add.text(0, -70, 'KEEP CURRENT', {
          fontSize: '10px',
          color: '#8888aa',
        }).setOrigin(0.5);

        const emojiText = this.add.text(0, -30, '✓', {
          fontSize: '36px',
        }).setOrigin(0.5);

        const nameLabel = this.add.text(0, 10, 'No Change', {
          fontSize: '14px',
          color: '#ffffff',
          fontStyle: 'bold',
        }).setOrigin(0.5);

        const descLabel = this.add.text(0, 55, 'Continue with\nyour current gear', {
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
        return;
      }

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
        ? this.getWeaponEmoji(choice.item!.id)
        : this.getAccessoryEmoji(choice.item!.id);
      const emojiText = this.add.text(0, -30, emoji, {
        fontSize: '36px',
      }).setOrigin(0.5);

      // Name
      const nameLabel = this.add.text(0, 10, choice.item!.name, {
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
    if (choice.type === 'keep' || !choice.item) {
      return 'Continue with\nyour current gear';
    }
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

    this.updatePreview();
    this.updateContinueButton();
  }

  private selectGear(choice: GearChoice, _index: number): void {
    // Clear all
    this.gearCards.forEach((_card, i) => {
      const ch = this.gearChoices[i];
      const bg = (ch as any)._bg as Phaser.GameObjects.Rectangle;
      bg.setFillStyle(0x2a2a4a);
      let borderColor: number;
      if (ch.type === 'keep') {
        borderColor = 0x8888aa;
      } else {
        borderColor = ch.isRare ? 0xffaa00 : (ch.type === 'weapon' ? 0xff6666 : 0x66ff66);
      }
      bg.setStrokeStyle(ch.isRare ? 3 : 2, borderColor);
    });

    // Select new
    this.selectedGear = choice;
    const bg = (choice as any)._bg as Phaser.GameObjects.Rectangle;
    bg.setFillStyle(0x4a4a6a);
    let selectedColor: number;
    if (choice.type === 'keep') {
      selectedColor = 0xaaaacc;
    } else {
      selectedColor = choice.isRare ? 0xffdd44 : (choice.type === 'weapon' ? 0xff9999 : 0x99ff99);
    }
    bg.setStrokeStyle(4, selectedColor);

    this.updatePreview();
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

    if (this.selectedGear && this.selectedGear.type !== 'keep') {
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
