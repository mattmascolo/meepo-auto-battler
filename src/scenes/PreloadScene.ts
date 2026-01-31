import Phaser from 'phaser';
import { SPRITE_CONFIGS, getAllFrameKeys } from '../config/spriteConfig';

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

    // Load battle backgrounds
    this.load.image('battle-bg-1', 'BattleMaps/battle-scene-1.png');

    // Load static animal sprites (relative paths for GitHub Pages compatibility)
    this.load.image('rat', 'sprites/rat.png');
    this.load.image('toad', 'sprites/toad.png');
    this.load.image('spider', 'sprites/spider.png');
    this.load.image('mosquito', 'sprites/mosquito.png');
    this.load.image('beetle', 'sprites/beetle.png');

    // Load animated character sprites
    for (const animalId of Object.keys(SPRITE_CONFIGS)) {
      const frames = getAllFrameKeys(animalId);
      for (const frame of frames) {
        this.load.image(frame.key, frame.path);
      }
    }
  }

  create(): void {
    // Create animations for animated characters
    this.createAnimations();

    // Go to menu scene
    this.scene.start('MenuScene');
  }

  private createAnimations(): void {
    for (const [animalId, config] of Object.entries(SPRITE_CONFIGS)) {
      for (const [, animConfig] of Object.entries(config.animations)) {
        if (!animConfig) continue;

        const frameKeys = animConfig.frames.map(
          framePath => `${animalId}-${framePath.replace(/[\/\.]/g, '-')}`
        );

        this.anims.create({
          key: animConfig.key,
          frames: frameKeys.map(key => ({ key })),
          frameRate: animConfig.frameRate,
          repeat: animConfig.repeat,
        });
      }
    }
  }
}
