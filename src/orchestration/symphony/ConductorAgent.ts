import { AgentPool } from '../AgentPool';
import { TaskQueue } from '../TaskQueue';
import { SharedMemoryBridge } from '../memory/SharedMemoryBridge';
import { OpenRouterClient } from '@/core/openrouter/OpenRouterClient';
import type { 
  BuildPlan, 
  Task, 
  SpecializedAgent, 
  AgentState, 
  AgentType
} from '@/types';

/**
 * Symphony mode conductor that orchestrates 10-15 agents for complex tasks
 * Manages agent lifecycle, task distribution, and coordination
 */
export class ConductorAgent {
  protected workers: Map<string, Worker> = new Map();
  protected agentPool: AgentPool;
  protected taskQueue: TaskQueue;
  protected memoryBridge: SharedMemoryBridge;
  protected openRouterClient?: OpenRouterClient;
  private activeAgents: Map<string, SpecializedAgent> = new Map();
  private agentStates: Map<string, AgentState> = new Map();

  constructor(apiKey?: string) {
    this.agentPool = new AgentPool(15); // Symphony = 15 agents max
    this.taskQueue = new TaskQueue();
    this.memoryBridge = SharedMemoryBridge.isSupported() 
      ? new SharedMemoryBridge() 
      : SharedMemoryBridge.createFallback();
    
    if (apiKey) {
      this.openRouterClient = new OpenRouterClient(apiKey);
    }
  }

  /**
   * Analyze project requirements and create execution plan
   */
  async analyzeProject(requirements: string): Promise<BuildPlan> {
    if (!this.openRouterClient) {
      throw new Error('OpenRouter client not initialized');
    }

    console.log('🎼 Symphony Conductor analyzing project requirements...');

    const response = await this.openRouterClient.getCompletionWithUsage({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{
        role: 'system',
        content: `You are the master conductor for a Symphony of AI agents. 
                  Analyze these requirements and create a detailed build plan.
                  Break down into parallel tasks for specialized agents.
                  
                  IMPORTANT: Plan for REAL implementation, no placeholders.
                  
                  Return a JSON object with this structure:
                  {
                    "projectType": "string",
                    "tasks": [
                      {
                        "type": "frontend-architect|backend-engineer|database-designer|devops-specialist|security-auditor|performance-optimizer|documentation-writer|testing-specialist|ui-ux-designer|api-designer",
                        "title": "string",
                        "description": "string", 
                        "requirements": {},
                        "priority": "low|normal|high|critical",
                        "estimatedTime": number_in_minutes,
                        "dependencies": ["task_ids"],
                        "files": ["file_paths"]
                      }
                    ],
                    "estimatedDuration": number_in_minutes,
                    "parallelizable": boolean
                  }`
      }, {
        role: 'user',
        content: requirements
      }],
      temperature: 0.7,
      max_tokens: 4000
    });

    const content = response.content;
    let planData;
    
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        planData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (error) {
      console.error('Failed to parse build plan:', error);
      // Fallback to a simple plan
      planData = this.createFallbackPlan(requirements);
    }

    const plan: BuildPlan = {
      id: `plan-${Date.now()}`,
      projectType: planData.projectType || 'web-application',
      requirements,
      tasks: this.createTasksFromPlan(planData),
      dependencies: [],
      estimatedDuration: planData.estimatedDuration || 60,
      parallelizable: planData.parallelizable !== false,
      createdAt: new Date()
    };

    // Add tasks to queue
    this.taskQueue.addTasks(plan.tasks);

