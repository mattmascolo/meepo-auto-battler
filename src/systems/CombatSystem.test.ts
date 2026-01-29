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
      rat.currentHP = 4; // Below 25% of 20 (and also below 50%, so Scrappy triggers too)
      expect(combatSystem.getEffectiveAttackMod(rat, null)).toBe(8); // 3 + 2 (Scrappy) + 3 (Adrenaline)
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
      vi.spyOn(diceRoller, 'checkProc').mockReturnValue(false);

      const attacker = createCombatant('rat', 'rusty-dagger');
      const defender = createCombatant('beetle');

      const event = combatSystem.executeAttack(attacker, defender);

      expect(event.type).toBe('attack');
      expect(event.hit).toBe(true);
      expect(event.damage).toBe(4); // 5 - 1 (beetle damage reduction)
      expect(defender.currentHP).toBe(20); // 24 - 4
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
      vi.spyOn(diceRoller, 'checkProc').mockReturnValue(true);

      const attacker = createCombatant('rat', 'flame-stick');
      const defender = createCombatant('toad');

      combatSystem.executeAttack(attacker, defender);

      expect(defender.statuses.some(s => s.type === 'burn')).toBe(true);
    });

    it('should heal on hit with sapping thorn', () => {
      vi.spyOn(diceRoller, 'rollD20').mockReturnValue(20);
      vi.spyOn(diceRoller, 'checkProc').mockReturnValue(false);

      const attacker = createCombatant('rat', 'sapping-thorn');
      attacker.currentHP = 15;
      const defender = createCombatant('toad');

      combatSystem.executeAttack(attacker, defender);

      expect(attacker.currentHP).toBe(17); // healed 2
    });

    it('should trigger spiked collar damage on defender hit', () => {
      vi.spyOn(diceRoller, 'rollD20').mockReturnValue(20);
      vi.spyOn(diceRoller, 'checkProc').mockReturnValue(false);

      const attacker = createCombatant('rat');
      const defender = createCombatant('toad', undefined, 'spiked-collar');
      const initialHP = attacker.currentHP;

      combatSystem.executeAttack(attacker, defender);

      expect(attacker.currentHP).toBe(initialHP - 2);
    });

    it('should check dodge for mosquito evasive passive', () => {
      vi.spyOn(diceRoller, 'rollD20').mockReturnValue(20);
      vi.spyOn(diceRoller, 'checkProc').mockReturnValue(true); // dodge succeeds

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
      expect(event.dotDamage).toBe(2);
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
