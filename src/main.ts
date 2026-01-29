import Phaser from 'phaser';
import { MenuScene, LoadoutScene, BattleScene, DraftScene, ResultScene } from './scenes';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scene: [MenuScene, LoadoutScene, BattleScene, DraftScene, ResultScene],
};

new Phaser.Game(config);
