import type { AnimationQueue } from './AnimationQueue';
import type { TurnPhase, PhaseEvent } from '../types/events';

export type PhaseHook = (combatantId: string) => Promise<void>;

const PHASE_ORDER: TurnPhase[] = ['pre_attack', 'attack', 'post_attack', 'turn_end'];

export class TurnPhaseManager {
  private _currentPhase: TurnPhase = 'pre_attack';
  private _phaseIndex = 0;
  private _activeCombatant: string | null = null;
  private _phaseComplete = false;
  private hooks: Map<TurnPhase, PhaseHook[]> = new Map();

  constructor(private animationQueue: AnimationQueue) {
    // Initialize hook arrays for each phase
    for (const phase of PHASE_ORDER) {
      this.hooks.set(phase, []);
    }
  }

  get currentPhase(): TurnPhase {
    return this._currentPhase;
  }

  get activeCombatant(): string | null {
    return this._activeCombatant;
  }

  get isPhaseComplete(): boolean {
    return this._phaseComplete;
  }

  /**
   * Start a new turn for the given combatant.
   * Resets phase to pre_attack.
   */
  startTurn(combatantId: string): void {
    this._activeCombatant = combatantId;
    this._phaseIndex = 0;
    this._currentPhase = PHASE_ORDER[0];
    this._phaseComplete = false;
    this.emitPhaseEvent();
  }

  /**
   * Advance to the next phase.
   * Returns true if there are more phases, false if turn is complete.
   */
  nextPhase(): boolean {
    this._phaseIndex++;
    this._phaseComplete = false;

    if (this._phaseIndex >= PHASE_ORDER.length) {
      return false;
    }

    this._currentPhase = PHASE_ORDER[this._phaseIndex];
    this.emitPhaseEvent();
    return true;
  }

  /**
   * Mark the current phase as complete.
   */
  markPhaseComplete(): void {
    this._phaseComplete = true;
  }

  /**
   * Register a hook to be called during a specific phase.
   * Returns an unregister function.
   */
  registerHook(phase: TurnPhase, hook: PhaseHook): () => void {
    const phaseHooks = this.hooks.get(phase)!;
    phaseHooks.push(hook);

    return () => {
      const index = phaseHooks.indexOf(hook);
      if (index !== -1) {
        phaseHooks.splice(index, 1);
      }
    };
  }

  /**
   * Execute all hooks for the current phase.
   */
  async executeCurrentPhase(): Promise<void> {
    if (!this._activeCombatant) {
      return;
    }

    const phaseHooks = this.hooks.get(this._currentPhase)!;
    for (const hook of phaseHooks) {
      await hook(this._activeCombatant);
    }
  }

  /**
   * Execute a complete turn: all phases in sequence.
   */
  async executeTurn(combatantId: string): Promise<void> {
    this.startTurn(combatantId);

    do {
      await this.executeCurrentPhase();
      this.markPhaseComplete();
    } while (this.nextPhase());
  }

  /**
   * Emit a phase event to the animation queue.
   */
  private emitPhaseEvent(): void {
    if (!this._activeCombatant) return;

    const event: PhaseEvent = {
      type: 'phase',
      timestamp: Date.now(),
      phase: this._currentPhase,
      combatantId: this._activeCombatant,
    };
    this.animationQueue.enqueue(event);
  }
}
