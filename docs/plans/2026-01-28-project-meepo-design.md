# Project Meepo Auto Battler — Game Design Document

## Overview

A browser-based PvE autobattler where players build a small animal with equipment, then fight through a 3-battle gauntlet against CPU opponents. D&D-inspired dice combat, roguelike draft picks between fights.

## Run Structure

1. **Pre-run (LoadoutScene):** Pick animal, starting weapon, starting accessory
2. **Fight CPU 1** (easy)
3. **Draft phase:** Pick 1 of 3 random gear pieces (weapon or accessory), can skip
4. **Fight CPU 2** (medium)
5. **Draft phase:** Pick 1 of 3 random gear pieces
6. **Fight CPU 3** (hard)
7. **Win or lose** → return to start

**HP carries over** between all 3 fights (no healing between).

## Combat Rules

- **Coin flip** determines first attacker each fight
- **Turn structure:** Attack → Roll d20 + Attack Mod vs Armor → Hit/Miss → Status ticks → Swap turns
- **Combat ends** when one animal hits 0 HP
- **Pacing:** ~1-1.5 seconds per turn

### To-Hit Roll

```
d20 + Attacker's Attack Mod  vs  Defender's Armor
Roll ≥ Armor = Hit
Roll < Armor = Miss
```

### Damage Calculation

```
Base weapon/attack damage
- Defender's damage reduction (if any)
= Final damage (minimum 0)
```

## Animal Design

### Base Stats

| Stat | Description |
|------|-------------|
| **HP** | Health pool. Die at 0. |
| **Attack Mod** | Added to d20 roll when attacking |
| **Armor** | Target number enemies must beat to hit you |

### Animal Components

- **Unarmed Attack:** Unique attack used when no weapon equipped. Has damage value and optional effect.
- **Passive Ability:** Always active, triggers automatically during combat.

### MVP Animals (5)

| Animal | HP | Atk | Armor | Unarmed Attack | Passive |
|--------|-----|-----|-------|----------------|---------|
| **Rat** | 20 | +3 | 10 | Bite (4 dmg) | *Scrappy* — +2 Atk Mod when below 50% HP |
| **Toad** | 28 | +1 | 11 | Tongue Whip (3 dmg, 30% Weaken) | *Thick Skin* — Regen 1 HP per turn |
| **Spider** | 16 | +4 | 9 | Venomous Bite (3 dmg, 40% Poison 2) | *Web Trap* — Enemies have -1 Atk Mod |
| **Mosquito** | 12 | +5 | 8 | Blood Drain (2 dmg, heal 2 HP) | *Evasive* — 20% chance to dodge attacks |
| **Beetle** | 24 | +0 | 14 | Horn Ram (5 dmg) | *Hard Shell* — Take -1 damage from all hits |

## Equipment Design

### Weapons

Weapons replace the animal's unarmed attack.

| Weapon | Damage | Effect | Notes |
|--------|--------|--------|-------|
| **Rusty Dagger** | 5 | — | Reliable baseline |
| **Flame Stick** | 4 | 40% Burn (2 dmg/turn) | Pressure over time |
| **Venom Fang** | 4 | 40% Poison (2 dmg/turn) | Alt DoT option |
| **Heavy Rock** | 7 | -1 to your Atk Mod | High risk, high reward |
| **Sapping Thorn** | 3 | Heal 2 HP on hit | Sustain weapon |

### Accessories

Three types: stat sticks, reactive triggers, attack buffs.

| Accessory | Type | Effect |
|-----------|------|--------|
| **Iron Acorn** | Stat | +4 HP |
| **Lucky Pebble** | Stat | +1 Atk Mod |
| **Spiked Collar** | Reactive | Deal 2 damage when hit |
| **Adrenaline Gland** | Reactive | +3 Atk Mod when below 25% HP |
| **Ember Charm** | Buff | Your attacks gain 20% Burn chance |

## Status Effects

| Effect | Behavior | Duration |
|--------|----------|----------|
| **Burn** | Take X damage at end of your turn | 3 turns |
| **Poison** | Take X damage at end of your turn | 3 turns (stacks with Burn) |
| **Weaken** | -2 to Attack Mod | 2 turns |
| **Regen** | Heal X HP at start of your turn | 3 turns |

Effects tick down at the end of the affected animal's turn. Multiple DoTs can stack.

## CPU Opponents

| CPU | Animal | Weapon | Accessory | Strategy |
|-----|--------|--------|-----------|----------|
| **CPU 1 (Easy)** | Beetle | Rusty Dagger | Iron Acorn | Tanky, low damage. Teaches basic combat. |
| **CPU 2 (Medium)** | Rat | Flame Stick | Lucky Pebble | Accurate + DoT pressure. Tests HP management. |
| **CPU 3 (Hard)** | Spider | Venom Fang | Adrenaline Gland | Poison stacking + dangerous when low. |

### Difficulty Curve

- **CPU 1:** Low threat. Should win with ~70-80% HP remaining.
- **CPU 2:** Real threat, applies Burn. Exit with 40-60% HP.
- **CPU 3:** Highest damage, Poison stacks. Rewards sustain builds.

## Technical Architecture

### Tech Stack

| Layer | Choice |
|-------|--------|
| Engine | Phaser 3 |
| Language | TypeScript |
| Build | Vite |
| Hosting | Static (GitHub Pages, Netlify, etc.) |

### Scene Structure

```
MenuScene → LoadoutScene → BattleScene → (DraftScene → BattleScene) × 2 → ResultScene
```

| Scene | Responsibility |
|-------|----------------|
| **MenuScene** | Title screen, "Start" button, load assets |
| **LoadoutScene** | Select animal, weapon, accessory. Confirm to begin run. |
| **BattleScene** | Render combat, animate turns, show HP/status, detect win/lose |
| **DraftScene** | Show 3 random gear picks after CPU 1 and CPU 2. Skip option. |
| **ResultScene** | "Victory" or "Defeat" screen, return to menu |

### State Management

```typescript
interface GameState {
  player: {
    animal: Animal;
    weapon: Weapon | null;
    accessory: Accessory | null;
    currentHP: number;
    statuses: Status[];
  };
  run: {
    currentCPU: 1 | 2 | 3;
    cpuDefeated: boolean[];
  };
}
```

### File Structure

```
/src
  /scenes       (Menu, Loadout, Battle, Draft, Result)
  /entities     (Animal, Weapon, Accessory, Status)
  /data         (animal definitions, gear definitions, CPU loadouts)
  /systems      (CombatSystem, DiceRoller, StatusManager)
  /ui           (HealthBar, StatusIcons, DamageNumbers)
  main.ts       (Phaser config, scene registration)
/assets
  /sprites
    animals/
    weapons/
    accessories/
    effects/
  /audio
  /ui
```

## MVP Scope

### Included

- 5 animals (Rat, Toad, Spider, Mosquito, Beetle)
- 5 weapons
- 5 accessories
- 3 CPU opponents in fixed gauntlet
- 2 draft phases (after CPU 1 and CPU 2)
- Full loadout selection at run start
- Automated turn-based combat with d20 rolls
- 4 status effects (Burn, Poison, Weaken, Regen)
- Win/lose conditions with result screen

### Not in MVP

- Sound/music
- Save system
- Multiple gauntlets/modes
- Unlockables/progression
- PvP
