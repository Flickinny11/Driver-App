import type { AgentType, SpecializedAgent } from '@/types';

/**
 * Manages a pool of specialized agents for the orchestration system
 * Handles agent allocation, lifecycle, and availability tracking
 */
export class AgentPool {
  private availableAgents: Map<AgentType, SpecializedAgent[]> = new Map();
  private busyAgents: Set<string> = new Set();
  private maxAgents: number;
  private agentCounter = 0;

  constructor(maxAgents: number) {
    this.maxAgents = maxAgents;
    this.initializePool();
  }

  /**
   * Initialize the pool with pre-created agents of each type
   */
  private initializePool(): void {
    const agentTypes: AgentType[] = [
      'frontend-architect',
      'backend-engineer', 
      'database-designer',
      'devops-specialist',
      'security-auditor',
      'performance-optimizer',
      'documentation-writer',
      'testing-specialist',
      'ui-ux-designer',
      'api-designer'
    ];

    // Pre-create 2 agents of each type
    agentTypes.forEach(type => {
      const agents = Array(2).fill(null).map(() => 
        this.createAgent(type)
      );
      this.availableAgents.set(type, agents);
    });
  }

  /**
   * Create a new agent of the specified type
   */
  private createAgent(type: AgentType): SpecializedAgent {
    this.agentCounter++;
    
    return {
      id: `agent-${type}-${this.agentCounter}`,
      type,
      name: this.getAgentName(type),
      model: this.getDefaultModel(type),
      status: 'idle',
      contextUsage: 0,
      maxContext: 100000,
      capabilities: this.getAgentCapabilities(type),
      createdAt: new Date(),
      lastActive: new Date()
    };
  }

  /**
   * Get a human-readable name for the agent type
   */
  private getAgentName(type: AgentType): string {
    const names = {
      'frontend-architect': 'Frontend Architect',
      'backend-engineer': 'Backend Engineer',
      'database-designer': 'Database Designer',
      'devops-specialist': 'DevOps Specialist',
      'security-auditor': 'Security Auditor',
      'performance-optimizer': 'Performance Optimizer',
      'documentation-writer': 'Documentation Writer',
      'testing-specialist': 'Testing Specialist',
      'ui-ux-designer': 'UI/UX Designer',
      'api-designer': 'API Designer'
    };
    return names[type];
  }

  /**
   * Get the default model for an agent type
   */
  private getDefaultModel(type: AgentType): string {
    // Use current 2025 models based on agent specialization
    const modelMap = {
      'frontend-architect': 'anthropic/claude-3.5-sonnet-20241022', // Best for complex reasoning and code
      'backend-engineer': 'openai/gpt-4o', // Excellent for general code and API design
      'database-designer': 'openai/o1-preview', // Superior reasoning for data architecture
      'devops-specialist': 'mistralai/mistral-large-2407', // Fast and efficient for automation
      'security-auditor': 'anthropic/claude-3.5-sonnet-20241022', // Best analysis capabilities
      'performance-optimizer': 'openai/o1-mini', // Fast reasoning for optimization
      'documentation-writer': 'anthropic/claude-3.5-sonnet-20241022', // Superior writing capabilities
      'testing-specialist': 'openai/gpt-4o', // Excellent for test generation
      'ui-ux-designer': 'meta-llama/llama-3.2-90b-vision-instruct', // Multimodal for visual design
      'api-designer': 'openai/gpt-4o' // Great for API design and documentation
    };
    return modelMap[type];
  }

