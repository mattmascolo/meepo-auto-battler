import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CombatSystem } from './CombatSystem';
import { DiceRoller } from './DiceRoller';
import { StatusManager } from './StatusManager';
import { PassiveResolver, createDefaultRegistry } from './passives';
import type { Combatant, Accessory } from '../types';
import { getAnimalById } from '../data/animals';
import { getWeaponById } from '../data/weapons';
import { ACCESSORIES } from '../data/accessories';
import { DRAFT_ACCESSORIES } from '../data/draftGear';

function findAccessory(id: string): Accessory | undefined {
  return ACCESSORIES.find(a => a.id === id) || DRAFT_ACCESSORIES.find(a => a.id === id);
}

function createCombatant(animalId: string, weaponId?: string, accessoryId?: string): Combatant {
  const animal = getAnimalById(animalId)!;
  const weapon = weaponId ? getWeaponById(weaponId) ?? null : null;
  const accessory = accessoryId ? findAccessory(accessoryId) ?? null : null;
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

    it('should apply oswald keen eye flat armor bonus', () => {
      // Oswald has base armor 8 + Keen Eye +2 = 10
      const oswald = createCombatant('oswald');
      expect(combatSystem.getEffectiveArmor(oswald)).toBe(10);
    });

    it('should apply sir-pokesalot knight valor when below 50% HP', () => {
      // Sir Pokesalot has base armor 13, +2 when below 50% HP
      const sirPokesalot = createCombatant('sir-pokesalot');
      // At full HP, should be 13
      expect(combatSystem.getEffectiveArmor(sirPokesalot)).toBe(13);
      // Below 50% HP (21/2 = 10.5), should be 15
      sirPokesalot.currentHP = 10;
      expect(combatSystem.getEffectiveArmor(sirPokesalot)).toBe(15);
    });

    it('should not apply sir-pokesalot bonus when above 50% HP', () => {
      const sirPokesalot = createCombatant('sir-pokesalot');
      // Above 50% HP (21 * 0.5 = 10.5), should NOT trigger
      sirPokesalot.currentHP = 11; // Above threshold
      expect(combatSystem.getEffectiveArmor(sirPokesalot)).toBe(13);
    });

    it('should add accessory armor bonus', () => {
      // beep-boop (11) + dragons_scale (+2) = 13
      const fighter = createCombatant('beep-boop', undefined, 'dragons_scale');
      expect(combatSystem.getEffectiveArmor(fighter)).toBe(13);
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

    it('should trigger esmeralda mystic shield dodge', () => {
      vi.spyOn(diceRoller, 'rollD20').mockReturnValue(20); // Hit
      vi.spyOn(diceRoller, 'checkProc').mockReturnValue(true); // Dodge procs

      const attacker = createCombatant('humphrey');
      const esmeralda = createCombatant('esmeralda');
      const initialHP = esmeralda.currentHP;

      const event = combatSystem.executeAttack(attacker, esmeralda);

      expect(event.hit).toBe(false);
      expect(event.dodged).toBe(true);
      expect(esmeralda.currentHP).toBe(initialHP); // No damage taken
    });

    it('should NOT dodge when proc fails for esmeralda', () => {
      vi.spyOn(diceRoller, 'rollD20').mockReturnValue(20); // Hit
      vi.spyOn(diceRoller, 'checkProc').mockReturnValue(false); // Dodge doesn't proc

      const attacker = createCombatant('humphrey');
      const esmeralda = createCombatant('esmeralda');
      const initialHP = esmeralda.currentHP;

      const event = combatSystem.executeAttack(attacker, esmeralda);

      expect(event.hit).toBe(true);
      expect(event.dodged).toBeUndefined();
      expect(esmeralda.currentHP).toBeLessThan(initialHP);
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

    it('should apply moo-man milk power conditional regen when below 50% HP', () => {
      // Moo-Man has Milk Power: regen 2 HP when below 50%
      const mooMan = createCombatant('moo-man'); // HP 26
      mooMan.currentHP = 10; // Below 50%

      const event = combatSystem.executeTurnEnd(mooMan);

      expect(event.regenHealing).toBe(2);
      expect(mooMan.currentHP).toBe(12);
    });

    it('should NOT apply moo-man regen when at or above 50% HP', () => {
      const mooMan = createCombatant('moo-man'); // HP 26
      mooMan.currentHP = 20; // Above 50%

      const event = combatSystem.executeTurnEnd(mooMan);

      expect(event.regenHealing).toBe(0);
      expect(mooMan.currentHP).toBe(20);
    });

    it('should apply murder bloodthirst conditional regen when below 50% HP', () => {
      // Murder has Bloodthirst: regen 2 HP when below 50%
      const murder = createCombatant('murder'); // HP 17
      murder.currentHP = 5; // Below 50%

      const event = combatSystem.executeTurnEnd(murder);

      expect(event.regenHealing).toBe(2);
      expect(murder.currentHP).toBe(7);
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

  describe('stat_flat passives via registry', () => {
    it('should apply oswald keen eye armor via registry', () => {
      const oswald = createCombatant('oswald');
      expect(combatSystem.getEffectiveArmor(oswald)).toBe(10); // 8 base + 2 keen eye
    });

    it('should apply pang frost aura via registry', () => {
      const pang = createCombatant('pang');
      const enemy = createCombatant('beep-boop');
      expect(combatSystem.getEffectiveAttackMod(enemy, pang)).toBe(2); // 3 - 1
    });
  });

  describe('stat_conditional passives via registry', () => {
    it('should apply sir-pokesalot armor bonus when below 50% HP', () => {
      const sirPokesalot = createCombatant('sir-pokesalot');
      expect(combatSystem.getEffectiveArmor(sirPokesalot)).toBe(13);
      sirPokesalot.currentHP = 10;
      expect(combatSystem.getEffectiveArmor(sirPokesalot)).toBe(15);
    });

    it('should apply wilber berserker rage attack bonus when below 50% HP', () => {
      const wilber = createCombatant('wilber');
      expect(combatSystem.getEffectiveAttackMod(wilber, null)).toBe(3);
      wilber.currentHP = 10; // Below 50% of 22 (threshold is 11)
      expect(combatSystem.getEffectiveAttackMod(wilber, null)).toBe(5); // 3 + 2
    });
  });

  describe('on_attacked passives via registry', () => {
    it('should apply beep-boop damage reduction via registry', () => {
      const beepBoop = createCombatant('beep-boop');
      expect(combatSystem.getDamageReduction(beepBoop)).toBe(1);
    });

    it('should apply sarah hard shell damage reduction via registry', () => {
      const sarah = createCombatant('sarah');
      expect(combatSystem.getDamageReduction(sarah)).toBe(1);
    });

    it('should trigger esmeralda dodge via registry', () => {
      vi.spyOn(diceRoller, 'rollD20').mockReturnValue(20);
      vi.spyOn(diceRoller, 'checkProc').mockReturnValue(true);

      const attacker = createCombatant('humphrey');
      const esmeralda = createCombatant('esmeralda');
      const initialHP = esmeralda.currentHP;

      const event = combatSystem.executeAttack(attacker, esmeralda);

      expect(event.dodged).toBe(true);
      expect(esmeralda.currentHP).toBe(initialHP);
    });
  });

  describe('per_turn passives via registry', () => {
    it('should apply humphrey thick skin regen via registry', () => {
      const humphrey = createCombatant('humphrey');
      humphrey.currentHP = 25;

      const event = combatSystem.executeTurnEnd(humphrey);

      expect(event.regenHealing).toBe(1);
      expect(humphrey.currentHP).toBe(26);
    });

    it('should apply geezer wisdom of ages regen via registry', () => {
      const geezer = createCombatant('geezer');
      geezer.currentHP = 10;

      const event = combatSystem.executeTurnEnd(geezer);

      expect(event.regenHealing).toBe(2);
      expect(geezer.currentHP).toBe(12);
    });
  });

  describe('stat_conditional turn_end passives via registry', () => {
    it('should apply moo-man milk power regen when below 50% via registry', () => {
      const mooMan = createCombatant('moo-man');
      mooMan.currentHP = 10;

      const event = combatSystem.executeTurnEnd(mooMan);

      expect(event.regenHealing).toBe(2);
      expect(mooMan.currentHP).toBe(12);
    });

    it('should NOT apply moo-man regen when above 50%', () => {
      const mooMan = createCombatant('moo-man');
      mooMan.currentHP = 20;

      const event = combatSystem.executeTurnEnd(mooMan);

      expect(event.regenHealing).toBe(0);
    });

    it('should apply murder bloodthirst regen when below 50% via registry', () => {
      const murder = createCombatant('murder');
      murder.currentHP = 5;

      const event = combatSystem.executeTurnEnd(murder);

      expect(event.regenHealing).toBe(2);
      expect(murder.currentHP).toBe(7);
    });
  });
});
