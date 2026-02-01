import Phaser from 'phaser';
import type { Animal } from '../types';
import { ANIMALS, PLAYABLE_ANIMALS } from '../data';
import { hasAnimatedSprite, SPRITE_CONFIGS } from '../config/spriteConfig';
import { FONT_FAMILY, FONT_FAMILY_SECONDARY } from '../config/fontConfig';

const CHARACTERS_PER_PAGE = 12;
const GRID_COLS = 3;

export class CharacterGalleryScene extends Phaser.Scene {
  private selectedAnimal: Animal | null = null;
  private characterCards: Phaser.GameObjects.Container[] = [];
  private detailSprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image | null = null;
  private detailContainer: Phaser.GameObjects.Container | null = null;
  private statsText: Phaser.GameObjects.Text | null = null;
  private passiveText: Phaser.GameObjects.Text | null = null;
  private attackText: Phaser.GameObjects.Text | null = null;
  private playableBadge: Phaser.GameObjects.Text | null = null;
  private animationButtons: Phaser.GameObjects.Text[] = [];

  private currentPage = 0;
  private pageText: Phaser.GameObjects.Text | null = null;
  private prevButton: Phaser.GameObjects.Text | null = null;
  private nextButton: Phaser.GameObjects.Text | null = null;
  private gridContainer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'CharacterGalleryScene' });
  }

  create(): void {
    // Cleanup on shutdown (only scene-local UI)
    this.events.once('shutdown', () => {
      this.tweens.killAll();
    });

    this.characterCards = [];
    this.animationButtons = [];
    this.selectedAnimal = null;
    this.currentPage = 0;

    this.createBackground();
    this.createCharacterGrid();
    this.createPaginationControls();
    this.createDetailPanel();
    this.createBackButton();

    // Select first character by default
    if (ANIMALS.length > 0) {
      this.selectCharacter(ANIMALS[0], 0);
    }
  }

  private get totalPages(): number {
    return Math.ceil(ANIMALS.length / CHARACTERS_PER_PAGE);
  }

  private get pageAnimals(): Animal[] {
    const start = this.currentPage * CHARACTERS_PER_PAGE;
    return ANIMALS.slice(start, start + CHARACTERS_PER_PAGE);
  }

  private createBackground(): void {
    const { width, height } = this.cameras.main;

    // Dark background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Title
    this.add.text(width / 2, 30, 'Character Gallery', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Divider line between grid and detail panel
    this.add.rectangle(260, height / 2 + 30, 2, height - 100, 0x4a4a6a);
  }

  private createCharacterGrid(): void {
    this.gridContainer = this.add.container(0, 0);
    this.rebuildGrid();
  }

  private rebuildGrid(): void {
    // Clear existing cards
    this.characterCards.forEach(card => card.destroy());
    this.characterCards = [];

    if (this.gridContainer) {
      this.gridContainer.removeAll(true);
    }

    const startX = 10;
    const startY = 75;
    const cardWidth = 75;
    const cardHeight = 95;
    const spacing = 8;

    // Section label
    const label = this.add.text(startX + 5, startY - 10, 'All Characters', {
      fontFamily: FONT_FAMILY_SECONDARY,
      fontSize: '12px',
      color: '#888888',
    });
    this.gridContainer?.add(label);

    const animals = this.pageAnimals;

    animals.forEach((animal, index) => {
      const row = Math.floor(index / GRID_COLS);
      const col = index % GRID_COLS;
      const x = startX + (col * (cardWidth + spacing)) + cardWidth / 2;
      const y = startY + 12 + (row * (cardHeight + spacing)) + cardHeight / 2;

      const container = this.add.container(x, y);

      // Card background
      const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x2a2a4a)
        .setStrokeStyle(2, 0x4a4a6a);

      // Check if playable
      const isPlayable = PLAYABLE_ANIMALS.some(a => a.id === animal.id);

      // Enemy-only indicator
      let enemyBadge: Phaser.GameObjects.Text | null = null;
      if (!isPlayable) {
        enemyBadge = this.add.text(cardWidth / 2 - 3, -cardHeight / 2 + 3, '👁️', {
          fontSize: '8px',
        }).setOrigin(1, 0);
      }

      // Animal sprite
      let sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
      if (hasAnimatedSprite(animal.id)) {
        const config = SPRITE_CONFIGS[animal.id];
        const firstFramePath = config.animations.idle?.frames[0] || config.animations.attack?.frames[0];
        const firstFrameKey = `${animal.id}-${firstFramePath?.replace(/[\/\.]/g, '-')}`;
        sprite = this.add.sprite(0, -15, firstFrameKey).setDisplaySize(48, 48);
        if (config.animations.idle) {
          (sprite as Phaser.GameObjects.Sprite).play(config.animations.idle.key);
        }
      } else {
        sprite = this.add.image(0, -15, animal.id).setDisplaySize(48, 48);
      }

      // Animal name
      const name = this.add.text(0, 22, animal.name, {
        fontFamily: FONT_FAMILY_SECONDARY,
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Mini stats
      const stats = this.add.text(0, 35, `HP:${animal.stats.hp}`, {
        fontFamily: FONT_FAMILY_SECONDARY,
        fontSize: '10px',
        color: '#aaaaaa',
      }).setOrigin(0.5);

      const children: Phaser.GameObjects.GameObject[] = [bg, sprite, name, stats];
      if (enemyBadge) children.push(enemyBadge);
      container.add(children);

      // Interactivity
      bg.setInteractive({ useHandCursor: true });

      const globalIndex = this.currentPage * CHARACTERS_PER_PAGE + index;

      bg.on('pointerover', () => {
        if (this.selectedAnimal?.id !== animal.id) {
          bg.setFillStyle(0x3a3a5a);
        }
      });

      bg.on('pointerout', () => {
        if (this.selectedAnimal?.id !== animal.id) {
          bg.setFillStyle(0x2a2a4a);
        }
      });

      bg.on('pointerdown', () => {
        this.selectCharacter(animal, globalIndex);
      });

      this.characterCards.push(container);
      (container as any)._bg = bg;
      (container as any)._animalId = animal.id;
      this.gridContainer?.add(container);
    });

    // Highlight currently selected if on this page
    this.updateGridSelection();
  }

  private updateGridSelection(): void {
    this.characterCards.forEach(card => {
      const bg = (card as any)._bg as Phaser.GameObjects.Rectangle;
      const animalId = (card as any)._animalId as string;

      if (this.selectedAnimal?.id === animalId) {
        bg.setFillStyle(0x4a4a6a);
        bg.setStrokeStyle(3, 0x88ff88);
      } else {
        bg.setFillStyle(0x2a2a4a);
        bg.setStrokeStyle(2, 0x4a4a6a);
      }
    });
  }

  private createPaginationControls(): void {
    const centerX = 130;
    const y = 510;

    // Previous button
    this.prevButton = this.add.text(centerX - 70, y, '◀', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#3a3a5a',
      padding: { x: 12, y: 6 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.prevButton.on('pointerover', () => {
      if (this.currentPage > 0) {
        this.prevButton?.setStyle({ backgroundColor: '#5a5a7a' });
      }
    });

    this.prevButton.on('pointerout', () => {
      this.prevButton?.setStyle({ backgroundColor: '#3a3a5a' });
    });

    this.prevButton.on('pointerdown', () => {
      if (this.currentPage > 0) {
        this.currentPage--;
        this.rebuildGrid();
        this.updatePaginationUI();
      }
    });

    // Page indicator
    this.pageText = this.add.text(centerX, y, '', {
      fontSize: '14px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Next button
    this.nextButton = this.add.text(centerX + 70, y, '▶', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#3a3a5a',
      padding: { x: 12, y: 6 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.nextButton.on('pointerover', () => {
      if (this.currentPage < this.totalPages - 1) {
        this.nextButton?.setStyle({ backgroundColor: '#5a5a7a' });
      }
    });

    this.nextButton.on('pointerout', () => {
      this.nextButton?.setStyle({ backgroundColor: '#3a3a5a' });
    });

    this.nextButton.on('pointerdown', () => {
      if (this.currentPage < this.totalPages - 1) {
        this.currentPage++;
        this.rebuildGrid();
        this.updatePaginationUI();
      }
    });

    this.updatePaginationUI();
  }

  private updatePaginationUI(): void {
    if (this.pageText) {
      this.pageText.setText(`Page ${this.currentPage + 1} / ${this.totalPages}`);
    }

    // Update button states
    if (this.prevButton) {
      this.prevButton.setAlpha(this.currentPage > 0 ? 1 : 0.4);
    }
    if (this.nextButton) {
      this.nextButton.setAlpha(this.currentPage < this.totalPages - 1 ? 1 : 0.4);
    }
  }

  private createDetailPanel(): void {
    const panelX = 280;
    const panelY = 65;
    const panelWidth = 500;
    const panelHeight = 480;

    this.detailContainer = this.add.container(panelX, panelY);

    // Panel background
    const panelBg = this.add.rectangle(panelWidth / 2, panelHeight / 2, panelWidth, panelHeight, 0x222244)
      .setStrokeStyle(2, 0x5a5a7a);

    // Character name placeholder
    const nameText = this.add.text(panelWidth / 2, 25, 'Select a Character', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    (this.detailContainer as any)._nameText = nameText;

    // Large sprite area
    this.detailSprite = this.add.sprite(panelWidth / 2, 115, 'rat')
      .setDisplaySize(120, 120)
      .setAlpha(0.3);

    // Animation buttons row
    const buttonY = 195;
    const buttonLabels = ['Idle', 'Attack', 'Hurt', 'Death', 'Jump'];
    const buttonWidth = 65;
    const buttonSpacing = 8;
    const totalButtonWidth = (buttonLabels.length * buttonWidth) + ((buttonLabels.length - 1) * buttonSpacing);
    const startButtonX = (panelWidth - totalButtonWidth) / 2 + buttonWidth / 2;

    const animLabel = this.add.text(panelWidth / 2, buttonY - 20, 'Animations', {
      fontSize: '11px',
      color: '#888888',
    }).setOrigin(0.5);

    buttonLabels.forEach((label, index) => {
      const btnX = startButtonX + index * (buttonWidth + buttonSpacing);
      const btn = this.add.text(btnX, buttonY, label, {
        fontSize: '11px',
        color: '#ffffff',
        backgroundColor: '#3a3a5a',
        padding: { x: 10, y: 5 },
      })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => {
        btn.setStyle({ backgroundColor: '#5a5a7a' });
      });

      btn.on('pointerout', () => {
        btn.setStyle({ backgroundColor: '#3a3a5a' });
      });

      btn.on('pointerdown', () => {
        this.playAnimation(label.toLowerCase() as 'idle' | 'attack' | 'hurt' | 'death' | 'jump');
      });

      this.animationButtons.push(btn);
    });

    // Stats section
    const statsY = 235;
    const statsLabel = this.add.text(20, statsY, 'Stats', {
      fontSize: '13px',
      color: '#88ff88',
      fontStyle: 'bold',
    });

    this.statsText = this.add.text(20, statsY + 18, '', {
      fontSize: '12px',
      color: '#ffffff',
      lineSpacing: 4,
    });

    // Passive section
    const passiveY = 290;
    const passiveLabel = this.add.text(20, passiveY, 'Passive Ability', {
      fontSize: '13px',
      color: '#ffaa66',
      fontStyle: 'bold',
    });

    this.passiveText = this.add.text(20, passiveY + 18, '', {
      fontSize: '11px',
      color: '#ffffff',
      wordWrap: { width: panelWidth - 40 },
      lineSpacing: 2,
    });

    // Attack section
    const attackY = 365;
    const attackLabel = this.add.text(20, attackY, 'Unarmed Attack', {
      fontSize: '13px',
      color: '#ff6666',
      fontStyle: 'bold',
    });

    this.attackText = this.add.text(20, attackY + 18, '', {
      fontSize: '11px',
      color: '#ffffff',
      wordWrap: { width: panelWidth - 40 },
      lineSpacing: 2,
    });

    // Playable badge
    this.playableBadge = this.add.text(panelWidth - 20, panelHeight - 20, '', {
      fontSize: '11px',
      color: '#ffffff',
      backgroundColor: '#4a6a4a',
      padding: { x: 10, y: 5 },
    }).setOrigin(1, 1);

    // Add all elements to the container
    this.detailContainer.add([
      panelBg,
      nameText,
      this.detailSprite,
      animLabel,
      ...this.animationButtons,
      statsLabel,
      this.statsText,
      passiveLabel,
      this.passiveText,
      attackLabel,
      this.attackText,
      this.playableBadge,
    ]);
  }

  private createBackButton(): void {
    const { height } = this.cameras.main;

    const backButton = this.add.text(130, height - 35, '← Back to Menu', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#4a4a6a',
      padding: { x: 14, y: 6 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    backButton.on('pointerover', () => {
      backButton.setStyle({ backgroundColor: '#6a6a8a' });
    });

    backButton.on('pointerout', () => {
      backButton.setStyle({ backgroundColor: '#4a4a6a' });
    });

    backButton.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }

  private selectCharacter(animal: Animal, _globalIndex: number): void {
    this.selectedAnimal = animal;
    this.updateGridSelection();
    this.updateDetailPanel();
  }

  private updateDetailPanel(): void {
    if (!this.selectedAnimal || !this.detailContainer || !this.detailSprite) return;

    const animal = this.selectedAnimal;
    const nameText = (this.detailContainer as any)._nameText as Phaser.GameObjects.Text;
    nameText.setText(animal.name);

    // Update sprite
    if (hasAnimatedSprite(animal.id)) {
      const config = SPRITE_CONFIGS[animal.id];
      const firstFramePath = config.animations.idle?.frames[0] || config.animations.attack?.frames[0];
      const firstFrameKey = `${animal.id}-${firstFramePath?.replace(/[\/\.]/g, '-')}`;
      this.detailSprite.setTexture(firstFrameKey);
      this.detailSprite.setDisplaySize(120, 120);
      this.detailSprite.setAlpha(1);
      if (this.detailSprite instanceof Phaser.GameObjects.Sprite && config.animations.idle) {
        this.detailSprite.play(config.animations.idle.key);
      }
    } else {
      this.detailSprite.setTexture(animal.id);
      this.detailSprite.setDisplaySize(120, 120);
      this.detailSprite.setAlpha(1);
      if (this.detailSprite instanceof Phaser.GameObjects.Sprite) {
        this.detailSprite.stop();
      }
    }

    // Update stats
    if (this.statsText) {
      const stats = animal.stats;
      this.statsText.setText(
        `HP: ${stats.hp}    Attack Mod: +${stats.attackMod}    Armor: ${stats.armor}`
      );
    }

    // Update passive
    if (this.passiveText) {
      this.passiveText.setText(`${animal.passive.name}\n${animal.passive.description}`);
    }

    // Update attack
    if (this.attackText) {
      const atk = animal.unarmedAttack;
      let attackDesc = `${atk.name} - ${atk.damage} damage`;
      if (atk.effectType && atk.effectChance) {
        const effectDuration = atk.effectValue || 1;
        attackDesc += `\n${atk.effectChance}% chance to apply ${atk.effectType} for ${effectDuration} turn${effectDuration > 1 ? 's' : ''}`;
      }
      if (atk.healOnHit) {
        attackDesc += `\nHeals ${atk.healOnHit} HP on hit`;
      }
      this.attackText.setText(attackDesc);
    }

    // Update playable badge
    if (this.playableBadge) {
      const isPlayable = PLAYABLE_ANIMALS.some(a => a.id === animal.id);
      if (isPlayable) {
        this.playableBadge.setText('✓ Playable');
        this.playableBadge.setStyle({ backgroundColor: '#4a6a4a' });
      } else {
        this.playableBadge.setText('👁️ Enemy Only');
        this.playableBadge.setStyle({ backgroundColor: '#6a4a4a' });
      }
    }

    // Enable/disable animation buttons based on available animations
    this.updateAnimationButtons();
  }

  private updateAnimationButtons(): void {
    if (!this.selectedAnimal) return;

    const animKeys = ['idle', 'attack', 'hurt', 'death', 'jump'];
    const hasAnim = hasAnimatedSprite(this.selectedAnimal.id);

    this.animationButtons.forEach((btn, index) => {
      const animKey = animKeys[index] as keyof typeof SPRITE_CONFIGS[string]['animations'];
      let isAvailable = false;

      if (hasAnim) {
        const config = SPRITE_CONFIGS[this.selectedAnimal!.id];
        isAvailable = !!config.animations[animKey];
      }

      if (isAvailable) {
        btn.setAlpha(1);
        btn.setInteractive({ useHandCursor: true });
      } else {
        btn.setAlpha(0.4);
        btn.disableInteractive();
      }
    });
  }

  private playAnimation(animKey: 'idle' | 'attack' | 'hurt' | 'death' | 'jump'): void {
    if (!this.selectedAnimal || !this.detailSprite) return;

    if (!hasAnimatedSprite(this.selectedAnimal.id)) return;

    const config = SPRITE_CONFIGS[this.selectedAnimal.id];
    const animConfig = config.animations[animKey];

    if (!animConfig) return;

    if (this.detailSprite instanceof Phaser.GameObjects.Sprite) {
      this.detailSprite.play(animConfig.key);

      // For non-looping animations (except death), return to idle when complete
      // Death animation stays on final frame
      if (animConfig.repeat === 0 && animKey !== 'idle' && animKey !== 'death') {
        this.detailSprite.once('animationcomplete', () => {
          const idleConfig = config.animations.idle;
          if (idleConfig && this.detailSprite instanceof Phaser.GameObjects.Sprite) {
            this.detailSprite.play(idleConfig.key);
          }
        });
      }
    }
  }
}
