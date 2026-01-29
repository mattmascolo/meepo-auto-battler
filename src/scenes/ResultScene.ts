import Phaser from 'phaser';
import { gameStateManager } from '../GameStateManager';

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

    this.add.text(width / 2, height / 3, titleText, {
      fontSize: '64px',
      color: titleColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Summary
    if (victory) {
      this.add.text(width / 2, height / 2, 'You conquered the gauntlet!', {
        fontSize: '24px',
        color: '#ffffff',
      }).setOrigin(0.5);
    } else {
      const cpuNumber = state?.run.currentCPU ?? 1;
      const hpRemaining = Math.max(0, state?.player.currentHP ?? 0);
      this.add.text(width / 2, height / 2, `Defeated at Battle ${cpuNumber}`, {
        fontSize: '24px',
        color: '#ffffff',
      }).setOrigin(0.5);

      this.add.text(width / 2, height / 2 + 40, `Final HP: ${hpRemaining}`, {
        fontSize: '18px',
        color: '#aaaaaa',
      }).setOrigin(0.5);
    }

    // Animal used
    const animalName = state?.player.animal.name ?? 'Unknown';
    this.add.text(width / 2, height / 2 + 100, `Animal: ${animalName}`, {
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
}
