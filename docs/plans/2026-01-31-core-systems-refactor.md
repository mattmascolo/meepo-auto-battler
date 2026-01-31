# Core Systems Refactor Implementation Plan

> **For Claude:** Spawn `plan-executor` agent to implement this plan task-by-task.

**Goal:** Refactor three core systems to create a unified effect pipeline, decoupled animation system, and phase-based turn flow that can support future complexity.

**Architecture:** Extract hard-coded passive/ability logic into a generic effect system with a consistent trigger/evaluate pattern. Create an event-based animation queue that consumes combat events without coupling to game logic. Restructure turn execution into distinct phases (pre-attack, attack, post-attack, turn-end) with hook points for extensibility.

**Tech Stack:** TypeScript, Phaser 3, Vitest

---

## Overview

### Current Problems

1. **Effect System:** Passive logic is scattered through `CombatSystem.ts` with 7+ hard-coded `if` checks for specific animal/accessory effects
2. **Animation Pipeline:** `BattleScene.ts` tightly couples animation calls with combat execution, making it hard to add new animations or change timing
3. **Turn Flow:** `executeCombatTurn()` mixes combat resolution and animation in a single async function with no clear phase boundaries

### Target Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Turn Phases                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Pre-Turn │→ │  Attack  │→ │Post-Attack│→ │ Turn-End │            │
│  └────┬─────┘  └────┬─────┘  └─────┬────┘  └────┬─────┘            │
│       │             │              │             │                   │
│       ▼             ▼              ▼             ▼                   │
│  ┌─────────────────────────────────────────────────────┐            │
│  │              Effect System (evaluates triggers)      │            │
│  └─────────────────────────────────────────────────────┘            │
│                            │                                         │
│                            ▼                                         │
│  ┌─────────────────────────────────────────────────────┐            │
│  │              Combat Events (emitted)                 │            │
│  └─────────────────────────────────────────────────────┘            │
│                            │                                         │
│                            ▼                                         │
│  ┌─────────────────────────────────────────────────────┐            │
│  │         Animation Queue (consumes events)           │            │
│  └─────────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Task 1: Create Effect Types

**Parallel:** no
**Blocked by:** none
**Owned files:** `src/types/effects.ts`

**Files:**
- Create: `src/types/effects.ts`

**Step 1: Write the failing test**

Create `src/types/effects.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { Effect, EffectTrigger, EffectContext } from './effects';

describe('Effect types', () => {
  it('should define stat modifier effect', () => {
    const effect: Effect = {
      id: 'frost-aura',
      name: 'Frost Aura',
      type: 'stat_modifier',
      target: 'enemy',
      trigger: 'always',
      modifiers: { attackMod: -1 },
    };
    expect(effect.type).toBe('stat_modifier');
    expect(effect.modifiers.attackMod).toBe(-1);
  });

  it('should define conditional effect with hp trigger', () => {
    const effect: Effect = {
      id: 'scrappy',
      name: 'Scrappy',
      type: 'stat_modifier',
      target: 'self',
      trigger: 'hp_below',
      triggerValue: 50,
      modifiers: { attackMod: 2 },
    };
    expect(effect.trigger).toBe('hp_below');
    expect(effect.triggerValue).toBe(50);
  });

  it('should define on_hit effect', () => {
    const effect: Effect = {
      id: 'lifesteal',
      name: 'Lifesteal',
      type: 'heal',
      target: 'self',
      trigger: 'on_hit',
      value: 2,
    };
    expect(effect.trigger).toBe('on_hit');
    expect(effect.value).toBe(2);
  });

  it('should define on_attacked effect', () => {
    const effect: Effect = {
      id: 'spiked-collar',
      name: 'Spiked Collar',
      type: 'damage',
      target: 'attacker',
      trigger: 'on_attacked',
      value: 2,
    };
    expect(effect.trigger).toBe('on_attacked');
    expect(effect.target).toBe('attacker');
  });

  it('should define proc chance effect', () => {
    const effect: Effect = {
      id: 'burn-chance',
      name: 'Burn Chance',
      type: 'apply_status',
      target: 'enemy',
      trigger: 'on_hit',
      procChance: 40,
      status: { type: 'burn', value: 2, duration: 3 },
    };
    expect(effect.procChance).toBe(40);
    expect(effect.status?.type).toBe('burn');
  });

  it('should define turn end effect', () => {
    const effect: Effect = {
      id: 'regen',
      name: 'Regeneration',
      type: 'heal',
      target: 'self',
      trigger: 'turn_end',
      value: 1,
    };
    expect(effect.trigger).toBe('turn_end');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/types/effects.test.ts`
Expected: FAIL with "Cannot find module './effects'"

**Step 3: Write the types**

Create `src/types/effects.ts`:

```typescript
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
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/types/effects.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/effects.ts src/types/effects.test.ts
git commit -m "feat: add Effect type system for unified effect handling

Defines EffectTrigger, EffectType, EffectTarget, and related types
to support generic effect evaluation for passives, abilities, and items.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create EffectSystem Class

**Parallel:** no
**Blocked by:** Task 1
**Owned files:** `src/systems/EffectSystem.ts`, `src/systems/EffectSystem.test.ts`

**Files:**
- Create: `src/systems/EffectSystem.ts`
- Create: `src/systems/EffectSystem.test.ts`

**Step 1: Write the failing test**

Create `src/systems/EffectSystem.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EffectSystem } from './EffectSystem';
import { DiceRoller } from './DiceRoller';
import type { Effect, EffectContext } from '../types/effects';

