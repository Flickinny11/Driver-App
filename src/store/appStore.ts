import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { 
  User, 
  Agent, 
  Project, 
  Conversation,
  ViewType, 
  SubscriptionTier, 
  AgentStatus,
  Toast,
  LoadingState,
  AppleAccount,
  OTADeployment
} from '@/types';

/**
 * Main application state interface
 */
interface AppState {
  // User state
  user: User | null;
  subscription: SubscriptionTier;
  isAuthenticated: boolean;

  // UI state
  activeView: ViewType;
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light' | 'system';
  isLoading: LoadingState;
  toasts: Toast[];

  // Agent state
  activeAgents: Agent[];
  agentStatuses: Map<string, AgentStatus>;
  selectedAgent: string | null;

  // Project state
  currentProject: Project | null;
  projects: Project[];
  recentProjects: string[];

  // Conversation state
  activeConversation: Conversation | null;
  conversations: Conversation[];

  // AI Model state
  selectedModel: string;
  availableModels: string[];
  modelStatus: Map<string, 'available' | 'unavailable' | 'loading'>;

  // WebSocket state
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastPing: Date | null;

  // iOS state
  appleAccount: AppleAccount | null;
  iosDeployments: OTADeployment[];

  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setActiveView: (view: ViewType) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setLoading: (loading: LoadingState) => void;
  addToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Agent actions
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
  updateAgentStatus: (id: string, status: AgentStatus) => void;
  setSelectedAgent: (id: string | null) => void;

  // Project actions
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  addToRecentProjects: (projectId: string) => void;

  // Conversation actions
  setActiveConversation: (conversation: Conversation | null) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;

  // Model actions
  setSelectedModel: (model: string) => void;
  setAvailableModels: (models: string[]) => void;
  updateModelStatus: (model: string, status: 'available' | 'unavailable' | 'loading') => void;

  // WebSocket actions
  setConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  updateLastPing: () => void;

  // iOS actions
  setAppleAccount: (account: AppleAccount | null) => void;
  addIOSDeployment: (deployment: OTADeployment) => void;
  removeIOSDeployment: (deploymentId: string) => void;

  // Utility actions
  reset: () => void;
  hydrate: () => void;
}

/**
 * Create the main application store with persistence
 */