  /**
   * Get capabilities for an agent type
   */
  private getAgentCapabilities(type: AgentType): string[] {
    const capabilities = {
      'frontend-architect': ['React', 'TypeScript', 'CSS', 'Component Design', 'State Management'],
      'backend-engineer': ['Node.js', 'Python', 'API Development', 'Database Integration', 'Microservices'],
      'database-designer': ['SQL', 'NoSQL', 'Schema Design', 'Optimization', 'Migrations'],
      'devops-specialist': ['Docker', 'CI/CD', 'Cloud Deployment', 'Monitoring', 'Infrastructure'],
      'security-auditor': ['Security Analysis', 'Vulnerability Assessment', 'Code Review', 'Compliance'],
      'performance-optimizer': ['Performance Analysis', 'Optimization', 'Profiling', 'Caching'],
      'documentation-writer': ['Technical Writing', 'API Documentation', 'User Guides', 'Code Comments'],
      'testing-specialist': ['Unit Testing', 'Integration Testing', 'Test Automation', 'Quality Assurance'],
      'ui-ux-designer': ['User Interface', 'User Experience', 'Design Systems', 'Accessibility'],
      'api-designer': ['API Design', 'REST', 'GraphQL', 'API Documentation', 'Versioning']
    };
    return capabilities[type] || [];
  }

  /**
   * Get an available agent of the specified type
   */
  async getAgent(type: AgentType): Promise<SpecializedAgent> {
    const available = this.availableAgents.get(type) || [];
    
    // Find an available agent
    let agent = available.find(a => !this.busyAgents.has(a.id));
    
    // Create new agent if none available and under limit
    if (!agent && this.getTotalAgents() < this.maxAgents) {
      agent = this.createAgent(type);
      available.push(agent);
      this.availableAgents.set(type, available);
    }
    
    // Wait for agent to become available if at capacity
    if (!agent) {
      const availableAgent = await this.waitForAvailableAgent(type);
      if (availableAgent) {
        agent = availableAgent;
      }
    }
    
    if (!agent) {
      throw new Error(`No agent of type ${type} available`);
    }

    // Mark agent as busy
    this.busyAgents.add(agent.id);
    agent.status = 'working';
    agent.lastActive = new Date();
    
    return agent;
  }

  /**
   * Release an agent back to the pool
   */
  releaseAgent(agentId: string): void {
    this.busyAgents.delete(agentId);
    
    // Find and update agent status
    for (const agents of this.availableAgents.values()) {
      const agent = agents.find(a => a.id === agentId);
      if (agent) {
        agent.status = 'idle';
        agent.lastActive = new Date();
        break;
      }
    }
  }

  /**
   * Get total number of agents in the pool
   */
  private getTotalAgents(): number {
    let total = 0;
    for (const agents of this.availableAgents.values()) {
      total += agents.length;
    }
    return total;
  }

  /**
   * Wait for an agent of the specified type to become available
   */
  private waitForAvailableAgent(type: AgentType): Promise<SpecializedAgent | null> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const available = this.availableAgents.get(type) || [];
        const agent = available.find(a => !this.busyAgents.has(a.id));
        
        if (agent) {
          clearInterval(checkInterval);
          resolve(agent);
        }
      }, 100);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(null);
      }, 30000);
    });
  }

  /**
   * Get statistics about the agent pool
   */
  getStats(): {
    total: number;
    busy: number;
    available: number;
    byType: Record<AgentType, { total: number; busy: number; available: number }>;
  } {
    const stats = {
      total: this.getTotalAgents(),
      busy: this.busyAgents.size,
      available: 0,
      byType: {} as Record<AgentType, { total: number; busy: number; available: number }>
    };

    stats.available = stats.total - stats.busy;

    // Calculate stats by type
    for (const [type, agents] of this.availableAgents.entries()) {
      const busy = agents.filter(a => this.busyAgents.has(a.id)).length;
      stats.byType[type] = {
        total: agents.length,
        busy,
        available: agents.length - busy
      };
    }

    return stats;
  }

  /**
   * Get all agents of a specific type
   */
  getAgentsByType(type: AgentType): SpecializedAgent[] {
    return this.availableAgents.get(type) || [];
  }

  /**
   * Get all active agents
   */
  getAllAgents(): SpecializedAgent[] {
    const agents: SpecializedAgent[] = [];
    for (const agentList of this.availableAgents.values()) {
      agents.push(...agentList);
    }
    return agents;
  }
}