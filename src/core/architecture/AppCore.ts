import { OpenRouterClient } from '../openrouter/OpenRouterClient';
import { ModelManager } from '../openrouter/ModelManager';
import { StreamHandler } from '../openrouter/StreamHandler';
import { WebSocketManager } from '../realtime/WebSocketManager';
import { EventHandler } from '../realtime/EventHandler';
import { MemoryManager } from '../memory/MemoryManager';
import { StorageAdapter } from '../memory/StorageAdapter';
import type { Config } from '@/types';

/**
 * Core application singleton that manages all services and provides a unified interface
 */
export class AppCore {
  private static instance: AppCore;
  private initialized = false;

  // Core services
  public openRouter!: OpenRouterClient;
  public modelManager!: ModelManager;
  public streamHandler!: StreamHandler;
  public wsManager!: WebSocketManager;
  public eventHandler!: EventHandler;
  public memoryManager!: MemoryManager;
  public storageAdapter!: StorageAdapter;

  // Configuration
  private config: Config;

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): AppCore {
    if (!AppCore.instance) {
      AppCore.instance = new AppCore();
    }
    return AppCore.instance;
  }

  /**
   * Initialize all core services
   */
  async initialize(apiKey?: string): Promise<void> {
    if (this.initialized) {
      console.warn('AppCore already initialized');
      return;
    }

    try {
      console.log('Initializing Driver AI Platform core services...');

      // Set up global error handling first
      this.setupGlobalErrorHandling();

      // Initialize memory management
      this.memoryManager = new MemoryManager();
      await this.memoryManager.initialize();
      
      this.storageAdapter = new StorageAdapter(this.memoryManager);

      // Initialize real-time communication
      this.wsManager = new WebSocketManager({
        url: this.config.api.websocket.url,
        timeout: 20000,
        maxReconnectAttempts: this.config.api.websocket.reconnectAttempts
      });

      this.eventHandler = new EventHandler();

      // Set up WebSocket event forwarding
      this.setupWebSocketEventForwarding();

      // Initialize AI services if API key is provided
      if (apiKey) {
        await this.initializeAIServices(apiKey);
      } else {
        console.log('No API key provided, AI services will be initialized later');
      }

      // Initialize stream handler
      this.streamHandler = new StreamHandler();

      // Load saved configuration
      await this.loadConfiguration();

      this.initialized = true;
      console.log('Driver AI Platform core services initialized successfully');

      // Emit initialization complete event
      await this.eventHandler.emit({
        type: 'system:initialized',
        data: { timestamp: new Date() },
        timestamp: new Date(),
        source: 'app-core'
      });

    } catch (error) {
      console.error('Failed to initialize AppCore:', error);
      throw error;
    }
  }

  /**
   * Initialize AI services with API key
   */
  async initializeAIServices(apiKey: string): Promise<void> {
    try {
      // Get secure API key (could be from environment or user input)
      const secureApiKey = apiKey || await this.getSecureApiKey();
      
      if (!secureApiKey) {
        throw new Error('No API key available for OpenRouter');
      }

      // Initialize OpenRouter client
      this.openRouter = new OpenRouterClient(secureApiKey);
      
      // Test connection
      const isConnected = await this.openRouter.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to OpenRouter');
      }

      // Initialize model manager
      this.modelManager = new ModelManager(secureApiKey);

      console.log('AI services initialized successfully');

      // Emit AI services ready event
      await this.eventHandler.emit({
        type: 'ai:ready',
        data: { 
          models: this.openRouter.getAvailableModels(),
          timestamp: new Date() 
        },
        timestamp: new Date(),
        source: 'app-core'
      });

    } catch (error) {
      console.error('Failed to initialize AI services:', error);
      throw error;
    }
  }

  /**
   * Connect to WebSocket with user authentication
   */
  async connectRealtime(userId: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('AppCore not initialized');
    }

    try {
      await this.wsManager.connect(userId);
      console.log('Real-time connection established');
    } catch (error) {
      console.error('Failed to connect to real-time services:', error);
      throw error;
    }
  }

  /**
   * Get secure API key from environment or storage
   */
  private async getSecureApiKey(): Promise<string | null> {
    // Try environment variable first
    const envKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (envKey) {
      return envKey;
    }

    // Try user settings
    try {
      const userKey = await this.storageAdapter.load('settings', 'openrouter_api_key');
      return userKey as string;
    } catch (error) {
      console.error('Failed to load API key from storage:', error);
      return null;
    }
  }

  /**
   * Set up WebSocket event forwarding to the event handler
   */
  private setupWebSocketEventForwarding(): void {
    // Forward WebSocket events to the event handler
    this.wsManager.on('agentMessage', (data: any) => {
      this.eventHandler.emit({
        type: 'agent:message',
        data,
        timestamp: new Date(),
        source: 'websocket'
      });
    });

    this.wsManager.on('agentStatus', (data: any) => {
      this.eventHandler.emit({
        type: 'agent:status',
        data,
        timestamp: new Date(),
        source: 'websocket'
      });
    });

    this.wsManager.on('previewUpdate', (data: any) => {
      this.eventHandler.emit({
        type: 'preview:update',
        data,
        timestamp: new Date(),
        source: 'websocket'
      });
    });

    this.wsManager.on('error', (error: any) => {
      this.eventHandler.emit({
        type: 'error',
        data: {
          error: error.message || 'WebSocket error',
          details: error,
          recoverable: true
        },
        timestamp: new Date(),
        source: 'websocket'
      });
    });

    this.wsManager.on('connected', () => {
      this.eventHandler.emit({
        type: 'websocket:connected',
        data: { timestamp: new Date() },
        timestamp: new Date(),
        source: 'websocket'
      });
    });

    this.wsManager.on('disconnected', (reason: any) => {
      this.eventHandler.emit({
        type: 'websocket:disconnected',
        data: { reason, timestamp: new Date() },
        timestamp: new Date(),
        source: 'websocket'
      });
    });
  }

  /**
   * Set up global error handling
   */
  private setupGlobalErrorHandling(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleError(event.reason, 'unhandled-promise');
      
      // Prevent the default browser error handling
      event.preventDefault();
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.handleError(event.error, 'uncaught-error');
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        console.error('Resource loading error:', event);
        this.handleError(new Error(`Failed to load resource: ${(event.target as any)?.src || 'unknown'}`), 'resource-error');
      }
    }, true);
  }

  /**
   * Handle errors centrally
   */
  private async handleError(error: any, source: string): Promise<void> {
    const errorEvent = {
      type: 'error' as const,
      data: {
        error: error instanceof Error ? error.message : String(error),
        details: error,
        source,
        recoverable: this.isRecoverableError(error),
        timestamp: new Date()
      },
      timestamp: new Date(),
      source: 'app-core'
    };

    // Emit error event if event handler is available
    if (this.eventHandler) {
      try {
        await this.eventHandler.emit(errorEvent);
      } catch (emitError) {
        console.error('Failed to emit error event:', emitError);
      }
    }

    // Log error to persistent storage for debugging
    if (this.memoryManager) {
      try {
        await this.memoryManager.saveSetting('last_error', {
          error: errorEvent.data,
          timestamp: new Date()
        });
      } catch (saveError) {
        console.error('Failed to save error to storage:', saveError);
      }
    }
  }

  /**
   * Determine if an error is recoverable
   */
  private isRecoverableError(error: any): boolean {
    if (error instanceof Error) {
      // Network errors are usually recoverable
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return true;
      }

      // Temporary failures
      if (error.message.includes('timeout') || error.message.includes('temporary')) {
        return true;
      }

      // WebSocket connection errors are recoverable
      if (error.message.includes('websocket') || error.message.includes('socket')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Load configuration from storage
   */
  private async loadConfiguration(): Promise<void> {
    try {
      const savedConfig = await this.storageAdapter.load('settings', 'app_config');
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig };
      }
    } catch (error) {
      console.warn('Failed to load configuration from storage:', error);
    }
  }

  /**
   * Save configuration to storage
   */
  async saveConfiguration(): Promise<void> {
    try {
      await this.storageAdapter.save('settings', 'app_config', this.config);
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): Config {
    return {
      app: {
        name: 'Driver AI Platform',
        version: '1.0.0',
        environment: import.meta.env.MODE as 'development' | 'production' | 'staging'
      },
      api: {
        openRouter: {
          baseUrl: 'https://openrouter.ai/api/v1',
          timeout: 30000
        },
        websocket: {
          url: import.meta.env.VITE_WS_URL || 
               (import.meta.env.MODE === 'production' 
                ? 'wss://driver-ws.herokuapp.com' 
                : 'ws://localhost:3001'),
          reconnectAttempts: 10,
          reconnectDelay: 1000
        }
      },
      storage: {
        database: 'driver-memory',
        version: 1,
        maxSize: 50 * 1024 * 1024 // 50MB
      },
      ui: {
        theme: {
          default: 'dark',
          enableAnimations: true,
          reducedMotion: false
        },
        performance: {
          lazyLoading: true,
          codesplitting: true,
          prefetchRoutes: true
        }
      }
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): Config {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  async updateConfig(updates: Partial<Config>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.saveConfiguration();
    
    // Emit configuration updated event
    await this.eventHandler.emit({
      type: 'config:updated',
      data: { config: this.config, timestamp: new Date() },
      timestamp: new Date(),
      source: 'app-core'
    });
  }

  /**
   * Check if the core is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get system health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const status: HealthStatus = {
      core: this.initialized,
      ai: !!this.openRouter,
      websocket: this.wsManager?.getConnectionStatus().connected || false,
      storage: !!this.memoryManager,
      timestamp: new Date()
    };

    // Test AI connection if available
    if (this.openRouter) {
      try {
        status.ai = await this.openRouter.testConnection();
      } catch (error) {
        status.ai = false;
      }
    }

    return status;
  }

  /**
   * Perform system maintenance
   */
  async performMaintenance(): Promise<void> {
    console.log('Performing system maintenance...');
    
    try {
      // Memory cleanup
      if (this.memoryManager) {
        await this.memoryManager.performMaintenance();
      }

      // Clear expired caches, clean up resources, etc.
      console.log('System maintenance completed successfully');
    } catch (error) {
      console.error('System maintenance failed:', error);
      throw error;
    }
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    console.log('Disposing AppCore resources...');

    // Dispose all services
    this.streamHandler?.dispose();
    this.wsManager?.dispose();
    this.eventHandler?.dispose();
    this.memoryManager?.dispose();
    this.openRouter?.dispose();

    // Reset state
    this.initialized = false;
    
    console.log('AppCore disposed successfully');
  }
}

// Supporting types
export interface HealthStatus {
  core: boolean;
  ai: boolean;
  websocket: boolean;
  storage: boolean;
  timestamp: Date;
}