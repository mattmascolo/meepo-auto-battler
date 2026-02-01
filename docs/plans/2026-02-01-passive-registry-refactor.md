# Passive Registry Refactor Implementation Plan

> **For Claude:** Spawn `plan-executor` agent to implement this plan task-by-task.

**Goal:** Replace scattered passive ability logic in CombatSystem with a centralized registry pattern for cleaner organization, easier testing, and simpler addition of new passive types.

**Architecture:** Create a `PassiveRegistry` class that maps passive types to handler functions. Each handler encapsulates the logic for one passive type (`stat_flat`, `stat_conditional`, `per_turn`, `on_attacked`). CombatSystem queries the registry instead of using inline conditionals.

**Tech Stack:** TypeScript, Vitest

---

## Current State Analysis

The current `CombatSystem.ts` has passive logic scattered across multiple methods:
- `getEffectiveAttackMod()` - checks `stat_conditional` for attackMod, `stat_flat` for enemyAttackMod
- `getEffectiveArmor()` - checks `stat_flat` and `stat_conditional` for armor
- `getDamageReduction()` - checks effect.damageReduction directly
- `executeAttack()` - checks effect.dodgeChance directly
- `executeTurnEnd()` - checks `per_turn` and `stat_conditional` for regen

Each passive type check uses inline conditionals making it hard to:
1. Add new passive types
2. Test passive logic in isolation
3. Understand what passives do without reading all code

---

## Task 1: Create PassiveHandler Types

**Parallel:** no
**Blocked by:** none
**Owned files:** `src/systems/passives/types.ts`

**Files:**
- Create: `src/systems/passives/types.ts`

**Step 1: Write the type definitions**

```typescript
// src/systems/passives/types.ts
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
```

**Step 2: Verify file compiles**

Run: `npx tsc --noEmit src/systems/passives/types.ts`
Expected: No errors (exit code 0)

**Step 3: Commit**

```bash
git add src/systems/passives/types.ts
git commit -m "feat: add PassiveHandler type definitions for registry pattern"
```

---

## Task 2: Create PassiveRegistry Class

**Parallel:** no
**Blocked by:** Task 1
**Owned files:** `src/systems/passives/PassiveRegistry.ts`, `src/systems/passives/PassiveRegistry.test.ts`

**Files:**
- Create: `src/systems/passives/PassiveRegistry.ts`
- Create: `src/systems/passives/PassiveRegistry.test.ts`

**Step 1: Write failing test for registry lookup**

```typescript
// src/systems/passives/PassiveRegistry.test.ts
import { describe, it, expect } from 'vitest';
import { PassiveRegistry } from './PassiveRegistry';
import type { PassiveStatHandler, PassiveType } from './types';

describe('PassiveRegistry', () => {
  describe('registerStatHandler', () => {
    it('should register and retrieve a stat handler', () => {
      const registry = new PassiveRegistry();
      const mockHandler: PassiveStatHandler = () => ({ attackMod: 1 });

      registry.registerStatHandler('stat_flat', mockHandler);
      const handlers = registry.getStatHandlers('stat_flat');

      expect(handlers).toHaveLength(1);
      expect(handlers[0]).toBe(mockHandler);
    });
  });

  describe('getStatHandlers', () => {
    it('should return empty array for unregistered type', () => {
      const registry = new PassiveRegistry();
      const handlers = registry.getStatHandlers('on_hit');

      expect(handlers).toEqual([]);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/systems/passives/PassiveRegistry.test.ts`
Expected: FAIL - Cannot find module './PassiveRegistry'

**Step 3: Write minimal PassiveRegistry implementation**

```typescript
// src/systems/passives/PassiveRegistry.ts
import type {
  PassiveType,
  PassiveStatHandler,
  PassiveAttackHandler,
  PassiveTurnEndHandler,
} from './types';

export class PassiveRegistry {
  private statHandlers = new Map<PassiveType, PassiveStatHandler[]>();
  private attackHandlers = new Map<PassiveType, PassiveAttackHandler[]>();
  private turnEndHandlers = new Map<PassiveType, PassiveTurnEndHandler[]>();

  registerStatHandler(type: PassiveType, handler: PassiveStatHandler): void {
    const handlers = this.statHandlers.get(type) ?? [];
    handlers.push(handler);
    this.statHandlers.set(type, handlers);
  }

  registerAttackHandler(type: PassiveType, handler: PassiveAttackHandler): void {
    const handlers = this.attackHandlers.get(type) ?? [];
    handlers.push(handler);
    this.attackHandlers.set(type, handlers);
  }

  registerTurnEndHandler(type: PassiveType, handler: PassiveTurnEndHandler): void {
    const handlers = this.turnEndHandlers.get(type) ?? [];
    handlers.push(handler);
    this.turnEndHandlers.set(type, handlers);
  }

  getStatHandlers(type: PassiveType): PassiveStatHandler[] {
    return this.statHandlers.get(type) ?? [];
  }

  getAttackHandlers(type: PassiveType): PassiveAttackHandler[] {
    return this.attackHandlers.get(type) ?? [];
  }

  getTurnEndHandlers(type: PassiveType): PassiveTurnEndHandler[] {
    return this.turnEndHandlers.get(type) ?? [];
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/systems/passives/PassiveRegistry.test.ts`
Expected: PASS

**Step 5: Add tests for attack and turn end handlers**

```typescript
// Add to PassiveRegistry.test.ts after existing tests

  describe('registerAttackHandler', () => {
    it('should register and retrieve an attack handler', () => {
      const registry = new PassiveRegistry();
      const mockHandler: PassiveAttackHandler = () => ({ dodged: true });

      registry.registerAttackHandler('on_attacked', mockHandler);
      const handlers = registry.getAttackHandlers('on_attacked');

      expect(handlers).toHaveLength(1);
      expect(handlers[0]).toBe(mockHandler);
    });
  });

  describe('registerTurnEndHandler', () => {
    it('should register and retrieve a turn end handler', () => {
      const registry = new PassiveRegistry();
      const mockHandler: PassiveTurnEndHandler = () => ({ regen: 2 });

      registry.registerTurnEndHandler('per_turn', mockHandler);
      const handlers = registry.getTurnEndHandlers('per_turn');

      expect(handlers).toHaveLength(1);
      expect(handlers[0]).toBe(mockHandler);
    });
  });
```

Import the missing types at the top:
```typescript
import type { PassiveStatHandler, PassiveAttackHandler, PassiveTurnEndHandler, PassiveType } from './types';
```

**Step 6: Run all registry tests**

Run: `npm run test -- src/systems/passives/PassiveRegistry.test.ts`
Expected: PASS (3 tests)

**Step 7: Commit**

```bash
git add src/systems/passives/PassiveRegistry.ts src/systems/passives/PassiveRegistry.test.ts
git commit -m "feat: add PassiveRegistry class for handler registration"
```

