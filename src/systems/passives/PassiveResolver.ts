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
