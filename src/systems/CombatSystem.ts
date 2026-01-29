import type { Combatant, StatusType } from '../types';
import { DiceRoller } from './DiceRoller';
import { StatusManager } from './StatusManager';

export interface AttackEvent {
  type: 'attack';
  attacker: string;
  defender: string;
  attackName: string;
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
  dotDamage: number;
  regenHealing: number;
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
    mod -= this.statusManager.getWeakenAmount(combatant.statuses);

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

  getAttackName(combatant: Combatant): string {
    if (combatant.weapon) {
      return combatant.weapon.name;
    }
    return combatant.animal.unarmedAttack.name;
  }

  private getAttackDetails(combatant: Combatant): {
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
    const rollResult = this.diceRoller.rollToHit(attackMod, targetArmor);

    const event: AttackEvent = {
      type: 'attack',
      attacker: attacker.animal.name,
      defender: defender.animal.name,
      attackName: this.getAttackName(attacker),
      roll: rollResult.roll,
      modifier: rollResult.modifier,
      total: rollResult.total,
      targetArmor,
      hit: false,
      damage: 0,
    };

    // Check if attack hits
    if (!rollResult.hit) {
      return event;
    }

    // Check dodge (Mosquito Evasive passive)
    if (defender.animal.passive.effect.dodgeChance) {
      if (this.diceRoller.checkProc(defender.animal.passive.effect.dodgeChance)) {
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
    if (attackDetails.effectChance && attackDetails.effectType && attackDetails.effectValue) {
      if (this.diceRoller.checkProc(attackDetails.effectChance)) {
        const duration = attackDetails.effectType === 'weaken' ? 2 : 3;
        this.statusManager.addStatus(defender.statuses, attackDetails.effectType, attackDetails.effectValue, duration);
        event.statusApplied = attackDetails.effectType;
      }
    }

    // Ember Charm adds 20% burn chance (only if no status already applied)
    if (!event.statusApplied && attacker.accessory?.effect.burnChance) {
      if (this.diceRoller.checkProc(attacker.accessory.effect.burnChance)) {
        this.statusManager.addStatus(defender.statuses, 'burn', 2, 3);
        event.statusApplied = 'burn';
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
    let regenHealing = 0;
    let dotDamage = 0;

    // Apply Toad regen passive
    if (combatant.animal.passive.type === 'per_turn' && combatant.animal.passive.effect.regen) {
      const healAmount = Math.min(
        combatant.animal.passive.effect.regen,
        combatant.maxHP - combatant.currentHP
      );
      combatant.currentHP += healAmount;
      regenHealing = healAmount;
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

  isCombatantDead(combatant: Combatant): boolean {
    return combatant.currentHP <= 0;
  }
}
