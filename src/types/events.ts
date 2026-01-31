import type { StatusType } from '../types';

/** Base event with timestamp */
export interface BaseEvent {
  timestamp: number;
}

/** Turn phases */
export type TurnPhase =
  | 'pre_attack'
  | 'attack'
  | 'post_attack'
  | 'turn_end';

/** Phase transition event */
export interface PhaseEvent extends BaseEvent {
  type: 'phase';
  phase: TurnPhase;
  combatantId: string;
}

/** Attack roll event */
export interface AttackEvent extends BaseEvent {
  type: 'attack';
  attackerId: string;
  defenderId: string;
  attackName: string;
  roll: number;
  modifier: number;
  total: number;
  targetArmor: number;
  hit: boolean;
  dodged?: boolean;
  critical?: boolean;
}

/** Damage types */
export type DamageType = 'physical' | 'fire' | 'poison' | 'reflect';

/** Damage event */
export interface DamageEvent extends BaseEvent {
  type: 'damage';
  targetId: string;
  sourceId?: string;
  amount: number;
  damageType: DamageType;
  source: 'attack' | 'dot' | 'reflect' | 'effect';
  reduced?: number;  // Amount reduced by DR
}

/** Heal event */
export interface HealEvent extends BaseEvent {
  type: 'heal';
  targetId: string;
  amount: number;
  source: 'regen' | 'lifesteal' | 'effect';
  overheal?: number;  // Amount that exceeded max HP
}

/** Status effect event */
export interface StatusEvent extends BaseEvent {
  type: 'status';
  targetId: string;
  statusType: StatusType;
  action: 'applied' | 'tick' | 'expired' | 'removed';
  value?: number;
  duration?: number;
}

/** Death event */
export interface DeathEvent extends BaseEvent {
  type: 'death';
  combatantId: string;
  killerId?: string;
  killerSource?: 'attack' | 'dot' | 'reflect';
}

/** Dodge event */
export interface DodgeEvent extends BaseEvent {
  type: 'dodge';
  defenderId: string;
  attackerId: string;
}

/** Miss event (roll failed) */
export interface MissEvent extends BaseEvent {
  type: 'miss';
  attackerId: string;
  defenderId: string;
  roll: number;
  total: number;
  targetArmor: number;
}

/** Union of all combat events */
export type CombatEvent =
  | PhaseEvent
  | AttackEvent
  | DamageEvent
  | HealEvent
  | StatusEvent
  | DeathEvent
  | DodgeEvent
  | MissEvent;

/** Event listener callback type */
export type CombatEventListener = (event: CombatEvent) => void;