    console.log(`📋 Created build plan with ${plan.tasks.length} tasks`);
    return plan;
  }

  /**
   * Create tasks from plan data
   */
  private createTasksFromPlan(planData: any): Task[] {
    const tasks = planData.tasks || [];
    
    return tasks.map((taskData: any, index: number) => ({
      id: `task-${Date.now()}-${index}`,
      type: taskData.type as AgentType,
      title: taskData.title || `Task ${index + 1}`,
      description: taskData.description || '',
      requirements: taskData.requirements || {},
      priority: taskData.priority || 'normal',
      estimatedTime: taskData.estimatedTime || 30,
      dependencies: taskData.dependencies || [],
      files: taskData.files || [],
      status: 'pending' as const,
      progress: 0,
      createdAt: new Date()
    }));
  }

  /**
   * Create a fallback plan when parsing fails
   */
  private createFallbackPlan(_requirements: string): any {
    return {
      projectType: 'web-application',
      tasks: [
        {
          type: 'frontend-architect',
          title: 'Create project structure',
          description: 'Set up basic project structure and components',
          requirements: { framework: 'React', features: ['routing', 'state-management'] },
          priority: 'high',
          estimatedTime: 20,
          dependencies: [],
          files: ['src/App.tsx', 'src/components/']
        },
        {
          type: 'backend-engineer',
          title: 'API design and implementation',
          description: 'Create REST API endpoints',
          requirements: { framework: 'Express', database: 'MongoDB' },
          priority: 'high',
          estimatedTime: 30,
          dependencies: [],
          files: ['server/api/', 'server/models/']
        }
      ],
      estimatedDuration: 50,
      parallelizable: true
    };
  }

  /**
   * Start the Symphony orchestration
   */
  async startSymphony(): Promise<void> {
    console.log('🎼 Starting Symphony orchestration...');
    
    // Get initial batch of parallel tasks
    const parallelTasks = this.taskQueue.getParallelTasks(5);
    
    if (parallelTasks.length === 0) {
      console.log('📝 No tasks available to execute');
      return;
    }

    console.log(`🚀 Launching ${parallelTasks.length} agents in parallel`);

    // Launch agents for each task
    const agentPromises = parallelTasks.map(async (task) => {
      try {
        const agent = await this.agentPool.getAgent(task.type);
        await this.launchAgent(agent, task);
        return agent;
      } catch (error) {
        console.error(`Failed to launch agent for task ${task.id}:`, error);
        this.taskQueue.failTask(task.id, error instanceof Error ? error.message : String(error));
        return null;
      }
    });

    const agents = (await Promise.all(agentPromises)).filter(Boolean) as SpecializedAgent[];
    
    console.log(`✅ Successfully launched ${agents.length} agents`);

    // Start monitoring and coordination
    this.startSymphonyCoordination(agents);
  }

  /**
   * Launch a specialized agent for a specific task
   */
  private async launchAgent(agent: SpecializedAgent, task: Task): Promise<void> {
    console.log(`🤖 Launching ${agent.type} agent for task: ${task.title}`);

    // Create worker for agent
    const workerUrl = this.getWorkerUrl(agent.type);
    const worker = new Worker(workerUrl, { type: 'module' });

    // Set up SharedArrayBuffer for memory sharing
    const sharedMemory = this.memoryBridge.createSharedMemory(
      `agent-${agent.id}`, 
      10 * 1024 * 1024 // 10MB
    );

    // Initialize worker
    worker.postMessage({
      type: 'initialize',
      task,
      sharedMemory,
      agentId: agent.id,
      apiKey: this.openRouterClient ? 'available' : undefined
    });

    this.workers.set(agent.id, worker);
    this.activeAgents.set(agent.id, agent);
    this.setupWorkerHandlers(worker, agent);

    // Start the task
    worker.postMessage({
      type: 'task',
      task
    });
  }

  /**
   * Get worker URL for agent type
   */
  private getWorkerUrl(agentType: AgentType): string {
    // In a real implementation, these would be actual worker files
    const workerMap = {
      'frontend-architect': '/src/orchestration/agents/FrontendArchitectAgent.worker.ts',
      'backend-engineer': '/src/orchestration/agents/BackendEngineerAgent.worker.ts',
      'database-designer': '/src/orchestration/agents/DatabaseDesignerAgent.worker.ts',
      'devops-specialist': '/src/orchestration/agents/DevOpsAgent.worker.ts',
      'security-auditor': '/src/orchestration/agents/SecurityAuditorAgent.worker.ts',
      'performance-optimizer': '/src/orchestration/agents/PerformanceAgent.worker.ts',
      'documentation-writer': '/src/orchestration/agents/DocumentationAgent.worker.ts',
      'testing-specialist': '/src/orchestration/agents/TestingAgent.worker.ts',
      'ui-ux-designer': '/src/orchestration/agents/UIUXAgent.worker.ts',
      'api-designer': '/src/orchestration/agents/APIDesignerAgent.worker.ts'
    };

    return workerMap[agentType] || '/src/orchestration/agents/DefaultAgent.worker.ts';
  }

  /**
   * Set up event handlers for worker communication
   */
  private setupWorkerHandlers(worker: Worker, agent: SpecializedAgent): void {
    worker.onmessage = (event) => {
      const { type, data, agentId } = event.data;

      switch (type) {
        case 'initialized':
          console.log(`✅ Agent ${agentId} initialized`);
          break;

        case 'progress':
          this.updateProgress(agentId, data.progress);
          break;

        case 'needsHelp':
          this.coordinateAgentHelp(agentId, data.helpType);
          break;

        case 'contextLimitApproaching':
          this.duplicateAgent(agent);
          break;

        case 'fileUpdate':
          this.broadcastFileUpdate(data);
          break;

        case 'complete':
          this.handleTaskComplete(agentId, data.result);
          break;

        case 'error':
          console.error(`Agent ${agentId} error:`, data.error);
          this.handleAgentError(agentId, data.error);
          break;

        default:
          console.log(`Unknown message from agent ${agentId}:`, type, data);
      }
    };

    worker.onerror = (error) => {
      console.error(`Worker error for agent ${agent.id}:`, error);
      this.handleAgentError(agent.id, error.message);
    };
  }

  /**
   * Update task progress
   */
  private updateProgress(agentId: string, progress: number): void {
    const agent = this.activeAgents.get(agentId);
    if (!agent || !agent.currentTask) return;

    this.taskQueue.updateTaskProgress(agent.currentTask.id, progress);
    
    // Emit progress event for UI
    this.emitEvent('progress', {
      agentId,
      taskId: agent.currentTask.id,
      progress
    });
  }

  /**
   * Handle agent requesting help from other agents
   */
  private async coordinateAgentHelp(agentId: string, helpType: string): Promise<void> {
    console.log(`🤝 Agent ${agentId} requesting help: ${helpType}`);
    
    // This could involve finding appropriate helper agents
    // For now, just log the request
    this.emitEvent('agentHelp', { agentId, helpType });
  }

  /**
   * Duplicate an agent when context limit is approaching
   */
  private async duplicateAgent(agent: SpecializedAgent): Promise<void> {
    console.log(`🔄 Duplicating agent ${agent.id} due to context limit`);

    try {
      // Create new agent with same specialization
      const newAgent = await this.agentPool.getAgent(agent.type);

      // Extract current state
      const currentState = await this.extractAgentState(agent.id);
      const compressedState = this.compressState(currentState);

      // Launch new agent with transferred state
      const workerUrl = this.getWorkerUrl(agent.type);
      const newWorker = new Worker(workerUrl, { type: 'module' });

      newWorker.postMessage({
        type: 'initializeWithState',
        state: compressedState,
        continuationPoint: currentState.lastCheckpoint,
        agentId: newAgent.id
      });

      this.workers.set(newAgent.id, newWorker);
      this.activeAgents.set(newAgent.id, newAgent);
      this.setupWorkerHandlers(newWorker, newAgent);

      // Prepare handoff from old agent
      const oldWorker = this.workers.get(agent.id);
      oldWorker?.postMessage({ type: 'prepareHandoff' });

      // Clean up old agent after handoff
      setTimeout(() => {
        this.cleanupAgent(agent.id);
      }, 5000);

      console.log(`✅ Agent duplication complete: ${agent.id} → ${newAgent.id}`);
    } catch (error) {
      console.error('Failed to duplicate agent:', error);
    }
  }

  /**
   * Extract agent state for duplication
   */
  private async extractAgentState(agentId: string): Promise<AgentState> {
    try {
      const stateData = await this.memoryBridge.readJSON<AgentState>(`agent-${agentId}`);
      return stateData;
    } catch (error) {
      console.warn('Failed to extract agent state, using default:', error);
      return {
        contextWindow: {},
        memory: {},
        lastCheckpoint: new Date(),
        workingFiles: [],
        completedTasks: []
      };
    }
  }

  /**
   * Compress agent state for transfer
   */
  private compressState(state: AgentState): AgentState {
    // In a real implementation, this would use compression algorithms
    return {
      ...state,
      lastCheckpoint: new Date()
    };
  }

  /**
   * Broadcast file updates to all agents
   */
  private broadcastFileUpdate(data: any): void {
    console.log(`📁 Broadcasting file update: ${data.path}`);
    
    // Update shared memory with file change
    this.memoryBridge.writeJSON(`file-${data.path}`, data).catch(console.error);
    
    // Notify all workers
    this.workers.forEach((worker) => {
      worker.postMessage({
        type: 'fileChanged',
        data
      });
    });

    this.emitEvent('fileUpdate', data);
  }

  /**
   * Handle task completion
   */
  private handleTaskComplete(agentId: string, result: any): void {
    const agent = this.activeAgents.get(agentId);
    if (!agent || !agent.currentTask) return;

    console.log(`✅ Task completed by agent ${agentId}: ${agent.currentTask.title}`);

    this.taskQueue.completeTask(agent.currentTask.id);
    this.agentPool.releaseAgent(agentId);

    this.emitEvent('taskComplete', {
      agentId,
      taskId: agent.currentTask.id,
      result
    });

    // Try to assign next task
    this.assignNextTask(agentId);
  }

  /**
   * Handle agent errors
   */
  private handleAgentError(agentId: string, error: string): void {
    const agent = this.activeAgents.get(agentId);
    if (agent?.currentTask) {
      this.taskQueue.failTask(agent.currentTask.id, error);
    }

    this.cleanupAgent(agentId);
    this.emitEvent('agentError', { agentId, error });
  }

  /**
   * Assign next available task to an agent
   */
  private async assignNextTask(agentId: string): Promise<void> {
    const agent = this.activeAgents.get(agentId);
    if (!agent) return;

    const nextTask = this.taskQueue.getNextTask();
    if (!nextTask) {
      console.log(`📋 No more tasks available for agent ${agentId}`);
      return;
    }

    const worker = this.workers.get(agentId);
    if (worker) {
      agent.currentTask = nextTask;
      worker.postMessage({
        type: 'task',
        task: nextTask
      });
    }
  }

  /**
   * Start coordination monitoring for active agents
   */
  private startSymphonyCoordination(agents: SpecializedAgent[]): void {
    console.log(`🎼 Starting Symphony coordination for ${agents.length} agents`);

    // Set up periodic coordination checks
    const coordinationInterval = setInterval(() => {
      this.coordinateAgents();
    }, 5000); // Check every 5 seconds

    // Store interval for cleanup
    (this as any).coordinationInterval = coordinationInterval;
  }

  /**
   * Coordinate agent activities
   */
  private coordinateAgents(): void {
    const stats = this.taskQueue.getStats();
    
    // Check if we need more agents for pending tasks
    if (stats.pending > 0 && this.activeAgents.size < this.agentPool.getStats().total) {
      const nextTasks = this.taskQueue.getParallelTasks(3);
      nextTasks.forEach(async (task) => {
        try {
          const agent = await this.agentPool.getAgent(task.type);
          await this.launchAgent(agent, task);
        } catch (error) {
          console.error('Failed to launch additional agent:', error);
        }
      });
    }

    // Emit coordination status
    this.emitEvent('coordination', {
      activeAgents: this.activeAgents.size,
      queueStats: stats,
      memoryStats: this.memoryBridge.getStats()
    });
  }

  /**
   * Clean up an agent and its resources
   */
  private cleanupAgent(agentId: string): void {
    const worker = this.workers.get(agentId);
    if (worker) {
      worker.terminate();
      this.workers.delete(agentId);
    }

    this.activeAgents.delete(agentId);
    this.agentStates.delete(agentId);
    this.agentPool.releaseAgent(agentId);
    this.memoryBridge.cleanup(`agent-${agentId}`);
  }

  /**
   * Emit events for UI updates
   */
  private emitEvent(type: string, data: any): void {
    const event = new CustomEvent(`symphony:${type}`, { detail: data });
    document.dispatchEvent(event);
  }

  /**
   * Get orchestration statistics
   */
  getStats() {
    return {
      activeAgents: this.activeAgents.size,
      totalAgents: this.agentPool.getStats().total,
      taskQueue: this.taskQueue.getStats(),
      memory: this.memoryBridge.getStats()
    };
  }

  /**
   * Stop the Symphony and clean up all agents
   */
  async stopSymphony(): Promise<void> {
    console.log('🛑 Stopping Symphony orchestration...');

    // Clear coordination interval
    if ((this as any).coordinationInterval) {
      clearInterval((this as any).coordinationInterval);
    }

    // Terminate all workers
    const cleanupPromises = Array.from(this.activeAgents.keys()).map(agentId => {
      return new Promise<void>((resolve) => {
        this.cleanupAgent(agentId);
        resolve();
      });
    });

    await Promise.all(cleanupPromises);
    console.log('✅ Symphony stopped successfully');
  }
}