---

## Task 3: Implement stat_flat Handler

**Parallel:** no
**Blocked by:** Task 2
**Owned files:** `src/systems/passives/handlers/statFlatHandler.ts`, `src/systems/passives/handlers/statFlatHandler.test.ts`

**Files:**
- Create: `src/systems/passives/handlers/statFlatHandler.ts`
- Create: `src/systems/passives/handlers/statFlatHandler.test.ts`

**Step 1: Write failing test for armor bonus**

```typescript
// src/systems/passives/handlers/statFlatHandler.test.ts
import { describe, it, expect } from 'vitest';
import { statFlatHandler } from './statFlatHandler';
import type { AnimalPassive, Combatant, Animal, Weapon, Accessory } from '../../../types';

function createMockCombatant(passive: AnimalPassive): Combatant {
  const animal: Animal = {
    id: 'test',
    name: 'Test',
    stats: { hp: 20, attackMod: 3, armor: 10 },
    unarmedAttack: { name: 'Test', damage: 4 },
    passive,
  };
  return {
    animal,
    weapon: null,
    accessory: null,
    currentHP: 20,
    maxHP: 20,
    statuses: [],
  };
}

describe('statFlatHandler', () => {
  it('should return armor bonus for Keen Eye passive', () => {
    const passive: AnimalPassive = {
      name: 'Keen Eye',
      description: '+2 Armor',
      type: 'stat_flat',
      effect: { armor: 2 },
    };
    const combatant = createMockCombatant(passive);

    const result = statFlatHandler(passive, { combatant, enemy: null });

    expect(result.armor).toBe(2);
  });

  it('should return enemyAttackMod for Frost Aura passive', () => {
    const passive: AnimalPassive = {
      name: 'Frost Aura',
      description: 'Enemies have -1 Atk Mod',
      type: 'stat_flat',
      effect: { enemyAttackMod: -1 },
    };
    const combatant = createMockCombatant(passive);

    const result = statFlatHandler(passive, { combatant, enemy: null });

    expect(result.enemyAttackMod).toBe(-1);
  });

  it('should return empty object when no matching effects', () => {
    const passive: AnimalPassive = {
      name: 'Empty',
      description: 'Nothing',
      type: 'stat_flat',
      effect: {},
    };
    const combatant = createMockCombatant(passive);

    const result = statFlatHandler(passive, { combatant, enemy: null });

    expect(result).toEqual({});
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/systems/passives/handlers/statFlatHandler.test.ts`
Expected: FAIL - Cannot find module './statFlatHandler'

**Step 3: Write minimal implementation**

```typescript
// src/systems/passives/handlers/statFlatHandler.ts
import type { AnimalPassive } from '../../../types';
import type { PassiveStatContext, StatModification } from '../types';

export function statFlatHandler(
  passive: AnimalPassive,
  _context: PassiveStatContext
): StatModification {
  const result: StatModification = {};

  if (passive.effect.armor) {
    result.armor = passive.effect.armor;
  }

  if (passive.effect.enemyAttackMod) {
    result.enemyAttackMod = passive.effect.enemyAttackMod;
  }

  return result;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/systems/passives/handlers/statFlatHandler.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/systems/passives/handlers/statFlatHandler.ts src/systems/passives/handlers/statFlatHandler.test.ts
git commit -m "feat: add statFlatHandler for stat_flat passive type"
```

---

## Task 4: Implement stat_conditional Handler

**Parallel:** no
**Blocked by:** Task 2
**Owned files:** `src/systems/passives/handlers/statConditionalHandler.ts`, `src/systems/passives/handlers/statConditionalHandler.test.ts`

**Files:**
- Create: `src/systems/passives/handlers/statConditionalHandler.ts`
- Create: `src/systems/passives/handlers/statConditionalHandler.test.ts`

**Step 1: Write failing test for conditional attack mod**

```typescript
// src/systems/passives/handlers/statConditionalHandler.test.ts
import { describe, it, expect } from 'vitest';
import { statConditionalHandler } from './statConditionalHandler';
import type { AnimalPassive, Combatant, Animal } from '../../../types';

function createMockCombatant(passive: AnimalPassive, currentHP: number, maxHP: number): Combatant {
  const animal: Animal = {
    id: 'test',
    name: 'Test',
    stats: { hp: maxHP, attackMod: 3, armor: 10 },
    unarmedAttack: { name: 'Test', damage: 4 },
    passive,
  };
  return {
    animal,
    weapon: null,
    accessory: null,
    currentHP,
    maxHP,
    statuses: [],
  };
}

describe('statConditionalHandler', () => {
  describe('Berserker Rage (+2 attackMod when below 50% HP)', () => {
    const passive: AnimalPassive = {
      name: 'Berserker Rage',
      description: '+2 Atk Mod when below 50% HP',
      type: 'stat_conditional',
      trigger: { hpBelow: 50 },
      effect: { attackMod: 2 },
    };

    it('should return attackMod bonus when below threshold', () => {
      const combatant = createMockCombatant(passive, 10, 22); // 10/22 = 45%

      const result = statConditionalHandler(passive, { combatant, enemy: null });

      expect(result.attackMod).toBe(2);
    });

    it('should return empty when at or above threshold', () => {
      const combatant = createMockCombatant(passive, 15, 22); // 15/22 = 68%

      const result = statConditionalHandler(passive, { combatant, enemy: null });

      expect(result.attackMod).toBeUndefined();
    });
  });

  describe('Knight Valor (+2 armor when below 50% HP)', () => {
    const passive: AnimalPassive = {
      name: "Knight's Valor",
      description: '+2 Armor when below 50% HP',
      type: 'stat_conditional',
      trigger: { hpBelow: 50 },
      effect: { armor: 2 },
    };

    it('should return armor bonus when below threshold', () => {
      const combatant = createMockCombatant(passive, 10, 21); // 10/21 = 47%

      const result = statConditionalHandler(passive, { combatant, enemy: null });

      expect(result.armor).toBe(2);
    });

    it('should NOT return armor when at threshold', () => {
      const combatant = createMockCombatant(passive, 11, 21); // 11/21 = 52%

      const result = statConditionalHandler(passive, { combatant, enemy: null });

      expect(result.armor).toBeUndefined();
    });
  });

  it('should return empty when no trigger defined', () => {
    const passive: AnimalPassive = {
      name: 'Broken',
      description: 'Missing trigger',
      type: 'stat_conditional',
      effect: { attackMod: 5 },
    };
    const combatant = createMockCombatant(passive, 5, 20);

    const result = statConditionalHandler(passive, { combatant, enemy: null });

    expect(result).toEqual({});
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/systems/passives/handlers/statConditionalHandler.test.ts`
Expected: FAIL - Cannot find module './statConditionalHandler'

**Step 3: Write minimal implementation**

