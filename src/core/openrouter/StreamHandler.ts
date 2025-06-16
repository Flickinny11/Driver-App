

/**
 * Handles streaming responses from AI models with proper error handling and cancellation
 */
export class StreamHandler {
  private activeStreams: Map<string, AbortController> = new Map();
  private readonly MAX_CONCURRENT_STREAMS = 5;

  /**
   * Start a new streaming session
   */
  async startStream(
    streamId: string,
    streamFunction: (signal: AbortSignal) => Promise<void>,
    options: StreamOptions = {}
  ): Promise<void> {
    // Check if we've reached the maximum concurrent streams
    if (this.activeStreams.size >= this.MAX_CONCURRENT_STREAMS) {
      throw new Error('Maximum concurrent streams reached');
    }

    // Check if stream with this ID already exists
    if (this.activeStreams.has(streamId)) {
      throw new Error(`Stream with ID ${streamId} already exists`);
    }

    const controller = new AbortController();
    this.activeStreams.set(streamId, controller);

    try {
      // Set up timeout if specified
      let timeoutId: NodeJS.Timeout | undefined;
      if (options.timeout) {
        timeoutId = setTimeout(() => {
          controller.abort();
        }, options.timeout);
      }

      // Execute the stream function
      await streamFunction(controller.signal);

      // Clear timeout if stream completed successfully
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        options.onAbort?.(streamId);
      } else {
        options.onError?.(streamId, error instanceof Error ? error : new Error('Unknown error'));
      }
      throw error;
    } finally {
      // Clean up
      this.activeStreams.delete(streamId);
      options.onComplete?.(streamId);
    }
  }

  /**
   * Cancel a specific stream
   */
  cancelStream(streamId: string): boolean {
    const controller = this.activeStreams.get(streamId);
    if (controller) {
      controller.abort();
      this.activeStreams.delete(streamId);
      return true;
    }
    return false;
  }

  /**
   * Cancel all active streams
   */
  cancelAllStreams(): void {
    this.activeStreams.forEach((controller) => {
      controller.abort();
    });
    this.activeStreams.clear();
  }

  /**
   * Get list of active stream IDs
   */
  getActiveStreams(): string[] {
    return Array.from(this.activeStreams.keys());
  }

  /**
   * Check if a stream is active
   */
  isStreamActive(streamId: string): boolean {
    return this.activeStreams.has(streamId);
  }

  /**
   * Create a buffered token handler that batches tokens for better performance
   */
  createBufferedTokenHandler(
    onTokenBatch: (tokens: string) => void,
    bufferTime: number = 50 // milliseconds
  ): (token: string) => void {
    let buffer = '';
    let timeoutId: NodeJS.Timeout | undefined;

    return (token: string) => {
      buffer += token;

      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Set new timeout to flush buffer
      timeoutId = setTimeout(() => {
        if (buffer) {
          onTokenBatch(buffer);
          buffer = '';
        }
      }, bufferTime);
    };
  }

  /**
   * Create a token handler with rate limiting
   */
  createRateLimitedTokenHandler(
    onToken: (token: string) => void,
    maxTokensPerSecond: number = 100
  ): (token: string) => void {
    const tokenTimes: number[] = [];

    return (token: string) => {
      const now = Date.now();
      
      // Remove tokens older than 1 second
      while (tokenTimes.length > 0 && now - tokenTimes[0] > 1000) {
        tokenTimes.shift();
      }

      // Check if we're within rate limit
      if (tokenTimes.length < maxTokensPerSecond) {
        tokenTimes.push(now);
        onToken(token);
      }
      // If rate limited, we simply drop the token
    };
  }

  /**
   * Create a token handler with markdown streaming support
   */
  createMarkdownStreamHandler(
    onUpdate: (markdown: string, isComplete: boolean) => void
  ): (token: string) => void {
    let accumulator = '';
    let isInCodeBlock = false;

    return (token: string) => {
      accumulator += token;

      // Detect code block boundaries
      const lines = accumulator.split('\n');
      let processedContent = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('```')) {
          if (!isInCodeBlock) {
            isInCodeBlock = true;
          } else {
            isInCodeBlock = false;
          }
        }
        
        processedContent += line;
        if (i < lines.length - 1) {
          processedContent += '\n';
        }
      }

      onUpdate(processedContent, false);
    };
  }

  /**
   * Create a stream progress tracker
   */
  createProgressTracker(
    onProgress: (progress: StreamProgress) => void,
    estimatedTokens?: number
  ): (token: string) => void {
    let tokenCount = 0;
    let startTime = Date.now();
    let lastUpdateTime = startTime;

    return (_token: string) => {
      tokenCount++;
      const now = Date.now();
      const elapsed = now - startTime;
      const tokensPerSecond = tokenCount / (elapsed / 1000);

      // Update progress
      const progress: StreamProgress = {
        tokenCount,
        tokensPerSecond,
        elapsedTime: elapsed,
        estimatedCompletion: estimatedTokens ? 
          (estimatedTokens - tokenCount) / tokensPerSecond * 1000 : undefined
      };

      // Throttle progress updates to every 100ms
      if (now - lastUpdateTime >= 100) {
        onProgress(progress);
        lastUpdateTime = now;
      }
    };
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.cancelAllStreams();
  }
}

// Supporting types and interfaces
export interface StreamOptions {
  timeout?: number;
  onComplete?: (streamId: string) => void;
  onError?: (streamId: string, error: Error) => void;
  onAbort?: (streamId: string) => void;
}

export interface StreamProgress {
  tokenCount: number;
  tokensPerSecond: number;
  elapsedTime: number;
  estimatedCompletion?: number;
}

export interface StreamSession {
  id: string;
  startTime: Date;
  model: string;
  tokenCount: number;
  status: 'active' | 'completed' | 'cancelled' | 'error';
}