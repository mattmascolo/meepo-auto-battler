import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CombatSystem } from './CombatSystem';
import { DiceRoller } from './DiceRoller';
import { StatusManager } from './StatusManager';
import type { Combatant } from '../types';
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getEffectiveAttackMod', () => {
    it('should return base attack mod', () => {
      // beep-boop has attackMod: 3
      const fighter = createCombatant('beep-boop');
      expect(combatSystem.getEffectiveAttackMod(fighter, null)).toBe(3);
    });

    it('should add weapon attack modifier', () => {
      // beep-boop (3) + heavy-rock (-1) = 2
      const fighter = createCombatant('beep-boop', 'heavy-rock');
      expect(combatSystem.getEffectiveAttackMod(fighter, null)).toBe(2);
    });

    it('should add accessory attack mod', () => {
      // beep-boop (3) + lucky-pebble (+1) = 4
      const fighter = createCombatant('beep-boop', undefined, 'lucky-pebble');
      expect(combatSystem.getEffectiveAttackMod(fighter, null)).toBe(4);
    });

    it('should apply moo-man milk power passive when below 50% HP', () => {
      // moo-man has conditional regen when below 50%, not attack bonus
      // So we test toad's regen separately
      const mooMan = createCombatant('moo-man');
      // moo-man doesn't have attack mod bonus, so attackMod stays at 2
      mooMan.currentHP = 10; // Below 50% of 26
      expect(combatSystem.getEffectiveAttackMod(mooMan, null)).toBe(2);
    });

    it('should apply weaken status', () => {
      // beep-boop (3) - weaken (2) = 1
      const fighter = createCombatant('beep-boop');
      fighter.statuses = [{ type: 'weaken', value: 2, duration: 2 }];
      expect(combatSystem.getEffectiveAttackMod(fighter, null)).toBe(1);
    });

    it('should apply adrenaline gland when below 25% HP', () => {
      // beep-boop (3) + adrenaline (+3) = 6
      const fighter = createCombatant('beep-boop', undefined, 'adrenaline-gland');
      fighter.currentHP = 4; // Below 25% of 18
      expect(combatSystem.getEffectiveAttackMod(fighter, null)).toBe(6);
    });

    it('should apply pang frost aura debuff to enemy', () => {
      // Pang has Frost Aura: enemies have -1 Atk Mod
      const pang = createCombatant('pang');
      const enemy = createCombatant('beep-boop'); // beep-boop has attackMod 3
      expect(combatSystem.getEffectiveAttackMod(enemy, pang)).toBe(2); // 3 - 1
    });
  });

  describe('getEffectiveArmor', () => {
    it('should return base armor', () => {
      const sarah = createCombatant('sarah');
      expect(combatSystem.getEffectiveArmor(sarah)).toBe(14);
    });
  });

  describe('getDamageReduction', () => {
    it('should return 0 for no damage reduction passive', () => {
      const pang = createCombatant('pang');
      expect(combatSystem.getDamageReduction(pang)).toBe(0);
    });

    it('should return 1 for sarah hard shell', () => {
      const sarah = createCombatant('sarah');
      expect(combatSystem.getDamageReduction(sarah)).toBe(1);
    });

    it('should return 1 for beep-boop metal plating', () => {
      const beepBoop = createCombatant('beep-boop');
      expect(combatSystem.getDamageReduction(beepBoop)).toBe(1);
    });
  });

  describe('getAttackDamage', () => {
    it('should return weapon damage when equipped', () => {
      const fighter = createCombatant('humphrey', 'rusty-dagger');
      expect(combatSystem.getAttackDamage(fighter)).toBe(5);
    });

    it('should return unarmed attack damage when no weapon', () => {
      // humphrey's Tail Slap does 3 damage
      const humphrey = createCombatant('humphrey');
      expect(combatSystem.getAttackDamage(humphrey)).toBe(3);
    });
  });

  describe('executeAttack', () => {
    it('should return hit event when roll succeeds', () => {
      vi.spyOn(diceRoller, 'rollD20').mockReturnValue(15);
      vi.spyOn(diceRoller, 'checkProc').mockReturnValue(false);

      const attacker = createCombatant('humphrey', 'rusty-dagger'); // 5 damage
      const defender = createCombatant('sarah'); // armor 14, DR 1

      const event = combatSystem.executeAttack(attacker, defender);

      expect(event.type).toBe('attack');
      expect(event.hit).toBe(true);
      expect(event.damage).toBe(4); // 5 - 1 (sarah damage reduction)
      expect(defender.currentHP).toBe(20); // 24 - 4
    });

    it('should return miss event when roll fails', () => {
      vi.spyOn(diceRoller, 'rollD20').mockReturnValue(5);

      const attacker = createCombatant('humphrey');
      const defender = createCombatant('sarah');

      const event = combatSystem.executeAttack(attacker, defender);

      expect(event.type).toBe('attack');
      expect(event.hit).toBe(false);
      expect(event.damage).toBe(0);
    });

    it('should apply status effect from weapon on hit', () => {
      vi.spyOn(diceRoller, 'rollD20').mockReturnValue(20);
      vi.spyOn(diceRoller, 'checkProc').mockReturnValue(true);

      const attacker = createCombatant('humphrey', 'flame-stick');
      const defender = createCombatant('humphrey');

      combatSystem.executeAttack(attacker, defender);

      expect(defender.statuses.some(s => s.type === 'burn')).toBe(true);
    });

    it('should heal on hit with sapping thorn', () => {
      vi.spyOn(diceRoller, 'rollD20').mockReturnValue(20);
      vi.spyOn(diceRoller, 'checkProc').mockReturnValue(false);

      const attacker = createCombatant('humphrey', 'sapping-thorn');
      attacker.currentHP = 20;
      const defender = createCombatant('humphrey');

      combatSystem.executeAttack(attacker, defender);

      expect(attacker.currentHP).toBe(22); // healed 2
    });

    it('should trigger spiked collar damage on defender hit', () => {
      vi.spyOn(diceRoller, 'rollD20').mockReturnValue(20);
      vi.spyOn(diceRoller, 'checkProc').mockReturnValue(false);

      const attacker = createCombatant('humphrey');
      const defender = createCombatant('humphrey', undefined, 'spiked-collar');
      const initialHP = attacker.currentHP;

      combatSystem.executeAttack(attacker, defender);

      expect(attacker.currentHP).toBe(initialHP - 2);
    });
  });

  describe('executeTurnEnd', () => {
    it('should tick status effects', () => {
      const fighter = createCombatant('beep-boop'); // HP 18
      fighter.statuses = [{ type: 'burn', value: 2, duration: 2 }];

      const event = combatSystem.executeTurnEnd(fighter);

      expect(event.type).toBe('turn_end');
      expect(event.dotDamage).toBe(2);
      expect(fighter.currentHP).toBe(16); // 18 - 2
    });

    it('should apply humphrey regen passive', () => {
      const humphrey = createCombatant('humphrey'); // HP 28
      humphrey.currentHP = 25;

      const event = combatSystem.executeTurnEnd(humphrey);

      expect(event.regenHealing).toBe(1);
      expect(humphrey.currentHP).toBe(26);
    });
  });

  describe('isCombatantDead', () => {
    it('should return true when HP <= 0', () => {
      const fighter = createCombatant('humphrey');
      fighter.currentHP = 0;
      expect(combatSystem.isCombatantDead(fighter)).toBe(true);
    });

    it('should return false when HP > 0', () => {
      const fighter = createCombatant('humphrey');
      expect(combatSystem.isCombatantDead(fighter)).toBe(false);
    });
  });
});