export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // Initial state
        user: null,
        subscription: 'free',
        isAuthenticated: false,

        activeView: 'code-chat',
        sidebarCollapsed: false,
        theme: 'dark',
        isLoading: { isLoading: false },
        toasts: [],

        activeAgents: [],
        agentStatuses: new Map(),
        selectedAgent: null,

        currentProject: null,
        projects: [],
        recentProjects: [],

        activeConversation: null,
        conversations: [],

        selectedModel: 'anthropic/claude-3.5-sonnet-20241022',
        availableModels: [],
        modelStatus: new Map(),

        isConnected: false,
        connectionStatus: 'disconnected',
        lastPing: null,

        // iOS state
        appleAccount: null,
        iosDeployments: [],

        // User actions
        setUser: (user) => set((state) => {
          state.user = user;
          state.isAuthenticated = !!user;
        }),

        setAuthenticated: (authenticated) => set((state) => {
          state.isAuthenticated = authenticated;
        }),

        // UI actions
        setActiveView: (view) => set((state) => {
          state.activeView = view;
        }),

        setSidebarCollapsed: (collapsed) => set((state) => {
          state.sidebarCollapsed = collapsed;
        }),

        setTheme: (theme) => set((state) => {
          state.theme = theme;
        }),

        setLoading: (loading) => set((state) => {
          state.isLoading = loading;
        }),

        addToast: (toast) => set((state) => {
          const newToast: Toast = {
            ...toast,
            id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date()
          };
          state.toasts.push(newToast);

          // Auto-remove toast after duration
          if (toast.duration !== 0) {
            setTimeout(() => {
              const currentState = get();
              currentState.removeToast(newToast.id);
            }, toast.duration || 5000);
          }
        }),

        removeToast: (id) => set((state) => {
          const index = state.toasts.findIndex(toast => toast.id === id);
          if (index > -1) {
            state.toasts.splice(index, 1);
          }
        }),

        clearToasts: () => set((state) => {
          state.toasts = [];
        }),

        // Agent actions
        addAgent: (agent) => set((state) => {
          const existingIndex = state.activeAgents.findIndex(a => a.id === agent.id);
          if (existingIndex > -1) {
            state.activeAgents[existingIndex] = agent;
          } else {
            state.activeAgents.push(agent);
          }
          state.agentStatuses.set(agent.id, agent.status);
        }),

        updateAgent: (id, updates) => set((state) => {
          const index = state.activeAgents.findIndex(a => a.id === id);
          if (index > -1) {
            Object.assign(state.activeAgents[index], updates);
            if (updates.status) {
              state.agentStatuses.set(id, updates.status);
            }
          }
        }),

        removeAgent: (id) => set((state) => {
          const index = state.activeAgents.findIndex(a => a.id === id);
          if (index > -1) {
            state.activeAgents.splice(index, 1);
          }
          state.agentStatuses.delete(id);
          if (state.selectedAgent === id) {
            state.selectedAgent = null;
          }
        }),

        updateAgentStatus: (id, status) => set((state) => {
          state.agentStatuses.set(id, status);
          const agent = state.activeAgents.find(a => a.id === id);
          if (agent) {
            agent.status = status;
            agent.updatedAt = new Date();
          }
        }),

        setSelectedAgent: (id) => set((state) => {
          state.selectedAgent = id;
        }),

        // Project actions
        setCurrentProject: (project) => set((state) => {
          state.currentProject = project;
          if (project) {
            // Add to recent projects
            const recentIndex = state.recentProjects.indexOf(project.id);
            if (recentIndex > -1) {
              state.recentProjects.splice(recentIndex, 1);
            }
            state.recentProjects.unshift(project.id);
            
            // Keep only last 10 recent projects
            if (state.recentProjects.length > 10) {
              state.recentProjects = state.recentProjects.slice(0, 10);
            }
          }
        }),

        addProject: (project) => set((state) => {
          const existingIndex = state.projects.findIndex(p => p.id === project.id);
          if (existingIndex > -1) {
            state.projects[existingIndex] = project;
          } else {
            state.projects.push(project);
          }
        }),

        updateProject: (id, updates) => set((state) => {
          const index = state.projects.findIndex(p => p.id === id);
          if (index > -1) {
            Object.assign(state.projects[index], updates);
            state.projects[index].updatedAt = new Date();
          }
          
          // Update current project if it's the same
          if (state.currentProject?.id === id) {
            Object.assign(state.currentProject, updates);
            state.currentProject.updatedAt = new Date();
          }
        }),

        removeProject: (id) => set((state) => {
          const index = state.projects.findIndex(p => p.id === id);
          if (index > -1) {
            state.projects.splice(index, 1);
          }
          
          // Clear current project if it's the same
          if (state.currentProject?.id === id) {
            state.currentProject = null;
          }
          
          // Remove from recent projects
          const recentIndex = state.recentProjects.indexOf(id);
          if (recentIndex > -1) {
            state.recentProjects.splice(recentIndex, 1);
          }
        }),

        addToRecentProjects: (projectId) => set((state) => {
          const recentIndex = state.recentProjects.indexOf(projectId);
          if (recentIndex > -1) {
            state.recentProjects.splice(recentIndex, 1);
          }
          state.recentProjects.unshift(projectId);
          
          // Keep only last 10 recent projects
          if (state.recentProjects.length > 10) {
            state.recentProjects = state.recentProjects.slice(0, 10);
          }
        }),

        // Conversation actions
        setActiveConversation: (conversation) => set((state) => {
          state.activeConversation = conversation;
        }),

        addConversation: (conversation) => set((state) => {
          const existingIndex = state.conversations.findIndex(c => c.id === conversation.id);
          if (existingIndex > -1) {
            state.conversations[existingIndex] = conversation;
          } else {
            state.conversations.push(conversation);
          }
        }),

        updateConversation: (id, updates) => set((state) => {
          const index = state.conversations.findIndex(c => c.id === id);
          if (index > -1) {
            Object.assign(state.conversations[index], updates);
            state.conversations[index].updatedAt = new Date();
          }
          
          // Update active conversation if it's the same
          if (state.activeConversation?.id === id) {
            Object.assign(state.activeConversation, updates);
            state.activeConversation.updatedAt = new Date();
          }
        }),

        removeConversation: (id) => set((state) => {
          const index = state.conversations.findIndex(c => c.id === id);
          if (index > -1) {
            state.conversations.splice(index, 1);
          }
          
          // Clear active conversation if it's the same
          if (state.activeConversation?.id === id) {
            state.activeConversation = null;
          }
        }),

        // Model actions
        setSelectedModel: (model) => set((state) => {
          state.selectedModel = model;
        }),

        setAvailableModels: (models) => set((state) => {
          state.availableModels = models;
          
          // Initialize model status
          models.forEach(model => {
            if (!state.modelStatus.has(model)) {
              state.modelStatus.set(model, 'available');
            }
          });
        }),

        updateModelStatus: (model, status) => set((state) => {
          state.modelStatus.set(model, status);
        }),

        // WebSocket actions
        setConnectionStatus: (status) => set((state) => {
          state.connectionStatus = status;
          state.isConnected = status === 'connected';
        }),

        updateLastPing: () => set((state) => {
          state.lastPing = new Date();
        }),

        // iOS actions
        setAppleAccount: (account) => set((state) => {
          state.appleAccount = account;
        }),

        addIOSDeployment: (deployment) => set((state) => {
          state.iosDeployments.push(deployment);
        }),

        removeIOSDeployment: (deploymentId) => set((state) => {
          const index = state.iosDeployments.findIndex(d => d.installUrl.includes(deploymentId));
          if (index > -1) {
            state.iosDeployments.splice(index, 1);
          }
        }),

        // Utility actions
        reset: () => set((state) => {
          // Reset to initial state but preserve user and theme
          const currentUser = state.user;
          const currentTheme = state.theme;
          
          Object.assign(state, {
            user: currentUser,
            subscription: 'free',
            isAuthenticated: !!currentUser,

            activeView: 'code-chat',
            sidebarCollapsed: false,
            theme: currentTheme,
            isLoading: { isLoading: false },
            toasts: [],

            activeAgents: [],
            agentStatuses: new Map(),
            selectedAgent: null,

            currentProject: null,
            projects: [],
            recentProjects: [],

            activeConversation: null,
            conversations: [],

            selectedModel: 'anthropic/claude-3.5-sonnet-20241022',
            availableModels: [],
            modelStatus: new Map(),

            isConnected: false,
            connectionStatus: 'disconnected' as const,
            lastPing: null,

            // Reset iOS state
            appleAccount: null,
            iosDeployments: []
          });
        }),

        hydrate: () => {
          // Hydration logic - convert Maps from plain objects if needed
          const state = get();
          if (!(state.agentStatuses instanceof Map)) {
            set((draft) => {
              draft.agentStatuses = new Map(Object.entries(state.agentStatuses as any));
            });
          }
          if (!(state.modelStatus instanceof Map)) {
            set((draft) => {
              draft.modelStatus = new Map(Object.entries(state.modelStatus as any));
            });
          }
        }
      })),
      {
        name: 'driver-app-state',
        partialize: (state) => ({
          // Only persist certain parts of the state
          user: state.user,
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          selectedModel: state.selectedModel,
          projects: state.projects,
          recentProjects: state.recentProjects,
          conversations: state.conversations
        }),
        onRehydrateStorage: () => {
          return (state) => {
            // Perform any necessary transformations after rehydration
            state?.hydrate();
          };
        }
      }
    )
  )
);

