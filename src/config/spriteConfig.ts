/**
 * Sprite configuration for animated characters
 */

export interface AnimationConfig {
  key: string;
  frames: string[];
  frameRate: number;
  repeat: number; // -1 for infinite loop, 0 for once
}

export interface CharacterSpriteConfig {
  /** Base path to processed frames (relative to public/) */
  basePath: string;
  /** Frame dimensions */
  frameSize: number;
  /** Animation definitions */
  animations: {
    idle?: AnimationConfig;
    attack?: AnimationConfig;
    hurt?: AnimationConfig;
    death?: AnimationConfig;
    jump?: AnimationConfig;
  };
}

/**
 * Registry of all animated character sprites
 * Key = animal ID
 */
export const SPRITE_CONFIGS: Record<string, CharacterSpriteConfig> = {
  'pang': {
    basePath: 'characters/pang/processed',
    frameSize: 128,
    animations: {
      idle: {
        key: 'pang-idle',
        frames: [
          'idle/idle_00.png',
          'idle/idle_01.png',
        ],
        frameRate: 4,
        repeat: -1,
      },
      attack: {
        key: 'pang-attack',
        frames: [
          'attack/attack_00.png',
          'attack/attack_01.png',
          'attack/attack_02.png',
          'attack/attack_03.png',
          'attack/attack_04.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      hurt: {
        key: 'pang-hurt',
        frames: [
          'hurt/hurt_00.png',
          'hurt/hurt_01.png',
          'hurt/hurt_02.png',
          'hurt/hurt_03.png',
          'hurt/hurt_04.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      death: {
        key: 'pang-death',
        frames: [
          'death/death_00.png',
          'death/death_01.png',
          'death/death_02.png',
          'death/death_03.png',
          'death/death_04.png',
        ],
        frameRate: 4,
        repeat: 0,
      },
      jump: {
        key: 'pang-jump',
        frames: [
          'jump/jump_00.png',
          'jump/jump_01.png',
          'jump/jump_02.png',
          'jump/jump_03.png',
          'jump/jump_04.png',
        ],
        frameRate: 6,
        repeat: 0,
      },
    },
  },
  'beep-boop': {
    basePath: 'characters/beep-boop/processed',
    frameSize: 128,
    animations: {
      idle: {
        key: 'beep-boop-idle',
        frames: [
          'idle/idle_00.png',
          'idle/idle_01.png',
        ],
        frameRate: 4,
        repeat: -1,
      },
      attack: {
        key: 'beep-boop-attack',
        frames: [
          'attack/attack_00.png',
          'attack/attack_01.png',
          'attack/attack_02.png',
          'attack/attack_03.png',
          'attack/attack_04.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      hurt: {
        key: 'beep-boop-hurt',
        frames: [
          'hurt/hurt_00.png',
          'hurt/hurt_01.png',
          'hurt/hurt_02.png',
          'hurt/hurt_03.png',
          'hurt/hurt_04.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      death: {
        key: 'beep-boop-death',
        frames: [
          'death/death_00.png',
          'death/death_01.png',
          'death/death_02.png',
          'death/death_03.png',
          'death/death_04.png',
        ],
        frameRate: 4,
        repeat: 0,
      },
      jump: {
        key: 'beep-boop-jump',
        frames: [
          'jump/jump_00.png',
          'jump/jump_01.png',
          'jump/jump_02.png',
          'jump/jump_03.png',
          'jump/jump_04.png',
        ],
        frameRate: 6,
        repeat: 0,
      },
    },
  },
  'moo-man': {
    basePath: 'characters/moo-man/processed',
    frameSize: 128,
    animations: {
      idle: {
        key: 'moo-man-idle',
        frames: [
          'jump/jump_00.png',
          'jump/jump_01.png',
          'jump/jump_02.png',
          'jump/jump_03.png',
          'jump/jump_04.png',
        ],
        frameRate: 8,
        repeat: -1,
      },
      attack: {
        key: 'moo-man-attack',
        frames: [
          'attack/attack_00.png',
          'attack/attack_01.png',
          'attack/attack_02.png',
          'attack/attack_03.png',
          'attack/attack_04.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      hurt: {
        key: 'moo-man-hurt',
        frames: [
          'hurt/hurt_00.png',
          'hurt/hurt_01.png',
          'hurt/hurt_02.png',
          'hurt/hurt_03.png',
          'hurt/hurt_04.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      death: {
        key: 'moo-man-death',
        frames: [
          'death/death_00.png',
          'death/death_01.png',
          'death/death_02.png',
          'death/death_03.png',
          'death/death_04.png',
        ],
        frameRate: 4,
        repeat: 0,
      },
      jump: {
        key: 'moo-man-jump',
        frames: [
          'jump/jump_00.png',
          'jump/jump_01.png',
          'jump/jump_02.png',
          'jump/jump_03.png',
          'jump/jump_04.png',
        ],
        frameRate: 6,
        repeat: 0,
      },
    },
  },
  'humphrey': {
    basePath: 'characters/Humphrey/processed',
    frameSize: 128,
    animations: {
      idle: {
        key: 'humphrey-idle',
        frames: [
          'Idle/Idle_00.png',
          'Idle/Idle_01.png',
        ],
        frameRate: 4,
        repeat: -1,
      },
      attack: {
        key: 'humphrey-attack',
        frames: [
          'Attack/Attack_00.png',
          'Attack/Attack_01.png',
          'Attack/Attack_02.png',
          'Attack/Attack_03.png',
          'Attack/Attack_04.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      hurt: {
        key: 'humphrey-hurt',
        frames: [
          'Hurt/Hurt_00.png',
          'Hurt/Hurt_01.png',
          'Hurt/Hurt_02.png',
          'Hurt/Hurt_03.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      death: {
        key: 'humphrey-death',
        frames: [
          'Death/Death_00.png',
          'Death/Death_01.png',
          'Death/Death_02.png',
          'Death/Death_03.png',
          'Death/Death_04.png',
        ],
        frameRate: 4,
        repeat: 0,
      },
      jump: {
        key: 'humphrey-jump',
        frames: [
          'Jump/Jump_00.png',
          'Jump/Jump_01.png',
          'Jump/Jump_02.png',
          'Jump/Jump_03.png',
          'Jump/Jump_04.png',
        ],
        frameRate: 6,
        repeat: 0,
      },
    },
  },
  'oswald': {
    basePath: 'characters/Oswald/processed',
    frameSize: 128,
    animations: {
      idle: {
        key: 'oswald-idle',
        frames: [
          'Idle/Idle_00.png',
          'Idle/Idle_01.png',
        ],
        frameRate: 4,
        repeat: -1,
      },
      attack: {
        key: 'oswald-attack',
        frames: [
          'Attack/Attack_00.png',
          'Attack/Attack_01.png',
          'Attack/Attack_02.png',
          'Attack/Attack_03.png',
          'Attack/Attack_04.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      hurt: {
        key: 'oswald-hurt',
        frames: [
          'Hurt/Hurt_00.png',
          'Hurt/Hurt_01.png',
          'Hurt/Hurt_02.png',
          'Hurt/Hurt_03.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      death: {
        key: 'oswald-death',
        frames: [
          'Death/Death_00.png',
          'Death/Death_01.png',
          'Death/Death_02.png',
          'Death/Death_03.png',
          'Death/Death_04.png',
        ],
        frameRate: 4,
        repeat: 0,
      },
      jump: {
        key: 'oswald-jump',
        frames: [
          'Jump/Jump_00.png',
          'Jump/Jump_01.png',
          'Jump/Jump_02.png',
          'Jump/Jump_03.png',
          'Jump/Jump_04.png',
        ],
        frameRate: 6,
        repeat: 0,
      },
    },
  },
  'quatack': {
    basePath: 'characters/Quatack/processed',
    frameSize: 128,
    animations: {
      idle: {
        key: 'quatack-idle',
        frames: [
          'Idle/Idle_00.png',
          'Idle/Idle_01.png',
        ],
        frameRate: 4,
        repeat: -1,
      },
      attack: {
        key: 'quatack-attack',
        frames: [
          'Attack/Attack_00.png',
          'Attack/Attack_01.png',
          'Attack/Attack_02.png',
          'Attack/Attack_03.png',
          'Attack/Attack_04.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      hurt: {
        key: 'quatack-hurt',
        frames: [
          'Hurt/Hurt_00.png',
          'Hurt/Hurt_01.png',
          'Hurt/Hurt_02.png',
          'Hurt/Hurt_03.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      death: {
        key: 'quatack-death',
        frames: [
          'Death/Death_00.png',
          'Death/Death_01.png',
          'Death/Death_02.png',
          'Death/Death_03.png',
          'Death/Death_04.png',
        ],
        frameRate: 4,
        repeat: 0,
      },
      jump: {
        key: 'quatack-jump',
        frames: [
          'Jump/Jump_00.png',
          'Jump/Jump_01.png',
          'Jump/Jump_02.png',
          'Jump/Jump_03.png',
          'Jump/Jump_04.png',
        ],
        frameRate: 6,
        repeat: 0,
      },
    },
  },
  'sarah': {
    basePath: 'characters/Sarah/processed',
    frameSize: 128,
    animations: {
      idle: {
        key: 'sarah-idle',
        frames: [
          'Idle/Idle_00.png',
          'Idle/Idle_01.png',
        ],
        frameRate: 4,
        repeat: -1,
      },
      attack: {
        key: 'sarah-attack',
        frames: [
          'Attack/Attack_00.png',
          'Attack/Attack_01.png',
          'Attack/Attack_02.png',
          'Attack/Attack_03.png',
          'Attack/Attack_04.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      hurt: {
        key: 'sarah-hurt',
        frames: [
          'Hurt/Hurt_00.png',
          'Hurt/Hurt_01.png',
          'Hurt/Hurt_02.png',
          'Hurt/Hurt_03.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      death: {
        key: 'sarah-death',
        frames: [
          'Death/Death_00.png',
          'Death/Death_01.png',
          'Death/Death_02.png',
          'Death/Death_03.png',
          'Death/Death_04.png',
        ],
        frameRate: 4,
        repeat: 0,
      },
      jump: {
        key: 'sarah-jump',
        frames: [
          'Jump/Jump_00.png',
          'Jump/Jump_01.png',
          'Jump/Jump_02.png',
          'Jump/Jump_03.png',
          'Jump/Jump_04.png',
        ],
        frameRate: 6,
        repeat: 0,
      },
    },
  },
  'thomas': {
    basePath: 'characters/Thomas/processed',
    frameSize: 128,
    animations: {
      idle: {
        key: 'thomas-idle',
        frames: [
          'Idle/Idle_00.png',
          'Idle/Idle_01.png',
        ],
        frameRate: 4,
        repeat: -1,
      },
      attack: {
        key: 'thomas-attack',
        frames: [
          'Attack/Attack_00.png',
          'Attack/Attack_01.png',
          'Attack/Attack_02.png',
          'Attack/Attack_03.png',
          'Attack/Attack_04.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      hurt: {
        key: 'thomas-hurt',
        frames: [
          'Hurt/Hurt_00.png',
          'Hurt/Hurt_01.png',
          'Hurt/Hurt_02.png',
          'Hurt/Hurt_03.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      death: {
        key: 'thomas-death',
        frames: [
          'Death/Death_00.png',
          'Death/Death_01.png',
          'Death/Death_02.png',
          'Death/Death_03.png',
          'Death/Death_04.png',
        ],
        frameRate: 4,
        repeat: 0,
      },
      jump: {
        key: 'thomas-jump',
        frames: [
          'Jump/Jump_00.png',
          'Jump/Jump_01.png',
          'Jump/Jump_02.png',
          'Jump/Jump_03.png',
          'Jump/Jump_04.png',
        ],
        frameRate: 6,
        repeat: 0,
      },
    },
  },
  'wilber': {
    basePath: 'characters/Wilber/processed',
    frameSize: 128,
    animations: {
      idle: {
        key: 'wilber-idle',
        frames: [
          'Idle/Idle_00.png',
          'Idle/Idle_01.png',
        ],
        frameRate: 4,
        repeat: -1,
      },
      attack: {
        key: 'wilber-attack',
        frames: [
          'Attack/Attack_00.png',
          'Attack/Attack_01.png',
          'Attack/Attack_02.png',
          'Attack/Attack_03.png',
          'Attack/Attack_04.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      hurt: {
        key: 'wilber-hurt',
        frames: [
          'Hurt/Hurt_00.png',
          'Hurt/Hurt_01.png',
          'Hurt/Hurt_02.png',
          'Hurt/Hurt_03.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      death: {
        key: 'wilber-death',
        frames: [
          'Death/Death_00.png',
          'Death/Death_01.png',
          'Death/Death_02.png',
          'Death/Death_03.png',
          'Death/Death_04.png',
        ],
        frameRate: 4,
        repeat: 0,
      },
      jump: {
        key: 'wilber-jump',
        frames: [
          'Jump/Jump_00.png',
          'Jump/Jump_01.png',
          'Jump/Jump_02.png',
          'Jump/Jump_03.png',
          'Jump/Jump_04.png',
        ],
        frameRate: 6,
        repeat: 0,
      },
    },
  },
  'wyatt': {
    basePath: 'characters/Wyatt/processed',
    frameSize: 128,
    animations: {
      idle: {
        key: 'wyatt-idle',
        frames: [
          'Idle/Idle_00.png',
          'Idle/Idle_01.png',
        ],
        frameRate: 4,
        repeat: -1,
      },
      attack: {
        key: 'wyatt-attack',
        frames: [
          'Attack/Attack_00.png',
          'Attack/Attack_01.png',
          'Attack/Attack_02.png',
          'Attack/Attack_03.png',
          'Attack/Attack_04.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      hurt: {
        key: 'wyatt-hurt',
        frames: [
          'Hurt/Hurt_00.png',
          'Hurt/Hurt_01.png',
          'Hurt/Hurt_02.png',
          'Hurt/Hurt_03.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      death: {
        key: 'wyatt-death',
        frames: [
          'Death/Death_00.png',
          'Death/Death_01.png',
          'Death/Death_02.png',
          'Death/Death_03.png',
          'Death/Death_04.png',
        ],
        frameRate: 4,
        repeat: 0,
      },
      jump: {
        key: 'wyatt-jump',
        frames: [
          'Jump/Jump_00.png',
          'Jump/Jump_01.png',
          'Jump/Jump_02.png',
          'Jump/Jump_03.png',
          'Jump/Jump_04.png',
        ],
        frameRate: 6,
        repeat: 0,
      },
    },
  },
  'geezer': {
    basePath: 'characters/Geezer/processed',
    frameSize: 128,
    animations: {
      idle: {
        key: 'geezer-idle',
        frames: [
          'Idle/Idle_00.png',
          'Idle/Idle_01.png',
        ],
        frameRate: 4,
        repeat: -1,
      },
      attack: {
        key: 'geezer-attack',
        frames: [
          'Attack/Attack_00.png',
          'Attack/Attack_01.png',
          'Attack/Attack_02.png',
          'Attack/Attack_03.png',
          'Attack/Attack_04.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      hurt: {
        key: 'geezer-hurt',
        frames: [
          'Hurt/Hurt_00.png',
          'Hurt/Hurt_01.png',
          'Hurt/Hurt_02.png',
          'Hurt/Hurt_03.png',
          'Hurt/Hurt_04.png',
        ],
        frameRate: 8,
        repeat: 0,
      },
      death: {
        key: 'geezer-death',
        frames: [
          'Death/Death_00.png',
          'Death/Death_01.png',
          'Death/Death_02.png',
          'Death/Death_03.png',
          'Death/Death_04.png',
        ],
        frameRate: 4,
        repeat: 0,
      },
      jump: {
        key: 'geezer-jump',
        frames: [
          'Jump/Jump_00.png',
          'Jump/Jump_01.png',
          'Jump/Jump_02.png',
          'Jump/Jump_03.png',
          'Jump/Jump_04.png',
        ],
        frameRate: 6,
        repeat: 0,
      },
    },
  },
};

/**
 * Check if a character has animated sprites
 */
export function hasAnimatedSprite(animalId: string): boolean {
  return animalId in SPRITE_CONFIGS;
}

/**
 * Get all frame keys for a character (for preloading)
 */
export function getAllFrameKeys(animalId: string): { key: string; path: string }[] {
  const config = SPRITE_CONFIGS[animalId];
  if (!config) return [];

  const frames: { key: string; path: string }[] = [];
  const seenPaths = new Set<string>();

  for (const anim of Object.values(config.animations)) {
    if (!anim) continue;
    for (const framePath of anim.frames) {
      if (seenPaths.has(framePath)) continue;
      seenPaths.add(framePath);

      const key = `${animalId}-${framePath.replace(/[\/\.]/g, '-')}`;
      frames.push({
        key,
        path: `${config.basePath}/${framePath}`,
      });
    }
  }

  return frames;
}

/**
 * Get animation frame keys for creating Phaser animation
 */
export function getAnimationFrameKeys(animalId: string, animName: keyof CharacterSpriteConfig['animations']): string[] {
  const config = SPRITE_CONFIGS[animalId];
  if (!config) return [];

  const anim = config.animations[animName];
  if (!anim) return [];

  return anim.frames.map(framePath => `${animalId}-${framePath.replace(/[\/\.]/g, '-')}`);
}
