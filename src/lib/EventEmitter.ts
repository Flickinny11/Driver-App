/**
 * Browser-compatible EventEmitter implementation
 */
export class EventEmitter {
  private events: Map<string, Function[]> = new Map();
  private maxListeners = 10;

  /**
   * Add an event listener
   */
  on(event: string, listener: Function): this {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const listeners = this.events.get(event)!;
    listeners.push(listener);

    // Warn about potential memory leaks
    if (listeners.length > this.maxListeners) {
      console.warn(`MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ${listeners.length} ${event} listeners added.`);
    }

    return this;
  }

  /**
   * Add a one-time event listener
   */
  once(event: string, listener: Function): this {
    const onceWrapper = (...args: any[]) => {
      this.removeListener(event, onceWrapper);
      listener.apply(this, args);
    };

    return this.on(event, onceWrapper);
  }

  /**
   * Remove an event listener
   */
  removeListener(event: string, listener: Function): this {
    const listeners = this.events.get(event);
    if (!listeners) return this;

    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }

    if (listeners.length === 0) {
      this.events.delete(event);
    }

    return this;
  }

  /**
   * Remove an event listener (alias for removeListener)
   */
  off(event: string, listener: Function): this {
    return this.removeListener(event, listener);
  }

  /**
   * Remove all listeners for an event, or all events
   */
  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }

  /**
   * Emit an event
   */
  emit(event: string, ...args: any[]): boolean {
    const listeners = this.events.get(event);
    if (!listeners || listeners.length === 0) {
      return false;
    }

    // Call all listeners
    listeners.forEach(listener => {
      try {
        listener.apply(this, args);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });

    return true;
  }

  /**
   * Get the list of event names
   */
  eventNames(): string[] {
    return Array.from(this.events.keys());
  }

  /**
   * Get the listeners for an event
   */
  listeners(event: string): Function[] {
    return this.events.get(event)?.slice() || [];
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.length || 0;
  }

  /**
   * Set the maximum number of listeners
   */
  setMaxListeners(max: number): this {
    this.maxListeners = max;
    return this;
  }

  /**
   * Get the maximum number of listeners
   */
  getMaxListeners(): number {
    return this.maxListeners;
  }
}