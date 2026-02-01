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