```typescript
// src/systems/passives/handlers/statConditionalHandler.ts
import type { AnimalPassive } from '../../../types';
import type { PassiveStatContext, StatModification } from '../types';

export function statConditionalHandler(
  passive: AnimalPassive,
  context: PassiveStatContext
): StatModification {
  const result: StatModification = {};

  // Require hpBelow trigger
  if (!passive.trigger?.hpBelow) {
    return result;
  }

  const threshold = context.combatant.maxHP * (passive.trigger.hpBelow / 100);
  const isTriggered = context.combatant.currentHP < threshold;

  if (!isTriggered) {
    return result;
  }

  if (passive.effect.attackMod) {
    result.attackMod = passive.effect.attackMod;
  }

  if (passive.effect.armor) {
    result.armor = passive.effect.armor;
  }

  return result;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/systems/passives/handlers/statConditionalHandler.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/systems/passives/handlers/statConditionalHandler.ts src/systems/passives/handlers/statConditionalHandler.test.ts
git commit -m "feat: add statConditionalHandler for HP-based stat bonuses"
```

---

## Task 5: Implement on_attacked Handler

**Parallel:** no
**Blocked by:** Task 2
**Owned files:** `src/systems/passives/handlers/onAttackedHandler.ts`, `src/systems/passives/handlers/onAttackedHandler.test.ts`

**Files:**
- Create: `src/systems/passives/handlers/onAttackedHandler.ts`
- Create: `src/systems/passives/handlers/onAttackedHandler.test.ts`

**Step 1: Write failing test for dodge and damage reduction**

```typescript
// src/systems/passives/handlers/onAttackedHandler.test.ts
import { describe, it, expect, vi } from 'vitest';
import { onAttackedStatHandler, onAttackedDodgeHandler } from './onAttackedHandler';
import type { AnimalPassive, Combatant, Animal } from '../../../types';

function createMockCombatant(passive: AnimalPassive): Combatant {
  const animal: Animal = {
    id: 'test',
    name: 'Test',
    stats: { hp: 20, attackMod: 3, armor: 10 },
    unarmedAttack: { name: 'Test', damage: 4 },
    passive,
  };
  return {
    animal,
    weapon: null,
    accessory: null,
    currentHP: 20,
    maxHP: 20,
    statuses: [],
  };
}

describe('onAttackedStatHandler', () => {
  it('should return damageReduction for Hard Shell passive', () => {
    const passive: AnimalPassive = {
      name: 'Hard Shell',
      description: 'Take -1 damage from all hits',
      type: 'on_attacked',
      effect: { damageReduction: 1 },
    };
    const combatant = createMockCombatant(passive);

    const result = onAttackedStatHandler(passive, { combatant, enemy: null });

    expect(result.damageReduction).toBe(1);
  });

  it('should return empty when no damageReduction', () => {
    const passive: AnimalPassive = {
      name: 'Evasive',
      description: '15% chance to dodge',
      type: 'on_attacked',
      effect: { dodgeChance: 15 },
    };
    const combatant = createMockCombatant(passive);

    const result = onAttackedStatHandler(passive, { combatant, enemy: null });

    expect(result.damageReduction).toBeUndefined();
  });
});

describe('onAttackedDodgeHandler', () => {
  it('should return dodged:true when dodge procs', () => {
    const passive: AnimalPassive = {
      name: 'Evasive',
      description: '15% chance to dodge',
      type: 'on_attacked',
      effect: { dodgeChance: 15 },
    };
    const attacker = createMockCombatant(passive);
    const defender = createMockCombatant(passive);
    const checkProc = vi.fn().mockReturnValue(true);

    const result = onAttackedDodgeHandler(
      passive,
      { attacker, defender, baseDamage: 5 },
      checkProc
    );

    expect(result.dodged).toBe(true);
    expect(checkProc).toHaveBeenCalledWith(15);
  });

  it('should return empty when dodge does not proc', () => {
    const passive: AnimalPassive = {
      name: 'Evasive',
      description: '15% chance to dodge',
      type: 'on_attacked',
      effect: { dodgeChance: 15 },
    };
    const attacker = createMockCombatant(passive);
    const defender = createMockCombatant(passive);
    const checkProc = vi.fn().mockReturnValue(false);

    const result = onAttackedDodgeHandler(
      passive,
      { attacker, defender, baseDamage: 5 },
      checkProc
    );

    expect(result.dodged).toBeUndefined();
  });

  it('should return empty when no dodgeChance', () => {
    const passive: AnimalPassive = {
      name: 'Hard Shell',
      description: 'Damage reduction',
      type: 'on_attacked',
      effect: { damageReduction: 1 },
    };
    const attacker = createMockCombatant(passive);
    const defender = createMockCombatant(passive);
    const checkProc = vi.fn();

    const result = onAttackedDodgeHandler(
      passive,
      { attacker, defender, baseDamage: 5 },
      checkProc
    );

    expect(result.dodged).toBeUndefined();
    expect(checkProc).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/systems/passives/handlers/onAttackedHandler.test.ts`
Expected: FAIL - Cannot find module './onAttackedHandler'

**Step 3: Write minimal implementation**

```typescript
// src/systems/passives/handlers/onAttackedHandler.ts
import type { AnimalPassive } from '../../../types';
import type {
  PassiveStatContext,
  PassiveAttackContext,
  StatModification,
  AttackModification,
} from '../types';

/**
 * Handles stat modifications from on_attacked passives (e.g., damage reduction)
 */
export function onAttackedStatHandler(
  passive: AnimalPassive,
  _context: PassiveStatContext
): StatModification {
  const result: StatModification = {};

  if (passive.effect.damageReduction) {
    result.damageReduction = passive.effect.damageReduction;
  }

  return result;
}

/**
 * Handles dodge chance from on_attacked passives
 */
export function onAttackedDodgeHandler(
  passive: AnimalPassive,
  _context: PassiveAttackContext,
  checkProc: (chance: number) => boolean
): AttackModification {
  const result: AttackModification = {};

  if (passive.effect.dodgeChance) {
    if (checkProc(passive.effect.dodgeChance)) {
      result.dodged = true;
    }
  }

  return result;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/systems/passives/handlers/onAttackedHandler.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/systems/passives/handlers/onAttackedHandler.ts src/systems/passives/handlers/onAttackedHandler.test.ts
git commit -m "feat: add onAttackedHandler for dodge and damage reduction"
```

---

## Task 6: Implement per_turn Handler

**Parallel:** no
**Blocked by:** Task 2
**Owned files:** `src/systems/passives/handlers/perTurnHandler.ts`, `src/systems/passives/handlers/perTurnHandler.test.ts`

**Files:**
- Create: `src/systems/passives/handlers/perTurnHandler.ts`
- Create: `src/systems/passives/handlers/perTurnHandler.test.ts`

**Step 1: Write failing test for per-turn regen**

