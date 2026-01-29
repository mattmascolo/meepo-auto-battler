// Core game types for Project Meepo Auto Battler

export interface AnimalStats {
  hp: number;
  attackMod: number;
  armor: number;
}

export interface UnarmedAttack {
  name: string;
  damage: number;
  effectChance?: number;
  effectType?: StatusType;
  effectValue?: number;
  healOnHit?: number;
}

export interface AnimalPassive {
  name: string;
  description: string;
  type: 'stat_conditional' | 'stat_flat' | 'on_hit' | 'on_attacked' | 'per_turn';
  trigger?: {
    hpBelow?: number; // percentage (0-100)
  };
  effect: {
    attackMod?: number;
    armor?: number;
    damageReduction?: number;
    regen?: number;
    dodgeChance?: number;
    enemyAttackMod?: number;
  };
}

export interface Animal {
  id: string;
  name: string;
  stats: AnimalStats;
  unarmedAttack: UnarmedAttack;
  passive: AnimalPassive;
}

export interface Weapon {
  id: string;
  name: string;
  damage: number;
  attackModModifier?: number;
  effectChance?: number;
  effectType?: StatusType;
  effectValue?: number;
  healOnHit?: number;
}

export interface Accessory {
  id: string;
  name: string;
  type: 'stat' | 'reactive' | 'buff';
  effect: {
    hp?: number;
    armor?: number;
    attackMod?: number;
    damageOnHit?: number;
    attackModWhenLow?: number;
    lowHpThreshold?: number;
    burnChance?: number;
  };
}

export type StatusType = 'burn' | 'poison' | 'weaken' | 'regen';

export interface StatusEffect {
  type: StatusType;
  value: number;
  duration: number;
}

export interface Combatant {
  animal: Animal;
  weapon: Weapon | null;
  accessory: Accessory | null;
  currentHP: number;
  maxHP: number;
  statuses: StatusEffect[];
}

export interface GameState {
  player: Combatant;
  run: {
    currentCPU: 1 | 2 | 3;
    cpuDefeated: [boolean, boolean, boolean];
  };
}

export interface CPULoadout {
  animal: Animal;
  weapon: Weapon;
  accessory: Accessory;
}

export interface DraftChoice {
  type: 'weapon' | 'accessory';
  item: Weapon | Accessory;
}