describe('EffectSystem', () => {
  let effectSystem: EffectSystem;
  let diceRoller: DiceRoller;

  beforeEach(() => {
    diceRoller = new DiceRoller();
    effectSystem = new EffectSystem(diceRoller);
  });

  describe('shouldTrigger', () => {
    it('should return true for always trigger', () => {
      const effect: Effect = {
        id: 'test',
        name: 'Test',
        type: 'stat_modifier',
        target: 'self',
        trigger: 'always',
        modifiers: { attackMod: 1 },
      };
      const context: EffectContext = {
        owner: { currentHP: 10, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'always',
      };
      expect(effectSystem.shouldTrigger(effect, context)).toBe(true);
    });

    it('should return true for hp_below when HP is below threshold', () => {
      const effect: Effect = {
        id: 'test',
        name: 'Test',
        type: 'stat_modifier',
        target: 'self',
        trigger: 'hp_below',
        triggerValue: 50,
        modifiers: { attackMod: 2 },
      };
      const context: EffectContext = {
        owner: { currentHP: 8, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'hp_below',
      };
      expect(effectSystem.shouldTrigger(effect, context)).toBe(true);
    });

    it('should return false for hp_below when HP is above threshold', () => {
      const effect: Effect = {
        id: 'test',
        name: 'Test',
        type: 'stat_modifier',
        target: 'self',
        trigger: 'hp_below',
        triggerValue: 50,
        modifiers: { attackMod: 2 },
      };
      const context: EffectContext = {
        owner: { currentHP: 15, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'hp_below',
      };
      expect(effectSystem.shouldTrigger(effect, context)).toBe(false);
    });

    it('should check proc chance for on_hit effects', () => {
      vi.spyOn(diceRoller, 'checkProc').mockReturnValue(true);

      const effect: Effect = {
        id: 'test',
        name: 'Test',
        type: 'apply_status',
        target: 'enemy',
        trigger: 'on_hit',
        procChance: 40,
        status: { type: 'burn', value: 2, duration: 3 },
      };
      const context: EffectContext = {
        owner: { currentHP: 10, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'on_hit',
        damageDealt: 5,
      };
      expect(effectSystem.shouldTrigger(effect, context)).toBe(true);
      expect(diceRoller.checkProc).toHaveBeenCalledWith(40);
    });
  });

  describe('evaluate', () => {
    it('should return stat modifiers for stat_modifier effect', () => {
      const effect: Effect = {
        id: 'test',
        name: 'Test',
        type: 'stat_modifier',
        target: 'enemy',
        trigger: 'always',
        modifiers: { attackMod: -1 },
      };
      const context: EffectContext = {
        owner: { currentHP: 10, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'always',
      };
      const result = effectSystem.evaluate(effect, context);
      expect(result.applied).toBe(true);
      expect(result.modifiers).toEqual({ attackMod: -1 });
      expect(result.target).toBe('enemy');
    });

    it('should return damage for damage effect', () => {
      const effect: Effect = {
        id: 'test',
        name: 'Test',
        type: 'damage',
        target: 'attacker',
        trigger: 'on_attacked',
        value: 2,
      };
      const context: EffectContext = {
        owner: { currentHP: 10, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'on_attacked',
        damageTaken: 5,
      };
      const result = effectSystem.evaluate(effect, context);
      expect(result.applied).toBe(true);
      expect(result.damage).toBe(2);
      expect(result.target).toBe('attacker');
    });

    it('should return healing for heal effect', () => {
      const effect: Effect = {
        id: 'test',
        name: 'Test',
        type: 'heal',
        target: 'self',
        trigger: 'on_hit',
        value: 2,
      };
      const context: EffectContext = {
        owner: { currentHP: 10, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'on_hit',
        damageDealt: 5,
      };
      const result = effectSystem.evaluate(effect, context);
      expect(result.applied).toBe(true);
      expect(result.healing).toBe(2);
      expect(result.target).toBe('self');
    });

    it('should return status for apply_status effect', () => {
      vi.spyOn(diceRoller, 'checkProc').mockReturnValue(true);

      const effect: Effect = {
        id: 'test',
        name: 'Test',
        type: 'apply_status',
        target: 'enemy',
        trigger: 'on_hit',
        procChance: 40,
        status: { type: 'burn', value: 2, duration: 3 },
      };
      const context: EffectContext = {
        owner: { currentHP: 10, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'on_hit',
        damageDealt: 5,
      };
      const result = effectSystem.evaluate(effect, context);
      expect(result.applied).toBe(true);
      expect(result.status).toEqual({ type: 'burn', value: 2, duration: 3 });
    });

    it('should not apply when trigger conditions not met', () => {
      const effect: Effect = {
        id: 'test',
        name: 'Test',
        type: 'stat_modifier',
        target: 'self',
        trigger: 'hp_below',
        triggerValue: 25,
        modifiers: { attackMod: 3 },
      };
      const context: EffectContext = {
        owner: { currentHP: 15, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'hp_below',
      };
      const result = effectSystem.evaluate(effect, context);
      expect(result.applied).toBe(false);
    });
  });

  describe('evaluateAll', () => {
    it('should evaluate multiple effects and return combined results', () => {
      const effects: Effect[] = [
        {
          id: 'e1',
          name: 'Attack Boost',
          type: 'stat_modifier',
          target: 'self',
          trigger: 'always',
          modifiers: { attackMod: 1 },
        },
        {
          id: 'e2',
          name: 'Armor Boost',
          type: 'stat_modifier',
          target: 'self',
          trigger: 'always',
          modifiers: { armor: 2 },
        },
      ];
      const context: EffectContext = {
        owner: { currentHP: 10, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'always',
      };
      const results = effectSystem.evaluateAll(effects, context);
      expect(results).toHaveLength(2);
      expect(results.every(r => r.applied)).toBe(true);
    });

    it('should filter by trigger type', () => {
      const effects: Effect[] = [
        {
          id: 'e1',
          name: 'Always Active',
          type: 'stat_modifier',
          target: 'self',
          trigger: 'always',
          modifiers: { attackMod: 1 },
        },
        {
          id: 'e2',
          name: 'On Hit',
          type: 'heal',
          target: 'self',
          trigger: 'on_hit',
          value: 2,
        },
      ];
      const context: EffectContext = {
        owner: { currentHP: 10, maxHP: 20, attackMod: 0, armor: 10 },
        trigger: 'always',
      };
      const results = effectSystem.evaluateAll(effects, context);
      // Only 'always' effect should be evaluated, 'on_hit' should not trigger
      expect(results.filter(r => r.applied)).toHaveLength(1);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/systems/EffectSystem.test.ts`
Expected: FAIL with "Cannot find module './EffectSystem'"

**Step 3: Write the implementation**

Create `src/systems/EffectSystem.ts`:

```typescript
import type { DiceRoller } from './DiceRoller';
import type { Effect, EffectContext, EffectResult } from '../types/effects';

export class EffectSystem {
  constructor(private diceRoller: DiceRoller) {}

  /**
   * Check if an effect should trigger given the current context.
   */
  shouldTrigger(effect: Effect, context: EffectContext): boolean {
    // First, check if the context trigger matches the effect trigger
    // 'always' effects match any context trigger
    if (effect.trigger !== 'always' && effect.trigger !== context.trigger) {
      return false;
    }

    // Check conditional triggers
    switch (effect.trigger) {
      case 'always':
        return true;

      case 'hp_below':
        if (effect.triggerValue === undefined) return false;
        const hpPercentBelow = (context.owner.currentHP / context.owner.maxHP) * 100;
        return hpPercentBelow < effect.triggerValue;

      case 'hp_above':
        if (effect.triggerValue === undefined) return false;
        const hpPercentAbove = (context.owner.currentHP / context.owner.maxHP) * 100;
        return hpPercentAbove > effect.triggerValue;

      case 'on_hit':
      case 'on_attacked':
      case 'on_miss':
      case 'on_dodge':
      case 'turn_start':
      case 'turn_end':
      case 'battle_start':
      case 'battle_end':
        // Check proc chance if present
        if (effect.procChance !== undefined) {
          return this.diceRoller.checkProc(effect.procChance);
        }
        return true;

      default:
        return false;
    }
  }

  /**
   * Evaluate a single effect and return the result.
   */
  evaluate(effect: Effect, context: EffectContext): EffectResult {
    if (!this.shouldTrigger(effect, context)) {
      return { applied: false };
    }

    const result: EffectResult = {
      applied: true,
      target: effect.target,
    };

    switch (effect.type) {
      case 'stat_modifier':
        result.modifiers = effect.modifiers;
        break;

      case 'damage':
        result.damage = effect.value;
        break;

      case 'heal':
        result.healing = effect.value;
        break;

      case 'apply_status':
        result.status = effect.status;
        break;

      case 'damage_reduction':
        result.modifiers = { damage: -(effect.value ?? 0) };
        break;

      case 'dodge_chance':
        // Dodge chance is handled separately in combat
        break;
    }

    return result;
  }

  /**
   * Evaluate multiple effects and return all results.
   */
  evaluateAll(effects: Effect[], context: EffectContext): EffectResult[] {
    return effects.map(effect => this.evaluate(effect, context));
  }

  /**
   * Collect stat modifiers from all applied effects.
   */
  collectModifiers(results: EffectResult[]): { attackMod: number; armor: number; damage: number } {
    const totals = { attackMod: 0, armor: 0, damage: 0 };

    for (const result of results) {
      if (result.applied && result.modifiers) {
        totals.attackMod += result.modifiers.attackMod ?? 0;
        totals.armor += result.modifiers.armor ?? 0;
        totals.damage += result.modifiers.damage ?? 0;
      }
    }

    return totals;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/systems/EffectSystem.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/systems/EffectSystem.ts src/systems/EffectSystem.test.ts
git commit -m "feat: add EffectSystem for generic effect evaluation

Implements shouldTrigger() for conditional checks, evaluate() for
single effects, evaluateAll() for batches, and collectModifiers()
to aggregate stat changes.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create Combat Event Types

**Parallel:** yes
**Blocked by:** Task 1
**Owned files:** `src/types/events.ts`, `src/types/events.test.ts`

**Files:**
- Create: `src/types/events.ts`
- Create: `src/types/events.test.ts`

**Step 1: Write the failing test**

Create `src/types/events.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type {
  CombatEvent,
  AttackEvent,
  DamageEvent,
  HealEvent,
  StatusEvent,
  DeathEvent,
  PhaseEvent,
} from './events';

describe('Combat Event types', () => {
  it('should define attack event', () => {
    const event: AttackEvent = {
      type: 'attack',
      timestamp: Date.now(),
      attackerId: 'player',
      defenderId: 'cpu',
      attackName: 'Slash',
      roll: 15,
      modifier: 3,
      total: 18,
      targetArmor: 12,
      hit: true,
    };
    expect(event.type).toBe('attack');
    expect(event.hit).toBe(true);
  });

  it('should define damage event', () => {
    const event: DamageEvent = {
      type: 'damage',
      timestamp: Date.now(),
      targetId: 'cpu',
      sourceId: 'player',
      amount: 5,
      damageType: 'physical',
      source: 'attack',
    };
    expect(event.type).toBe('damage');
    expect(event.damageType).toBe('physical');
  });

  it('should define heal event', () => {
    const event: HealEvent = {
      type: 'heal',
      timestamp: Date.now(),
      targetId: 'player',
      amount: 3,
      source: 'lifesteal',
    };
    expect(event.type).toBe('heal');
  });

  it('should define status event', () => {
    const event: StatusEvent = {
      type: 'status',
      timestamp: Date.now(),
      targetId: 'cpu',
      statusType: 'burn',
      action: 'applied',
      value: 2,
      duration: 3,
    };
    expect(event.type).toBe('status');
    expect(event.action).toBe('applied');
  });

  it('should define death event', () => {
    const event: DeathEvent = {
      type: 'death',
      timestamp: Date.now(),
      combatantId: 'cpu',
      killerId: 'player',
    };
    expect(event.type).toBe('death');
  });

  it('should define phase event', () => {
    const event: PhaseEvent = {
      type: 'phase',
      timestamp: Date.now(),
      phase: 'attack',
      combatantId: 'player',
    };
    expect(event.type).toBe('phase');
    expect(event.phase).toBe('attack');
  });

  it('should use CombatEvent union type', () => {
    const events: CombatEvent[] = [
      { type: 'phase', timestamp: Date.now(), phase: 'pre_attack', combatantId: 'player' },
      { type: 'attack', timestamp: Date.now(), attackerId: 'player', defenderId: 'cpu', attackName: 'Slash', roll: 15, modifier: 3, total: 18, targetArmor: 12, hit: true },
      { type: 'damage', timestamp: Date.now(), targetId: 'cpu', sourceId: 'player', amount: 5, damageType: 'physical', source: 'attack' },
    ];
    expect(events).toHaveLength(3);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/types/events.test.ts`
Expected: FAIL with "Cannot find module './events'"

**Step 3: Write the types**

Create `src/types/events.ts`:

```typescript
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
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/types/events.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/events.ts src/types/events.test.ts
git commit -m "feat: add CombatEvent types for event-driven architecture

Defines typed events for attacks, damage, healing, status changes,
deaths, dodges, and phase transitions to support animation queue.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create AnimationQueue System

**Parallel:** no
**Blocked by:** Task 3
**Owned files:** `src/systems/AnimationQueue.ts`, `src/systems/AnimationQueue.test.ts`

**Files:**
- Create: `src/systems/AnimationQueue.ts`
- Create: `src/systems/AnimationQueue.test.ts`

**Step 1: Write the failing test**

Create `src/systems/AnimationQueue.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnimationQueue } from './AnimationQueue';
import type { CombatEvent, DamageEvent, HealEvent } from '../types/events';

describe('AnimationQueue', () => {
  let queue: AnimationQueue;

  beforeEach(() => {
    queue = new AnimationQueue();
  });

  describe('enqueue', () => {
    it('should add events to the queue', () => {
      const event: DamageEvent = {
        type: 'damage',
        timestamp: Date.now(),
        targetId: 'cpu',
        sourceId: 'player',
        amount: 5,
        damageType: 'physical',
        source: 'attack',
      };
      queue.enqueue(event);
      expect(queue.length).toBe(1);
    });

    it('should maintain FIFO order', () => {
      const event1: DamageEvent = {
        type: 'damage',
        timestamp: 1,
        targetId: 'cpu',
        sourceId: 'player',
        amount: 5,
        damageType: 'physical',
        source: 'attack',
      };
      const event2: HealEvent = {
        type: 'heal',
        timestamp: 2,
        targetId: 'player',
        amount: 3,
        source: 'lifesteal',
      };
      queue.enqueue(event1);
      queue.enqueue(event2);
      expect(queue.peek()?.timestamp).toBe(1);
    });
  });

  describe('dequeue', () => {
    it('should remove and return first event', () => {
      const event: DamageEvent = {
        type: 'damage',
        timestamp: Date.now(),
        targetId: 'cpu',
        sourceId: 'player',
        amount: 5,
        damageType: 'physical',
        source: 'attack',
      };
      queue.enqueue(event);
      const dequeued = queue.dequeue();
      expect(dequeued).toEqual(event);
      expect(queue.length).toBe(0);
    });

    it('should return undefined when empty', () => {
      expect(queue.dequeue()).toBeUndefined();
    });
  });

  describe('peek', () => {
    it('should return first event without removing', () => {
      const event: DamageEvent = {
        type: 'damage',
        timestamp: Date.now(),
        targetId: 'cpu',
        sourceId: 'player',
        amount: 5,
        damageType: 'physical',
        source: 'attack',
      };
      queue.enqueue(event);
      expect(queue.peek()).toEqual(event);
      expect(queue.length).toBe(1);
    });
  });

  describe('clear', () => {
    it('should remove all events', () => {
      queue.enqueue({
        type: 'damage',
        timestamp: Date.now(),
        targetId: 'cpu',
        sourceId: 'player',
        amount: 5,
        damageType: 'physical',
        source: 'attack',
      });
      queue.enqueue({
        type: 'heal',
        timestamp: Date.now(),
        targetId: 'player',
        amount: 3,
        source: 'lifesteal',
      });
      queue.clear();
      expect(queue.length).toBe(0);
    });
  });

  describe('processNext', () => {
    it('should call handler with next event', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const event: DamageEvent = {
        type: 'damage',
        timestamp: Date.now(),
        targetId: 'cpu',
        sourceId: 'player',
        amount: 5,
        damageType: 'physical',
        source: 'attack',
      };
      queue.enqueue(event);
      await queue.processNext(handler);
      expect(handler).toHaveBeenCalledWith(event);
      expect(queue.length).toBe(0);
    });

    it('should return false when queue is empty', async () => {
      const handler = vi.fn();
      const result = await queue.processNext(handler);
      expect(result).toBe(false);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('processAll', () => {
    it('should process all events in order', async () => {
      const processed: number[] = [];
      const handler = vi.fn().mockImplementation(async (event: CombatEvent) => {
        processed.push(event.timestamp);
      });

      queue.enqueue({
        type: 'damage',
        timestamp: 1,
        targetId: 'cpu',
        sourceId: 'player',
        amount: 5,
        damageType: 'physical',
        source: 'attack',
      });
      queue.enqueue({
        type: 'heal',
        timestamp: 2,
        targetId: 'player',
        amount: 3,
        source: 'lifesteal',
      });
      queue.enqueue({
        type: 'damage',
        timestamp: 3,
        targetId: 'player',
        sourceId: 'cpu',
        amount: 4,
        damageType: 'physical',
        source: 'attack',
      });

      await queue.processAll(handler);
      expect(processed).toEqual([1, 2, 3]);
      expect(queue.length).toBe(0);
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers when events are enqueued', () => {
      const listener = vi.fn();
      queue.subscribe(listener);

      const event: DamageEvent = {
        type: 'damage',
        timestamp: Date.now(),
        targetId: 'cpu',
        sourceId: 'player',
        amount: 5,
        damageType: 'physical',
        source: 'attack',
      };
      queue.enqueue(event);
      expect(listener).toHaveBeenCalledWith(event);
    });

    it('should allow unsubscribing', () => {
      const listener = vi.fn();
      const unsubscribe = queue.subscribe(listener);
      unsubscribe();

      queue.enqueue({
        type: 'damage',
        timestamp: Date.now(),
        targetId: 'cpu',
        sourceId: 'player',
        amount: 5,
        damageType: 'physical',
        source: 'attack',
      });
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/systems/AnimationQueue.test.ts`
Expected: FAIL with "Cannot find module './AnimationQueue'"

**Step 3: Write the implementation**

Create `src/systems/AnimationQueue.ts`:

```typescript
import type { CombatEvent, CombatEventListener } from '../types/events';

export type EventHandler = (event: CombatEvent) => Promise<void>;

export class AnimationQueue {
  private queue: CombatEvent[] = [];
  private listeners: Set<CombatEventListener> = new Set();
  private processing = false;

  get length(): number {
    return this.queue.length;
  }

  get isEmpty(): boolean {
    return this.queue.length === 0;
  }

  get isProcessing(): boolean {
    return this.processing;
  }

  /**
   * Add an event to the queue.
   * Notifies all subscribers immediately.
   */
  enqueue(event: CombatEvent): void {
    this.queue.push(event);
    this.notifyListeners(event);
  }

  /**
   * Add multiple events to the queue.
   */
  enqueueAll(events: CombatEvent[]): void {
    for (const event of events) {
      this.enqueue(event);
    }
  }

  /**
   * Remove and return the next event from the queue.
   */
  dequeue(): CombatEvent | undefined {
    return this.queue.shift();
  }

  /**
   * View the next event without removing it.
   */
  peek(): CombatEvent | undefined {
    return this.queue[0];
  }

  /**
   * Remove all events from the queue.
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Process the next event with the given handler.
   * Returns true if an event was processed, false if queue was empty.
   */
  async processNext(handler: EventHandler): Promise<boolean> {
    const event = this.dequeue();
    if (!event) {
      return false;
    }
    await handler(event);
    return true;
  }

  /**
   * Process all events in the queue sequentially.
   */
  async processAll(handler: EventHandler): Promise<void> {
    this.processing = true;
    try {
      while (!this.isEmpty) {
        await this.processNext(handler);
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Subscribe to receive events as they are enqueued.
   * Returns an unsubscribe function.
   */
  subscribe(listener: CombatEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of a new event.
   */
  private notifyListeners(event: CombatEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/systems/AnimationQueue.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/systems/AnimationQueue.ts src/systems/AnimationQueue.test.ts
git commit -m "feat: add AnimationQueue for event-based animation pipeline

Implements FIFO queue with subscribe/notify pattern for decoupling
combat logic from animation execution.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Create TurnPhaseManager

**Parallel:** no
**Blocked by:** Task 2, Task 4
**Owned files:** `src/systems/TurnPhaseManager.ts`, `src/systems/TurnPhaseManager.test.ts`

**Files:**
- Create: `src/systems/TurnPhaseManager.ts`
- Create: `src/systems/TurnPhaseManager.test.ts`

**Step 1: Write the failing test**

Create `src/systems/TurnPhaseManager.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TurnPhaseManager } from './TurnPhaseManager';
import { AnimationQueue } from './AnimationQueue';
import type { TurnPhase } from '../types/events';

describe('TurnPhaseManager', () => {
  let phaseManager: TurnPhaseManager;
  let animationQueue: AnimationQueue;

  beforeEach(() => {
    animationQueue = new AnimationQueue();
    phaseManager = new TurnPhaseManager(animationQueue);
  });

  describe('phase transitions', () => {
    it('should start at pre_attack phase', () => {
      expect(phaseManager.currentPhase).toBe('pre_attack');
    });

    it('should transition through phases in order', () => {
      phaseManager.startTurn('player');
      expect(phaseManager.currentPhase).toBe('pre_attack');

      phaseManager.nextPhase();
      expect(phaseManager.currentPhase).toBe('attack');

      phaseManager.nextPhase();
      expect(phaseManager.currentPhase).toBe('post_attack');

      phaseManager.nextPhase();
      expect(phaseManager.currentPhase).toBe('turn_end');
    });

    it('should emit phase events to animation queue', () => {
      const events: TurnPhase[] = [];
      animationQueue.subscribe((event) => {
        if (event.type === 'phase') {
          events.push(event.phase);
        }
      });

      phaseManager.startTurn('player');
      phaseManager.nextPhase();
      phaseManager.nextPhase();
      phaseManager.nextPhase();

      expect(events).toEqual(['pre_attack', 'attack', 'post_attack', 'turn_end']);
    });
  });

  describe('phase hooks', () => {
    it('should call registered hooks for each phase', async () => {
      const preAttackHook = vi.fn().mockResolvedValue(undefined);
      const attackHook = vi.fn().mockResolvedValue(undefined);

      phaseManager.registerHook('pre_attack', preAttackHook);
      phaseManager.registerHook('attack', attackHook);

      phaseManager.startTurn('player');
      await phaseManager.executeCurrentPhase();
      expect(preAttackHook).toHaveBeenCalledWith('player');

      phaseManager.nextPhase();
      await phaseManager.executeCurrentPhase();
      expect(attackHook).toHaveBeenCalledWith('player');
    });

    it('should call multiple hooks in registration order', async () => {
      const order: number[] = [];
      const hook1 = vi.fn().mockImplementation(async () => { order.push(1); });
      const hook2 = vi.fn().mockImplementation(async () => { order.push(2); });

      phaseManager.registerHook('attack', hook1);
      phaseManager.registerHook('attack', hook2);

      phaseManager.startTurn('player');
      phaseManager.nextPhase(); // Move to attack phase
      await phaseManager.executeCurrentPhase();

      expect(order).toEqual([1, 2]);
    });

    it('should allow unregistering hooks', async () => {
      const hook = vi.fn().mockResolvedValue(undefined);
      const unregister = phaseManager.registerHook('pre_attack', hook);

      unregister();

      phaseManager.startTurn('player');
      await phaseManager.executeCurrentPhase();
      expect(hook).not.toHaveBeenCalled();
    });
  });

  describe('executeTurn', () => {
    it('should execute all phases in sequence', async () => {
      const phases: TurnPhase[] = [];

      phaseManager.registerHook('pre_attack', async () => { phases.push('pre_attack'); });
      phaseManager.registerHook('attack', async () => { phases.push('attack'); });
      phaseManager.registerHook('post_attack', async () => { phases.push('post_attack'); });
      phaseManager.registerHook('turn_end', async () => { phases.push('turn_end'); });

      await phaseManager.executeTurn('player');

      expect(phases).toEqual(['pre_attack', 'attack', 'post_attack', 'turn_end']);
    });

    it('should track active combatant', async () => {
      let capturedCombatant: string | null = null;
      phaseManager.registerHook('attack', async (combatantId) => {
        capturedCombatant = combatantId;
      });

      await phaseManager.executeTurn('cpu');
      expect(capturedCombatant).toBe('cpu');
    });
  });

  describe('isPhaseComplete', () => {
    it('should track phase completion', () => {
      phaseManager.startTurn('player');
      expect(phaseManager.isPhaseComplete).toBe(false);

      phaseManager.markPhaseComplete();
      expect(phaseManager.isPhaseComplete).toBe(true);

      phaseManager.nextPhase();
      expect(phaseManager.isPhaseComplete).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/systems/TurnPhaseManager.test.ts`
Expected: FAIL with "Cannot find module './TurnPhaseManager'"

**Step 3: Write the implementation**

Create `src/systems/TurnPhaseManager.ts`:

```typescript
import type { AnimationQueue } from './AnimationQueue';
import type { TurnPhase, PhaseEvent } from '../types/events';

export type PhaseHook = (combatantId: string) => Promise<void>;

const PHASE_ORDER: TurnPhase[] = ['pre_attack', 'attack', 'post_attack', 'turn_end'];

export class TurnPhaseManager {
  private _currentPhase: TurnPhase = 'pre_attack';
  private _phaseIndex = 0;
  private _activeCombatant: string | null = null;
  private _phaseComplete = false;
  private hooks: Map<TurnPhase, PhaseHook[]> = new Map();

  constructor(private animationQueue: AnimationQueue) {
    // Initialize hook arrays for each phase
    for (const phase of PHASE_ORDER) {
      this.hooks.set(phase, []);
    }
  }

  get currentPhase(): TurnPhase {
    return this._currentPhase;
  }

  get activeCombatant(): string | null {
    return this._activeCombatant;
  }

  get isPhaseComplete(): boolean {
    return this._phaseComplete;
  }

  /**
   * Start a new turn for the given combatant.
   * Resets phase to pre_attack.
   */
  startTurn(combatantId: string): void {
    this._activeCombatant = combatantId;
    this._phaseIndex = 0;
    this._currentPhase = PHASE_ORDER[0];
    this._phaseComplete = false;
    this.emitPhaseEvent();
  }

  /**
   * Advance to the next phase.
   * Returns true if there are more phases, false if turn is complete.
   */
  nextPhase(): boolean {
    this._phaseIndex++;
    this._phaseComplete = false;

    if (this._phaseIndex >= PHASE_ORDER.length) {
      return false;
    }

    this._currentPhase = PHASE_ORDER[this._phaseIndex];
    this.emitPhaseEvent();
    return true;
  }

  /**
   * Mark the current phase as complete.
   */
  markPhaseComplete(): void {
    this._phaseComplete = true;
  }

  /**
   * Register a hook to be called during a specific phase.
   * Returns an unregister function.
   */
  registerHook(phase: TurnPhase, hook: PhaseHook): () => void {
    const phaseHooks = this.hooks.get(phase)!;
    phaseHooks.push(hook);

    return () => {
      const index = phaseHooks.indexOf(hook);
      if (index !== -1) {
        phaseHooks.splice(index, 1);
      }
    };
  }

  /**
   * Execute all hooks for the current phase.
   */
  async executeCurrentPhase(): Promise<void> {
    if (!this._activeCombatant) {
      return;
    }

    const phaseHooks = this.hooks.get(this._currentPhase)!;
    for (const hook of phaseHooks) {
      await hook(this._activeCombatant);
    }
  }

  /**
   * Execute a complete turn: all phases in sequence.
   */
  async executeTurn(combatantId: string): Promise<void> {
    this.startTurn(combatantId);

    do {
      await this.executeCurrentPhase();
      this.markPhaseComplete();
    } while (this.nextPhase());
  }

  /**
   * Emit a phase event to the animation queue.
   */
  private emitPhaseEvent(): void {
    if (!this._activeCombatant) return;

    const event: PhaseEvent = {
      type: 'phase',
      timestamp: Date.now(),
      phase: this._currentPhase,
      combatantId: this._activeCombatant,
    };
    this.animationQueue.enqueue(event);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/systems/TurnPhaseManager.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/systems/TurnPhaseManager.ts src/systems/TurnPhaseManager.test.ts
git commit -m "feat: add TurnPhaseManager for phase-based turn execution

Implements pre_attack, attack, post_attack, turn_end phases with
hook registration for extensible combat logic.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Convert Existing Passives to Effect Format

**Parallel:** no
**Blocked by:** Task 2
**Owned files:** `src/data/effects.ts`, `src/data/effects.test.ts`

**Files:**
- Create: `src/data/effects.ts`
- Create: `src/data/effects.test.ts`

**Step 1: Write the failing test**

Create `src/data/effects.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  PASSIVE_EFFECTS,
  WEAPON_EFFECTS,
  ACCESSORY_EFFECTS,
  getPassiveEffect,
  getWeaponEffects,
  getAccessoryEffects,
} from './effects';
import type { Effect } from '../types/effects';

describe('Effect data', () => {
  describe('PASSIVE_EFFECTS', () => {
    it('should define Pang Frost Aura as enemy debuff', () => {
      const effect = getPassiveEffect('pang');
      expect(effect).toBeDefined();
      expect(effect?.id).toBe('pang-frost-aura');
      expect(effect?.type).toBe('stat_modifier');
      expect(effect?.target).toBe('enemy');
      expect(effect?.trigger).toBe('always');
      expect(effect?.modifiers?.attackMod).toBe(-1);
    });

    it('should define Toad Thick Skin as per-turn regen', () => {
      const effect = getPassiveEffect('toad');
      expect(effect).toBeDefined();
      expect(effect?.id).toBe('toad-thick-skin');
      expect(effect?.type).toBe('heal');
      expect(effect?.trigger).toBe('turn_end');
      expect(effect?.value).toBe(1);
    });

    it('should define Beep-Boop Metal Plating as damage reduction', () => {
      const effect = getPassiveEffect('beep-boop');
      expect(effect).toBeDefined();
      expect(effect?.id).toBe('beep-boop-metal-plating');
      expect(effect?.type).toBe('damage_reduction');
      expect(effect?.trigger).toBe('on_attacked');
      expect(effect?.value).toBe(1);
    });

    it('should define Moo-Man Milk Power as conditional regen', () => {
      const effect = getPassiveEffect('moo-man');
      expect(effect).toBeDefined();
      expect(effect?.id).toBe('moo-man-milk-power');
      expect(effect?.type).toBe('heal');
      expect(effect?.trigger).toBe('hp_below');
      expect(effect?.triggerValue).toBe(50);
      expect(effect?.value).toBe(2);
    });

    it('should define Beetle Hard Shell as damage reduction', () => {
      const effect = getPassiveEffect('beetle');
      expect(effect).toBeDefined();
      expect(effect?.id).toBe('beetle-hard-shell');
      expect(effect?.type).toBe('damage_reduction');
      expect(effect?.trigger).toBe('on_attacked');
      expect(effect?.value).toBe(1);
    });
  });

  describe('WEAPON_EFFECTS', () => {
    it('should define Flame Stick burn proc', () => {
      const effects = getWeaponEffects('flame-stick');
      expect(effects).toHaveLength(1);
      expect(effects[0].type).toBe('apply_status');
      expect(effects[0].trigger).toBe('on_hit');
      expect(effects[0].procChance).toBe(40);
      expect(effects[0].status?.type).toBe('burn');
    });

    it('should define Venom Fang poison proc', () => {
      const effects = getWeaponEffects('venom-fang');
      expect(effects).toHaveLength(1);
      expect(effects[0].status?.type).toBe('poison');
    });

    it('should define Sapping Thorn lifesteal', () => {
      const effects = getWeaponEffects('sapping-thorn');
      expect(effects).toHaveLength(1);
      expect(effects[0].type).toBe('heal');
      expect(effects[0].trigger).toBe('on_hit');
      expect(effects[0].value).toBe(2);
    });

    it('should return empty array for weapons with no effects', () => {
      const effects = getWeaponEffects('rusty-dagger');
      expect(effects).toHaveLength(0);
    });
  });

  describe('ACCESSORY_EFFECTS', () => {
    it('should define Lucky Pebble stat bonus', () => {
      const effects = getAccessoryEffects('lucky-pebble');
      expect(effects).toHaveLength(1);
      expect(effects[0].type).toBe('stat_modifier');
      expect(effects[0].trigger).toBe('always');
      expect(effects[0].modifiers?.attackMod).toBe(1);
    });

    it('should define Spiked Collar reflect damage', () => {
      const effects = getAccessoryEffects('spiked-collar');
      expect(effects).toHaveLength(1);
      expect(effects[0].type).toBe('damage');
      expect(effects[0].target).toBe('attacker');
      expect(effects[0].trigger).toBe('on_attacked');
      expect(effects[0].value).toBe(2);
    });

    it('should define Adrenaline Gland conditional attack boost', () => {
      const effects = getAccessoryEffects('adrenaline-gland');
      expect(effects).toHaveLength(1);
      expect(effects[0].type).toBe('stat_modifier');
      expect(effects[0].trigger).toBe('hp_below');
      expect(effects[0].triggerValue).toBe(25);
      expect(effects[0].modifiers?.attackMod).toBe(3);
    });

    it('should define Ember Charm burn chance', () => {
      const effects = getAccessoryEffects('ember-charm');
      expect(effects).toHaveLength(1);
      expect(effects[0].type).toBe('apply_status');
      expect(effects[0].trigger).toBe('on_hit');
      expect(effects[0].procChance).toBe(20);
    });

    it('should define Iron Acorn HP bonus', () => {
      const effects = getAccessoryEffects('iron-acorn');
      expect(effects).toHaveLength(1);
      expect(effects[0].type).toBe('stat_modifier');
      expect(effects[0].modifiers?.maxHP).toBe(4);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/data/effects.test.ts`
Expected: FAIL with "Cannot find module './effects'"

**Step 3: Write the data**

Create `src/data/effects.ts`:

```typescript
import type { Effect } from '../types/effects';

/**
 * Animal passive effects indexed by animal ID.
 */
export const PASSIVE_EFFECTS: Record<string, Effect> = {
  'pang': {
    id: 'pang-frost-aura',
    name: 'Frost Aura',
    type: 'stat_modifier',
    target: 'enemy',
    trigger: 'always',
    modifiers: { attackMod: -1 },
  },
  'toad': {
    id: 'toad-thick-skin',
    name: 'Thick Skin',
    type: 'heal',
    target: 'self',
    trigger: 'turn_end',
    value: 1,
  },
  'beep-boop': {
    id: 'beep-boop-metal-plating',
    name: 'Metal Plating',
    type: 'damage_reduction',
    target: 'self',
    trigger: 'on_attacked',
    value: 1,
  },
  'moo-man': {
    id: 'moo-man-milk-power',
    name: 'Milk Power',
    type: 'heal',
    target: 'self',
    trigger: 'hp_below',
    triggerValue: 50,
    value: 2,
  },
  'beetle': {
    id: 'beetle-hard-shell',
    name: 'Hard Shell',
    type: 'damage_reduction',
    target: 'self',
    trigger: 'on_attacked',
    value: 1,
  },
};

/**
 * Weapon effects indexed by weapon ID.
 */
export const WEAPON_EFFECTS: Record<string, Effect[]> = {
  'rusty-dagger': [],
  'flame-stick': [
    {
      id: 'flame-stick-burn',
      name: 'Burn Proc',
      type: 'apply_status',
      target: 'enemy',
      trigger: 'on_hit',
      procChance: 40,
      status: { type: 'burn', value: 2, duration: 3 },
    },
  ],
  'venom-fang': [
    {
      id: 'venom-fang-poison',
      name: 'Poison Proc',
      type: 'apply_status',
      target: 'enemy',
      trigger: 'on_hit',
      procChance: 40,
      status: { type: 'poison', value: 2, duration: 3 },
    },
  ],
  'heavy-rock': [],
  'sapping-thorn': [
    {
      id: 'sapping-thorn-lifesteal',
      name: 'Lifesteal',
      type: 'heal',
      target: 'self',
      trigger: 'on_hit',
      value: 2,
    },
  ],
};

/**
 * Accessory effects indexed by accessory ID.
 */
export const ACCESSORY_EFFECTS: Record<string, Effect[]> = {
  'iron-acorn': [
    {
      id: 'iron-acorn-hp',
      name: 'HP Bonus',
      type: 'stat_modifier',
      target: 'self',
      trigger: 'always',
      modifiers: { maxHP: 4 },
    },
  ],
  'lucky-pebble': [
    {
      id: 'lucky-pebble-attack',
      name: 'Attack Bonus',
      type: 'stat_modifier',
      target: 'self',
      trigger: 'always',
      modifiers: { attackMod: 1 },
    },
  ],
  'spiked-collar': [
    {
      id: 'spiked-collar-reflect',
      name: 'Reflect Damage',
      type: 'damage',
      target: 'attacker',
      trigger: 'on_attacked',
      value: 2,
    },
  ],
  'adrenaline-gland': [
    {
      id: 'adrenaline-gland-boost',
      name: 'Adrenaline Boost',
      type: 'stat_modifier',
      target: 'self',
      trigger: 'hp_below',
      triggerValue: 25,
      modifiers: { attackMod: 3 },
    },
  ],
  'ember-charm': [
    {
      id: 'ember-charm-burn',
      name: 'Ember Burn',
      type: 'apply_status',
      target: 'enemy',
      trigger: 'on_hit',
      procChance: 20,
      status: { type: 'burn', value: 2, duration: 3 },
    },
  ],
};

/**
 * Get the passive effect for an animal.
 */
export function getPassiveEffect(animalId: string): Effect | undefined {
  return PASSIVE_EFFECTS[animalId];
}

/**
 * Get all effects for a weapon.
 */
export function getWeaponEffects(weaponId: string): Effect[] {
  return WEAPON_EFFECTS[weaponId] ?? [];
}

/**
 * Get all effects for an accessory.
 */
export function getAccessoryEffects(accessoryId: string): Effect[] {
  return ACCESSORY_EFFECTS[accessoryId] ?? [];
}

/**
 * Collect all effects for a combatant (passive + weapon + accessory).
 */
export function collectCombatantEffects(
  animalId: string,
  weaponId?: string,
  accessoryId?: string
): Effect[] {
  const effects: Effect[] = [];

  const passive = getPassiveEffect(animalId);
  if (passive) {
    effects.push(passive);
  }

  if (weaponId) {
    effects.push(...getWeaponEffects(weaponId));
  }

  if (accessoryId) {
    effects.push(...getAccessoryEffects(accessoryId));
  }

  return effects;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/data/effects.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/effects.ts src/data/effects.test.ts
git commit -m "feat: convert existing passives/weapons/accessories to Effect format

Migrates all hard-coded effect logic to data-driven Effect definitions
that can be evaluated by EffectSystem.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Update Systems Index Export

**Parallel:** no
**Blocked by:** Task 2, Task 4, Task 5
**Owned files:** `src/systems/index.ts`

**Files:**
- Modify: `src/systems/index.ts`

**Step 1: Read current exports**

Run: `cat src/systems/index.ts`

**Step 2: Update exports**

Update `src/systems/index.ts` to include new systems:

```typescript
export { CombatSystem } from './CombatSystem';
export type { AttackEvent, TurnEndEvent, CombatEvent } from './CombatSystem';
export { DiceRoller } from './DiceRoller';
export { StatusManager } from './StatusManager';
export { EffectSystem } from './EffectSystem';
export { AnimationQueue } from './AnimationQueue';
export type { EventHandler } from './AnimationQueue';
export { TurnPhaseManager } from './TurnPhaseManager';
export type { PhaseHook } from './TurnPhaseManager';
```

**Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add src/systems/index.ts
git commit -m "chore: export new systems from index

Adds EffectSystem, AnimationQueue, and TurnPhaseManager to
public systems API.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Create Types Index Export

**Parallel:** yes
**Blocked by:** Task 1, Task 3
**Owned files:** `src/types/index.ts`

**Files:**
- Create: `src/types/index.ts`

**Step 1: Create types index**

Create `src/types/index.ts`:

```typescript
// Re-export from main types file
export type {
  AnimalStats,
  UnarmedAttack,
  AnimalPassive,
  Animal,
  Weapon,
  Accessory,
  StatusType,
  StatusEffect,
  Combatant,
  GameState,
  CPULoadout,
  DraftChoice,
} from '../types';

// Export effect types
export type {
  EffectTrigger,
  EffectType,
  EffectTarget,
  StatModifiers,
  StatusApplication,
  Effect,
  EffectContext,
  EffectResult,
} from './effects';

// Export event types
export type {
  TurnPhase,
  BaseEvent,
  PhaseEvent,
  AttackEvent,
  DamageEvent,
  HealEvent,
  StatusEvent,
  DeathEvent,
  DodgeEvent,
  MissEvent,
  CombatEvent,
  CombatEventListener,
  DamageType,
} from './events';
```

**Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "chore: create types index for centralized exports

Provides single import point for all game types.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Run Full Test Suite

**Parallel:** no
**Blocked by:** Task 7, Task 8
**Owned files:** none (verification only)

**Step 1: Run all tests**

Run: `npm run test`
Expected: All tests pass

**Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: No type errors

**Step 3: Run linter (if available)**

Run: `npm run lint` (if exists)
Expected: No lint errors

**Step 4: Verify existing tests still pass**

Run: `npm run test -- src/systems/CombatSystem.test.ts`
Expected: All 15 existing tests pass

---

## Task 10: Create Integration Test

**Parallel:** no
**Blocked by:** Task 9
**Owned files:** `src/systems/integration.test.ts`

**Files:**
- Create: `src/systems/integration.test.ts`

**Step 1: Write the integration test**

Create `src/systems/integration.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EffectSystem } from './EffectSystem';
import { AnimationQueue } from './AnimationQueue';
import { TurnPhaseManager } from './TurnPhaseManager';
import { DiceRoller } from './DiceRoller';
import { collectCombatantEffects } from '../data/effects';
import type { EffectContext } from '../types/effects';
import type { CombatEvent } from '../types/events';

describe('Systems Integration', () => {
  let diceRoller: DiceRoller;
  let effectSystem: EffectSystem;
  let animationQueue: AnimationQueue;
  let phaseManager: TurnPhaseManager;

  beforeEach(() => {
    diceRoller = new DiceRoller();
    effectSystem = new EffectSystem(diceRoller);
    animationQueue = new AnimationQueue();
    phaseManager = new TurnPhaseManager(animationQueue);
  });

  it('should collect and evaluate effects for Pang with Flame Stick', () => {
    const effects = collectCombatantEffects('pang', 'flame-stick');

    // Should have Frost Aura passive + Flame Stick burn proc
    expect(effects).toHaveLength(2);

    // Test Frost Aura evaluation
    const frostAura = effects.find(e => e.id === 'pang-frost-aura');
    expect(frostAura).toBeDefined();

    const context: EffectContext = {
      owner: { currentHP: 16, maxHP: 16, attackMod: 4, armor: 9 },
      opponent: { currentHP: 20, maxHP: 20, attackMod: 2, armor: 12 },
      trigger: 'always',
    };

    const result = effectSystem.evaluate(frostAura!, context);
    expect(result.applied).toBe(true);
    expect(result.modifiers?.attackMod).toBe(-1);
    expect(result.target).toBe('enemy');
  });

  it('should emit phase events during turn execution', async () => {
    const events: CombatEvent[] = [];
    animationQueue.subscribe((event) => events.push(event));

    await phaseManager.executeTurn('player');

    const phaseEvents = events.filter(e => e.type === 'phase');
    expect(phaseEvents).toHaveLength(4);
    expect(phaseEvents.map(e => e.type === 'phase' && e.phase)).toEqual([
      'pre_attack',
      'attack',
      'post_attack',
      'turn_end',
    ]);
  });

  it('should evaluate conditional effects based on HP', () => {
    const effects = collectCombatantEffects('moo-man');
    const milkPower = effects.find(e => e.id === 'moo-man-milk-power');
    expect(milkPower).toBeDefined();

    // Above 50% HP - should not trigger
    const contextAbove: EffectContext = {
      owner: { currentHP: 20, maxHP: 26, attackMod: 2, armor: 12 },
      trigger: 'hp_below',
    };
    const resultAbove = effectSystem.evaluate(milkPower!, contextAbove);
    expect(resultAbove.applied).toBe(false);

    // Below 50% HP - should trigger
    const contextBelow: EffectContext = {
      owner: { currentHP: 10, maxHP: 26, attackMod: 2, armor: 12 },
      trigger: 'hp_below',
    };
    const resultBelow = effectSystem.evaluate(milkPower!, contextBelow);
    expect(resultBelow.applied).toBe(true);
    expect(resultBelow.healing).toBe(2);
  });

  it('should handle proc chance effects', () => {
    vi.spyOn(diceRoller, 'checkProc').mockReturnValue(true);

    const effects = collectCombatantEffects('toad', 'flame-stick');
    const burnProc = effects.find(e => e.id === 'flame-stick-burn');
    expect(burnProc).toBeDefined();

    const context: EffectContext = {
      owner: { currentHP: 28, maxHP: 28, attackMod: 1, armor: 11 },
      trigger: 'on_hit',
      damageDealt: 4,
    };

    const result = effectSystem.evaluate(burnProc!, context);
    expect(result.applied).toBe(true);
    expect(result.status?.type).toBe('burn');
    expect(diceRoller.checkProc).toHaveBeenCalledWith(40);
  });

  it('should process animation queue events in order', async () => {
    const processed: string[] = [];

    animationQueue.enqueue({
      type: 'phase',
      timestamp: 1,
      phase: 'attack',
      combatantId: 'player',
    });
    animationQueue.enqueue({
      type: 'damage',
      timestamp: 2,
      targetId: 'cpu',
      sourceId: 'player',
      amount: 5,
      damageType: 'physical',
      source: 'attack',
    });
    animationQueue.enqueue({
      type: 'status',
      timestamp: 3,
      targetId: 'cpu',
      statusType: 'burn',
      action: 'applied',
      value: 2,
      duration: 3,
    });

    await animationQueue.processAll(async (event) => {
      processed.push(`${event.type}-${event.timestamp}`);
    });

    expect(processed).toEqual(['phase-1', 'damage-2', 'status-3']);
  });
});
```

**Step 2: Run the integration test**

Run: `npm run test -- src/systems/integration.test.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/systems/integration.test.ts
git commit -m "test: add integration tests for new systems

Verifies EffectSystem, AnimationQueue, and TurnPhaseManager
work together correctly.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Summary

This implementation plan creates three new systems:

1. **EffectSystem** - Generic effect evaluation with trigger conditions, proc chances, and stat modifiers
2. **AnimationQueue** - Event-based queue for decoupling combat from animations
3. **TurnPhaseManager** - Phase-based turn execution with hook points

**Files Created:**
- `src/types/effects.ts` - Effect type definitions
- `src/types/events.ts` - Combat event type definitions
- `src/types/index.ts` - Types re-export index
- `src/systems/EffectSystem.ts` - Effect evaluation system
- `src/systems/AnimationQueue.ts` - Animation event queue
- `src/systems/TurnPhaseManager.ts` - Phase-based turn manager
- `src/data/effects.ts` - Effect data for existing passives/weapons/accessories
- `src/systems/integration.test.ts` - Integration tests

**Files Modified:**
- `src/systems/index.ts` - Export new systems

**Not Modified (yet):**
- `src/systems/CombatSystem.ts` - Will be refactored in follow-up to use EffectSystem
- `src/scenes/BattleScene.ts` - Will be refactored in follow-up to use AnimationQueue + TurnPhaseManager

The existing `CombatSystem` and `BattleScene` remain unchanged. A follow-up plan will migrate them to use these new systems incrementally, ensuring the game remains functional throughout the refactor.

---

## Dependency Graph

```
Task 1 (Effect Types)
    │
    ├─────────────────────────────────────────┐
    │                                         │
    ▼                                         ▼
Task 2 (EffectSystem)                   Task 3 (Event Types) [parallel]
    │                                         │
    │                                         ▼
    │                                   Task 4 (AnimationQueue)
    │                                         │
    ├─────────────────────────────────────────┤
    │                                         │
    ▼                                         │
Task 6 (Effect Data)                          │
    │                                         │
    └─────────────────────────────────────────┤
                                              │
                                              ▼
                                        Task 5 (TurnPhaseManager)
                                              │
    ┌─────────────────────────────────────────┤
    │                                         │
    ▼                                         ▼
Task 7 (Systems Index)                  Task 8 (Types Index) [parallel]
    │                                         │
    └─────────────────────────────────────────┤
                                              │
                                              ▼
                                        Task 9 (Verify Tests)
                                              │
                                              ▼
                                        Task 10 (Integration Test)
```
