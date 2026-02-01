import Phaser from 'phaser';
import { gameStateManager } from '../GameStateManager';
import { hasAnimatedSprite, SPRITE_CONFIGS } from '../config/spriteConfig';
import { FONT_FAMILY, FONT_FAMILY_SECONDARY } from '../config/fontConfig';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  init(data: { victory: boolean }): void {
    this.data.set('victory', data.victory);
  }

  create(): void {
    // Cleanup on shutdown (only scene-local UI)
    this.events.once('shutdown', () => {
      this.tweens.killAll();
    });

    const { width, height } = this.cameras.main;
    const victory = this.data.get('victory') as boolean;
    const state = gameStateManager.getState();

    if (victory) {
      this.createVictoryScreen(width, height, state);
    } else {
      this.createDefeatScreen(width, height, state);
    }

    // Buttons at bottom
    this.createButtons(width, height);
  }

  private createVictoryScreen(width: number, height: number, state: any): void {
    // Victory title with glow effect
    this.add.text(width / 2, 50, 'VICTORY', {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: '#ffdd44',
    }).setOrigin(0.5);

    this.add.text(width / 2, 95, 'You conquered the gauntlet!', {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: '#88ff88',
    }).setOrigin(0.5);

    // Main panel
    const panelWidth = 300;
    const panelHeight = 320;
    const panelX = width / 2;
    const panelY = height / 2 + 10;

    this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x1a1a2a)
      .setStrokeStyle(3, 0x88ff88);

    // Champion label
    this.add.text(panelX, panelY - 140, 'CHAMPION', {
      fontFamily: FONT_FAMILY_SECONDARY,
      fontSize: '14px',
      color: '#ffdd44',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Animal sprite (celebrating with jump animation)
    const animalId = state?.player.animal.id;
    if (animalId) {
      this.createAnimalSprite(panelX, panelY - 70, animalId, false, true);
    }

    // Animal name
    const animalName = state?.player.animal.name ?? 'Unknown';
    this.add.text(panelX, panelY + 10, animalName, {
      fontFamily: FONT_FAMILY_SECONDARY,
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Divider
    this.add.rectangle(panelX, panelY + 40, panelWidth - 40, 1, 0x4a4a6a);

    // Stats summary
    let yPos = panelY + 60;

    this.add.text(panelX, yPos, 'FINAL STATS', {
      fontSize: '10px',
      color: '#888888',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    yPos += 20;

    // Stats row
    const hp = state?.player.currentHP ?? 0;
    const maxHp = state?.player.maxHP ?? 0;
    const atk = state?.player.animal.stats.attackMod ?? 0;
    const armor = state?.player.animal.stats.armor ?? 0;

    this.add.text(panelX - 60, yPos, `❤️ ${hp}/${maxHp}`, {
      fontSize: '14px',
      color: '#ff6666',
    }).setOrigin(0.5);

    this.add.text(panelX, yPos, `⚔️ +${atk}`, {
      fontSize: '14px',
      color: '#ffaa66',
    }).setOrigin(0.5);

    this.add.text(panelX + 60, yPos, `🛡️ ${armor}`, {
      fontSize: '14px',
      color: '#6699ff',
    }).setOrigin(0.5);

    yPos += 30;

    // Battles won
    this.add.text(panelX, yPos, '4 Battles Won', {
      fontSize: '16px',
      color: '#88ff88',
    }).setOrigin(0.5);

    yPos += 25;

    // Equipment summary
    const weaponName = state?.player.weapon?.name;
    const accessoryName = state?.player.accessory?.name;

    if (weaponName || accessoryName) {
      this.add.text(panelX, yPos, 'Equipment:', {
        fontSize: '11px',
        color: '#888888',
      }).setOrigin(0.5);
      yPos += 16;

      if (weaponName) {
        this.add.text(panelX, yPos, `🗡️ ${weaponName}`, {
          fontSize: '12px',
          color: '#ff9966',
        }).setOrigin(0.5);
        yPos += 16;
      }

      if (accessoryName) {
        this.add.text(panelX, yPos, `💎 ${accessoryName}`, {
          fontSize: '12px',
          color: '#66ff99',
        }).setOrigin(0.5);
      }
    }
  }

  private createDefeatScreen(width: number, height: number, state: any): void {
    // Defeat title
    this.add.text(width / 2, 50, 'DEFEAT', {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: '#ff6666',
    }).setOrigin(0.5);

    const cpuNumber = state?.run.currentCPU ?? 1;
    this.add.text(width / 2, 95, `Fell in Battle ${cpuNumber}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Main panel
    const panelWidth = 280;
    const panelHeight = 280;
    const panelX = width / 2;
    const panelY = height / 2 + 10;

    this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x1a1a2a)
      .setStrokeStyle(2, 0x5a5a7a);

    // Animal sprite (death animation)
    const animalId = state?.player.animal.id;
    if (animalId) {
      this.createAnimalSprite(panelX, panelY - 50, animalId, true);
    }

    // Animal name
    const animalName = state?.player.animal.name ?? 'Unknown';
    this.add.text(panelX, panelY + 30, animalName, {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Divider
    this.add.rectangle(panelX, panelY + 60, panelWidth - 40, 1, 0x4a4a6a);

    // Progress summary
    let yPos = panelY + 80;

    const battlesWon = cpuNumber - 1;
    if (battlesWon > 0) {
      this.add.text(panelX, yPos, `${battlesWon} Battle${battlesWon > 1 ? 's' : ''} Won`, {
        fontSize: '16px',
        color: '#88aa88',
      }).setOrigin(0.5);
    } else {
      this.add.text(panelX, yPos, 'No Victories', {
        fontSize: '16px',
        color: '#888888',
      }).setOrigin(0.5);
    }

    yPos += 30;

    // Encouraging message
    const messages = [
      'Better luck next time!',
      'Try a different strategy.',
      'The gauntlet awaits...',
      'Rise and try again!',
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    this.add.text(panelX, yPos, randomMessage, {
      fontSize: '14px',
      color: '#666688',
      fontStyle: 'italic',
    }).setOrigin(0.5);
  }

  private createButtons(width: number, height: number): void {
    // Play again button
    const playAgainButton = this.add.text(width / 2, height - 90, 'Play Again', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#4a6a4a',
      padding: { x: 35, y: 12 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    playAgainButton.on('pointerover', () => {
      playAgainButton.setStyle({ backgroundColor: '#5a8a5a' });
    });

    playAgainButton.on('pointerout', () => {
      playAgainButton.setStyle({ backgroundColor: '#4a6a4a' });
    });

    playAgainButton.on('pointerdown', () => {
      gameStateManager.resetRun();
      this.scene.start('LoadoutScene');
    });

    // Main menu button
    const menuButton = this.add.text(width / 2, height - 40, 'Main Menu', {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: '#888888',
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    menuButton.on('pointerover', () => {
      menuButton.setStyle({ color: '#ffffff' });
    });

    menuButton.on('pointerout', () => {
      menuButton.setStyle({ color: '#888888' });
    });

    menuButton.on('pointerdown', () => {
      gameStateManager.resetRun();
      this.scene.start('MenuScene');
    });
  }

  private createAnimalSprite(x: number, y: number, animalId: string, playDeath: boolean, isVictory: boolean = false): void {
    if (hasAnimatedSprite(animalId)) {
      const config = SPRITE_CONFIGS[animalId];

      let startFramePath: string | undefined;
      let animToPlay: string | undefined;

      if (playDeath && config.animations.death) {
        startFramePath = config.animations.death.frames[0];
        animToPlay = config.animations.death.key;
      } else if (isVictory && config.animations.jump) {
        // Use jump animation for victory, looping
        startFramePath = config.animations.jump.frames[0];
        animToPlay = config.animations.jump.key;
      } else if (config.animations.idle) {
        startFramePath = config.animations.idle.frames[0];
        animToPlay = config.animations.idle.key;
      } else if (config.animations.jump) {
        startFramePath = config.animations.jump.frames[0];
      }

      if (!startFramePath) return;

      const frameKey = `${animalId}-${startFramePath.replace(/[\/\.]/g, '-')}`;
      const sprite = this.add.sprite(x, y, frameKey)
        .setDisplaySize(120, 120);

      if (playDeath && animToPlay) {
        sprite.play(animToPlay);
        sprite.once('animationcomplete', () => {
          sprite.stop();
        });
      } else if (isVictory && animToPlay) {
        // Loop jump animation for victory celebration
        sprite.play({ key: animToPlay, repeat: -1 });
      } else if (animToPlay) {
        sprite.play(animToPlay);
      }
    } else {
      const sprite = this.add.image(x, y, animalId)
        .setDisplaySize(120, 120);

      if (playDeath) {
        sprite.setAlpha(0.5);
        sprite.setTint(0xff6666);
      }
    }
  }
}
