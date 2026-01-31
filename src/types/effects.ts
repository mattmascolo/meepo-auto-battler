import type { StatusType } from '../types';

/** When an effect evaluates */
export type EffectTrigger =
  | 'always'          // Always active (stat modifiers)
  | 'hp_below'        // When HP below threshold
  | 'hp_above'        // When HP above threshold
  | 'on_hit'          // When this combatant lands a hit
  | 'on_attacked'     // When this combatant is hit
  | 'on_miss'         // When this combatant misses
  | 'on_dodge'        // When this combatant dodges
  | 'turn_start'      // At start of this combatant's turn
  | 'turn_end'        // At end of this combatant's turn
  | 'battle_start'    // At battle start
  | 'battle_end';     // At battle end

/** What the effect does */
export type EffectType =
  | 'stat_modifier'   // Modifies stats (attackMod, armor, etc)
  | 'damage'          // Deals damage
  | 'heal'            // Heals HP
  | 'apply_status'    // Applies a status effect
  | 'damage_reduction'// Reduces incoming damage
  | 'dodge_chance'    // Chance to completely avoid attack
  | 'proc_chance';    // Chance to trigger something

/** Who the effect targets */
export type EffectTarget =
  | 'self'            // Affects the effect owner
  | 'enemy'           // Affects the opponent
  | 'attacker'        // Affects whoever attacked (for reactive effects)
  | 'defender';       // Affects whoever is being attacked

/** Stat modifiers that can be applied */
export interface StatModifiers {
  attackMod?: number;
  armor?: number;
  damage?: number;
  maxHP?: number;
}

/** Status to apply with an effect */
export interface StatusApplication {
  type: StatusType;
  value: number;
  duration: number;
}

/** Core effect definition */
export interface Effect {
  id: string;
  name: string;
  type: EffectType;
  target: EffectTarget;
  trigger: EffectTrigger;
  triggerValue?: number;        // For hp_below/hp_above thresholds (percentage)
  procChance?: number;          // Percentage chance (0-100) for proc effects
  value?: number;               // For damage/heal amounts
  modifiers?: StatModifiers;    // For stat_modifier type
  status?: StatusApplication;   // For apply_status type
}

/** Context passed to effect evaluation */
export interface EffectContext {
  owner: {
    currentHP: number;
    maxHP: number;
    attackMod: number;
    armor: number;
  };
  opponent?: {
    currentHP: number;
    maxHP: number;
    attackMod: number;
    armor: number;
  };
  trigger: EffectTrigger;
  damageDealt?: number;         // For on_hit context
  damageTaken?: number;         // For on_attacked context
}

/** Result of evaluating an effect */
export interface EffectResult {
  applied: boolean;
  modifiers?: StatModifiers;
  damage?: number;
  healing?: number;
  status?: StatusApplication;
  target?: EffectTarget;
}
