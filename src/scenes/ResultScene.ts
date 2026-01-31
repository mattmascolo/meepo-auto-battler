import Phaser from 'phaser';
import { gameStateManager } from '../GameStateManager';
import { hasAnimatedSprite, SPRITE_CONFIGS } from '../config/spriteConfig';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  init(data: { victory: boolean }): void {
    this.data.set('victory', data.victory);
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const victory = this.data.get('victory') as boolean;
    const state = gameStateManager.getState();

    // Result title
    const titleText = victory ? 'VICTORY!' : 'DEFEAT';
    const titleColor = victory ? '#88ff88' : '#ff8888';

    this.add.text(width / 2, 60, titleText, {
      fontSize: '64px',
      color: titleColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Show player's animal sprite
    const animalId = state?.player.animal.id;
    const animalName = state?.player.animal.name ?? 'Unknown';

    if (animalId) {
      this.createAnimalSprite(width / 2, height / 2 - 20, animalId, !victory);
    }

    // Summary text below sprite
    if (victory) {
      this.add.text(width / 2, height / 2 + 100, 'You conquered the gauntlet!', {
        fontSize: '24px',
        color: '#ffffff',
      }).setOrigin(0.5);
    } else {
      const cpuNumber = state?.run.currentCPU ?? 1;
      const hpRemaining = Math.max(0, state?.player.currentHP ?? 0);
      this.add.text(width / 2, height / 2 + 100, `Defeated at Battle ${cpuNumber}`, {
        fontSize: '24px',
        color: '#ffffff',
      }).setOrigin(0.5);

      this.add.text(width / 2, height / 2 + 135, `Final HP: ${hpRemaining}`, {
        fontSize: '18px',
        color: '#aaaaaa',
      }).setOrigin(0.5);
    }

    // Animal name
    this.add.text(width / 2, height / 2 + 170, animalName, {
      fontSize: '16px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Play again button
    const playAgainButton = this.add.text(width / 2, height - 100, 'Play Again', {
      fontSize: '28px',
      color: '#ffffff',
      backgroundColor: '#4a4a6a',
      padding: { x: 30, y: 15 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    playAgainButton.on('pointerover', () => {
      playAgainButton.setStyle({ backgroundColor: '#6a6a8a' });
    });

    playAgainButton.on('pointerout', () => {
      playAgainButton.setStyle({ backgroundColor: '#4a4a6a' });
    });

    playAgainButton.on('pointerdown', () => {
      gameStateManager.resetRun();
      this.scene.start('LoadoutScene');
    });

    // Main menu button
    const menuButton = this.add.text(width / 2, height - 50, 'Main Menu', {
      fontSize: '18px',
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

  private createAnimalSprite(x: number, y: number, animalId: string, playDeath: boolean): void {
    if (hasAnimatedSprite(animalId)) {
      const config = SPRITE_CONFIGS[animalId];

      // Get starting frame
      let startFramePath: string | undefined;
      let animToPlay: string | undefined;

      if (playDeath && config.animations.death) {
        // Start with first death frame, will play animation
        startFramePath = config.animations.death.frames[0];
        animToPlay = config.animations.death.key;
      } else if (config.animations.idle) {
        startFramePath = config.animations.idle.frames[0];
        animToPlay = config.animations.idle.key;
      } else if (config.animations.jump) {
        startFramePath = config.animations.jump.frames[0];
      }

      if (!startFramePath) return;

      const frameKey = `${animalId}-${startFramePath.replace(/[\/\.]/g, '-')}`;
      const sprite = this.add.sprite(x, y, frameKey)
        .setDisplaySize(150, 150);

      if (playDeath && animToPlay) {
        // Play death animation then freeze on last frame
        sprite.play(animToPlay);
        sprite.once('animationcomplete', () => {
          sprite.stop();
        });
      } else if (animToPlay) {
        sprite.play(animToPlay);
      }
    } else {
      // Static sprite fallback
      const sprite = this.add.image(x, y, animalId)
        .setDisplaySize(150, 150);

      if (playDeath) {
        sprite.setAlpha(0.5);
        sprite.setTint(0xff6666);
      }
    }
  }
}
