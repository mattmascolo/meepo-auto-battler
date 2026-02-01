import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager';

const SCALE_KEY = 'meepo-scale-mode';

export class UIScene extends Phaser.Scene {
  private scaleButton: Phaser.GameObjects.Text | null = null;
  private currentScaleMode: number = 0;
  private scaleModes = [
    { label: '1x', zoom: 1 },
    { label: '1.5x', zoom: 1.5 },
    { label: '2x', zoom: 2 },
    { label: 'Fit', zoom: 0 }, // 0 means fit to screen
  ];

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    const { width } = this.cameras.main;

    // Load saved scale mode
    const savedMode = localStorage.getItem(SCALE_KEY);
    if (savedMode !== null) {
      this.currentScaleMode = parseInt(savedMode, 10);
      this.applyScale();
    }

    // Scale button in top right
    this.scaleButton = this.add.text(width - 45, 12, this.scaleModes[this.currentScaleMode].label, {
      fontSize: '14px',
      color: '#888888',
      backgroundColor: '#222233',
      padding: { x: 4, y: 2 },
    })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(1000);

    this.scaleButton.on('pointerdown', () => {
      this.cycleScale();
    });

    this.scaleButton.on('pointerover', () => {
      this.scaleButton?.setColor('#ffffff');
    });

    this.scaleButton.on('pointerout', () => {
      this.scaleButton?.setColor('#888888');
    });

    // Mute button in top right (small)
    const muteButton = this.add.text(width - 12, 12, audioManager.isMuted ? '🔇' : '🔊', {
      fontSize: '18px',
    })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(1000);

    muteButton.on('pointerdown', () => {
      const muted = audioManager.toggle();
      muteButton.setText(muted ? '🔇' : '🔊');
    });

    muteButton.on('pointerover', () => {
      muteButton.setScale(1.15);
    });

    muteButton.on('pointerout', () => {
      muteButton.setScale(1);
    });
  }

  private cycleScale(): void {
    this.currentScaleMode = (this.currentScaleMode + 1) % this.scaleModes.length;
    localStorage.setItem(SCALE_KEY, this.currentScaleMode.toString());
    this.applyScale();
    this.scaleButton?.setText(this.scaleModes[this.currentScaleMode].label);
  }

  private applyScale(): void {
    const mode = this.scaleModes[this.currentScaleMode];
    const canvas = this.game.canvas;
    const parent = canvas.parentElement;

    if (!parent) return;

    if (mode.zoom === 0) {
      // Fit to screen - calculate max zoom that fits
      const maxWidth = window.innerWidth - 40;
      const maxHeight = window.innerHeight - 40;
      const scaleX = maxWidth / 800;
      const scaleY = maxHeight / 600;
      const fitZoom = Math.min(scaleX, scaleY, 3); // Cap at 3x
      canvas.style.width = `${800 * fitZoom}px`;
      canvas.style.height = `${600 * fitZoom}px`;
    } else {
      canvas.style.width = `${800 * mode.zoom}px`;
      canvas.style.height = `${600 * mode.zoom}px`;
    }
  }
}
