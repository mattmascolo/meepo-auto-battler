import Phaser from 'phaser';
import { PreloadScene, MenuScene, LoadoutScene, BattleScene, DraftScene, ResultScene, CharacterGalleryScene, UIScene } from './scenes';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scene: [PreloadScene, MenuScene, LoadoutScene, BattleScene, DraftScene, ResultScene, CharacterGalleryScene, UIScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
