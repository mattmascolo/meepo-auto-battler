import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    const { width } = this.cameras.main;

    // Mute button in top right (small)
    const button = this.add.text(width - 12, 12, audioManager.isMuted ? '🔇' : '🔊', {
      fontSize: '18px',
    })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(1000);

    button.on('pointerdown', () => {
      const muted = audioManager.toggle();
      button.setText(muted ? '🔇' : '🔊');
    });

    button.on('pointerover', () => {
      button.setScale(1.15);
    });

    button.on('pointerout', () => {
      button.setScale(1);
    });
  }
}
