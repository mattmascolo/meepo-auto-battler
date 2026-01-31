import type { CombatEvent, CombatEventListener } from '../types/events';

export type EventHandler = (event: CombatEvent) => Promise<void>;

export class AnimationQueue {
  private queue: CombatEvent[] = [];
  private listeners: Set<CombatEventListener> = new Set();
  private processing = false;

  get length(): number {
    return this.queue.length;
  }

  get isEmpty(): boolean {
    return this.queue.length === 0;
  }

  get isProcessing(): boolean {
    return this.processing;
  }

  /**
   * Add an event to the queue.
   * Notifies all subscribers immediately.
   */
  enqueue(event: CombatEvent): void {
    this.queue.push(event);
    this.notifyListeners(event);
  }

  /**
   * Add multiple events to the queue.
   */
  enqueueAll(events: CombatEvent[]): void {
    for (const event of events) {
      this.enqueue(event);
    }
  }

  /**
   * Remove and return the next event from the queue.
   */
  dequeue(): CombatEvent | undefined {
    return this.queue.shift();
  }

  /**
   * View the next event without removing it.
   */
  peek(): CombatEvent | undefined {
    return this.queue[0];
  }

  /**
   * Remove all events from the queue.
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Process the next event with the given handler.
   * Returns true if an event was processed, false if queue was empty.
   */
  async processNext(handler: EventHandler): Promise<boolean> {
    const event = this.dequeue();
    if (!event) {
      return false;
    }
    await handler(event);
    return true;
  }

  /**
   * Process all events in the queue sequentially.
   */
  async processAll(handler: EventHandler): Promise<void> {
    this.processing = true;
    try {
      while (!this.isEmpty) {
        await this.processNext(handler);
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Subscribe to receive events as they are enqueued.
   * Returns an unsubscribe function.
   */
  subscribe(listener: CombatEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of a new event.
   */
  private notifyListeners(event: CombatEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
