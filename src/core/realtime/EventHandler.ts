import type { WebSocketEvent } from '@/types';

/**
 * Handles and routes WebSocket events with type safety and error handling
 */
export class EventHandler {
  private handlers: Map<string, EventHandlerFunction[]> = new Map();
  private middlewares: EventMiddleware[] = [];
  private eventHistory: WebSocketEvent[] = [];
  private readonly MAX_HISTORY_SIZE = 1000;

  /**
   * Register an event handler
   */
  on<T extends WebSocketEvent>(
    eventType: T['type'] | string,
    handler: EventHandlerFunction,
    options: EventHandlerOptions = {}
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    const wrappedHandler = this.wrapHandler(handler, options);
    this.handlers.get(eventType)!.push(wrappedHandler);

    // Return unsubscribe function
    return () => {
      this.off(eventType, wrappedHandler);
    };
  }

  /**
   * Register a one-time event handler
   */
  once<T extends WebSocketEvent>(
    eventType: T['type'] | string,
    handler: EventHandlerFunction,
    options: EventHandlerOptions = {}
  ): () => void {
    const wrappedHandler = (event: WebSocketEvent) => {
      handler(event);
      this.off(eventType, wrappedHandler as EventHandlerFunction);
    };

    return this.on(eventType, wrappedHandler as EventHandlerFunction, options);
  }