```typescript
// src/systems/passives/handlers/perTurnHandler.test.ts
import { describe, it, expect } from 'vitest';
import { perTurnHandler } from './perTurnHandler';
import type { AnimalPassive, Combatant, Animal } from '../../../types';

function createMockCombatant(passive: AnimalPassive, currentHP: number, maxHP: number): Combatant {
  const animal: Animal = {
    id: 'test',
    name: 'Test',
    stats: { hp: maxHP, attackMod: 3, armor: 10 },
    unarmedAttack: { name: 'Test', damage: 4 },
    passive,
  };
  return {
    animal,
    weapon: null,
    accessory: null,
    currentHP,
    maxHP,
    statuses: [],
  };
}

describe('perTurnHandler', () => {
  it('should return regen amount for Thick Skin passive', () => {
    const passive: AnimalPassive = {
      name: 'Thick Skin',
      description: 'Regen 1 HP per turn',
      type: 'per_turn',
      effect: { regen: 1 },
    };
    const combatant = createMockCombatant(passive, 20, 28);

    const result = perTurnHandler(passive, { combatant });

    expect(result.regen).toBe(1);
  });

  it('should return regen capped at max HP', () => {
    const passive: AnimalPassive = {
      name: 'Wisdom of Ages',
      description: 'Regen 2 HP per turn',
      type: 'per_turn',
      effect: { regen: 2 },
    };
    // Only 1 HP below max
    const combatant = createMockCombatant(passive, 31, 32);

    const result = perTurnHandler(passive, { combatant });

    expect(result.regen).toBe(1);
  });

  it('should return 0 regen when at full HP', () => {
    const passive: AnimalPassive = {
      name: 'Thick Skin',
      description: 'Regen 1 HP per turn',
      type: 'per_turn',
      effect: { regen: 1 },
    };
    const combatant = createMockCombatant(passive, 28, 28);

    const result = perTurnHandler(passive, { combatant });

    expect(result.regen).toBe(0);
  });

  it('should return empty when no regen effect', () => {
    const passive: AnimalPassive = {
      name: 'Unknown',
      description: 'No regen',
      type: 'per_turn',
      effect: {},
    };
    const combatant = createMockCombatant(passive, 20, 28);

    const result = perTurnHandler(passive, { combatant });

    expect(result.regen).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/systems/passives/handlers/perTurnHandler.test.ts`
Expected: FAIL - Cannot find module './perTurnHandler'

**Step 3: Write minimal implementation**

```typescript
// src/systems/passives/handlers/perTurnHandler.ts
import type { AnimalPassive } from '../../../types';
import type { PassiveTurnEndContext, TurnEndEffect } from '../types';

export function perTurnHandler(
  passive: AnimalPassive,
  context: PassiveTurnEndContext
): TurnEndEffect {
  const result: TurnEndEffect = {};

  if (passive.effect.regen) {
    const missingHP = context.combatant.maxHP - context.combatant.currentHP;
    result.regen = Math.min(passive.effect.regen, missingHP);
  }

  return result;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/systems/passives/handlers/perTurnHandler.test.ts`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/systems/passives/handlers/perTurnHandler.ts src/systems/passives/handlers/perTurnHandler.test.ts
git commit -m "feat: add perTurnHandler for per-turn regen passive"
```

---

## Task 7: Implement stat_conditional Turn End Handler

**Parallel:** no
**Blocked by:** Task 4
**Owned files:** `src/systems/passives/handlers/statConditionalTurnEndHandler.ts`, `src/systems/passives/handlers/statConditionalTurnEndHandler.test.ts`

**Files:**
- Create: `src/systems/passives/handlers/statConditionalTurnEndHandler.ts`
- Create: `src/systems/passives/handlers/statConditionalTurnEndHandler.test.ts`

**Step 1: Write failing test for conditional regen**

```typescript
// src/systems/passives/handlers/statConditionalTurnEndHandler.test.ts
import { describe, it, expect } from 'vitest';
import { statConditionalTurnEndHandler } from './statConditionalTurnEndHandler';
import type { AnimalPassive, Combatant, Animal } from '../../../types';

function createMockCombatant(passive: AnimalPassive, currentHP: number, maxHP: number): Combatant {
  const animal: Animal = {
    id: 'test',
    name: 'Test',
    stats: { hp: maxHP, attackMod: 3, armor: 10 },
    unarmedAttack: { name: 'Test', damage: 4 },
    passive,
  };
  return {
    animal,
    weapon: null,
    accessory: null,
    currentHP,
    maxHP,
    statuses: [],
  };
}

