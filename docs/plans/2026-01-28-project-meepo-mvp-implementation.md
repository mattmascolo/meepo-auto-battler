# Project Meepo Auto Battler — MVP Implementation Plan

> **For Claude:** Spawn `plan-executor` agent to implement this plan task-by-task.

**Goal:** Build a fully playable browser-based PvE autobattler with 5 animals, 5 weapons, 5 accessories, 3 CPU opponents, and draft phases between fights.

**Architecture:** Phaser 3 game engine with TypeScript. Scene-based flow (Menu → Loadout → Battle → Draft → Result). Combat system uses d20 + modifier vs armor, with status effects ticking per turn. State persists across the 3-fight gauntlet.

**Tech Stack:** Phaser 3, TypeScript, Vite, vitest for testing

---

## Phase 0: Project Scaffolding

### Task 0.1: Initialize Vite + TypeScript Project

**Parallel:** no
**Blocked by:** none
**Owned files:** `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts`

**Step 1: Initialize npm project**

Run: `npm init -y`

**Step 2: Install dependencies**

Run: `npm install phaser`
Run: `npm install -D typescript vite vitest @types/node`

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

**Step 4: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
  },
});
```

**Step 5: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Project Meepo - Auto Battler</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        background: #1a1a2e;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }
      #game-container {
        border: 2px solid #4a4a6a;
        border-radius: 8px;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <div id="game-container"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

**Step 6: Create minimal src/main.ts**

```typescript
import Phaser from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scene: [],
};

new Phaser.Game(config);

console.log('Project Meepo initialized');
```

**Step 7: Add npm scripts to package.json**

Update `package.json` scripts section:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "typecheck": "tsc --noEmit"
  }
}
```

**Step 8: Verify setup**

Run: `npm run typecheck`
Expected: Exit 0, no errors

Run: `npm run dev` (check browser opens, then Ctrl+C)
Expected: Console shows "Project Meepo initialized"

**Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html src/main.ts
git commit -m "chore: initialize Vite + TypeScript + Phaser 3 project"
```

---

### Task 0.2: Create Directory Structure and CLAUDE.md

**Parallel:** no
**Blocked by:** Task 0.1
**Owned files:** `CLAUDE.md`, `src/scenes/.gitkeep`, `src/entities/.gitkeep`, `src/data/.gitkeep`, `src/systems/.gitkeep`, `src/ui/.gitkeep`, `src/types.ts`

**Files:**
- Create: `CLAUDE.md`
- Create: `src/scenes/.gitkeep`
- Create: `src/entities/.gitkeep`
- Create: `src/data/.gitkeep`
- Create: `src/systems/.gitkeep`
- Create: `src/ui/.gitkeep`
- Create: `src/types.ts`
- Create: `assets/sprites/.gitkeep`

**Step 1: Create directory structure**

Run:
```bash
mkdir -p src/scenes src/entities src/data src/systems src/ui assets/sprites
touch src/scenes/.gitkeep src/entities/.gitkeep src/data/.gitkeep src/systems/.gitkeep src/ui/.gitkeep assets/sprites/.gitkeep
```

**Step 2: Create src/types.ts with core type definitions**

```typescript
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
```

**Step 3: Create CLAUDE.md**

```markdown
# Project Meepo Auto Battler

Browser-based PvE autobattler with D&D-inspired dice combat.

## Quick Start

```bash
npm install
npm run dev      # Start dev server at http://localhost:3000
npm run test     # Run tests
npm run typecheck # Type check
```

## Project Structure

```
/src
  /scenes       - Phaser scenes (Menu, Loadout, Battle, Draft, Result)
  /entities     - Game entity classes
  /data         - Static data (animals, weapons, accessories, CPU loadouts)
  /systems      - Game systems (CombatSystem, DiceRoller, StatusManager)
  /ui           - UI components (HealthBar, StatusIcons, DamageNumbers)
  /types.ts     - TypeScript type definitions
  main.ts       - Phaser config and scene registration
/assets
  /sprites      - Animal, weapon, accessory, and effect sprites
/docs
  /plans        - Design docs and implementation plans
```

## Testing

```bash
npm run test           # Run all tests
npm run test -- --ui   # Run with UI
```

## Game Design Reference

See `/docs/plans/2026-01-28-project-meepo-design.md` for full game design document.

## Combat Formula

```
To-Hit: d20 + AttackMod >= Armor = Hit
Damage: WeaponDamage - DamageReduction = FinalDamage (min 0)
```

## Scene Flow

```
MenuScene → LoadoutScene → BattleScene → DraftScene → BattleScene → DraftScene → BattleScene → ResultScene
```
```

**Step 4: Commit**

```bash
git add CLAUDE.md src/types.ts src/scenes/.gitkeep src/entities/.gitkeep src/data/.gitkeep src/systems/.gitkeep src/ui/.gitkeep assets/sprites/.gitkeep
git commit -m "chore: add directory structure, types, and CLAUDE.md"
```

---

## Phase 1: Core Data Layer

### Task 1.1: Implement Animal Definitions

**Parallel:** no
**Blocked by:** Task 0.2
**Owned files:** `src/data/animals.ts`, `src/data/animals.test.ts`

**Files:**
- Create: `src/data/animals.ts`
- Create: `src/data/animals.test.ts`

**Step 1: Write the failing test**

Create `src/data/animals.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ANIMALS, getAnimalById } from './animals';

