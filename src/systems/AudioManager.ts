import Phaser from 'phaser';

const MUTE_KEY = 'meepo-music-muted';

class AudioManager {
  private music: Phaser.Sound.BaseSound | null = null;

  get isMuted(): boolean {
    return localStorage.getItem(MUTE_KEY) === 'true';
  }

  set isMuted(value: boolean) {
    localStorage.setItem(MUTE_KEY, value.toString());
    if (this.music) {
      (this.music as Phaser.Sound.WebAudioSound).setMute(value);
    }
  }

  initialize(scene: Phaser.Scene): void {
    // Only start music if it's not already playing
    if (!this.music || !this.music.isPlaying) {
      this.music = scene.sound.add('menu-music', {
        loop: true,
        volume: 0.5,
      });
      (this.music as Phaser.Sound.WebAudioSound).setMute(this.isMuted);
      this.music.play();
    }
  }

  toggle(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  createMuteButton(scene: Phaser.Scene): Phaser.GameObjects.Text {
    const { width, height } = scene.cameras.main;

    const button = scene.add.text(width - 20, height - 20, this.isMuted ? '🔇' : '🔊', {
      fontSize: '28px',
    })
      .setOrigin(1, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(1000);

    button.on('pointerdown', () => {
      const muted = this.toggle();
      button.setText(muted ? '🔇' : '🔊');
    });

    button.on('pointerover', () => {
      button.setScale(1.2);
    });

    button.on('pointerout', () => {
      button.setScale(1);
    });

    return button;
  }
}

export const audioManager = new AudioManager();
