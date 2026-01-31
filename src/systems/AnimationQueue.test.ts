import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnimationQueue } from './AnimationQueue';
import type { CombatEvent, DamageEvent, HealEvent } from '../types/events';

describe('AnimationQueue', () => {
  let queue: AnimationQueue;

  beforeEach(() => {
    queue = new AnimationQueue();
  });

  describe('enqueue', () => {
    it('should add events to the queue', () => {
      const event: DamageEvent = {
        type: 'damage',
        timestamp: Date.now(),
        targetId: 'cpu',
        sourceId: 'player',
        amount: 5,
        damageType: 'physical',
        source: 'attack',
      };
      queue.enqueue(event);
      expect(queue.length).toBe(1);
    });

    it('should maintain FIFO order', () => {
      const event1: DamageEvent = {
        type: 'damage',
        timestamp: 1,
        targetId: 'cpu',
        sourceId: 'player',
        amount: 5,
        damageType: 'physical',
        source: 'attack',
      };
      const event2: HealEvent = {
        type: 'heal',
        timestamp: 2,
        targetId: 'player',
        amount: 3,
        source: 'lifesteal',
      };
      queue.enqueue(event1);
      queue.enqueue(event2);
      expect(queue.peek()?.timestamp).toBe(1);
    });
  });

  describe('dequeue', () => {
    it('should remove and return first event', () => {
      const event: DamageEvent = {
        type: 'damage',
        timestamp: Date.now(),
        targetId: 'cpu',
        sourceId: 'player',
        amount: 5,
        damageType: 'physical',
        source: 'attack',
      };
      queue.enqueue(event);
      const dequeued = queue.dequeue();
      expect(dequeued).toEqual(event);
      expect(queue.length).toBe(0);
    });

    it('should return undefined when empty', () => {
      expect(queue.dequeue()).toBeUndefined();
    });
  });

  describe('peek', () => {
    it('should return first event without removing', () => {
      const event: DamageEvent = {
        type: 'damage',
        timestamp: Date.now(),
        targetId: 'cpu',
        sourceId: 'player',
        amount: 5,
        damageType: 'physical',
        source: 'attack',
      };
      queue.enqueue(event);
      expect(queue.peek()).toEqual(event);
      expect(queue.length).toBe(1);
    });
  });

  describe('clear', () => {
    it('should remove all events', () => {
      queue.enqueue({
        type: 'damage',
        timestamp: Date.now(),
        targetId: 'cpu',
        sourceId: 'player',
        amount: 5,
        damageType: 'physical',
        source: 'attack',
      });
      queue.enqueue({
        type: 'heal',
        timestamp: Date.now(),
        targetId: 'player',
        amount: 3,
        source: 'lifesteal',
      });
      queue.clear();
      expect(queue.length).toBe(0);
    });
  });

  describe('processNext', () => {
    it('should call handler with next event', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const event: DamageEvent = {
        type: 'damage',
        timestamp: Date.now(),
        targetId: 'cpu',
        sourceId: 'player',
        amount: 5,
        damageType: 'physical',
        source: 'attack',
      };
      queue.enqueue(event);
      await queue.processNext(handler);
      expect(handler).toHaveBeenCalledWith(event);
      expect(queue.length).toBe(0);
    });

    it('should return false when queue is empty', async () => {
      const handler = vi.fn();
      const result = await queue.processNext(handler);
      expect(result).toBe(false);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('processAll', () => {
    it('should process all events in order', async () => {
      const processed: number[] = [];
      const handler = vi.fn().mockImplementation(async (event: CombatEvent) => {
        processed.push(event.timestamp);
      });

      queue.enqueue({
        type: 'damage',
        timestamp: 1,
        targetId: 'cpu',
        sourceId: 'player',
        amount: 5,
        damageType: 'physical',
        source: 'attack',
      });
      queue.enqueue({
        type: 'heal',
        timestamp: 2,
        targetId: 'player',
        amount: 3,
        source: 'lifesteal',
      });
      queue.enqueue({
        type: 'damage',
        timestamp: 3,
        targetId: 'player',
        sourceId: 'cpu',
        amount: 4,
        damageType: 'physical',
        source: 'attack',
      });

      await queue.processAll(handler);
      expect(processed).toEqual([1, 2, 3]);
      expect(queue.length).toBe(0);
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers when events are enqueued', () => {
      const listener = vi.fn();
      queue.subscribe(listener);

      const event: DamageEvent = {
        type: 'damage',
        timestamp: Date.now(),
        targetId: 'cpu',
        sourceId: 'player',
        amount: 5,
        damageType: 'physical',
        source: 'attack',
      };
      queue.enqueue(event);
      expect(listener).toHaveBeenCalledWith(event);
    });

    it('should allow unsubscribing', () => {
      const listener = vi.fn();
      const unsubscribe = queue.subscribe(listener);
      unsubscribe();

      queue.enqueue({
        type: 'damage',
        timestamp: Date.now(),
        targetId: 'cpu',
        sourceId: 'player',
        amount: 5,
        damageType: 'physical',
        source: 'attack',
      });
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
