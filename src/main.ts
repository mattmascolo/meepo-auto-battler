import Phaser from 'phaser';
import { PreloadScene, MenuScene, LoadoutScene, BattleScene, DraftScene, ResultScene, CharacterGalleryScene, UIScene } from './scenes';

// Use devicePixelRatio to render at native resolution for crisp text on high-DPI displays
const dpr = Math.min(window.devicePixelRatio || 1, 2);
const baseWidth = 800;
const baseHeight = 600;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: baseWidth * dpr,
  height: baseHeight * dpr,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scene: [PreloadScene, MenuScene, LoadoutScene, BattleScene, DraftScene, ResultScene, CharacterGalleryScene, UIScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: true,
    zoom: 1 / dpr,
  },
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: true,
  },
};

new Phaser.Game(config);