  /**
   * Unregister an event handler
   */
  off(eventType: string, handler?: EventHandlerFunction): void {
    if (!handler) {
      // Remove all handlers for this event type
      this.handlers.delete(eventType);
      return;
    }

    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
      
      // Clean up empty handler arrays
      if (handlers.length === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  /**
   * Emit an event to all registered handlers
   */
  async emit<T extends WebSocketEvent>(event: T): Promise<void> {
    // Add to history
    this.addToHistory(event);

    // Apply middlewares
    let processedEvent = event;
    for (const middleware of this.middlewares) {
      try {
        const result = await middleware(processedEvent);
        if (result === false) {
          // Middleware blocked the event
          return;
        }
        if (result && typeof result === 'object') {
          processedEvent = result as T;
        }
      } catch (error) {
        console.error('Error in event middleware:', error);
      }
    }

    // Get handlers for this event type
    const handlers = this.handlers.get(processedEvent.type) || [];
    const wildcardHandlers = this.handlers.get('*') || [];
    const allHandlers = [...handlers, ...wildcardHandlers];

    if (allHandlers.length === 0) {
      return;
    }

    // Execute handlers concurrently
    const promises = allHandlers.map(async handler => {
      try {
        await handler(processedEvent);
      } catch (error) {
        console.error(`Error in event handler for ${processedEvent.type}:`, error);
        // Emit error event
        this.emit({
          type: 'error',
          data: {
            error: error instanceof Error ? error.message : 'Unknown error',
            originalEvent: processedEvent,
            recoverable: true
          },
          timestamp: new Date(),
          source: 'event-handler'
        } as any);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Add middleware to process events before they reach handlers
   */
  use(middleware: EventMiddleware): () => void {
    this.middlewares.push(middleware);

    // Return function to remove middleware
    return () => {
      const index = this.middlewares.indexOf(middleware);
      if (index > -1) {
        this.middlewares.splice(index, 1);
      }
    };
  }

  /**
   * Wrap handler with additional functionality
   */
  private wrapHandler(
    handler: EventHandlerFunction,
    options: EventHandlerOptions
  ): EventHandlerFunction {
    return async (event: WebSocketEvent) => {
      // Rate limiting
      if (options.rateLimit) {
        const key = `${event.type}_${event.source}`;
        if (!this.checkRateLimit(key, options.rateLimit)) {
          return;
        }
      }

      // Debouncing
      if (options.debounce) {
        return this.debounce(handler, options.debounce)(event);
      }

      // Throttling
      if (options.throttle) {
        return this.throttle(handler, options.throttle)(event);
      }

      // Execute handler
      await handler(event);
    };
  }

  /**
   * Rate limiting implementation
   */
  private rateLimitMap = new Map<string, number[]>();
  
  private checkRateLimit(key: string, limit: RateLimit): boolean {
    const now = Date.now();
    const window = limit.window * 1000; // Convert to milliseconds
    
    if (!this.rateLimitMap.has(key)) {
      this.rateLimitMap.set(key, []);
    }
    
    const timestamps = this.rateLimitMap.get(key)!;
    
    // Remove old timestamps
    while (timestamps.length > 0 && now - timestamps[0] > window) {
      timestamps.shift();
    }
    
    // Check if within limit
    if (timestamps.length >= limit.max) {
      return false;
    }
    
    timestamps.push(now);
    return true;
  }

  /**
   * Debounce implementation
   */
  private debounceMap = new Map<Function, NodeJS.Timeout>();
  
  private debounce(func: EventHandlerFunction, delay: number): EventHandlerFunction {
    return (event: WebSocketEvent) => {
      const timeoutId = this.debounceMap.get(func);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      const newTimeoutId = setTimeout(() => {
        func(event);
        this.debounceMap.delete(func);
      }, delay);
      
      this.debounceMap.set(func, newTimeoutId);
    };
  }

  /**
   * Throttle implementation
   */
  private throttleMap = new Map<Function, { lastCall: number; timeoutId?: NodeJS.Timeout }>();
  
  private throttle(func: EventHandlerFunction, delay: number): EventHandlerFunction {
    return (event: WebSocketEvent) => {
      const now = Date.now();
      const throttleInfo = this.throttleMap.get(func);
      
      if (!throttleInfo || now - throttleInfo.lastCall >= delay) {
        func(event);
        this.throttleMap.set(func, { lastCall: now });
      } else if (!throttleInfo.timeoutId) {
        const timeoutId = setTimeout(() => {
          func(event);
          const info = this.throttleMap.get(func);
          if (info) {
            info.lastCall = Date.now();
            info.timeoutId = undefined;
          }
        }, delay - (now - throttleInfo.lastCall));
        
        throttleInfo.timeoutId = timeoutId;
      }
    };
  }

  /**
   * Add event to history
   */
  private addToHistory(event: WebSocketEvent): void {
    this.eventHistory.push(event);
    
    // Maintain max history size
    if (this.eventHistory.length > this.MAX_HISTORY_SIZE) {
      this.eventHistory.shift();
    }
  }

  /**
   * Get event history
   */
  getEventHistory(filter?: EventHistoryFilter): WebSocketEvent[] {
    let events = [...this.eventHistory];
    
    if (filter) {
      if (filter.type) {
        events = events.filter(event => event.type === filter.type);
      }
      
      if (filter.source) {
        events = events.filter(event => event.source === filter.source);
      }
      
      if (filter.since) {
        events = events.filter(event => event.timestamp >= filter.since!);
      }
      
      if (filter.limit) {
        events = events.slice(-filter.limit);
      }
    }
    
    return events;
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get statistics about event handling
   */
  getStats(): EventHandlerStats {
    const handlerCounts = new Map<string, number>();
    
    for (const [eventType, handlers] of this.handlers) {
      handlerCounts.set(eventType, handlers.length);
    }
    
    return {
      totalHandlers: Array.from(this.handlers.values()).reduce((sum, handlers) => sum + handlers.length, 0),
      handlersByType: Object.fromEntries(handlerCounts),
      middlewareCount: this.middlewares.length,
      historySize: this.eventHistory.length
    };
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    // Clear all handlers
    this.handlers.clear();
    
    // Clear middlewares
    this.middlewares = [];
    
    // Clear debounce timeouts
    for (const timeoutId of this.debounceMap.values()) {
      clearTimeout(timeoutId);
    }
    this.debounceMap.clear();
    
    // Clear throttle timeouts
    for (const throttleInfo of this.throttleMap.values()) {
      if (throttleInfo.timeoutId) {
        clearTimeout(throttleInfo.timeoutId);
      }
    }
    this.throttleMap.clear();
    
    // Clear rate limit map
    this.rateLimitMap.clear();
    
    // Clear history
    this.eventHistory = [];
  }
}

// Supporting types and interfaces
export type EventHandlerFunction<T extends WebSocketEvent = WebSocketEvent> = (event: T) => void | Promise<void>;

export type EventMiddleware = (event: WebSocketEvent) => WebSocketEvent | false | Promise<WebSocketEvent | false>;

export interface EventHandlerOptions {
  rateLimit?: RateLimit;
  debounce?: number;
  throttle?: number;
}

export interface RateLimit {
  max: number;
  window: number; // seconds
}

export interface EventHistoryFilter {
  type?: string;
  source?: string;
  since?: Date;
  limit?: number;
}

export interface EventHandlerStats {
  totalHandlers: number;
  handlersByType: Record<string, number>;
  middlewareCount: number;
  historySize: number;
}