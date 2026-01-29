import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Title
    this.add.text(width / 2, height / 3, 'Project Meepo', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 3 + 60, 'Auto Battler', {
      fontSize: '24px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Start button
    const startButton = this.add.text(width / 2, height / 2 + 50, 'Start Game', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#4a4a6a',
      padding: { x: 30, y: 15 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startButton.on('pointerover', () => {
      startButton.setStyle({ backgroundColor: '#6a6a8a' });
    });

    startButton.on('pointerout', () => {
      startButton.setStyle({ backgroundColor: '#4a4a6a' });
    });

    startButton.on('pointerdown', () => {
      this.scene.start('LoadoutScene');
    });

    // Instructions
    this.add.text(width / 2, height - 80, 'Build your animal. Fight 3 CPUs. Win the gauntlet.', {
      fontSize: '16px',
      color: '#888888',
    }).setOrigin(0.5);
  }
}
