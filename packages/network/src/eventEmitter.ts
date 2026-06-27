// ─────────────────────────────────────────────────────────────
// Typed Event Emitter
// A minimal, strongly-typed pub/sub used throughout the network layer.
// ─────────────────────────────────────────────────────────────

export type EventMap = { [key: string]: unknown };

export type EventHandler<T> = (payload: T) => void;

/**
 * Lightweight typed event emitter.
 *
 * @example
 * const emitter = new EventEmitter<{ message: string; connected: void }>();
 * emitter.on('message', (msg) => console.log(msg));
 * emitter.emit('message', 'hello');
 */
export class EventEmitter<Events extends EventMap> {
  private handlers: Partial<{
    [K in keyof Events]: Array<EventHandler<Events[K]>>;
  }> = {};

  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): this {
    const existing = this.handlers[event];
    if (existing) {
      existing.push(handler);
    } else {
      this.handlers[event] = [handler];
    }
    return this;
  }

  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): this {
    const existing = this.handlers[event];
    if (!existing) return this;
    this.handlers[event] = existing.filter((h) => h !== handler) as Array<EventHandler<Events[K]>>;
    return this;
  }

  once<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): this {
    const wrapper: EventHandler<Events[K]> = (payload) => {
      handler(payload);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const existing = this.handlers[event];
    if (!existing) return;
    for (const handler of existing) {
      handler(payload);
    }
  }

  removeAllListeners<K extends keyof Events>(event?: K): void {
    if (event) {
      delete this.handlers[event];
    } else {
      this.handlers = {};
    }
  }
}
