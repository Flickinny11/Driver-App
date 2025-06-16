// Core types for the Driver AI Platform

export type ViewType = 
  | 'code-chat'
  | 'history'
  | 'creations'
  | 'search'
  | 'knowledge'
  | 'vision'
  | 'multi-panel'
  | 'orchestra'
  | 'live-preview';

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

// Orchestration System Types
export type OrchestrationMode = 'symphony' | 'orchestra';

export type AgentType = 
  | 'frontend-architect'
  | 'backend-engineer'
  | 'database-designer'
  | 'devops-specialist'
  | 'security-auditor'
  | 'performance-optimizer'
  | 'documentation-writer'
  | 'testing-specialist'
  | 'ui-ux-designer'
  | 'api-designer';

export interface SpecializedAgent {
  id: string;
  type: AgentType;
  name: string;
  model: string;
  status: AgentStatus;
  contextUsage: number;
  maxContext: number;
  capabilities: string[];
  currentTask?: Task;
  createdAt: Date;
  lastActive: Date;
}

export interface Task {
  id: string;
  type: AgentType;
  title: string;
  description: string;
  requirements: any;
  priority: 'low' | 'normal' | 'high' | 'critical';
  estimatedTime: number;
  dependencies: string[];
  files: string[];
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'failed';
  assignedAgent?: string;
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface BuildPlan {
  id: string;
  projectType: string;
  requirements: string;
  tasks: Task[];
  dependencies: TaskDependency[];
  estimatedDuration: number;
  parallelizable: boolean;
  createdAt: Date;
}

export interface TaskDependency {
  from: string;
  to: string;
  type: 'sequence' | 'blocking' | 'optional';
}

export interface Assignment {
  agentType: AgentType;
  task: Task;
  priority: 'normal' | 'critical';
  parallelWorkers: number;
}

export interface FileDependencyGraph {
  files: Map<string, string[]>;
  getCriticalPath(): Task[];
  getParallelizableTasks(): Task[][];
}

export interface FileState {
  path: string;
  content: string;
  lastModified: Date;
  lockedBy?: string;
  version: number;
}

export interface FileOperation {
  type: 'create' | 'update' | 'delete';
  filePath: string;
  startLine?: number;
  endLine?: number;
  content: string;
  agentId: string;
  timestamp: Date;
}

export interface Conflict {
  type: 'overlapping-edit' | 'concurrent-modification' | 'dependency-violation';
  operations: FileOperation[];
  severity: 'low' | 'medium' | 'high';
  resolution?: string;
}

export interface AgentState {
  contextWindow: any;
  memory: any;
  lastCheckpoint: any;
  workingFiles: string[];
  completedTasks: string[];
}

export interface ComponentRequirements {
  name: string;
  type: string;
  framework: string;
  features: string[];
  styling: string;
  dependencies: string[];
  outputPath: string;
}

export interface OrchestrationMetrics {
  activeAgents: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksPending: number;
  filesPerMinute: number;
  linesOfCode: number;
  parallelOps: number;
  averageTaskTime: number;
  successRate: number;
  trend: 'up' | 'down' | 'stable';
  fileProgress: FileProgress[];
}

export interface FileProgress {
  path: string;
  progress: number;
  assignedAgent: string;
  estimatedCompletion: Date;
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

// Preview System Types
export type WindowType = 'desktop' | 'mobile' | 'tablet';
export type Framework = 'react' | 'vue' | 'angular' | 'svelte' | 'vanilla';

export interface PreviewWindow {
  id: string;
  type: WindowType;
  active: boolean;
  showConsole?: boolean;
}

export interface FileMap {
  [path: string]: string;
}

// iOS App Signing and Deployment Types
export interface AppleAccount {
  id: string;
  email: string;
  name: string;
  teamId?: string;
  teamName?: string;
  isDeveloperAccount: boolean;
  canSignApps: boolean;
  certificates: SigningCertificate[];
  connectedAt: Date;
}

export interface AppleTokens {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_at: Date;
}

export type CertificateType = 
  | 'IOS_DEVELOPMENT' 
  | 'IOS_DISTRIBUTION' 
  | 'MAC_APP_DISTRIBUTION' 
  | 'personal';

export interface SigningCertificate {
  id: string;
  name: string;
  serialNumber: string;
  type: CertificateType;
  expiresAt: Date;
  canRenew: boolean;
  isActive: boolean;
}

export interface ProvisioningProfile {
  id: string;
  name: string;
  bundleId: string;
  content: string;
  expiresAt: Date;
  devices: string[];
  type: 'development' | 'distribution' | 'ad-hoc' | 'enterprise';
}

export interface SigningInfo {
  bundleId: string;
  teamId: string;
  certificate: SigningCertificate;
  profile: ProvisioningProfile;
}

export interface XcodeProject {
  id: string;
  name: string;
  path: string;
  bundleId: string;
  version: string;
  scheme: string;
  infoPlist: string;
  pbxproj: string;
  entitlements: string;
  iconSet: IconSet;
  signingInfo: SigningInfo;
}

export interface SignedApp {
  ipa: {
    url: string;
    content: ArrayBuffer;
  };
  manifest: string;
  buildId: string;
  signedAt: Date;
}

export interface OTADeployment {
  installUrl: string;
  landingUrl: string;
  manifestUrl: string;
  ipaUrl: string;
  expiresAt: Date;
  qrCode: string;
}

export type InstallStatus = 
  | 'ready' 
  | 'building' 
  | 'signing' 
  | 'deploying' 
  | 'ready-to-install' 
  | 'error';

export interface IOSCapability {
  name: string;
  identifier: string;
  required: boolean;
  description: string;
}

export interface BuildArtifact {
  ipa: {
    url: string;
    size: number;
  };
  manifest: string;
  logs: string[];
}

export interface WrapperOptions {
  usesWebView: boolean;
  localContent: boolean;
  offlineCapable: boolean;
}

export interface Bundle {
  html: string;
  css: string;
  js: string;
  files: FileMap;
  size: number;
}

export interface HMRUpdate {
  id: string;
  newModule: any;
  type: 'hot' | 'reload';
}

export interface ElementInfo {
  selector: string;
  xpath: string;
  bounds: DOMRect;
  tagName: string;
  attributes: Record<string, string>;
}

export interface InterjectComment {
  id: string;
  windowId: string;
  element: {
    selector: string;
    xpath: string;
    bounds: DOMRect;
    tagName: string;
    attributes: Record<string, string>;
  };
  comment: string;
  voiceNote?: Blob;
  screenshot: string;
  timestamp: Date;
  status: 'pending' | 'addressed' | 'dismissed';
}

// App Delivery Types
export interface CreatedApp {
  id: string;
  name: string;
  shortName?: string;
  description: string;
  url: string;
  icon: string;
  size: number;
  files: number;
  category: 'web' | 'mobile' | 'game' | 'tool';
  buildProgress: number;
  version: string;
  opens: number;
  screenshot: string;
  installable: boolean;
  manifest: PWAManifest;
  createdAt: Date;
  updatedAt: Date;
}

export interface PWAManifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  theme_color: string;
  background_color: string;
  icons: IconSet;
}

export interface Icon {
  dataUrl: string;
  size: number;
}

export interface IconSet {
  [size: string]: Icon;
}

export interface AppPackageResult {
  id: string;
  name: string;
  url: string;
  icon: string;
  size: number;
  files: number;
  createdAt: Date;
  manifest: PWAManifest;
  installable: boolean;
}

// Console output types
export interface ConsoleMessage {
  type: 'log' | 'warn' | 'error' | 'info';
  args: string[];
  timestamp: Date;
}

export interface PreviewError {
  message: string;
  filename?: string;
  line?: number;
  column?: number;
  stack?: string;
}