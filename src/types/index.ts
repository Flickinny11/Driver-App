// Core types for the Driver AI Platform

export type ViewType = 
  | 'code-chat'
  | 'history'
  | 'creations'
  | 'search'
  | 'knowledge'
  | 'vision'
  | 'multi-panel'
  | 'orchestra';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export type AgentStatus = 'idle' | 'thinking' | 'working' | 'error' | 'completed';

export type ModelProvider = 'anthropic' | 'openai' | 'mistral' | 'meta' | 'google';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription: SubscriptionTier;
  apiKeys: Record<string, string>;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  defaultModel: string;
  codeEditor: {
    fontSize: number;
    tabSize: number;
    wordWrap: boolean;
    minimap: boolean;
  };
  ai: {
    temperature: number;
    maxTokens: number;
    streamingEnabled: boolean;
  };
}

export interface Agent {
  id: string;
  name: string;
  type: 'coder' | 'designer' | 'analyst' | 'tester' | 'orchestrator';
  model: string;
  status: AgentStatus;
  capabilities: string[];
  context: AgentContext;
  memory: AgentMemory;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentContext {
  projectId?: string;
  currentTask?: string;
  tools: string[];
  constraints: string[];
  goals: string[];
}

export interface AgentMemory {
  shortTerm: MemoryItem[];
  longTerm: MemoryItem[];
  episodic: EpisodicMemory[];
  procedural: ProceduralMemory[];
}

export interface MemoryItem {
  id: string;
  content: string;
  type: 'observation' | 'thought' | 'action' | 'result';
  importance: number;
  timestamp: Date;
  tags: string[];
}

export interface EpisodicMemory {
  id: string;
  episode: string;
  context: string;
  outcome: string;
  lessons: string[];
  timestamp: Date;
}

export interface ProceduralMemory {
  id: string;
  procedure: string;
  steps: string[];
  conditions: string[];
  success_rate: number;
  last_used: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  type: 'web-app' | 'mobile-app' | 'api' | 'library' | 'tool';
  status: 'planning' | 'active' | 'completed' | 'archived';
  agents: string[];
  files: ProjectFile[];
  metadata: ProjectMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectFile {
  id: string;
  path: string;
  content: string;
  language: string;
  size: number;
  modified: Date;
  author: string;
}

export interface ProjectMetadata {
  framework?: string;
  language?: string;
  dependencies: string[];
  environment: Record<string, string>;
  deployment?: {
    platform: string;
    url?: string;
    status: 'pending' | 'deployed' | 'failed';
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'agent';
  content: string;
  timestamp: Date;
  agentId?: string;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  model?: string;
  tokens?: number;
  cost?: number;
  latency?: number;
  tools_used?: string[];
  confidence?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  participants: string[];
  metadata: ConversationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMetadata {
  projectId?: string;
  context: string;
  summary?: string;
  tags: string[];
  totalTokens: number;
  totalCost: number;
}

export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: Date;
  source: string;
}

export interface AgentMessage extends WebSocketEvent {
  type: 'agent:message';
  data: {
    agentId: string;
    message: Message;
    conversationId: string;
  };
}

export interface AgentStatusUpdate extends WebSocketEvent {
  type: 'agent:status';
  data: {
    agentId: string;
    status: AgentStatus;
    progress?: number;
    currentTask?: string;
  };
}

export interface PreviewUpdate extends WebSocketEvent {
  type: 'preview:update';
  data: {
    projectId: string;
    files: ProjectFile[];
    url?: string;
  };
}

export interface ErrorEvent extends WebSocketEvent {
  type: 'error';
  data: {
    error: string;
    details?: any;
    recoverable: boolean;
  };
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface StreamResponse {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason?: string;
  }[];
}

// UI Component types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
  timestamp: Date;
}

export interface Modal {
  id: string;
  title: string;
  content: React.ReactNode;
  size: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable: boolean;
  onClose?: () => void;
}

// Configuration types
export interface Config {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'production' | 'staging';
  };
  api: {
    openRouter: {
      baseUrl: string;
      timeout: number;
    };
    websocket: {
      url: string;
      reconnectAttempts: number;
      reconnectDelay: number;
    };
  };
  storage: {
    database: string;
    version: number;
    maxSize: number;
  };
  ui: {
    theme: {
      default: 'dark' | 'light';
      enableAnimations: boolean;
      reducedMotion: boolean;
    };
    performance: {
      lazyLoading: boolean;
      codesplitting: boolean;
      prefetchRoutes: boolean;
    };
  };
}