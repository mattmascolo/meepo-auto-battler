import type { AnimalPassive, Combatant } from '../../types';

/**
 * Context passed to passive handlers for stat modifications
 */
export interface PassiveStatContext {
  combatant: Combatant;
  enemy: Combatant | null;
}

/**
 * Context passed to passive handlers during attack resolution
 */
export interface PassiveAttackContext {
  attacker: Combatant;
  defender: Combatant;
  baseDamage: number;
}

/**
 * Context passed to passive handlers at turn end
 */
export interface PassiveTurnEndContext {
  combatant: Combatant;
}

/**
 * Result of stat modification from a passive
 */
export interface StatModification {
  attackMod?: number;
  armor?: number;
  damageReduction?: number;
  enemyAttackMod?: number;
}

/**
 * Result of attack modification from a passive
 */
export interface AttackModification {
  dodged?: boolean;
}

/**
 * Result of turn end effects from a passive
 */
export interface TurnEndEffect {
  regen?: number;
}

/**
 * Handler that calculates stat modifications from a passive
 */
export type PassiveStatHandler = (
  passive: AnimalPassive,
  context: PassiveStatContext
) => StatModification;

/**
 * Handler that processes attack events for a passive
 */
export type PassiveAttackHandler = (
  passive: AnimalPassive,
  context: PassiveAttackContext,
  checkProc: (chance: number) => boolean
) => AttackModification;

/**
 * Handler that processes turn end events for a passive
 */
export type PassiveTurnEndHandler = (
  passive: AnimalPassive,
  context: PassiveTurnEndContext
) => TurnEndEffect;

/**
 * Passive type identifier matching AnimalPassive.type
 */
export type PassiveType = 'stat_conditional' | 'stat_flat' | 'on_hit' | 'on_attacked' | 'per_turn';
