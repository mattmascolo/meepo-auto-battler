import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Cleanup on shutdown (only scene-local UI, not music)
    this.events.once('shutdown', () => {
      this.tweens.killAll();
    });

    const { width, height } = this.cameras.main;

    // Initialize and start music
    audioManager.initialize(this);

    // Title
    this.add.text(width / 2, height / 3, 'Project Meepo', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
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

    // Gallery button
    const galleryButton = this.add.text(width / 2, height / 2 + 120, 'Character Gallery', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#4a4a6a',
      padding: { x: 20, y: 10 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    galleryButton.on('pointerover', () => {
      galleryButton.setStyle({ backgroundColor: '#6a6a8a' });
    });

    galleryButton.on('pointerout', () => {
      galleryButton.setStyle({ backgroundColor: '#4a4a6a' });
    });

    galleryButton.on('pointerdown', () => {
      this.scene.start('CharacterGalleryScene');
    });
  }
}
