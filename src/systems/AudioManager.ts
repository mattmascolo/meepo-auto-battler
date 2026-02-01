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
}

export const audioManager = new AudioManager();