describe('statConditionalTurnEndHandler', () => {
  describe('Milk Power (regen 2 when below 50% HP)', () => {
    const passive: AnimalPassive = {
      name: 'Milk Power',
      description: 'Regen 2 HP when below 50% HP',
      type: 'stat_conditional',
      trigger: { hpBelow: 50 },
      effect: { regen: 2 },
    };

    it('should return regen when below threshold', () => {
      const combatant = createMockCombatant(passive, 10, 26); // 38%

      const result = statConditionalTurnEndHandler(passive, { combatant });

      expect(result.regen).toBe(2);
    });

    it('should return empty when at or above threshold', () => {
      const combatant = createMockCombatant(passive, 20, 26); // 77%

      const result = statConditionalTurnEndHandler(passive, { combatant });

      expect(result.regen).toBeUndefined();
    });

    it('should cap regen at max HP', () => {
      const combatant = createMockCombatant(passive, 25, 26); // 96% but somehow triggered

      // Force the threshold to be met for this test
      const lowThresholdPassive = { ...passive, trigger: { hpBelow: 100 } };
      const result = statConditionalTurnEndHandler(lowThresholdPassive, { combatant });

      expect(result.regen).toBe(1); // Can only heal 1
    });
  });

  it('should return empty when no trigger', () => {
    const passive: AnimalPassive = {
      name: 'Broken',
      description: 'No trigger',
      type: 'stat_conditional',
      effect: { regen: 5 },
    };
    const combatant = createMockCombatant(passive, 5, 20);

    const result = statConditionalTurnEndHandler(passive, { combatant });

    expect(result.regen).toBeUndefined();
  });

  it('should return empty when no regen effect', () => {
    const passive: AnimalPassive = {
      name: 'Berserker Rage',
      description: 'Attack bonus only',
      type: 'stat_conditional',
      trigger: { hpBelow: 50 },
      effect: { attackMod: 2 },
    };
    const combatant = createMockCombatant(passive, 5, 20);

    const result = statConditionalTurnEndHandler(passive, { combatant });

    expect(result.regen).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/systems/passives/handlers/statConditionalTurnEndHandler.test.ts`
Expected: FAIL - Cannot find module

**Step 3: Write minimal implementation**

```typescript
// src/systems/passives/handlers/statConditionalTurnEndHandler.ts
import type { AnimalPassive } from '../../../types';
import type { PassiveTurnEndContext, TurnEndEffect } from '../types';

export function statConditionalTurnEndHandler(
  passive: AnimalPassive,
  context: PassiveTurnEndContext
): TurnEndEffect {
  const result: TurnEndEffect = {};

  // Require both trigger and regen effect
  if (!passive.trigger?.hpBelow || !passive.effect.regen) {
    return result;
  }

  const threshold = context.combatant.maxHP * (passive.trigger.hpBelow / 100);
  const isTriggered = context.combatant.currentHP < threshold;

  if (!isTriggered) {
    return result;
  }

  const missingHP = context.combatant.maxHP - context.combatant.currentHP;
  result.regen = Math.min(passive.effect.regen, missingHP);

  return result;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/systems/passives/handlers/statConditionalTurnEndHandler.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/systems/passives/handlers/statConditionalTurnEndHandler.ts src/systems/passives/handlers/statConditionalTurnEndHandler.test.ts
git commit -m "feat: add statConditionalTurnEndHandler for conditional regen"
```

---

## Task 8: Create Handler Index and Default Registry

**Parallel:** no
**Blocked by:** Task 3, Task 4, Task 5, Task 6, Task 7
**Owned files:** `src/systems/passives/handlers/index.ts`, `src/systems/passives/index.ts`, `src/systems/passives/createDefaultRegistry.ts`, `src/systems/passives/createDefaultRegistry.test.ts`

**Files:**
- Create: `src/systems/passives/handlers/index.ts`
- Create: `src/systems/passives/index.ts`
- Create: `src/systems/passives/createDefaultRegistry.ts`
- Create: `src/systems/passives/createDefaultRegistry.test.ts`

**Step 1: Create handler barrel export**

```typescript
// src/systems/passives/handlers/index.ts
export { statFlatHandler } from './statFlatHandler';
export { statConditionalHandler } from './statConditionalHandler';
export { onAttackedStatHandler, onAttackedDodgeHandler } from './onAttackedHandler';
export { perTurnHandler } from './perTurnHandler';
export { statConditionalTurnEndHandler } from './statConditionalTurnEndHandler';
```

**Step 2: Write failing test for default registry**

```typescript
// src/systems/passives/createDefaultRegistry.test.ts
import { describe, it, expect } from 'vitest';
import { createDefaultRegistry } from './createDefaultRegistry';

describe('createDefaultRegistry', () => {
  it('should register stat_flat handler', () => {
    const registry = createDefaultRegistry();
    const handlers = registry.getStatHandlers('stat_flat');

    expect(handlers).toHaveLength(1);
  });

  it('should register stat_conditional stat handler', () => {
    const registry = createDefaultRegistry();
    const handlers = registry.getStatHandlers('stat_conditional');

    expect(handlers).toHaveLength(1);
  });

  it('should register on_attacked stat handler', () => {
    const registry = createDefaultRegistry();
    const handlers = registry.getStatHandlers('on_attacked');

    expect(handlers).toHaveLength(1);
  });

  it('should register on_attacked attack handler', () => {
    const registry = createDefaultRegistry();
    const handlers = registry.getAttackHandlers('on_attacked');

    expect(handlers).toHaveLength(1);
  });

  it('should register per_turn turn end handler', () => {
    const registry = createDefaultRegistry();
    const handlers = registry.getTurnEndHandlers('per_turn');

    expect(handlers).toHaveLength(1);
  });

  it('should register stat_conditional turn end handler', () => {
    const registry = createDefaultRegistry();
    const handlers = registry.getTurnEndHandlers('stat_conditional');

    expect(handlers).toHaveLength(1);
  });
});
```

**Step 3: Run test to verify it fails**

Run: `npm run test -- src/systems/passives/createDefaultRegistry.test.ts`
Expected: FAIL - Cannot find module

**Step 4: Write implementation**

```typescript
// src/systems/passives/createDefaultRegistry.ts
import { PassiveRegistry } from './PassiveRegistry';
import {
  statFlatHandler,
  statConditionalHandler,
  onAttackedStatHandler,
  onAttackedDodgeHandler,
  perTurnHandler,
  statConditionalTurnEndHandler,
} from './handlers';

export function createDefaultRegistry(): PassiveRegistry {
  const registry = new PassiveRegistry();

  // Stat handlers
  registry.registerStatHandler('stat_flat', statFlatHandler);
  registry.registerStatHandler('stat_conditional', statConditionalHandler);
  registry.registerStatHandler('on_attacked', onAttackedStatHandler);

  // Attack handlers
  registry.registerAttackHandler('on_attacked', onAttackedDodgeHandler);

  // Turn end handlers
  registry.registerTurnEndHandler('per_turn', perTurnHandler);
  registry.registerTurnEndHandler('stat_conditional', statConditionalTurnEndHandler);

  return registry;
}
```

**Step 5: Run test to verify it passes**

Run: `npm run test -- src/systems/passives/createDefaultRegistry.test.ts`
Expected: PASS (6 tests)

**Step 6: Create passives barrel export**

```typescript
// src/systems/passives/index.ts
export { PassiveRegistry } from './PassiveRegistry';
export { createDefaultRegistry } from './createDefaultRegistry';
export * from './types';
export * from './handlers';
```

**Step 7: Commit**

```bash
git add src/systems/passives/handlers/index.ts src/systems/passives/index.ts src/systems/passives/createDefaultRegistry.ts src/systems/passives/createDefaultRegistry.test.ts
git commit -m "feat: add createDefaultRegistry factory and barrel exports"
```

---

## Task 9: Add PassiveResolver Helper

**Parallel:** no
**Blocked by:** Task 8
**Owned files:** `src/systems/passives/PassiveResolver.ts`, `src/systems/passives/PassiveResolver.test.ts`

**Files:**
- Create: `src/systems/passives/PassiveResolver.ts`
- Create: `src/systems/passives/PassiveResolver.test.ts`

**Step 1: Write failing test for stat resolution**

```typescript
// src/systems/passives/PassiveResolver.test.ts
import { describe, it, expect, vi } from 'vitest';
import { PassiveResolver } from './PassiveResolver';
import { createDefaultRegistry } from './createDefaultRegistry';
import type { Combatant, Animal, AnimalPassive } from '../../types';

function createMockCombatant(passive: AnimalPassive, currentHP?: number): Combatant {
  const animal: Animal = {
    id: 'test',
    name: 'Test',
    stats: { hp: 20, attackMod: 3, armor: 10 },
    unarmedAttack: { name: 'Test', damage: 4 },
    passive,
  };
  return {
    animal,
    weapon: null,
    accessory: null,
    currentHP: currentHP ?? 20,
    maxHP: 20,
    statuses: [],
  };
}

describe('PassiveResolver', () => {
  const registry = createDefaultRegistry();
  const resolver = new PassiveResolver(registry);

  describe('resolveStatMods', () => {
    it('should return armor from stat_flat passive', () => {
      const passive: AnimalPassive = {
        name: 'Keen Eye',
        description: '+2 Armor',
        type: 'stat_flat',
        effect: { armor: 2 },
      };
      const combatant = createMockCombatant(passive);

      const result = resolver.resolveStatMods(combatant, null);

      expect(result.armor).toBe(2);
    });

    it('should return attackMod from stat_conditional when triggered', () => {
      const passive: AnimalPassive = {
        name: 'Berserker Rage',
        description: '+2 Atk Mod when below 50%',
        type: 'stat_conditional',
        trigger: { hpBelow: 50 },
        effect: { attackMod: 2 },
      };
      const combatant = createMockCombatant(passive, 8); // 40%

      const result = resolver.resolveStatMods(combatant, null);

      expect(result.attackMod).toBe(2);
    });

    it('should return damageReduction from on_attacked passive', () => {
      const passive: AnimalPassive = {
        name: 'Hard Shell',
        description: '-1 damage',
        type: 'on_attacked',
        effect: { damageReduction: 1 },
      };
      const combatant = createMockCombatant(passive);

      const result = resolver.resolveStatMods(combatant, null);

      expect(result.damageReduction).toBe(1);
    });
  });

  describe('resolveAttackEffects', () => {
    it('should return dodged:true when dodge procs', () => {
      const passive: AnimalPassive = {
        name: 'Evasive',
        description: '15% dodge',
        type: 'on_attacked',
        effect: { dodgeChance: 15 },
      };
      const defender = createMockCombatant(passive);
      const attacker = createMockCombatant(passive);
      const checkProc = vi.fn().mockReturnValue(true);

      const result = resolver.resolveAttackEffects(attacker, defender, 5, checkProc);

      expect(result.dodged).toBe(true);
    });
  });

  describe('resolveTurnEndEffects', () => {
    it('should return regen from per_turn passive', () => {
      const passive: AnimalPassive = {
        name: 'Thick Skin',
        description: 'Regen 1',
        type: 'per_turn',
        effect: { regen: 1 },
      };
      const combatant = createMockCombatant(passive, 15);

      const result = resolver.resolveTurnEndEffects(combatant);

      expect(result.regen).toBe(1);
    });

    it('should return regen from stat_conditional when triggered', () => {
      const passive: AnimalPassive = {
        name: 'Milk Power',
        description: 'Regen 2 when low',
        type: 'stat_conditional',
        trigger: { hpBelow: 50 },
        effect: { regen: 2 },
      };
      const combatant = createMockCombatant(passive, 8); // 40%

      const result = resolver.resolveTurnEndEffects(combatant);

      expect(result.regen).toBe(2);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/systems/passives/PassiveResolver.test.ts`
Expected: FAIL - Cannot find module

**Step 3: Write implementation**

```typescript
// src/systems/passives/PassiveResolver.ts
import type { Combatant } from '../../types';
import type { PassiveRegistry } from './PassiveRegistry';
import type { StatModification, AttackModification, TurnEndEffect, PassiveType } from './types';

export class PassiveResolver {
  constructor(private registry: PassiveRegistry) {}

  resolveStatMods(combatant: Combatant, enemy: Combatant | null): StatModification {
    const result: StatModification = {};
    const passiveType = combatant.animal.passive.type as PassiveType;
    const handlers = this.registry.getStatHandlers(passiveType);

    for (const handler of handlers) {
      const mods = handler(combatant.animal.passive, { combatant, enemy });
      if (mods.attackMod !== undefined) result.attackMod = (result.attackMod ?? 0) + mods.attackMod;
      if (mods.armor !== undefined) result.armor = (result.armor ?? 0) + mods.armor;
      if (mods.damageReduction !== undefined) result.damageReduction = (result.damageReduction ?? 0) + mods.damageReduction;
      if (mods.enemyAttackMod !== undefined) result.enemyAttackMod = (result.enemyAttackMod ?? 0) + mods.enemyAttackMod;
    }

    return result;
  }

  resolveAttackEffects(
    attacker: Combatant,
    defender: Combatant,
    baseDamage: number,
    checkProc: (chance: number) => boolean
  ): AttackModification {
    const result: AttackModification = {};
    const passiveType = defender.animal.passive.type as PassiveType;
    const handlers = this.registry.getAttackHandlers(passiveType);

    for (const handler of handlers) {
      const effects = handler(defender.animal.passive, { attacker, defender, baseDamage }, checkProc);
      if (effects.dodged) result.dodged = true;
    }

    return result;
  }

  resolveTurnEndEffects(combatant: Combatant): TurnEndEffect {
    const result: TurnEndEffect = {};
    const passiveType = combatant.animal.passive.type as PassiveType;
    const handlers = this.registry.getTurnEndHandlers(passiveType);

    for (const handler of handlers) {
      const effects = handler(combatant.animal.passive, { combatant });
      if (effects.regen !== undefined) result.regen = (result.regen ?? 0) + effects.regen;
    }

    return result;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/systems/passives/PassiveResolver.test.ts`
Expected: PASS (5 tests)

**Step 5: Export from barrel**

Update `src/systems/passives/index.ts`:

```typescript
export { PassiveRegistry } from './PassiveRegistry';
export { PassiveResolver } from './PassiveResolver';
export { createDefaultRegistry } from './createDefaultRegistry';
export * from './types';
export * from './handlers';
```

**Step 6: Commit**

```bash
git add src/systems/passives/PassiveResolver.ts src/systems/passives/PassiveResolver.test.ts src/systems/passives/index.ts
git commit -m "feat: add PassiveResolver to aggregate handler results"
```

---

## Task 10: Integrate PassiveResolver into CombatSystem

**Parallel:** no
**Blocked by:** Task 9
**Owned files:** `src/systems/CombatSystem.ts`

**Files:**
- Modify: `src/systems/CombatSystem.ts`

**Step 1: Add PassiveResolver dependency to CombatSystem**

Add import at top of file:

```typescript
import { PassiveResolver } from './passives/PassiveResolver';
```

Update constructor:

```typescript
export class CombatSystem {
  constructor(
    private diceRoller: DiceRoller,
    private statusManager: StatusManager,
    private passiveResolver?: PassiveResolver
  ) {}
```

**Step 2: Refactor getEffectiveAttackMod to use registry**

Replace lines 37-77 in `src/systems/CombatSystem.ts`:

```typescript
  getEffectiveAttackMod(combatant: Combatant, enemy: Combatant | null): number {
    let mod = combatant.animal.stats.attackMod;

    // Weapon modifier (e.g., Heavy Rock -1)
    if (combatant.weapon?.attackModModifier) {
      mod += combatant.weapon.attackModModifier;
    }

    // Accessory stat bonus (Lucky Pebble +1)
    if (combatant.accessory?.effect.attackMod) {
      mod += combatant.accessory.effect.attackMod;
    }

    // Passive stat mods (via registry or fallback)
    if (this.passiveResolver) {
      const passiveMods = this.passiveResolver.resolveStatMods(combatant, enemy);
      mod += passiveMods.attackMod ?? 0;
    } else {
      // Legacy fallback: stat_conditional attackMod
      if (combatant.animal.passive.type === 'stat_conditional' &&
          combatant.animal.passive.trigger?.hpBelow) {
        const threshold = combatant.maxHP * (combatant.animal.passive.trigger.hpBelow / 100);
        if (combatant.currentHP < threshold) {
          mod += combatant.animal.passive.effect.attackMod ?? 0;
        }
      }
    }

    // Accessory: Adrenaline Gland - +3 when below 25% HP
    if (combatant.accessory?.effect.attackModWhenLow &&
        combatant.accessory.effect.lowHpThreshold) {
      const threshold = combatant.maxHP * (combatant.accessory.effect.lowHpThreshold / 100);
      if (combatant.currentHP < threshold) {
        mod += combatant.accessory.effect.attackModWhenLow;
      }
    }

    // Weaken status
    mod -= this.statusManager.getWeakenAmount(combatant.statuses);

    // Enemy passive: enemyAttackMod debuff
    if (enemy) {
      if (this.passiveResolver) {
        const enemyMods = this.passiveResolver.resolveStatMods(enemy, combatant);
        mod += enemyMods.enemyAttackMod ?? 0;
      } else if (enemy.animal.passive.effect.enemyAttackMod) {
        mod += enemy.animal.passive.effect.enemyAttackMod;
      }
    }

    return mod;
  }
```

**Step 3: Run existing tests to verify no regression**

Run: `npm run test -- src/systems/CombatSystem.test.ts`
Expected: PASS (all existing tests still pass)

**Step 4: Commit**

```bash
git add src/systems/CombatSystem.ts
git commit -m "refactor: integrate PassiveResolver into getEffectiveAttackMod"
```

---

## Task 11: Refactor getEffectiveArmor to use registry

**Parallel:** no
**Blocked by:** Task 10
**Owned files:** `src/systems/CombatSystem.ts`

**Files:**
- Modify: `src/systems/CombatSystem.ts:79-104`

**Step 1: Replace getEffectiveArmor implementation**

```typescript
  getEffectiveArmor(combatant: Combatant): number {
    let armor = combatant.animal.stats.armor;

    // Passive armor bonus (via registry or fallback)
    if (this.passiveResolver) {
      const passiveMods = this.passiveResolver.resolveStatMods(combatant, null);
      armor += passiveMods.armor ?? 0;
    } else {
      // Legacy fallback: stat_flat armor
      if (combatant.animal.passive.type === 'stat_flat' &&
          combatant.animal.passive.effect.armor) {
        armor += combatant.animal.passive.effect.armor;
      }

      // Legacy fallback: stat_conditional armor
      if (combatant.animal.passive.type === 'stat_conditional' &&
          combatant.animal.passive.trigger?.hpBelow &&
          combatant.animal.passive.effect.armor) {
        const threshold = combatant.maxHP * (combatant.animal.passive.trigger.hpBelow / 100);
        if (combatant.currentHP < threshold) {
          armor += combatant.animal.passive.effect.armor;
        }
      }
    }

    // Accessory armor bonus (e.g., Dragon's Scale +2)
    if (combatant.accessory?.effect.armor) {
      armor += combatant.accessory.effect.armor;
    }

    return armor;
  }
```

**Step 2: Run existing tests**

Run: `npm run test -- src/systems/CombatSystem.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/systems/CombatSystem.ts
git commit -m "refactor: integrate PassiveResolver into getEffectiveArmor"
```

---

## Task 12: Refactor getDamageReduction to use registry

**Parallel:** no
**Blocked by:** Task 11
**Owned files:** `src/systems/CombatSystem.ts`

**Files:**
- Modify: `src/systems/CombatSystem.ts:106-111`

**Step 1: Replace getDamageReduction implementation**

```typescript
  getDamageReduction(combatant: Combatant): number {
    if (this.passiveResolver) {
      const passiveMods = this.passiveResolver.resolveStatMods(combatant, null);
      return passiveMods.damageReduction ?? 0;
    }

    // Legacy fallback
    if (combatant.animal.passive.effect.damageReduction) {
      return combatant.animal.passive.effect.damageReduction;
    }
    return 0;
  }
```

**Step 2: Run existing tests**

Run: `npm run test -- src/systems/CombatSystem.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/systems/CombatSystem.ts
git commit -m "refactor: integrate PassiveResolver into getDamageReduction"
```

---

## Task 13: Refactor executeAttack dodge to use registry

**Parallel:** no
**Blocked by:** Task 12
**Owned files:** `src/systems/CombatSystem.ts`

**Files:**
- Modify: `src/systems/CombatSystem.ts:152-227` (executeAttack method)

**Step 1: Replace dodge check in executeAttack**

Find this section (around line 175-181):
```typescript
    // Check dodge (Mosquito Evasive passive)
    if (defender.animal.passive.effect.dodgeChance) {
      if (this.diceRoller.checkProc(defender.animal.passive.effect.dodgeChance)) {
        event.dodged = true;
        return event;
      }
    }
```

Replace with:
```typescript
    // Check dodge via registry or fallback
    if (this.passiveResolver) {
      const attackEffects = this.passiveResolver.resolveAttackEffects(
        attacker,
        defender,
        this.getAttackDamage(attacker),
        (chance) => this.diceRoller.checkProc(chance)
      );
      if (attackEffects.dodged) {
        event.dodged = true;
        return event;
      }
    } else if (defender.animal.passive.effect.dodgeChance) {
      if (this.diceRoller.checkProc(defender.animal.passive.effect.dodgeChance)) {
        event.dodged = true;
        return event;
      }
    }
```

**Step 2: Run existing tests**

Run: `npm run test -- src/systems/CombatSystem.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/systems/CombatSystem.ts
git commit -m "refactor: integrate PassiveResolver into executeAttack dodge"
```

---

## Task 14: Refactor executeTurnEnd to use registry

**Parallel:** no
**Blocked by:** Task 13
**Owned files:** `src/systems/CombatSystem.ts`

**Files:**
- Modify: `src/systems/CombatSystem.ts:229-279` (executeTurnEnd method)

**Step 1: Replace regen logic in executeTurnEnd**

Find the current executeTurnEnd method and replace it:

```typescript
  executeTurnEnd(combatant: Combatant): TurnEndEvent {
    let regenHealing = 0;
    let dotDamage = 0;

    // Apply passive regen (via registry or fallback)
    if (this.passiveResolver) {
      const turnEndEffects = this.passiveResolver.resolveTurnEndEffects(combatant);
      if (turnEndEffects.regen !== undefined && turnEndEffects.regen > 0) {
        combatant.currentHP += turnEndEffects.regen;
        regenHealing = turnEndEffects.regen;
      }
    } else {
      // Legacy fallback: per_turn regen
      if (combatant.animal.passive.type === 'per_turn' && combatant.animal.passive.effect.regen) {
        const healAmount = Math.min(
          combatant.animal.passive.effect.regen,
          combatant.maxHP - combatant.currentHP
        );
        combatant.currentHP += healAmount;
        regenHealing = healAmount;
      }

      // Legacy fallback: stat_conditional regen
      if (combatant.animal.passive.type === 'stat_conditional' &&
          combatant.animal.passive.trigger?.hpBelow &&
          combatant.animal.passive.effect.regen) {
        const threshold = combatant.maxHP * (combatant.animal.passive.trigger.hpBelow / 100);
        if (combatant.currentHP < threshold) {
          const healAmount = Math.min(
            combatant.animal.passive.effect.regen,
            combatant.maxHP - combatant.currentHP
          );
          combatant.currentHP += healAmount;
          regenHealing += healAmount;
        }
      }
    }

    // Apply regen status
    const statusRegen = this.statusManager.getRegenAmount(combatant.statuses);
    if (statusRegen > 0) {
      const healAmount = Math.min(statusRegen, combatant.maxHP - combatant.currentHP);
      combatant.currentHP += healAmount;
      regenHealing += healAmount;
    }

    // Apply DoT damage
    dotDamage = this.statusManager.calculateDotDamage(combatant.statuses);
    combatant.currentHP -= dotDamage;

    // Tick status durations
    this.statusManager.tickStatuses(combatant.statuses);

    return {
      type: 'turn_end',
      combatant: combatant.animal.name,
      dotDamage,
      regenHealing,
    };
  }
```

**Step 2: Run existing tests**

Run: `npm run test -- src/systems/CombatSystem.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/systems/CombatSystem.ts
git commit -m "refactor: integrate PassiveResolver into executeTurnEnd"
```

---

## Task 15: Add CombatSystem tests with PassiveResolver

**Parallel:** no
**Blocked by:** Task 14
**Owned files:** `src/systems/CombatSystem.test.ts`

**Files:**
- Modify: `src/systems/CombatSystem.test.ts`

**Step 1: Add new describe block for registry-based tests**

Add imports at the top:

```typescript
import { PassiveResolver, createDefaultRegistry } from './passives';
```

Add new describe block after existing tests:

```typescript
describe('CombatSystem with PassiveResolver', () => {
  let diceRoller: DiceRoller;
  let statusManager: StatusManager;
  let passiveResolver: PassiveResolver;
  let combatSystem: CombatSystem;

  beforeEach(() => {
    diceRoller = new DiceRoller();
    statusManager = new StatusManager();
    passiveResolver = new PassiveResolver(createDefaultRegistry());
    combatSystem = new CombatSystem(diceRoller, statusManager, passiveResolver);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should apply oswald keen eye armor via registry', () => {
    const oswald = createCombatant('oswald');
    expect(combatSystem.getEffectiveArmor(oswald)).toBe(10); // 8 base + 2 from Keen Eye
  });

  it('should apply pang frost aura debuff via registry', () => {
    const pang = createCombatant('pang');
    const enemy = createCombatant('beep-boop');
    expect(combatSystem.getEffectiveAttackMod(enemy, pang)).toBe(2); // 3 - 1 from Frost Aura
  });

  it('should apply beep-boop damage reduction via registry', () => {
    const beepBoop = createCombatant('beep-boop');
    expect(combatSystem.getDamageReduction(beepBoop)).toBe(1);
  });

  it('should apply humphrey per-turn regen via registry', () => {
    const humphrey = createCombatant('humphrey');
    humphrey.currentHP = 25;

    const event = combatSystem.executeTurnEnd(humphrey);

    expect(event.regenHealing).toBe(1);
    expect(humphrey.currentHP).toBe(26);
  });

  it('should apply moo-man conditional regen via registry', () => {
    const mooMan = createCombatant('moo-man');
    mooMan.currentHP = 10; // Below 50%

    const event = combatSystem.executeTurnEnd(mooMan);

    expect(event.regenHealing).toBe(2);
    expect(mooMan.currentHP).toBe(12);
  });

  it('should apply esmeralda dodge via registry', () => {
    vi.spyOn(diceRoller, 'rollD20').mockReturnValue(20);
    vi.spyOn(diceRoller, 'checkProc').mockReturnValue(true);

    const attacker = createCombatant('humphrey');
    const esmeralda = createCombatant('esmeralda');

    const event = combatSystem.executeAttack(attacker, esmeralda);

    expect(event.dodged).toBe(true);
    expect(event.hit).toBe(false);
  });
});
```

**Step 2: Run all tests**

Run: `npm run test -- src/systems/CombatSystem.test.ts`
Expected: PASS (all tests including new registry-based tests)

**Step 3: Commit**

```bash
git add src/systems/CombatSystem.test.ts
git commit -m "test: add CombatSystem tests using PassiveResolver"
```

---

## Task 16: Update Systems Index Export

**Parallel:** no
**Blocked by:** Task 15
**Owned files:** `src/systems/index.ts`

**Files:**
- Modify: `src/systems/index.ts`

**Step 1: Add passives export**

Add to `src/systems/index.ts`:

```typescript
export * from './passives';
```

**Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/systems/index.ts
git commit -m "chore: export passives from systems index"
```

---

## Task 17: Run Full Test Suite

**Parallel:** no
**Blocked by:** Task 16
**Owned files:** none

**Files:**
- None (verification only)

**Step 1: Run all tests**

Run: `npm run test`
Expected: All tests pass

**Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Run linter (if configured)**

Run: `npm run lint` (if available)
Expected: No errors

---

## Summary

This refactor creates a clean registry pattern for passive abilities:

1. **Types** (`src/systems/passives/types.ts`) - Define handler interfaces
2. **Registry** (`src/systems/passives/PassiveRegistry.ts`) - Maps passive types to handlers
3. **Handlers** (`src/systems/passives/handlers/`) - Individual handler functions per passive type
4. **Resolver** (`src/systems/passives/PassiveResolver.ts`) - Aggregates handler results
5. **Integration** - CombatSystem uses PassiveResolver with legacy fallback

Benefits:
- New passive types can be added by creating a handler and registering it
- Passive logic is testable in isolation
- Clear separation of concerns
- Backwards compatible (legacy fallback when no resolver provided)

---

**Plan complete and saved to `docs/plans/2026-02-01-passive-registry-refactor.md`. Two execution options:**

**1. Execute Now (this session)** - I spawn `plan-executor` agent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session in worktree, spawn `plan-executor` agent, batch execution with checkpoints

**3. Parallel Tickets** - Mark tasks with Parallel/Blocked by/Owned files, create worktrees, run `/ticket-builder` per task, review diffs before merge

**Which approach?**
