import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Display loading text
    const { width, height } = this.cameras.main;
    const loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Update loading text with progress
    this.load.on('progress', (value: number) => {
      loadingText.setText(`Loading... ${Math.round(value * 100)}%`);
    });

    // Load animal sprites (relative paths for GitHub Pages compatibility)
    this.load.image('rat', 'sprites/rat.png');
    this.load.image('toad', 'sprites/toad.png');
    this.load.image('spider', 'sprites/spider.png');
    this.load.image('mosquito', 'sprites/mosquito.png');
    this.load.image('beetle', 'sprites/beetle.png');
  }

  create(): void {
    // Go to menu scene
    this.scene.start('MenuScene');
  }
}