describe('animals data', () => {
  it('should have exactly 5 animals', () => {
    expect(ANIMALS.length).toBe(5);
  });

  it('should include all MVP animals', () => {
    const ids = ANIMALS.map(a => a.id);
    expect(ids).toContain('rat');
    expect(ids).toContain('toad');
    expect(ids).toContain('spider');
    expect(ids).toContain('mosquito');
    expect(ids).toContain('beetle');
  });

  it('should retrieve rat by id', () => {
    const rat = getAnimalById('rat');
    expect(rat).toBeDefined();
    expect(rat?.name).toBe('Rat');
    expect(rat?.stats.hp).toBe(20);
    expect(rat?.stats.attackMod).toBe(3);
    expect(rat?.stats.armor).toBe(10);
  });

  it('should have valid unarmed attacks', () => {
    for (const animal of ANIMALS) {
      expect(animal.unarmedAttack.name).toBeTruthy();
      expect(animal.unarmedAttack.damage).toBeGreaterThanOrEqual(0);
    }
  });

  it('should have valid passives', () => {
    for (const animal of ANIMALS) {
      expect(animal.passive.name).toBeTruthy();
      expect(animal.passive.description).toBeTruthy();
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/data/animals.test.ts`
Expected: FAIL - Cannot find module './animals'

**Step 3: Write implementation**

Create `src/data/animals.ts`:

```typescript
import type { Animal } from '../types';

export const ANIMALS: Animal[] = [
  {
    id: 'rat',
    name: 'Rat',
    stats: { hp: 20, attackMod: 3, armor: 10 },
    unarmedAttack: {
      name: 'Bite',
      damage: 4,
    },
    passive: {
      name: 'Scrappy',
      description: '+2 Atk Mod when below 50% HP',
      type: 'stat_conditional',
      trigger: { hpBelow: 50 },
      effect: { attackMod: 2 },
    },
  },
  {
    id: 'toad',
    name: 'Toad',
    stats: { hp: 28, attackMod: 1, armor: 11 },
    unarmedAttack: {
      name: 'Tongue Whip',
      damage: 3,
      effectChance: 30,
      effectType: 'weaken',
      effectValue: 2,
    },
    passive: {
      name: 'Thick Skin',
      description: 'Regen 1 HP per turn',
      type: 'per_turn',
      effect: { regen: 1 },
    },
  },
  {
    id: 'spider',
    name: 'Spider',
    stats: { hp: 16, attackMod: 4, armor: 9 },
    unarmedAttack: {
      name: 'Venomous Bite',
      damage: 3,
      effectChance: 40,
      effectType: 'poison',
      effectValue: 2,
    },
    passive: {
      name: 'Web Trap',
      description: 'Enemies have -1 Atk Mod',
      type: 'stat_flat',
      effect: { enemyAttackMod: -1 },
    },
  },
  {
    id: 'mosquito',
    name: 'Mosquito',
    stats: { hp: 12, attackMod: 5, armor: 8 },
    unarmedAttack: {
      name: 'Blood Drain',
      damage: 2,
      healOnHit: 2,
    },
    passive: {
      name: 'Evasive',
      description: '20% chance to dodge attacks',
      type: 'on_attacked',
      effect: { dodgeChance: 20 },
    },
  },
  {
    id: 'beetle',
    name: 'Beetle',
    stats: { hp: 24, attackMod: 0, armor: 14 },
    unarmedAttack: {
      name: 'Horn Ram',
      damage: 5,
    },
    passive: {
      name: 'Hard Shell',
      description: 'Take -1 damage from all hits',
      type: 'on_attacked',
      effect: { damageReduction: 1 },
    },
  },
];

export function getAnimalById(id: string): Animal | undefined {
  return ANIMALS.find(a => a.id === id);
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/data/animals.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/data/animals.ts src/data/animals.test.ts
git commit -m "feat: add animal definitions data"
```

---

### Task 1.2: Implement Weapon Definitions

**Parallel:** yes
**Blocked by:** Task 0.2
**Owned files:** `src/data/weapons.ts`, `src/data/weapons.test.ts`

**Files:**
- Create: `src/data/weapons.ts`
- Create: `src/data/weapons.test.ts`

**Step 1: Write the failing test**

Create `src/data/weapons.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { WEAPONS, getWeaponById } from './weapons';

describe('weapons data', () => {
  it('should have exactly 5 weapons', () => {
    expect(WEAPONS.length).toBe(5);
  });

  it('should include all MVP weapons', () => {
    const ids = WEAPONS.map(w => w.id);
    expect(ids).toContain('rusty-dagger');
    expect(ids).toContain('flame-stick');
    expect(ids).toContain('venom-fang');
    expect(ids).toContain('heavy-rock');
    expect(ids).toContain('sapping-thorn');
  });

  it('should retrieve rusty dagger by id', () => {
    const dagger = getWeaponById('rusty-dagger');
    expect(dagger).toBeDefined();
    expect(dagger?.name).toBe('Rusty Dagger');
    expect(dagger?.damage).toBe(5);
  });

  it('should have flame stick with burn effect', () => {
    const flame = getWeaponById('flame-stick');
    expect(flame?.effectChance).toBe(40);
    expect(flame?.effectType).toBe('burn');
  });

  it('should have heavy rock with attack penalty', () => {
    const rock = getWeaponById('heavy-rock');
    expect(rock?.attackModModifier).toBe(-1);
    expect(rock?.damage).toBe(7);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/data/weapons.test.ts`
Expected: FAIL - Cannot find module './weapons'

**Step 3: Write implementation**

Create `src/data/weapons.ts`:

```typescript
import type { Weapon } from '../types';

export const WEAPONS: Weapon[] = [
  {
    id: 'rusty-dagger',
    name: 'Rusty Dagger',
    damage: 5,
  },
  {
    id: 'flame-stick',
    name: 'Flame Stick',
    damage: 4,
    effectChance: 40,
    effectType: 'burn',
    effectValue: 2,
  },
  {
    id: 'venom-fang',
    name: 'Venom Fang',
    damage: 4,
    effectChance: 40,
    effectType: 'poison',
    effectValue: 2,
  },
  {
    id: 'heavy-rock',
    name: 'Heavy Rock',
    damage: 7,
    attackModModifier: -1,
  },
  {
    id: 'sapping-thorn',
    name: 'Sapping Thorn',
    damage: 3,
    healOnHit: 2,
  },
];

export function getWeaponById(id: string): Weapon | undefined {
  return WEAPONS.find(w => w.id === id);
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/data/weapons.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/data/weapons.ts src/data/weapons.test.ts
git commit -m "feat: add weapon definitions data"
```

---

### Task 1.3: Implement Accessory Definitions

**Parallel:** yes
**Blocked by:** Task 0.2
**Owned files:** `src/data/accessories.ts`, `src/data/accessories.test.ts`

**Files:**
- Create: `src/data/accessories.ts`
- Create: `src/data/accessories.test.ts`

**Step 1: Write the failing test**

Create `src/data/accessories.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ACCESSORIES, getAccessoryById } from './accessories';

describe('accessories data', () => {
  it('should have exactly 5 accessories', () => {
    expect(ACCESSORIES.length).toBe(5);
  });

  it('should include all MVP accessories', () => {
    const ids = ACCESSORIES.map(a => a.id);
    expect(ids).toContain('iron-acorn');
    expect(ids).toContain('lucky-pebble');
    expect(ids).toContain('spiked-collar');
    expect(ids).toContain('adrenaline-gland');
    expect(ids).toContain('ember-charm');
  });

  it('should retrieve iron acorn by id', () => {
    const acorn = getAccessoryById('iron-acorn');
    expect(acorn).toBeDefined();
    expect(acorn?.name).toBe('Iron Acorn');
    expect(acorn?.type).toBe('stat');
    expect(acorn?.effect.hp).toBe(4);
  });

  it('should have adrenaline gland with conditional effect', () => {
    const gland = getAccessoryById('adrenaline-gland');
    expect(gland?.type).toBe('reactive');
    expect(gland?.effect.attackModWhenLow).toBe(3);
    expect(gland?.effect.lowHpThreshold).toBe(25);
  });

  it('should have ember charm with burn chance', () => {
    const charm = getAccessoryById('ember-charm');
    expect(charm?.type).toBe('buff');
    expect(charm?.effect.burnChance).toBe(20);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/data/accessories.test.ts`
Expected: FAIL - Cannot find module './accessories'

**Step 3: Write implementation**

Create `src/data/accessories.ts`:

```typescript
import type { Accessory } from '../types';

export const ACCESSORIES: Accessory[] = [
  {
    id: 'iron-acorn',
    name: 'Iron Acorn',
    type: 'stat',
    effect: { hp: 4 },
  },
  {
    id: 'lucky-pebble',
    name: 'Lucky Pebble',
    type: 'stat',
    effect: { attackMod: 1 },
  },
  {
    id: 'spiked-collar',
    name: 'Spiked Collar',
    type: 'reactive',
    effect: { damageOnHit: 2 },
  },
  {
    id: 'adrenaline-gland',
    name: 'Adrenaline Gland',
    type: 'reactive',
    effect: { attackModWhenLow: 3, lowHpThreshold: 25 },
  },
  {
    id: 'ember-charm',
    name: 'Ember Charm',
    type: 'buff',
    effect: { burnChance: 20 },
  },
];

export function getAccessoryById(id: string): Accessory | undefined {
  return ACCESSORIES.find(a => a.id === id);
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/data/accessories.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/data/accessories.ts src/data/accessories.test.ts
git commit -m "feat: add accessory definitions data"
```

---

### Task 1.4: Implement CPU Loadout Definitions

**Parallel:** no
**Blocked by:** Task 1.1, Task 1.2, Task 1.3
**Owned files:** `src/data/cpu-loadouts.ts`, `src/data/cpu-loadouts.test.ts`

**Files:**
- Create: `src/data/cpu-loadouts.ts`
- Create: `src/data/cpu-loadouts.test.ts`

**Step 1: Write the failing test**

Create `src/data/cpu-loadouts.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { CPU_LOADOUTS, getCPULoadout } from './cpu-loadouts';

describe('CPU loadouts', () => {
  it('should have exactly 3 CPU loadouts', () => {
    expect(CPU_LOADOUTS.length).toBe(3);
  });

  it('should return CPU 1 (easy) with beetle + rusty dagger + iron acorn', () => {
    const cpu1 = getCPULoadout(1);
    expect(cpu1.animal.id).toBe('beetle');
    expect(cpu1.weapon.id).toBe('rusty-dagger');
    expect(cpu1.accessory.id).toBe('iron-acorn');
  });

  it('should return CPU 2 (medium) with rat + flame stick + lucky pebble', () => {
    const cpu2 = getCPULoadout(2);
    expect(cpu2.animal.id).toBe('rat');
    expect(cpu2.weapon.id).toBe('flame-stick');
    expect(cpu2.accessory.id).toBe('lucky-pebble');
  });

  it('should return CPU 3 (hard) with spider + venom fang + adrenaline gland', () => {
    const cpu3 = getCPULoadout(3);
    expect(cpu3.animal.id).toBe('spider');
    expect(cpu3.weapon.id).toBe('venom-fang');
    expect(cpu3.accessory.id).toBe('adrenaline-gland');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/data/cpu-loadouts.test.ts`
Expected: FAIL - Cannot find module './cpu-loadouts'

**Step 3: Write implementation**

Create `src/data/cpu-loadouts.ts`:

```typescript
import type { CPULoadout } from '../types';
import { getAnimalById } from './animals';
import { getWeaponById } from './weapons';
import { getAccessoryById } from './accessories';

export const CPU_LOADOUTS: CPULoadout[] = [
  {
    animal: getAnimalById('beetle')!,
    weapon: getWeaponById('rusty-dagger')!,
    accessory: getAccessoryById('iron-acorn')!,
  },
  {
    animal: getAnimalById('rat')!,
    weapon: getWeaponById('flame-stick')!,
    accessory: getAccessoryById('lucky-pebble')!,
  },
  {
    animal: getAnimalById('spider')!,
    weapon: getWeaponById('venom-fang')!,
    accessory: getAccessoryById('adrenaline-gland')!,
  },
];

export function getCPULoadout(cpuNumber: 1 | 2 | 3): CPULoadout {
  return CPU_LOADOUTS[cpuNumber - 1];
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/data/cpu-loadouts.test.ts`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/data/cpu-loadouts.ts src/data/cpu-loadouts.test.ts
git commit -m "feat: add CPU loadout definitions"
```

---

### Task 1.5: Create Data Index Export

**Parallel:** no
**Blocked by:** Task 1.4
**Owned files:** `src/data/index.ts`

**Files:**
- Create: `src/data/index.ts`

**Step 1: Create barrel export**

Create `src/data/index.ts`:

```typescript
export { ANIMALS, getAnimalById } from './animals';
export { WEAPONS, getWeaponById } from './weapons';
export { ACCESSORIES, getAccessoryById } from './accessories';
export { CPU_LOADOUTS, getCPULoadout } from './cpu-loadouts';
```

**Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: Exit 0

**Step 3: Commit**

```bash
git add src/data/index.ts
git commit -m "chore: add data barrel export"
```

---

## Phase 2: Core Systems

### Task 2.1: Implement Dice Roller System

**Parallel:** no
**Blocked by:** Task 0.2
**Owned files:** `src/systems/DiceRoller.ts`, `src/systems/DiceRoller.test.ts`

**Files:**
- Create: `src/systems/DiceRoller.ts`
- Create: `src/systems/DiceRoller.test.ts`

**Step 1: Write the failing test**

Create `src/systems/DiceRoller.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DiceRoller } from './DiceRoller';

describe('DiceRoller', () => {
  describe('rollD20', () => {
    it('should return a number between 1 and 20', () => {
      const roller = new DiceRoller();
      for (let i = 0; i < 100; i++) {
        const result = roller.rollD20();
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(20);
      }
    });
  });

  describe('rollAttack', () => {
    it('should return roll + modifier', () => {
      const roller = new DiceRoller();
      vi.spyOn(roller, 'rollD20').mockReturnValue(10);

      const result = roller.rollAttack(3);
      expect(result.roll).toBe(10);
      expect(result.modifier).toBe(3);
      expect(result.total).toBe(13);
    });

    it('should handle negative modifiers', () => {
      const roller = new DiceRoller();
      vi.spyOn(roller, 'rollD20').mockReturnValue(15);

      const result = roller.rollAttack(-2);
      expect(result.total).toBe(13);
    });
  });

  describe('checkHit', () => {
    it('should return true when total >= armor', () => {
      const roller = new DiceRoller();
      expect(roller.checkHit(15, 10)).toBe(true);
      expect(roller.checkHit(10, 10)).toBe(true);
    });

    it('should return false when total < armor', () => {
      const roller = new DiceRoller();
      expect(roller.checkHit(9, 10)).toBe(false);
    });
  });

  describe('rollChance', () => {
    it('should return true when roll <= chance', () => {
      const roller = new DiceRoller();
      vi.spyOn(Math, 'random').mockReturnValue(0.29); // 30% roll
      expect(roller.rollChance(40)).toBe(true);
    });

    it('should return false when roll > chance', () => {
      const roller = new DiceRoller();
      vi.spyOn(Math, 'random').mockReturnValue(0.5); // 51% roll
      expect(roller.rollChance(40)).toBe(false);
    });
  });

  describe('coinFlip', () => {
    it('should return true or false', () => {
      const roller = new DiceRoller();
      const results = new Set<boolean>();
      for (let i = 0; i < 100; i++) {
        results.add(roller.coinFlip());
      }
      expect(results.has(true)).toBe(true);
      expect(results.has(false)).toBe(true);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/systems/DiceRoller.test.ts`
Expected: FAIL - Cannot find module './DiceRoller'

**Step 3: Write implementation**

Create `src/systems/DiceRoller.ts`:

```typescript
export interface AttackRoll {
  roll: number;
  modifier: number;
  total: number;
}

export class DiceRoller {
  rollD20(): number {
    return Math.floor(Math.random() * 20) + 1;
  }

  rollAttack(modifier: number): AttackRoll {
    const roll = this.rollD20();
    return {
      roll,
      modifier,
      total: roll + modifier,
    };
  }

  checkHit(total: number, armor: number): boolean {
    return total >= armor;
  }

  rollChance(percentage: number): boolean {
    return Math.random() * 100 < percentage;
  }

  coinFlip(): boolean {
    return Math.random() < 0.5;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/systems/DiceRoller.test.ts`
Expected: PASS (7 tests)

**Step 5: Commit**

```bash
git add src/systems/DiceRoller.ts src/systems/DiceRoller.test.ts
git commit -m "feat: add DiceRoller system"
```

---

### Task 2.2: Implement Status Manager System

**Parallel:** yes
**Blocked by:** Task 0.2
**Owned files:** `src/systems/StatusManager.ts`, `src/systems/StatusManager.test.ts`

**Files:**
- Create: `src/systems/StatusManager.ts`
- Create: `src/systems/StatusManager.test.ts`

**Step 1: Write the failing test**

Create `src/systems/StatusManager.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { StatusManager } from './StatusManager';
import type { StatusEffect, Combatant, Animal, Weapon, Accessory } from '../types';

function createTestCombatant(overrides?: Partial<Combatant>): Combatant {
  const animal: Animal = {
    id: 'test',
    name: 'Test Animal',
    stats: { hp: 20, attackMod: 0, armor: 10 },
    unarmedAttack: { name: 'Test', damage: 1 },
    passive: { name: 'None', description: '', type: 'stat_flat', effect: {} },
  };
  return {
    animal,
    weapon: null,
    accessory: null,
    currentHP: 20,
    maxHP: 20,
    statuses: [],
    ...overrides,
  };
}

describe('StatusManager', () => {
  describe('applyStatus', () => {
    it('should add a new status effect', () => {
      const manager = new StatusManager();
      const combatant = createTestCombatant();

      manager.applyStatus(combatant, 'burn', 2, 3);

      expect(combatant.statuses.length).toBe(1);
      expect(combatant.statuses[0]).toEqual({ type: 'burn', value: 2, duration: 3 });
    });

    it('should stack different status types', () => {
      const manager = new StatusManager();
      const combatant = createTestCombatant();

      manager.applyStatus(combatant, 'burn', 2, 3);
      manager.applyStatus(combatant, 'poison', 2, 3);

      expect(combatant.statuses.length).toBe(2);
    });

    it('should refresh duration on same status type', () => {
      const manager = new StatusManager();
      const combatant = createTestCombatant();

      manager.applyStatus(combatant, 'burn', 2, 2);
      manager.applyStatus(combatant, 'burn', 2, 3);

      expect(combatant.statuses.length).toBe(1);
      expect(combatant.statuses[0].duration).toBe(3);
    });
  });

  describe('tickStatuses', () => {
    it('should apply burn damage', () => {
      const manager = new StatusManager();
      const combatant = createTestCombatant({ currentHP: 20 });
      combatant.statuses = [{ type: 'burn', value: 2, duration: 3 }];

      const result = manager.tickStatuses(combatant);

      expect(combatant.currentHP).toBe(18);
      expect(result.damage).toBe(2);
    });

    it('should apply poison damage', () => {
      const manager = new StatusManager();
      const combatant = createTestCombatant({ currentHP: 20 });
      combatant.statuses = [{ type: 'poison', value: 3, duration: 2 }];

      const result = manager.tickStatuses(combatant);

      expect(combatant.currentHP).toBe(17);
      expect(result.damage).toBe(3);
    });

    it('should apply regen healing', () => {
      const manager = new StatusManager();
      const combatant = createTestCombatant({ currentHP: 15, maxHP: 20 });
      combatant.statuses = [{ type: 'regen', value: 2, duration: 3 }];

      const result = manager.tickStatuses(combatant);

      expect(combatant.currentHP).toBe(17);
      expect(result.healing).toBe(2);
    });

    it('should not overheal past maxHP', () => {
      const manager = new StatusManager();
      const combatant = createTestCombatant({ currentHP: 19, maxHP: 20 });
      combatant.statuses = [{ type: 'regen', value: 5, duration: 3 }];

      manager.tickStatuses(combatant);

      expect(combatant.currentHP).toBe(20);
    });

    it('should decrement duration and remove expired statuses', () => {
      const manager = new StatusManager();
      const combatant = createTestCombatant();
      combatant.statuses = [{ type: 'burn', value: 2, duration: 1 }];

      manager.tickStatuses(combatant);

      expect(combatant.statuses.length).toBe(0);
    });

    it('should stack damage from multiple DoTs', () => {
      const manager = new StatusManager();
      const combatant = createTestCombatant({ currentHP: 20 });
      combatant.statuses = [
        { type: 'burn', value: 2, duration: 3 },
        { type: 'poison', value: 2, duration: 3 },
      ];

      const result = manager.tickStatuses(combatant);

      expect(combatant.currentHP).toBe(16);
      expect(result.damage).toBe(4);
    });
  });

  describe('getWeakenModifier', () => {
    it('should return -2 when weakened', () => {
      const manager = new StatusManager();
      const combatant = createTestCombatant();
      combatant.statuses = [{ type: 'weaken', value: 2, duration: 2 }];

      expect(manager.getWeakenModifier(combatant)).toBe(-2);
    });

    it('should return 0 when not weakened', () => {
      const manager = new StatusManager();
      const combatant = createTestCombatant();

      expect(manager.getWeakenModifier(combatant)).toBe(0);
    });
  });

  describe('hasStatus', () => {
    it('should return true if status exists', () => {
      const manager = new StatusManager();
      const combatant = createTestCombatant();
      combatant.statuses = [{ type: 'burn', value: 2, duration: 3 }];

      expect(manager.hasStatus(combatant, 'burn')).toBe(true);
    });

    it('should return false if status does not exist', () => {
      const manager = new StatusManager();
      const combatant = createTestCombatant();

      expect(manager.hasStatus(combatant, 'burn')).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/systems/StatusManager.test.ts`
Expected: FAIL - Cannot find module './StatusManager'

**Step 3: Write implementation**

Create `src/systems/StatusManager.ts`:

```typescript
import type { Combatant, StatusType, StatusEffect } from '../types';

export interface StatusTickResult {
  damage: number;
  healing: number;
  expiredStatuses: StatusType[];
}

export class StatusManager {
  applyStatus(combatant: Combatant, type: StatusType, value: number, duration: number): void {
    const existing = combatant.statuses.find(s => s.type === type);
    if (existing) {
      existing.duration = Math.max(existing.duration, duration);
      existing.value = value;
    } else {
      combatant.statuses.push({ type, value, duration });
    }
  }

  tickStatuses(combatant: Combatant): StatusTickResult {
    const result: StatusTickResult = {
      damage: 0,
      healing: 0,
      expiredStatuses: [],
    };

    for (const status of combatant.statuses) {
      switch (status.type) {
        case 'burn':
        case 'poison':
          result.damage += status.value;
          combatant.currentHP -= status.value;
          break;
        case 'regen':
          const healAmount = Math.min(status.value, combatant.maxHP - combatant.currentHP);
          result.healing += healAmount;
          combatant.currentHP += healAmount;
          break;
        case 'weaken':
          // Weaken is checked separately, no tick effect
          break;
      }

      status.duration--;
      if (status.duration <= 0) {
        result.expiredStatuses.push(status.type);
      }
    }

    combatant.statuses = combatant.statuses.filter(s => s.duration > 0);

    return result;
  }

  getWeakenModifier(combatant: Combatant): number {
    const weaken = combatant.statuses.find(s => s.type === 'weaken');
    return weaken ? -weaken.value : 0;
  }

  hasStatus(combatant: Combatant, type: StatusType): boolean {
    return combatant.statuses.some(s => s.type === type);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/systems/StatusManager.test.ts`
Expected: PASS (11 tests)

**Step 5: Commit**

```bash
git add src/systems/StatusManager.ts src/systems/StatusManager.test.ts
git commit -m "feat: add StatusManager system"
```

---

### Task 2.3: Implement Combat System

**Parallel:** no
**Blocked by:** Task 2.1, Task 2.2, Task 1.5
**Owned files:** `src/systems/CombatSystem.ts`, `src/systems/CombatSystem.test.ts`

**Files:**
- Create: `src/systems/CombatSystem.ts`
- Create: `src/systems/CombatSystem.test.ts`

**Step 1: Write the failing test**

Create `src/systems/CombatSystem.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CombatSystem, CombatEvent } from './CombatSystem';
import { DiceRoller } from './DiceRoller';
import { StatusManager } from './StatusManager';
import type { Combatant, Animal, Weapon, Accessory } from '../types';
import { getAnimalById } from '../data/animals';
import { getWeaponById } from '../data/weapons';
import { getAccessoryById } from '../data/accessories';

function createCombatant(animalId: string, weaponId?: string, accessoryId?: string): Combatant {
  const animal = getAnimalById(animalId)!;
  const weapon = weaponId ? getWeaponById(weaponId) ?? null : null;
  const accessory = accessoryId ? getAccessoryById(accessoryId) ?? null : null;
  const bonusHP = accessory?.effect.hp ?? 0;

  return {
    animal,
    weapon,
    accessory,
    currentHP: animal.stats.hp + bonusHP,
    maxHP: animal.stats.hp + bonusHP,
    statuses: [],
  };
}

describe('CombatSystem', () => {
  let diceRoller: DiceRoller;
  let statusManager: StatusManager;
  let combatSystem: CombatSystem;

  beforeEach(() => {
    diceRoller = new DiceRoller();
    statusManager = new StatusManager();
    combatSystem = new CombatSystem(diceRoller, statusManager);
  });

  describe('getEffectiveAttackMod', () => {
    it('should return base attack mod', () => {
      const rat = createCombatant('rat');
      expect(combatSystem.getEffectiveAttackMod(rat, null)).toBe(3);
    });

    it('should add weapon attack modifier', () => {
      const rat = createCombatant('rat', 'heavy-rock');
      expect(combatSystem.getEffectiveAttackMod(rat, null)).toBe(2); // 3 - 1
    });

    it('should add accessory attack mod', () => {
      const rat = createCombatant('rat', undefined, 'lucky-pebble');
      expect(combatSystem.getEffectiveAttackMod(rat, null)).toBe(4); // 3 + 1
    });

    it('should apply scrappy passive when below 50% HP', () => {
      const rat = createCombatant('rat');
      rat.currentHP = 9; // Below 50% of 20
      expect(combatSystem.getEffectiveAttackMod(rat, null)).toBe(5); // 3 + 2
    });

    it('should apply weaken status', () => {
      const rat = createCombatant('rat');
      rat.statuses = [{ type: 'weaken', value: 2, duration: 2 }];
      expect(combatSystem.getEffectiveAttackMod(rat, null)).toBe(1); // 3 - 2
    });

    it('should apply adrenaline gland when below 25% HP', () => {
      const rat = createCombatant('rat', undefined, 'adrenaline-gland');
      rat.currentHP = 4; // Below 25% of 20
      expect(combatSystem.getEffectiveAttackMod(rat, null)).toBe(6); // 3 + 3
    });

    it('should apply spider web trap debuff to enemy', () => {
      const spider = createCombatant('spider');
      const rat = createCombatant('rat');
      expect(combatSystem.getEffectiveAttackMod(rat, spider)).toBe(2); // 3 - 1
    });
  });

  describe('getEffectiveArmor', () => {
    it('should return base armor', () => {
      const beetle = createCombatant('beetle');
      expect(combatSystem.getEffectiveArmor(beetle)).toBe(14);
    });
  });

  describe('getDamageReduction', () => {
    it('should return 0 for no passive', () => {
      const rat = createCombatant('rat');
      expect(combatSystem.getDamageReduction(rat)).toBe(0);
    });

    it('should return 1 for beetle hard shell', () => {
      const beetle = createCombatant('beetle');
      expect(combatSystem.getDamageReduction(beetle)).toBe(1);
    });
  });

  describe('getAttackDamage', () => {
    it('should return weapon damage when equipped', () => {
      const rat = createCombatant('rat', 'rusty-dagger');
      expect(combatSystem.getAttackDamage(rat)).toBe(5);
    });

    it('should return unarmed attack damage when no weapon', () => {
      const rat = createCombatant('rat');
      expect(combatSystem.getAttackDamage(rat)).toBe(4); // Bite
    });
  });

  describe('executeAttack', () => {
    it('should return hit event when roll succeeds', () => {
      vi.spyOn(diceRoller, 'rollD20').mockReturnValue(15);
      vi.spyOn(diceRoller, 'rollChance').mockReturnValue(false);

      const attacker = createCombatant('rat', 'rusty-dagger');
      const defender = createCombatant('beetle');

      const event = combatSystem.executeAttack(attacker, defender);

      expect(event.type).toBe('attack');
      expect(event.hit).toBe(true);
      expect(event.damage).toBe(4); // 5 - 1 (beetle damage reduction)
      expect(defender.currentHP).toBe(24); // 28 (with iron acorn) - 4
    });

    it('should return miss event when roll fails', () => {
      vi.spyOn(diceRoller, 'rollD20').mockReturnValue(5);

      const attacker = createCombatant('rat');
      const defender = createCombatant('beetle');

      const event = combatSystem.executeAttack(attacker, defender);

      expect(event.type).toBe('attack');
      expect(event.hit).toBe(false);
      expect(event.damage).toBe(0);
    });

    it('should apply status effect from weapon on hit', () => {
      vi.spyOn(diceRoller, 'rollD20').mockReturnValue(20);
      vi.spyOn(diceRoller, 'rollChance').mockReturnValue(true);

      const attacker = createCombatant('rat', 'flame-stick');
      const defender = createCombatant('toad');

      combatSystem.executeAttack(attacker, defender);

      expect(defender.statuses.some(s => s.type === 'burn')).toBe(true);
    });

    it('should heal on hit with sapping thorn', () => {
      vi.spyOn(diceRoller, 'rollD20').mockReturnValue(20);
      vi.spyOn(diceRoller, 'rollChance').mockReturnValue(false);

      const attacker = createCombatant('rat', 'sapping-thorn');
      attacker.currentHP = 15;
      const defender = createCombatant('toad');

      combatSystem.executeAttack(attacker, defender);

      expect(attacker.currentHP).toBe(17); // healed 2
    });

    it('should trigger spiked collar damage on defender hit', () => {
      vi.spyOn(diceRoller, 'rollD20').mockReturnValue(20);
      vi.spyOn(diceRoller, 'rollChance').mockReturnValue(false);

      const attacker = createCombatant('rat');
      const defender = createCombatant('toad', undefined, 'spiked-collar');
      const initialHP = attacker.currentHP;

      combatSystem.executeAttack(attacker, defender);

      expect(attacker.currentHP).toBe(initialHP - 2);
    });

    it('should check dodge for mosquito evasive passive', () => {
      vi.spyOn(diceRoller, 'rollD20').mockReturnValue(20);
      vi.spyOn(diceRoller, 'rollChance').mockReturnValue(true); // dodge succeeds

      const attacker = createCombatant('rat');
      const defender = createCombatant('mosquito');
      const initialHP = defender.currentHP;

      const event = combatSystem.executeAttack(attacker, defender);

      expect(event.dodged).toBe(true);
      expect(defender.currentHP).toBe(initialHP);
    });
  });

  describe('executeTurnEnd', () => {
    it('should tick status effects', () => {
      const rat = createCombatant('rat');
      rat.statuses = [{ type: 'burn', value: 2, duration: 2 }];

      const event = combatSystem.executeTurnEnd(rat);

      expect(event.type).toBe('turn_end');
      expect(event.statusDamage).toBe(2);
      expect(rat.currentHP).toBe(18);
    });

    it('should apply toad regen passive', () => {
      const toad = createCombatant('toad');
      toad.currentHP = 20;

      const event = combatSystem.executeTurnEnd(toad);

      expect(event.regenHealing).toBe(1);
      expect(toad.currentHP).toBe(21);
    });
  });

  describe('isCombatantDead', () => {
    it('should return true when HP <= 0', () => {
      const rat = createCombatant('rat');
      rat.currentHP = 0;
      expect(combatSystem.isCombatantDead(rat)).toBe(true);
    });

    it('should return false when HP > 0', () => {
      const rat = createCombatant('rat');
      expect(combatSystem.isCombatantDead(rat)).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/systems/CombatSystem.test.ts`
Expected: FAIL - Cannot find module './CombatSystem'

**Step 3: Write implementation**

Create `src/systems/CombatSystem.ts`:

```typescript
import type { Combatant, StatusType, Weapon } from '../types';
import { DiceRoller } from './DiceRoller';
import { StatusManager } from './StatusManager';

export interface AttackEvent {
  type: 'attack';
  attacker: string;
  defender: string;
  roll: number;
  modifier: number;
  total: number;
  targetArmor: number;
  hit: boolean;
  dodged?: boolean;
  damage: number;
  healing?: number;
  statusApplied?: StatusType;
  reflectDamage?: number;
}

export interface TurnEndEvent {
  type: 'turn_end';
  combatant: string;
  statusDamage: number;
  regenHealing: number;
  expiredStatuses: StatusType[];
}

export type CombatEvent = AttackEvent | TurnEndEvent;

export class CombatSystem {
  constructor(
    private diceRoller: DiceRoller,
    private statusManager: StatusManager
  ) {}

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

    // Passive: Scrappy (Rat) - +2 when below 50% HP
    if (combatant.animal.passive.type === 'stat_conditional' &&
        combatant.animal.passive.trigger?.hpBelow) {
      const threshold = combatant.maxHP * (combatant.animal.passive.trigger.hpBelow / 100);
      if (combatant.currentHP < threshold) {
        mod += combatant.animal.passive.effect.attackMod ?? 0;
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
    mod += this.statusManager.getWeakenModifier(combatant);

    // Enemy passive: Spider Web Trap - enemies have -1 Atk Mod
    if (enemy?.animal.passive.effect.enemyAttackMod) {
      mod += enemy.animal.passive.effect.enemyAttackMod;
    }

    return mod;
  }

  getEffectiveArmor(combatant: Combatant): number {
    return combatant.animal.stats.armor;
  }

  getDamageReduction(combatant: Combatant): number {
    if (combatant.animal.passive.effect.damageReduction) {
      return combatant.animal.passive.effect.damageReduction;
    }
    return 0;
  }

  getAttackDamage(combatant: Combatant): number {
    if (combatant.weapon) {
      return combatant.weapon.damage;
    }
    return combatant.animal.unarmedAttack.damage;
  }

  getAttackDetails(combatant: Combatant): {
    damage: number;
    effectChance?: number;
    effectType?: StatusType;
    effectValue?: number;
    healOnHit?: number;
  } {
    if (combatant.weapon) {
      return {
        damage: combatant.weapon.damage,
        effectChance: combatant.weapon.effectChance,
        effectType: combatant.weapon.effectType,
        effectValue: combatant.weapon.effectValue,
        healOnHit: combatant.weapon.healOnHit,
      };
    }
    return {
      damage: combatant.animal.unarmedAttack.damage,
      effectChance: combatant.animal.unarmedAttack.effectChance,
      effectType: combatant.animal.unarmedAttack.effectType,
      effectValue: combatant.animal.unarmedAttack.effectValue,
      healOnHit: combatant.animal.unarmedAttack.healOnHit,
    };
  }

  executeAttack(attacker: Combatant, defender: Combatant): AttackEvent {
    const attackMod = this.getEffectiveAttackMod(attacker, defender);
    const targetArmor = this.getEffectiveArmor(defender);
    const rollResult = this.diceRoller.rollAttack(attackMod);

    const event: AttackEvent = {
      type: 'attack',
      attacker: attacker.animal.name,
      defender: defender.animal.name,
      roll: rollResult.roll,
      modifier: rollResult.modifier,
      total: rollResult.total,
      targetArmor,
      hit: false,
      damage: 0,
    };

    // Check if attack hits
    if (!this.diceRoller.checkHit(rollResult.total, targetArmor)) {
      return event;
    }

    // Check dodge (Mosquito Evasive passive)
    if (defender.animal.passive.effect.dodgeChance) {
      if (this.diceRoller.rollChance(defender.animal.passive.effect.dodgeChance)) {
        event.dodged = true;
        return event;
      }
    }

    event.hit = true;

    // Calculate damage
    const attackDetails = this.getAttackDetails(attacker);
    let damage = attackDetails.damage;

    // Apply damage reduction (Beetle Hard Shell)
    damage = Math.max(0, damage - this.getDamageReduction(defender));
    event.damage = damage;

    // Apply damage to defender
    defender.currentHP -= damage;

    // Apply status effect from weapon/unarmed attack
    let statusChance = attackDetails.effectChance ?? 0;

    // Ember Charm adds 20% burn chance
    if (attacker.accessory?.effect.burnChance) {
      statusChance = Math.max(statusChance, attacker.accessory.effect.burnChance);
      if (attackDetails.effectType !== 'burn') {
        // Ember charm provides its own burn chance
        if (this.diceRoller.rollChance(attacker.accessory.effect.burnChance)) {
          this.statusManager.applyStatus(defender, 'burn', 2, 3);
          event.statusApplied = 'burn';
        }
      }
    }

    if (attackDetails.effectChance && attackDetails.effectType && attackDetails.effectValue) {
      if (this.diceRoller.rollChance(attackDetails.effectChance)) {
        const duration = attackDetails.effectType === 'weaken' ? 2 : 3;
        this.statusManager.applyStatus(defender, attackDetails.effectType, attackDetails.effectValue, duration);
        event.statusApplied = attackDetails.effectType;
      }
    }

    // Heal on hit (Sapping Thorn, Mosquito Blood Drain)
    if (attackDetails.healOnHit) {
      const healAmount = Math.min(attackDetails.healOnHit, attacker.maxHP - attacker.currentHP);
      attacker.currentHP += healAmount;
      event.healing = healAmount;
    }

    // Spiked Collar reactive damage
    if (defender.accessory?.effect.damageOnHit) {
      attacker.currentHP -= defender.accessory.effect.damageOnHit;
      event.reflectDamage = defender.accessory.effect.damageOnHit;
    }

    return event;
  }

  executeTurnEnd(combatant: Combatant): TurnEndEvent {
    // Apply Toad regen passive before status ticks
    let regenHealing = 0;
    if (combatant.animal.passive.type === 'per_turn' && combatant.animal.passive.effect.regen) {
      const healAmount = Math.min(
        combatant.animal.passive.effect.regen,
        combatant.maxHP - combatant.currentHP
      );
      combatant.currentHP += healAmount;
      regenHealing = healAmount;
    }

    const statusResult = this.statusManager.tickStatuses(combatant);

    return {
      type: 'turn_end',
      combatant: combatant.animal.name,
      statusDamage: statusResult.damage,
      regenHealing: regenHealing + statusResult.healing,
      expiredStatuses: statusResult.expiredStatuses,
    };
  }

  isCombatantDead(combatant: Combatant): boolean {
    return combatant.currentHP <= 0;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/systems/CombatSystem.test.ts`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add src/systems/CombatSystem.ts src/systems/CombatSystem.test.ts
git commit -m "feat: add CombatSystem with full combat logic"
```

---

### Task 2.4: Create Systems Index Export

**Parallel:** no
**Blocked by:** Task 2.3
**Owned files:** `src/systems/index.ts`

**Files:**
- Create: `src/systems/index.ts`

**Step 1: Create barrel export**

Create `src/systems/index.ts`:

```typescript
export { DiceRoller, type AttackRoll } from './DiceRoller';
export { StatusManager, type StatusTickResult } from './StatusManager';
export { CombatSystem, type AttackEvent, type TurnEndEvent, type CombatEvent } from './CombatSystem';
```

**Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: Exit 0

**Step 3: Commit**

```bash
git add src/systems/index.ts
git commit -m "chore: add systems barrel export"
```

---

## Phase 3: Game State Management

### Task 3.1: Implement Game State Manager

**Parallel:** no
**Blocked by:** Task 2.4, Task 1.5
**Owned files:** `src/GameStateManager.ts`, `src/GameStateManager.test.ts`

**Files:**
- Create: `src/GameStateManager.ts`
- Create: `src/GameStateManager.test.ts`

**Step 1: Write the failing test**

Create `src/GameStateManager.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from './GameStateManager';
import { getAnimalById } from './data/animals';
import { getWeaponById } from './data/weapons';
import { getAccessoryById } from './data/accessories';

describe('GameStateManager', () => {
  let manager: GameStateManager;

  beforeEach(() => {
    manager = new GameStateManager();
  });

  describe('startRun', () => {
    it('should initialize player with selected loadout', () => {
      const animal = getAnimalById('rat')!;
      const weapon = getWeaponById('rusty-dagger')!;
      const accessory = getAccessoryById('iron-acorn')!;

      manager.startRun(animal, weapon, accessory);
      const state = manager.getState();

      expect(state.player.animal.id).toBe('rat');
      expect(state.player.weapon?.id).toBe('rusty-dagger');
      expect(state.player.accessory?.id).toBe('iron-acorn');
      expect(state.player.currentHP).toBe(24); // 20 + 4 from Iron Acorn
      expect(state.player.maxHP).toBe(24);
    });

    it('should reset run progress', () => {
      const animal = getAnimalById('rat')!;

      manager.startRun(animal, null, null);
      const state = manager.getState();

      expect(state.run.currentCPU).toBe(1);
      expect(state.run.cpuDefeated).toEqual([false, false, false]);
    });
  });

  describe('defeatCPU', () => {
    it('should mark CPU as defeated and advance', () => {
      const animal = getAnimalById('rat')!;
      manager.startRun(animal, null, null);

      manager.defeatCPU(1);
      const state = manager.getState();

      expect(state.run.cpuDefeated[0]).toBe(true);
      expect(state.run.currentCPU).toBe(2);
    });
  });

  describe('equipDraftChoice', () => {
    it('should equip weapon from draft', () => {
      const animal = getAnimalById('rat')!;
      manager.startRun(animal, null, null);

      const weapon = getWeaponById('flame-stick')!;
      manager.equipDraftChoice({ type: 'weapon', item: weapon });

      expect(manager.getState().player.weapon?.id).toBe('flame-stick');
    });

    it('should equip accessory from draft', () => {
      const animal = getAnimalById('rat')!;
      manager.startRun(animal, null, null);

      const accessory = getAccessoryById('lucky-pebble')!;
      manager.equipDraftChoice({ type: 'accessory', item: accessory });

      expect(manager.getState().player.accessory?.id).toBe('lucky-pebble');
    });

    it('should update maxHP when equipping HP accessory', () => {
      const animal = getAnimalById('rat')!;
      manager.startRun(animal, null, null);

      const accessory = getAccessoryById('iron-acorn')!;
      manager.equipDraftChoice({ type: 'accessory', item: accessory });

      expect(manager.getState().player.maxHP).toBe(24);
      expect(manager.getState().player.currentHP).toBe(24); // HP increases by bonus
    });
  });

  describe('updatePlayerHP', () => {
    it('should update current HP', () => {
      const animal = getAnimalById('rat')!;
      manager.startRun(animal, null, null);

      manager.updatePlayerHP(15);

      expect(manager.getState().player.currentHP).toBe(15);
    });
  });

  describe('isRunComplete', () => {
    it('should return true when all CPUs defeated', () => {
      const animal = getAnimalById('rat')!;
      manager.startRun(animal, null, null);

      manager.defeatCPU(1);
      manager.defeatCPU(2);
      manager.defeatCPU(3);

      expect(manager.isRunComplete()).toBe(true);
    });

    it('should return false when CPUs remain', () => {
      const animal = getAnimalById('rat')!;
      manager.startRun(animal, null, null);

      manager.defeatCPU(1);

      expect(manager.isRunComplete()).toBe(false);
    });
  });

  describe('createPlayerCombatant', () => {
    it('should create combatant with current state', () => {
      const animal = getAnimalById('rat')!;
      const weapon = getWeaponById('rusty-dagger')!;
      manager.startRun(animal, weapon, null);
      manager.updatePlayerHP(15);

      const combatant = manager.createPlayerCombatant();

      expect(combatant.currentHP).toBe(15);
      expect(combatant.weapon?.id).toBe('rusty-dagger');
      expect(combatant.statuses).toEqual([]);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/GameStateManager.test.ts`
Expected: FAIL - Cannot find module './GameStateManager'

**Step 3: Write implementation**

Create `src/GameStateManager.ts`:

```typescript
import type { Animal, Weapon, Accessory, GameState, Combatant, DraftChoice } from './types';

export class GameStateManager {
  private state: GameState | null = null;

  startRun(animal: Animal, weapon: Weapon | null, accessory: Accessory | null): void {
    const bonusHP = accessory?.effect.hp ?? 0;
    const maxHP = animal.stats.hp + bonusHP;

    this.state = {
      player: {
        animal,
        weapon,
        accessory,
        currentHP: maxHP,
        maxHP,
        statuses: [],
      },
      run: {
        currentCPU: 1,
        cpuDefeated: [false, false, false],
      },
    };
  }

  getState(): GameState {
    if (!this.state) {
      throw new Error('Game state not initialized. Call startRun first.');
    }
    return this.state;
  }

  defeatCPU(cpuNumber: 1 | 2 | 3): void {
    const state = this.getState();
    state.run.cpuDefeated[cpuNumber - 1] = true;
    if (cpuNumber < 3) {
      state.run.currentCPU = (cpuNumber + 1) as 1 | 2 | 3;
    }
  }

  equipDraftChoice(choice: DraftChoice): void {
    const state = this.getState();

    if (choice.type === 'weapon') {
      state.player.weapon = choice.item as Weapon;
    } else {
      const newAccessory = choice.item as Accessory;
      const oldBonusHP = state.player.accessory?.effect.hp ?? 0;
      const newBonusHP = newAccessory.effect.hp ?? 0;

      state.player.accessory = newAccessory;

      // Adjust HP for accessory swap
      const hpDiff = newBonusHP - oldBonusHP;
      state.player.maxHP += hpDiff;
      state.player.currentHP = Math.min(state.player.currentHP + hpDiff, state.player.maxHP);
    }
  }

  updatePlayerHP(hp: number): void {
    const state = this.getState();
    state.player.currentHP = Math.max(0, Math.min(hp, state.player.maxHP));
  }

  isRunComplete(): boolean {
    const state = this.getState();
    return state.run.cpuDefeated.every(d => d);
  }

  createPlayerCombatant(): Combatant {
    const state = this.getState();
    return {
      animal: state.player.animal,
      weapon: state.player.weapon,
      accessory: state.player.accessory,
      currentHP: state.player.currentHP,
      maxHP: state.player.maxHP,
      statuses: [], // Statuses reset between fights
    };
  }

  createCPUCombatant(cpuLoadout: { animal: Animal; weapon: Weapon; accessory: Accessory }): Combatant {
    const bonusHP = cpuLoadout.accessory.effect.hp ?? 0;
    const maxHP = cpuLoadout.animal.stats.hp + bonusHP;

    return {
      animal: cpuLoadout.animal,
      weapon: cpuLoadout.weapon,
      accessory: cpuLoadout.accessory,
      currentHP: maxHP,
      maxHP,
      statuses: [],
    };
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/GameStateManager.test.ts`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add src/GameStateManager.ts src/GameStateManager.test.ts
git commit -m "feat: add GameStateManager for run state"
```

---

## Phase 4: Phaser Scenes

### Task 4.1: Implement Base Scene Utilities

**Parallel:** no
**Blocked by:** Task 3.1
**Owned files:** `src/scenes/BaseScene.ts`

**Files:**
- Create: `src/scenes/BaseScene.ts`

**Step 1: Create base scene class**

Create `src/scenes/BaseScene.ts`:

```typescript
import Phaser from 'phaser';
import { GameStateManager } from '../GameStateManager';

export class BaseScene extends Phaser.Scene {
  protected gameState!: GameStateManager;

  init(data: { gameState?: GameStateManager }): void {
    if (data.gameState) {
      this.gameState = data.gameState;
    } else if (!this.gameState) {
      this.gameState = new GameStateManager();
    }
  }

  protected createButton(
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    width = 200,
    height = 50
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, width, height, 0x4a4a6a)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => bg.setFillStyle(0x6a6a8a))
      .on('pointerout', () => bg.setFillStyle(0x4a4a6a))
      .on('pointerdown', onClick);

    const label = this.add.text(0, 0, text, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    container.add([bg, label]);
    return container;
  }

  protected createText(
    x: number,
    y: number,
    text: string,
    fontSize = '24px',
    color = '#ffffff'
  ): Phaser.GameObjects.Text {
    return this.add.text(x, y, text, {
      fontSize,
      color,
      fontFamily: 'Arial',
    }).setOrigin(0.5);
  }

  protected changeScene(key: string, data?: object): void {
    this.scene.start(key, { gameState: this.gameState, ...data });
  }
}
```

**Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: Exit 0

**Step 3: Commit**

```bash
git add src/scenes/BaseScene.ts
git commit -m "feat: add BaseScene with shared utilities"
```

---

### Task 4.2: Implement Menu Scene

**Parallel:** no
**Blocked by:** Task 4.1
**Owned files:** `src/scenes/MenuScene.ts`

**Files:**
- Create: `src/scenes/MenuScene.ts`

**Step 1: Create menu scene**

Create `src/scenes/MenuScene.ts`:

```typescript
import { BaseScene } from './BaseScene';

export class MenuScene extends BaseScene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Title
    this.createText(width / 2, height / 3, 'Project Meepo', '48px');
    this.createText(width / 2, height / 3 + 50, 'Auto Battler', '32px', '#aaaaaa');

    // Start button
    this.createButton(
      width / 2,
      height / 2 + 50,
      'Start Game',
      () => this.changeScene('LoadoutScene')
    );

    // Instructions
    this.createText(
      width / 2,
      height - 80,
      'Battle through 3 CPU opponents!',
      '18px',
      '#888888'
    );
    this.createText(
      width / 2,
      height - 50,
      'HP carries over between fights',
      '16px',
      '#666666'
    );
  }
}
```

**Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: Exit 0

**Step 3: Commit**

```bash
git add src/scenes/MenuScene.ts
git commit -m "feat: add MenuScene"
```

---

### Task 4.3: Implement Loadout Scene

**Parallel:** no
**Blocked by:** Task 4.2
**Owned files:** `src/scenes/LoadoutScene.ts`

**Files:**
- Create: `src/scenes/LoadoutScene.ts`

**Step 1: Create loadout scene**

Create `src/scenes/LoadoutScene.ts`:

```typescript
import { BaseScene } from './BaseScene';
import { ANIMALS, WEAPONS, ACCESSORIES } from '../data';
import type { Animal, Weapon, Accessory } from '../types';

export class LoadoutScene extends BaseScene {
  private selectedAnimal: Animal | null = null;
  private selectedWeapon: Weapon | null = null;
  private selectedAccessory: Accessory | null = null;
  private startButton!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'LoadoutScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Title
    this.createText(width / 2, 40, 'Choose Your Loadout', '32px');

    // Animal selection
    this.createText(150, 100, 'Animal', '24px');
    this.createSelectionRow(ANIMALS, 150, 140, 'animal');

    // Weapon selection
    this.createText(150, 280, 'Weapon', '24px');
    this.createSelectionRow(WEAPONS, 150, 320, 'weapon');

    // Accessory selection
    this.createText(150, 420, 'Accessory', '24px');
    this.createSelectionRow(ACCESSORIES, 150, 460, 'accessory');

    // Start button (disabled initially)
    this.startButton = this.createButton(
      width / 2,
      height - 60,
      'Start Run',
      () => this.startRun(),
      200,
      50
    );
    this.startButton.setAlpha(0.5);

    // Back button
    this.createButton(100, height - 60, 'Back', () => this.changeScene('MenuScene'), 120, 40);
  }

  private createSelectionRow(
    items: readonly (Animal | Weapon | Accessory)[],
    startX: number,
    y: number,
    type: 'animal' | 'weapon' | 'accessory'
  ): void {
    items.forEach((item, index) => {
      const x = startX + index * 130;
      this.createItemCard(x, y, item, type);
    });
  }

  private createItemCard(
    x: number,
    y: number,
    item: Animal | Weapon | Accessory,
    type: 'animal' | 'weapon' | 'accessory'
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 120, 100, 0x333344)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        if (!this.isSelected(item, type)) {
          bg.setFillStyle(0x444455);
        }
      })
      .on('pointerout', () => {
        if (!this.isSelected(item, type)) {
          bg.setFillStyle(0x333344);
        }
      })
      .on('pointerdown', () => this.selectItem(item, type, bg));

    const name = this.add.text(0, -30, item.name, {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial',
      wordWrap: { width: 110 },
      align: 'center',
    }).setOrigin(0.5);

    let statsText = '';
    if ('stats' in item) {
      // Animal
      statsText = `HP:${item.stats.hp} Atk:${item.stats.attackMod} Arm:${item.stats.armor}`;
    } else if ('damage' in item) {
      // Weapon
      statsText = `Dmg: ${item.damage}`;
      if (item.effectType) {
        statsText += `\n${item.effectChance}% ${item.effectType}`;
      }
    } else {
      // Accessory
      const effects = [];
      if (item.effect.hp) effects.push(`+${item.effect.hp} HP`);
      if (item.effect.attackMod) effects.push(`+${item.effect.attackMod} Atk`);
      if (item.effect.damageOnHit) effects.push(`${item.effect.damageOnHit} reflect`);
      if (item.effect.burnChance) effects.push(`${item.effect.burnChance}% burn`);
      if (item.effect.attackModWhenLow) effects.push(`+${item.effect.attackModWhenLow} low HP`);
      statsText = effects.join('\n');
    }

    const stats = this.add.text(0, 15, statsText, {
      fontSize: '11px',
      color: '#aaaaaa',
      fontFamily: 'Arial',
      align: 'center',
    }).setOrigin(0.5);

    container.add([bg, name, stats]);
    container.setData('bg', bg);
    container.setData('item', item);
    container.setData('type', type);

    return container;
  }

  private isSelected(item: Animal | Weapon | Accessory, type: string): boolean {
    switch (type) {
      case 'animal':
        return this.selectedAnimal?.id === (item as Animal).id;
      case 'weapon':
        return this.selectedWeapon?.id === (item as Weapon).id;
      case 'accessory':
        return this.selectedAccessory?.id === (item as Accessory).id;
      default:
        return false;
    }
  }

  private selectItem(
    item: Animal | Weapon | Accessory,
    type: 'animal' | 'weapon' | 'accessory',
    bg: Phaser.GameObjects.Rectangle
  ): void {
    // Clear previous selection of same type
    this.children.list.forEach(child => {
      if (child instanceof Phaser.GameObjects.Container) {
        const itemType = child.getData('type');
        const itemBg = child.getData('bg') as Phaser.GameObjects.Rectangle;
        if (itemType === type && itemBg) {
          itemBg.setFillStyle(0x333344);
        }
      }
    });

    // Set new selection
    bg.setFillStyle(0x5a5a8a);

    switch (type) {
      case 'animal':
        this.selectedAnimal = item as Animal;
        break;
      case 'weapon':
        this.selectedWeapon = item as Weapon;
        break;
      case 'accessory':
        this.selectedAccessory = item as Accessory;
        break;
    }

    this.updateStartButton();
  }

  private updateStartButton(): void {
    if (this.selectedAnimal) {
      this.startButton.setAlpha(1);
    }
  }

  private startRun(): void {
    if (!this.selectedAnimal) return;

    this.gameState.startRun(
      this.selectedAnimal,
      this.selectedWeapon,
      this.selectedAccessory
    );

    this.changeScene('BattleScene');
  }
}
```

**Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: Exit 0

**Step 3: Commit**

```bash
git add src/scenes/LoadoutScene.ts
git commit -m "feat: add LoadoutScene for loadout selection"
```

---

### Task 4.4: Implement Battle Scene

**Parallel:** no
**Blocked by:** Task 4.3
**Owned files:** `src/scenes/BattleScene.ts`

**Files:**
- Create: `src/scenes/BattleScene.ts`

**Step 1: Create battle scene**

Create `src/scenes/BattleScene.ts`:

```typescript
import { BaseScene } from './BaseScene';
import { CombatSystem, DiceRoller, StatusManager, type CombatEvent } from '../systems';
import { getCPULoadout } from '../data';
import type { Combatant } from '../types';

type BattlePhase = 'start' | 'player_turn' | 'enemy_turn' | 'turn_end' | 'victory' | 'defeat';

export class BattleScene extends BaseScene {
  private player!: Combatant;
  private enemy!: Combatant;
  private combatSystem!: CombatSystem;
  private phase: BattlePhase = 'start';
  private isPlayerFirst = true;
  private eventQueue: CombatEvent[] = [];

  // UI elements
  private playerHealthText!: Phaser.GameObjects.Text;
  private enemyHealthText!: Phaser.GameObjects.Text;
  private playerStatusText!: Phaser.GameObjects.Text;
  private enemyStatusText!: Phaser.GameObjects.Text;
  private battleLog!: Phaser.GameObjects.Text;
  private turnIndicator!: Phaser.GameObjects.Text;
  private playerSprite!: Phaser.GameObjects.Rectangle;
  private enemySprite!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Initialize combat
    const diceRoller = new DiceRoller();
    const statusManager = new StatusManager();
    this.combatSystem = new CombatSystem(diceRoller, statusManager);

    // Get combatants
    const state = this.gameState.getState();
    this.player = this.gameState.createPlayerCombatant();
    const cpuLoadout = getCPULoadout(state.run.currentCPU);
    this.enemy = this.gameState.createCPUCombatant(cpuLoadout);

    // Coin flip for first turn
    this.isPlayerFirst = diceRoller.coinFlip();

    // Create UI
    this.createBattleUI(width, height, state.run.currentCPU);

    // Start combat
    this.time.delayedCall(500, () => this.startCombat());
  }

  private createBattleUI(width: number, height: number, cpuNumber: number): void {
    // Title
    this.createText(width / 2, 30, `Battle ${cpuNumber} of 3`, '24px');

    const cpuDifficulty = ['Easy', 'Medium', 'Hard'][cpuNumber - 1];
    this.createText(width / 2, 55, `(${cpuDifficulty})`, '16px', '#888888');

    // Player side (left)
    this.createText(150, 100, 'YOU', '20px', '#88ff88');
    this.createText(150, 125, this.player.animal.name, '18px');

    this.playerSprite = this.add.rectangle(150, 200, 80, 80, 0x4488ff);

    this.playerHealthText = this.createText(150, 280, this.getHealthString(this.player), '16px');
    this.playerStatusText = this.createText(150, 305, '', '14px', '#ffaa00');

    // Show player equipment
    const playerWeapon = this.player.weapon?.name ?? 'Unarmed';
    const playerAcc = this.player.accessory?.name ?? 'None';
    this.createText(150, 340, `Weapon: ${playerWeapon}`, '12px', '#aaaaaa');
    this.createText(150, 360, `Accessory: ${playerAcc}`, '12px', '#aaaaaa');

    // Enemy side (right)
    this.createText(width - 150, 100, 'ENEMY', '20px', '#ff8888');
    this.createText(width - 150, 125, this.enemy.animal.name, '18px');

    this.enemySprite = this.add.rectangle(width - 150, 200, 80, 80, 0xff4444);

    this.enemyHealthText = this.createText(width - 150, 280, this.getHealthString(this.enemy), '16px');
    this.enemyStatusText = this.createText(width - 150, 305, '', '14px', '#ffaa00');

    // Show enemy equipment
    const enemyWeapon = this.enemy.weapon?.name ?? 'Unarmed';
    const enemyAcc = this.enemy.accessory?.name ?? 'None';
    this.createText(width - 150, 340, `Weapon: ${enemyWeapon}`, '12px', '#aaaaaa');
    this.createText(width - 150, 360, `Accessory: ${enemyAcc}`, '12px', '#aaaaaa');

    // Turn indicator
    this.turnIndicator = this.createText(width / 2, 200, '', '24px', '#ffff00');

    // Battle log
    this.add.rectangle(width / 2, height - 120, 600, 180, 0x222233);
    this.battleLog = this.add.text(width / 2 - 280, height - 200, '', {
      fontSize: '14px',
      color: '#cccccc',
      fontFamily: 'Arial',
      wordWrap: { width: 560 },
    });
  }

  private getHealthString(combatant: Combatant): string {
    return `HP: ${combatant.currentHP}/${combatant.maxHP}`;
  }

  private updateHealthDisplays(): void {
    this.playerHealthText.setText(this.getHealthString(this.player));
    this.enemyHealthText.setText(this.getHealthString(this.enemy));

    // Update status displays
    const playerStatuses = this.player.statuses.map(s => `${s.type}(${s.duration})`).join(' ');
    const enemyStatuses = this.enemy.statuses.map(s => `${s.type}(${s.duration})`).join(' ');
    this.playerStatusText.setText(playerStatuses);
    this.enemyStatusText.setText(enemyStatuses);
  }

  private log(message: string): void {
    const current = this.battleLog.text;
    const lines = current.split('\n');
    if (lines.length > 8) {
      lines.shift();
    }
    lines.push(message);
    this.battleLog.setText(lines.join('\n'));
  }

  private startCombat(): void {
    const firstAttacker = this.isPlayerFirst ? 'You go first!' : 'Enemy goes first!';
    this.log(`Coin flip: ${firstAttacker}`);

    this.time.delayedCall(1000, () => {
      this.phase = this.isPlayerFirst ? 'player_turn' : 'enemy_turn';
      this.executeTurn();
    });
  }

  private executeTurn(): void {
    if (this.phase === 'victory' || this.phase === 'defeat') return;

    const isPlayerTurn = this.phase === 'player_turn';
    const attacker = isPlayerTurn ? this.player : this.enemy;
    const defender = isPlayerTurn ? this.enemy : this.player;

    this.turnIndicator.setText(isPlayerTurn ? '>>> YOUR TURN <<<' : '>>> ENEMY TURN <<<');
    this.turnIndicator.setColor(isPlayerTurn ? '#88ff88' : '#ff8888');

    // Flash attacker sprite
    const sprite = isPlayerTurn ? this.playerSprite : this.enemySprite;
    this.tweens.add({
      targets: sprite,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 1,
    });

    this.time.delayedCall(500, () => {
      // Execute attack
      const attackEvent = this.combatSystem.executeAttack(attacker, defender);
      this.logAttackEvent(attackEvent, isPlayerTurn);
      this.updateHealthDisplays();

      // Check for death
      if (this.combatSystem.isCombatantDead(defender)) {
        this.time.delayedCall(500, () => this.endCombat(isPlayerTurn));
        return;
      }

      // Turn end phase
      this.time.delayedCall(800, () => {
        const turnEndEvent = this.combatSystem.executeTurnEnd(attacker);
        if (turnEndEvent.statusDamage > 0 || turnEndEvent.regenHealing > 0) {
          this.logTurnEndEvent(turnEndEvent, isPlayerTurn);
          this.updateHealthDisplays();
        }

        // Check for death from DoT
        if (this.combatSystem.isCombatantDead(attacker)) {
          this.time.delayedCall(500, () => this.endCombat(!isPlayerTurn));
          return;
        }

        // Swap turns
        this.time.delayedCall(600, () => {
          this.phase = isPlayerTurn ? 'enemy_turn' : 'player_turn';
          this.executeTurn();
        });
      });
    });
  }

  private logAttackEvent(event: ReturnType<CombatSystem['executeAttack']>, isPlayerAttack: boolean): void {
    const attackerName = isPlayerAttack ? 'You' : 'Enemy';

    if (event.dodged) {
      this.log(`${attackerName} rolled ${event.roll}+${event.modifier}=${event.total} vs ${event.targetArmor} AC`);
      this.log(`  Hit! But ${event.defender} dodged!`);
      return;
    }

    if (!event.hit) {
      this.log(`${attackerName} rolled ${event.roll}+${event.modifier}=${event.total} vs ${event.targetArmor} AC`);
      this.log(`  Miss!`);
      return;
    }

    this.log(`${attackerName} rolled ${event.roll}+${event.modifier}=${event.total} vs ${event.targetArmor} AC`);
    let hitMsg = `  Hit for ${event.damage} damage!`;
    if (event.statusApplied) {
      hitMsg += ` Applied ${event.statusApplied}!`;
    }
    if (event.healing) {
      hitMsg += ` Healed ${event.healing}!`;
    }
    if (event.reflectDamage) {
      hitMsg += ` Took ${event.reflectDamage} reflect damage!`;
    }
    this.log(hitMsg);
  }

  private logTurnEndEvent(event: ReturnType<CombatSystem['executeTurnEnd']>, isPlayerTurn: boolean): void {
    const name = isPlayerTurn ? 'You' : 'Enemy';

    if (event.statusDamage > 0) {
      this.log(`${name} took ${event.statusDamage} status damage!`);
    }
    if (event.regenHealing > 0) {
      this.log(`${name} regenerated ${event.regenHealing} HP!`);
    }
  }

  private endCombat(playerWon: boolean): void {
    this.phase = playerWon ? 'victory' : 'defeat';
    this.turnIndicator.setText(playerWon ? 'VICTORY!' : 'DEFEAT!');
    this.turnIndicator.setColor(playerWon ? '#00ff00' : '#ff0000');

    if (playerWon) {
      // Update player HP in game state
      this.gameState.updatePlayerHP(this.player.currentHP);

      const state = this.gameState.getState();
      this.gameState.defeatCPU(state.run.currentCPU);

      this.time.delayedCall(2000, () => {
        if (this.gameState.isRunComplete()) {
          this.changeScene('ResultScene', { victory: true });
        } else {
          this.changeScene('DraftScene');
        }
      });
    } else {
      this.time.delayedCall(2000, () => {
        this.changeScene('ResultScene', { victory: false });
      });
    }
  }
}
```

**Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: Exit 0

**Step 3: Commit**

```bash
git add src/scenes/BattleScene.ts
git commit -m "feat: add BattleScene with automated combat"
```

---

### Task 4.5: Implement Draft Scene

**Parallel:** no
**Blocked by:** Task 4.4
**Owned files:** `src/scenes/DraftScene.ts`

**Files:**
- Create: `src/scenes/DraftScene.ts`

**Step 1: Create draft scene**

Create `src/scenes/DraftScene.ts`:

```typescript
import { BaseScene } from './BaseScene';
import { WEAPONS, ACCESSORIES } from '../data';
import type { Weapon, Accessory, DraftChoice } from '../types';

export class DraftScene extends BaseScene {
  private choices: DraftChoice[] = [];

  constructor() {
    super({ key: 'DraftScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Generate 3 random choices
    this.choices = this.generateDraftChoices();

    const state = this.gameState.getState();
    const nextBattle = state.run.currentCPU;

    // Title
    this.createText(width / 2, 50, 'Draft Phase', '32px');
    this.createText(width / 2, 85, `Pick an upgrade before Battle ${nextBattle}`, '18px', '#888888');

    // Current HP display
    this.createText(
      width / 2,
      120,
      `Current HP: ${state.player.currentHP}/${state.player.maxHP}`,
      '16px',
      '#88ff88'
    );

    // Current equipment display
    const currentWeapon = state.player.weapon?.name ?? 'Unarmed';
    const currentAcc = state.player.accessory?.name ?? 'None';
    this.createText(width / 2, 150, `Weapon: ${currentWeapon} | Accessory: ${currentAcc}`, '14px', '#aaaaaa');

    // Display choices
    this.choices.forEach((choice, index) => {
      const x = 150 + index * 200;
      this.createDraftCard(x, height / 2, choice, index);
    });

    // Skip button
    this.createButton(
      width / 2,
      height - 80,
      'Skip',
      () => this.skipDraft(),
      120,
      40
    );
  }

  private generateDraftChoices(): DraftChoice[] {
    const choices: DraftChoice[] = [];
    const allItems: DraftChoice[] = [
      ...WEAPONS.map(w => ({ type: 'weapon' as const, item: w })),
      ...ACCESSORIES.map(a => ({ type: 'accessory' as const, item: a })),
    ];

    // Shuffle and pick 3
    const shuffled = [...allItems].sort(() => Math.random() - 0.5);

    for (let i = 0; i < 3 && i < shuffled.length; i++) {
      choices.push(shuffled[i]);
    }

    return choices;
  }

  private createDraftCard(x: number, y: number, choice: DraftChoice, _index: number): void {
    const container = this.add.container(x, y);
    const item = choice.item;
    const isWeapon = choice.type === 'weapon';

    const bg = this.add.rectangle(0, 0, 180, 200, 0x333355)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => bg.setFillStyle(0x444466))
      .on('pointerout', () => bg.setFillStyle(0x333355))
      .on('pointerdown', () => this.selectChoice(choice));

    // Type label
    const typeLabel = this.add.text(0, -80, isWeapon ? 'WEAPON' : 'ACCESSORY', {
      fontSize: '12px',
      color: isWeapon ? '#ff8888' : '#88ff88',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // Name
    const name = this.add.text(0, -50, item.name, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial',
      wordWrap: { width: 160 },
      align: 'center',
    }).setOrigin(0.5);

    // Stats/effects
    let statsText = '';
    if (isWeapon) {
      const weapon = item as Weapon;
      statsText = `Damage: ${weapon.damage}`;
      if (weapon.attackModModifier) {
        statsText += `\nAtk Mod: ${weapon.attackModModifier}`;
      }
      if (weapon.effectType) {
        statsText += `\n${weapon.effectChance}% ${weapon.effectType}`;
      }
      if (weapon.healOnHit) {
        statsText += `\nHeal ${weapon.healOnHit} on hit`;
      }
    } else {
      const acc = item as Accessory;
      const effects = [];
      if (acc.effect.hp) effects.push(`+${acc.effect.hp} HP`);
      if (acc.effect.attackMod) effects.push(`+${acc.effect.attackMod} Atk Mod`);
      if (acc.effect.damageOnHit) effects.push(`Deal ${acc.effect.damageOnHit} when hit`);
      if (acc.effect.burnChance) effects.push(`${acc.effect.burnChance}% burn chance`);
      if (acc.effect.attackModWhenLow) {
        effects.push(`+${acc.effect.attackModWhenLow} Atk when <${acc.effect.lowHpThreshold}% HP`);
      }
      statsText = effects.join('\n');
    }

    const stats = this.add.text(0, 20, statsText, {
      fontSize: '13px',
      color: '#aaaaaa',
      fontFamily: 'Arial',
      align: 'center',
      wordWrap: { width: 160 },
    }).setOrigin(0.5);

    container.add([bg, typeLabel, name, stats]);
  }

  private selectChoice(choice: DraftChoice): void {
    this.gameState.equipDraftChoice(choice);
    this.changeScene('BattleScene');
  }

  private skipDraft(): void {
    this.changeScene('BattleScene');
  }
}
```

**Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: Exit 0

**Step 3: Commit**

```bash
git add src/scenes/DraftScene.ts
git commit -m "feat: add DraftScene for gear selection between battles"
```

---

### Task 4.6: Implement Result Scene

**Parallel:** no
**Blocked by:** Task 4.5
**Owned files:** `src/scenes/ResultScene.ts`

**Files:**
- Create: `src/scenes/ResultScene.ts`

**Step 1: Create result scene**

Create `src/scenes/ResultScene.ts`:

```typescript
import { BaseScene } from './BaseScene';

interface ResultSceneData {
  victory: boolean;
}

export class ResultScene extends BaseScene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  create(data: ResultSceneData & { gameState?: typeof this.gameState }): void {
    super.init(data);

    const { width, height } = this.scale;
    const victory = data.victory;

    // Result title
    const titleText = victory ? 'VICTORY!' : 'DEFEAT';
    const titleColor = victory ? '#00ff00' : '#ff0000';
    this.createText(width / 2, height / 3, titleText, '64px', titleColor);

    // Subtitle
    const subtitle = victory
      ? 'You conquered all three opponents!'
      : 'Your animal has fallen in battle...';
    this.createText(width / 2, height / 3 + 60, subtitle, '20px', '#888888');

    // Stats summary
    if (victory) {
      const state = this.gameState.getState();
      const finalHP = state.player.currentHP;
      const maxHP = state.player.maxHP;
      this.createText(
        width / 2,
        height / 2,
        `Final HP: ${finalHP}/${maxHP}`,
        '24px'
      );
    }

    // Play again button
    this.createButton(
      width / 2,
      height - 120,
      'Play Again',
      () => this.changeScene('LoadoutScene')
    );

    // Main menu button
    this.createButton(
      width / 2,
      height - 60,
      'Main Menu',
      () => this.changeScene('MenuScene')
    );
  }
}
```

**Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: Exit 0

**Step 3: Commit**

```bash
git add src/scenes/ResultScene.ts
git commit -m "feat: add ResultScene for victory/defeat display"
```

---

### Task 4.7: Create Scene Index and Update Main

**Parallel:** no
**Blocked by:** Task 4.6
**Owned files:** `src/scenes/index.ts`, `src/main.ts`

**Files:**
- Create: `src/scenes/index.ts`
- Modify: `src/main.ts`

**Step 1: Create scenes barrel export**

Create `src/scenes/index.ts`:

```typescript
export { BaseScene } from './BaseScene';
export { MenuScene } from './MenuScene';
export { LoadoutScene } from './LoadoutScene';
export { BattleScene } from './BattleScene';
export { DraftScene } from './DraftScene';
export { ResultScene } from './ResultScene';
```

**Step 2: Update main.ts to register scenes**

Update `src/main.ts`:

```typescript
import Phaser from 'phaser';
import { MenuScene, LoadoutScene, BattleScene, DraftScene, ResultScene } from './scenes';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scene: [MenuScene, LoadoutScene, BattleScene, DraftScene, ResultScene],
};

new Phaser.Game(config);
```

**Step 3: Verify typecheck**

Run: `npm run typecheck`
Expected: Exit 0

**Step 4: Run all tests**

Run: `npm run test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/scenes/index.ts src/main.ts
git commit -m "feat: register all scenes and complete game loop"
```

---

## Phase 5: Polish and Verification

### Task 5.1: Manual Playtest and Bug Fixes

**Parallel:** no
**Blocked by:** Task 4.7
**Owned files:** (depends on bugs found)

**Step 1: Start dev server**

Run: `npm run dev`
Expected: Browser opens to http://localhost:3000

**Step 2: Complete a full playthrough**

Checklist:
- [ ] Menu scene displays correctly
- [ ] Can select animal, weapon, accessory
- [ ] Start button works after selecting animal
- [ ] Battle 1 loads with correct CPU (Beetle)
- [ ] Combat resolves with correct damage calculations
- [ ] HP carries over after victory
- [ ] Draft scene shows 3 options
- [ ] Can select or skip draft
- [ ] Battle 2 loads with correct CPU (Rat)
- [ ] Battle 3 loads with correct CPU (Spider)
- [ ] Victory screen shows on completion
- [ ] Can restart from result screen

**Step 3: Test edge cases**

- [ ] Test losing a battle
- [ ] Test all 5 animals
- [ ] Test status effects applying correctly
- [ ] Test passives (Scrappy, Evasive, etc.)
- [ ] Test accessory effects (Spiked Collar, Adrenaline Gland)

**Step 4: Fix any bugs discovered**

Document bugs and fixes as separate small commits.

---

### Task 5.2: Create vitest Config

**Parallel:** no
**Blocked by:** Task 5.1
**Owned files:** `vitest.config.ts`

**Files:**
- Create: `vitest.config.ts`

**Step 1: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['src/scenes/**', 'src/ui/**', 'src/main.ts'],
    },
  },
});
```

**Step 2: Verify tests still pass**

Run: `npm run test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "chore: add vitest configuration"
```

---

### Task 5.3: Final Verification and Build

**Parallel:** no
**Blocked by:** Task 5.2
**Owned files:** none

**Step 1: Run full test suite**

Run: `npm run test`
Expected: All tests pass (minimum 30+ tests)

**Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: Exit 0, no errors

**Step 3: Run production build**

Run: `npm run build`
Expected: Exit 0, dist/ folder created

**Step 4: Preview production build**

Run: `npm run preview`
Expected: Game runs correctly from built assets

**Step 5: Commit any final fixes**

If any issues discovered, fix and commit.

---

## Owned Files Validation

```bash
# No parallel tasks overlap - validate before running parallel tasks
rg '\*\*Owned files:\*\*' docs/plans/2026-01-28-project-meepo-mvp-implementation.md \
  | sed 's/.*\*\*Owned files:\*\* *//' \
  | tr ',' '\n' \
  | sed 's/`//g' \
  | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' \
  | grep -v '^$' \
  | sort \
  | uniq -d
```

Expected output: empty (no duplicates)

---

## Summary

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| Phase 0: Scaffolding | 2 | 15 min |
| Phase 1: Data Layer | 5 | 30 min |
| Phase 2: Core Systems | 4 | 45 min |
| Phase 3: State Management | 1 | 20 min |
| Phase 4: Phaser Scenes | 7 | 90 min |
| Phase 5: Polish | 3 | 30 min |
| **Total** | **22** | **~4 hours** |

Parallel tasks: 1.2 + 1.3, 2.1 + 2.2 can run simultaneously.
