import { OpenRouterClient } from '@/core/openrouter/OpenRouterClient';
import type { Task, AgentState } from '@/types';

/**
 * Base class for all agent workers providing common functionality
 * Handles context management, OpenRouter communication, and state management
 */
export abstract class AgentWorkerBase {
  protected contextWindow: ContextWindow;
  protected sharedMemory?: SharedArrayBuffer;
  protected openRouterClient?: OpenRouterClient;
  protected agentId: string = '';
  
  constructor() {
    this.contextWindow = new ContextWindow(100000); // 100k tokens
    this.setupMessageHandler();
  }

  /**
   * Set up the main message handler for worker communication
   */
  private setupMessageHandler(): void {
    self.onmessage = async (event: MessageEvent) => {
      try {
        await this.handleMessage(event.data);
      } catch (error) {
        self.postMessage({
          type: 'error',
          error: error instanceof Error ? error.message : String(error),
          agentId: this.agentId
        });
      }
    };
  }

  /**
   * Handle incoming messages from the main thread
   */
  protected async handleMessage(data: any): Promise<void> {
    switch (data.type) {
      case 'initialize':
        await this.initialize(data);
        break;
        
      case 'initializeWithState':
        await this.initializeWithState(data.state, data.continuationPoint);
        break;
        
      case 'task':
        await this.executeTask(data.task);
        break;
        
      case 'prepareHandoff':
        await this.prepareHandoff();
        break;
        
      default:
        console.warn(`Unknown message type: ${data.type}`);
    }
  }

  /**
   * Initialize the agent worker
   */
  protected async initialize(data: any): Promise<void> {
    this.agentId = data.agentId;
    this.sharedMemory = data.sharedMemory;
    
    // Initialize OpenRouter client if API key is provided
    if (data.apiKey) {
      this.openRouterClient = new OpenRouterClient(data.apiKey);
    }

    this.sendMessage('initialized', { agentId: this.agentId });
  }

  /**
   * Initialize with transferred state from another agent
   */
  protected async initializeWithState(state: AgentState, continuationPoint: any): Promise<void> {
    this.contextWindow.loadState(state.contextWindow);
    // Load other state components
    this.sendMessage('stateLoaded', { agentId: this.agentId, continuationPoint });
  }

  /**
   * Check if context limit is approaching and notify if needed
   */
  protected checkContextLimit(): void {
    const usage = this.contextWindow.getUsage();
    if (usage > 0.8) {
      self.postMessage({
        type: 'contextLimitApproaching',
        usage,
        state: this.extractState(),
        agentId: this.agentId
      });
    }
  }

  /**
   * Send a message to the main thread
   */
  protected sendMessage(type: string, data: any): void {
    self.postMessage({
      type,
      data,
      agentId: this.agentId,
      timestamp: new Date()
    });

    // Also update shared memory if available
    this.updateSharedMemory(data);
  }

  /**
   * Update shared memory with data for other agents
   */
  protected updateSharedMemory(data: any): void {
    if (!this.sharedMemory) return;

    try {
      // Simple implementation - could be enhanced with proper serialization
      const view = new Int32Array(this.sharedMemory);
      const encoded = new TextEncoder().encode(JSON.stringify(data));
      
      // Write to shared memory with atomic operations
      Atomics.store(view, 0, encoded.length);
      // In a real implementation, we'd write the actual data
    } catch (error) {
      console.warn('Failed to update shared memory:', error);
    }
  }

  /**
   * Call OpenRouter API with error handling and context tracking
   */
  protected async callOpenRouter(request: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    max_tokens?: number;
  }): Promise<{ content: string; usage: { total_tokens: number } }> {
    if (!this.openRouterClient) {
      throw new Error('OpenRouter client not initialized');
    }

    const response = await this.openRouterClient.getCompletionWithUsage(request);

    // Update context usage
    this.contextWindow.addUsage(response.usage?.total_tokens || 0);
    this.checkContextLimit();

    return response;
  }

  /**
   * Prepare for handoff to a new agent
   */
  protected async prepareHandoff(): Promise<void> {
    const state = this.extractState();
    this.sendMessage('handoffReady', { state });
  }

  /**
   * Extract current agent state for duplication/handoff
   */
  protected extractState(): AgentState {
    return {
      contextWindow: this.contextWindow.serialize(),
      memory: {}, // Could be enhanced with actual memory
      lastCheckpoint: new Date(),
      workingFiles: [],
      completedTasks: []
    };
  }

  /**
   * Abstract method to be implemented by specialized agents
   */
  protected abstract executeTask(task: Task): Promise<void>;
}

/**
 * Simple context window implementation
 */
class ContextWindow {
  private tokens = 0;
  private maxTokens: number;

  constructor(maxTokens: number) {
    this.maxTokens = maxTokens;
  }

  addUsage(tokens: number): void {
    this.tokens += tokens;
  }

  getUsage(): number {
    return this.tokens / this.maxTokens;
  }

  serialize(): any {
    return { tokens: this.tokens, maxTokens: this.maxTokens };
  }

  loadState(state: any): void {
    this.tokens = state.tokens || 0;
    this.maxTokens = state.maxTokens || 100000;
  }
}