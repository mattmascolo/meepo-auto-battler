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
