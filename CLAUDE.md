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
