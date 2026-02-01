import Phaser from 'phaser';
import type { Animal } from '../types';
import { PLAYABLE_ANIMALS } from '../data';
import { gameStateManager } from '../GameStateManager';
import { hasAnimatedSprite, SPRITE_CONFIGS } from '../config/spriteConfig';

const CHARACTERS_PER_PAGE = 6;

export class LoadoutScene extends Phaser.Scene {
  private selectedAnimal: Animal | null = null;

  private startButton: Phaser.GameObjects.Text | null = null;
  private previewContainer: Phaser.GameObjects.Container | null = null;
  private previewSprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image | null = null;

  private animalCards: Phaser.GameObjects.Container[] = [];

  private currentPage = 0;
  private pageText: Phaser.GameObjects.Text | null = null;
  private prevButton: Phaser.GameObjects.Text | null = null;
  private nextButton: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'LoadoutScene' });
  }

  private get totalPages(): number {
    return Math.ceil(PLAYABLE_ANIMALS.length / CHARACTERS_PER_PAGE);
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Cleanup on shutdown (only scene-local UI)
    this.events.once('shutdown', () => {
      this.tweens.killAll();
    });

    // Reset selections
    this.selectedAnimal = null;
    this.animalCards = [];
    this.currentPage = 0;

    // Title
    this.add.text(width / 2, 30, 'Choose Your Character', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Create initial grid
    this.createAnimalCards(width, height);

    // Pagination controls
    this.createPaginationControls(width, height);

    // Preview panel on the right
    this.createPreviewPanel(width - 220, 70);

    // Start button
    this.startButton = this.add.text(width / 2, height - 40, '⚔️  Begin Gauntlet  ⚔️', {
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
          null,
          null
        );
        this.scene.start('BattleScene');
      }
    });

    this.updateStartButton();
  }

  private createPaginationControls(width: number, height: number): void {
    const y = height - 100;
    const centerX = width / 2 - 100; // Offset left since preview panel is on right

    // Previous button
    this.prevButton = this.add.text(centerX - 80, y, '◀', {
      fontSize: '24px',
      color: '#666666',
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.prevButton.on('pointerdown', () => {
      if (this.currentPage > 0) {
        this.currentPage--;
        this.refreshGrid();
      }
    });

    // Page indicator
    this.pageText = this.add.text(centerX, y, '', {
      fontSize: '16px',
      color: '#888888',
    }).setOrigin(0.5);

    // Next button
    this.nextButton = this.add.text(centerX + 80, y, '▶', {
      fontSize: '24px',
      color: '#666666',
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.nextButton.on('pointerdown', () => {
      if (this.currentPage < this.totalPages - 1) {
        this.currentPage++;
        this.refreshGrid();
      }
    });

    this.updatePaginationControls();
  }

  private updatePaginationControls(): void {
    if (this.pageText) {
      this.pageText.setText(`${this.currentPage + 1} / ${this.totalPages}`);
    }

    if (this.prevButton) {
      this.prevButton.setColor(this.currentPage > 0 ? '#ffffff' : '#444444');
    }

    if (this.nextButton) {
      this.nextButton.setColor(this.currentPage < this.totalPages - 1 ? '#ffffff' : '#444444');
    }
  }

  private refreshGrid(): void {
    const { width, height } = this.cameras.main;

    // Clear existing cards
    this.animalCards.forEach(card => card.destroy());
    this.animalCards = [];

    // Recreate grid
    this.createAnimalCards(width, height);
    this.updatePaginationControls();
  }

  private createAnimalCards(screenWidth: number, screenHeight: number): void {
    const cardWidth = 120;
    const cardHeight = 140;
    const spacing = 12;
    const cols = 3;
    const rows = 2;

    const gridWidth = cols * cardWidth + (cols - 1) * spacing;
    const gridHeight = rows * cardHeight + (rows - 1) * spacing;
    const startX = (screenWidth - gridWidth) / 2 - 100;
    const startY = (screenHeight - gridHeight) / 2 - 20;

    // Get animals for current page
    const startIndex = this.currentPage * CHARACTERS_PER_PAGE;
    const pageAnimals = PLAYABLE_ANIMALS.slice(startIndex, startIndex + CHARACTERS_PER_PAGE);

    pageAnimals.forEach((animal, localIndex) => {
      const col = localIndex % cols;
      const row = Math.floor(localIndex / cols);
      const x = startX + col * (cardWidth + spacing) + cardWidth / 2;
      const y = startY + row * (cardHeight + spacing) + cardHeight / 2;

      const container = this.add.container(x, y);

      // Card background
      const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x2a2a4a)
        .setStrokeStyle(2, 0x4a4a6a);

      // Check if this is the selected animal
      if (this.selectedAnimal?.id === animal.id) {
        bg.setFillStyle(0x4a4a6a);
        bg.setStrokeStyle(3, 0x88ff88);
      }

      // Animal sprite (animated if available)
      let sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
      if (hasAnimatedSprite(animal.id)) {
        const config = SPRITE_CONFIGS[animal.id];
        const firstFramePath = config.animations.idle?.frames[0] || config.animations.attack?.frames[0];
        const firstFrameKey = `${animal.id}-${firstFramePath?.replace(/[\/\.]/g, '-')}`;
        sprite = this.add.sprite(0, -20, firstFrameKey).setDisplaySize(70, 70);
        if (config.animations.idle) {
          (sprite as Phaser.GameObjects.Sprite).play(config.animations.idle.key);
        }
      } else {
        sprite = this.add.image(0, -20, animal.id).setDisplaySize(70, 70);
      }

      // Animal name
      const name = this.add.text(0, 30, animal.name, {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Stats preview
      const stats = this.add.text(0, 50, `❤️${animal.stats.hp} ⚔️+${animal.stats.attackMod} 🛡️${animal.stats.armor}`, {
        fontSize: '11px',
        color: '#aaaaaa',
      }).setOrigin(0.5);

      container.add([bg, sprite, name, stats]);

      // Interactivity
      bg.setInteractive({ useHandCursor: true });

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
        this.selectAnimal(animal, localIndex);
      });

      this.animalCards.push(container);
      (container as any)._bg = bg;
      (container as any)._animalId = animal.id;
    });
  }

  private createPreviewPanel(x: number, y: number): void {
    const panelWidth = 200;
    const panelHeight = 380;

    this.previewContainer = this.add.container(x + panelWidth / 2, y);

    // Panel background
    const panelBg = this.add.rectangle(0, panelHeight / 2, panelWidth, panelHeight, 0x1a1a2a)
      .setStrokeStyle(2, 0x5a5a7a);

    // Title
    const title = this.add.text(0, 15, 'Your Fighter', {
      fontSize: '16px',
      color: '#888888',
    }).setOrigin(0.5);

    // Placeholder prompt
    const selectPrompt = this.add.text(0, panelHeight / 2, 'Select a\ncharacter', {
      fontSize: '18px',
      color: '#555555',
      align: 'center',
    }).setOrigin(0.5);

    this.previewContainer.add([panelBg, title, selectPrompt]);
    (this.previewContainer as any)._selectPrompt = selectPrompt;
    (this.previewContainer as any)._panelWidth = panelWidth;
    (this.previewContainer as any)._panelHeight = panelHeight;
  }

  private selectAnimal(animal: Animal, localIndex: number): void {
    // Clear previous selection on current page
    this.animalCards.forEach(card => {
      const bg = (card as any)._bg as Phaser.GameObjects.Rectangle;
      const cardAnimalId = (card as any)._animalId;
      if (cardAnimalId !== animal.id) {
        bg.setFillStyle(0x2a2a4a);
        bg.setStrokeStyle(2, 0x4a4a6a);
      }
    });

    // Select new
    this.selectedAnimal = animal;
    const bg = (this.animalCards[localIndex] as any)._bg as Phaser.GameObjects.Rectangle;
    bg.setFillStyle(0x4a4a6a);
    bg.setStrokeStyle(3, 0x88ff88);

    this.updatePreview();
    this.updateStartButton();
  }

  private updatePreview(): void {
    if (!this.previewContainer) return;

    const selectPrompt = (this.previewContainer as any)._selectPrompt as Phaser.GameObjects.Text;
    const panelWidth = (this.previewContainer as any)._panelWidth as number;

    // Clear existing content (except background and title which are first 2 elements)
    while (this.previewContainer.list.length > 3) {
      const item = this.previewContainer.list[3];
      if (item && 'destroy' in item) {
        (item as Phaser.GameObjects.GameObject).destroy();
      }
    }

    if (!this.selectedAnimal) {
      selectPrompt.setVisible(true);
      return;
    }

    selectPrompt.setVisible(false);

    // Create structured preview
    let yPos = 45;

    // Large animated sprite
    if (hasAnimatedSprite(this.selectedAnimal.id)) {
      const config = SPRITE_CONFIGS[this.selectedAnimal.id];
      const firstFramePath = config.animations.idle?.frames[0] || config.animations.attack?.frames[0];
      const firstFrameKey = `${this.selectedAnimal.id}-${firstFramePath?.replace(/[\/\.]/g, '-')}`;
      this.previewSprite = this.add.sprite(0, yPos + 40, firstFrameKey).setDisplaySize(80, 80);
      if (config.animations.idle) {
        (this.previewSprite as Phaser.GameObjects.Sprite).play(config.animations.idle.key);
      }
    } else {
      this.previewSprite = this.add.image(0, yPos + 40, this.selectedAnimal.id).setDisplaySize(80, 80);
    }
    this.previewContainer.add(this.previewSprite);
    yPos += 95;

    // Character name
    const nameText = this.add.text(0, yPos, this.selectedAnimal.name, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.previewContainer.add(nameText);
    yPos += 30;

    // Stats row
    const statsContainer = this.add.container(0, yPos);

    const hpText = this.add.text(-60, 0, `❤️ ${this.selectedAnimal.stats.hp}`, {
      fontSize: '14px',
      color: '#ff6666',
    }).setOrigin(0.5);

    const atkText = this.add.text(0, 0, `⚔️ +${this.selectedAnimal.stats.attackMod}`, {
      fontSize: '14px',
      color: '#ffaa66',
    }).setOrigin(0.5);

    const armorText = this.add.text(60, 0, `🛡️ ${this.selectedAnimal.stats.armor}`, {
      fontSize: '14px',
      color: '#6699ff',
    }).setOrigin(0.5);

    statsContainer.add([hpText, atkText, armorText]);
    this.previewContainer.add(statsContainer);
    yPos += 35;

    // Divider
    const divider1 = this.add.rectangle(0, yPos, panelWidth - 30, 1, 0x4a4a6a);
    this.previewContainer.add(divider1);
    yPos += 15;

    // Passive section
    const passiveLabel = this.add.text(0, yPos, 'PASSIVE', {
      fontSize: '10px',
      color: '#88ff88',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.previewContainer.add(passiveLabel);
    yPos += 16;

    const passiveName = this.add.text(0, yPos, this.selectedAnimal.passive.name, {
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.previewContainer.add(passiveName);
    yPos += 18;

    const passiveDesc = this.add.text(0, yPos, this.selectedAnimal.passive.description, {
      fontSize: '11px',
      color: '#aaaaaa',
      align: 'center',
      wordWrap: { width: panelWidth - 20 },
    }).setOrigin(0.5, 0);
    this.previewContainer.add(passiveDesc);
    yPos += passiveDesc.height + 15;

    // Divider
    const divider2 = this.add.rectangle(0, yPos, panelWidth - 30, 1, 0x4a4a6a);
    this.previewContainer.add(divider2);
    yPos += 15;

    // Attack section
    const attackLabel = this.add.text(0, yPos, 'ATTACK', {
      fontSize: '10px',
      color: '#ff9966',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.previewContainer.add(attackLabel);
    yPos += 16;

    const attackName = this.add.text(0, yPos, this.selectedAnimal.unarmedAttack.name, {
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.previewContainer.add(attackName);
    yPos += 18;

    let attackDetails = `${this.selectedAnimal.unarmedAttack.damage} damage`;
    if (this.selectedAnimal.unarmedAttack.effectType && this.selectedAnimal.unarmedAttack.effectChance) {
      attackDetails += `\n${this.selectedAnimal.unarmedAttack.effectChance}% chance: ${this.selectedAnimal.unarmedAttack.effectType}`;
    }

    const attackDesc = this.add.text(0, yPos, attackDetails, {
      fontSize: '11px',
      color: '#aaaaaa',
      align: 'center',
    }).setOrigin(0.5, 0);
    this.previewContainer.add(attackDesc);
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