// Selectors for commonly used state combinations
export const useUser = () => useAppStore((state) => state.user);
export const useAuth = () => useAppStore((state) => ({ 
  user: state.user, 
  isAuthenticated: state.isAuthenticated 
}));
export const useUI = () => useAppStore((state) => ({
  activeView: state.activeView,
  sidebarCollapsed: state.sidebarCollapsed,
  theme: state.theme,
  isLoading: state.isLoading
}));
export const useAgents = () => useAppStore((state) => ({
  agents: state.activeAgents,
  statuses: state.agentStatuses,
  selected: state.selectedAgent
}));
export const useProjects = () => useAppStore((state) => ({
  current: state.currentProject,
  all: state.projects,
  recent: state.recentProjects
}));
export const useConversations = () => useAppStore((state) => ({
  active: state.activeConversation,
  all: state.conversations
}));
export const useModels = () => useAppStore((state) => ({
  selected: state.selectedModel,
  available: state.availableModels,
  status: state.modelStatus
}));
export const useConnection = () => useAppStore((state) => ({
  isConnected: state.isConnected,
  status: state.connectionStatus,
  lastPing: state.lastPing
}));
export const useIOS = () => useAppStore((state) => ({
  account: state.appleAccount,
  deployments: state.iosDeployments
}));

// Subscribe to state changes for debugging in development
if (import.meta.env.DEV) {
  useAppStore.subscribe(
    (state) => state,
    (state) => {
      console.log('🏪 Store updated:', {
        agents: state.activeAgents.length,
        projects: state.projects.length,
        conversations: state.conversations.length,
        connectionStatus: state.connectionStatus
      });
    }
  );
}