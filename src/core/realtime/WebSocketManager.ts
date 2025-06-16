import { io, Socket } from 'socket.io-client';
import { EventEmitter } from '@/lib/EventEmitter';
import type { AgentMessage, AgentStatusUpdate, PreviewUpdate, ErrorEvent } from '@/types';

/**
 * Manages WebSocket connections for real-time communication with agents and services
 * Provides automatic reconnection, event handling, and message queuing
 */
export class WebSocketManager extends EventEmitter {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly RECONNECT_DELAY = 1000;
  private readonly MAX_RECONNECT_DELAY = 30000;
  private messageQueue: QueuedMessage[] = [];
  private isConnected = false;
  private connectionAttemptTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds

  constructor(private config: WebSocketConfig = {}) {
    super();
    this.setMaxListeners(50); // Increase max listeners for multiple subscribers
  }

  /**
   * Connect to the WebSocket server
   */
  connect(userId: string, options: ConnectOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      const wsUrl = this.config.url || 
        (process.env.NODE_ENV === 'production' 
          ? 'wss://driver-ws.herokuapp.com' 
          : 'ws://localhost:3001');

      try {
        this.socket = io(wsUrl, {
          auth: { 
            userId,
            ...options.auth 
          },
          transports: ['websocket', 'polling'],
          reconnection: false, // We handle reconnection manually
          timeout: this.config.timeout || 20000,
          forceNew: true,
          ...options.socketOptions
        });

        this.setupEventHandlers();

        // Set connection timeout
        this.connectionAttemptTimeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
          this.disconnect();
        }, this.config.timeout || 20000);

        // Wait for connection
        this.socket.once('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          if (this.connectionAttemptTimeout) {
            clearTimeout(this.connectionAttemptTimeout);
            this.connectionAttemptTimeout = null;
          }

          this.startHeartbeat();
          this.flushMessageQueue();
          this.emit('connected');
          resolve();
        });

        this.socket.once('connect_error', (error) => {
          if (this.connectionAttemptTimeout) {
            clearTimeout(this.connectionAttemptTimeout);
            this.connectionAttemptTimeout = null;
          }
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Set up event handlers for the socket
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.stopHeartbeat();
      this.emit('disconnected', reason);
      this.handleReconnect(reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emit('error', error);
      this.handleReconnect('connection_error');
    });

    // Agent communication events
    this.socket.on('agent:message', (data: AgentMessage['data']) => {
      this.emit('agentMessage', data);
    });

    this.socket.on('agent:status', (data: AgentStatusUpdate['data']) => {
      this.emit('agentStatus', data);
    });

    this.socket.on('agent:error', (data: { agentId: string; error: string }) => {
      this.emit('agentError', data);
    });

    // Project and preview events
    this.socket.on('preview:update', (data: PreviewUpdate['data']) => {
      this.emit('previewUpdate', data);
    });

    this.socket.on('project:update', (data: any) => {
      this.emit('projectUpdate', data);
    });

    // System events
    this.socket.on('system:notification', (data: any) => {
      this.emit('systemNotification', data);
    });

    this.socket.on('error', (data: ErrorEvent['data']) => {
      this.emit('error', data);
    });

    // Heartbeat response
    this.socket.on('pong', () => {
      // Heartbeat acknowledged
    });

    // Custom event forwarding
    this.socket.onAny((eventName: string, ...args: any[]) => {
      this.emit('rawEvent', { eventName, args });
    });
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(reason: string): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    // Don't reconnect on intentional disconnection
    if (reason === 'io client disconnect') {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1),
      this.MAX_RECONNECT_DELAY
    );

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });

    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Send a message to the server
   */
  sendMessage(event: string, data: any, options: MessageOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        if (options.queueIfDisconnected) {
          this.queueMessage(event, data, resolve, reject);
          return;
        } else {
          reject(new Error('WebSocket not connected'));
          return;
        }
      }

      try {
        if (options.timeout) {
          const timeoutId = setTimeout(() => {
            reject(new Error('Message timeout'));
          }, options.timeout);

          this.socket.emit(event, data, (response: any) => {
            clearTimeout(timeoutId);
            if (response?.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          });
        } else {
          this.socket.emit(event, data);
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Queue a message for later sending when connected
   */
  private queueMessage(
    event: string, 
    data: any, 
    resolve: (value: void) => void, 
    reject: (reason: Error) => void
  ): void {
    this.messageQueue.push({
      event,
      data,
      resolve,
      reject,
      timestamp: Date.now()
    });

    // Limit queue size
    if (this.messageQueue.length > 100) {
      const oldMessage = this.messageQueue.shift();
      oldMessage?.reject(new Error('Message queue overflow'));
    }
  }

  /**
   * Send all queued messages
   */
  private flushMessageQueue(): void {
    const messages = [...this.messageQueue];
    this.messageQueue = [];

    messages.forEach(message => {
      this.sendMessage(message.event, message.data)
        .then(() => message.resolve())
        .catch(error => message.reject(error));
    });
  }

  /**
   * Subscribe to agent messages for a specific agent
   */
  subscribeToAgent(agentId: string): void {
    this.sendMessage('subscribe:agent', { agentId }, { queueIfDisconnected: true });
  }

  /**
   * Unsubscribe from agent messages
   */
  unsubscribeFromAgent(agentId: string): void {
    this.sendMessage('unsubscribe:agent', { agentId });
  }

  /**
   * Join a project room for real-time collaboration
   */
  joinProject(projectId: string): Promise<void> {
    return this.sendMessage('join:project', { projectId }, { 
      queueIfDisconnected: true,
      timeout: 5000 
    });
  }

  /**
   * Leave a project room
   */
  leaveProject(projectId: string): Promise<void> {
    return this.sendMessage('leave:project', { projectId }, { timeout: 5000 });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      socketId: this.socket?.id || null
    };
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    this.isConnected = false;
    this.stopHeartbeat();

    if (this.connectionAttemptTimeout) {
      clearTimeout(this.connectionAttemptTimeout);
      this.connectionAttemptTimeout = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Reject all queued messages
    this.messageQueue.forEach(message => {
      message.reject(new Error('Connection closed'));
    });
    this.messageQueue = [];

    this.emit('disconnected', 'manual');
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.disconnect();
    this.removeAllListeners();
  }
}

// Supporting types and interfaces
export interface WebSocketConfig {
  url?: string;
  timeout?: number;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

export interface ConnectOptions {
  auth?: Record<string, any>;
  socketOptions?: Record<string, any>;
}

export interface MessageOptions {
  timeout?: number;
  queueIfDisconnected?: boolean;
}

export interface QueuedMessage {
  event: string;
  data: any;
  resolve: (value: void) => void;
  reject: (reason: Error) => void;
  timestamp: number;
}

export interface ConnectionStatus {
  connected: boolean;
  reconnectAttempts: number;
  queuedMessages: number;
  socketId: string | null;
}