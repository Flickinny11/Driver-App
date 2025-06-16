import { ConductorAgent } from '../symphony/ConductorAgent';
import { MultiFileCoordinator } from './MultiFileCoordinator';
import { AgentVisualizer3D } from '../visualization/AgentVisualizer3D';
import { AgentPool } from '../AgentPool';
import type { 
  BuildPlan, 
  Assignment, 
  SpecializedAgent, 
  FileDependencyGraph,
  Task,
  AgentType
} from '@/types';

/**
 * Orchestra mode conductor that extends Symphony with enhanced coordination
 * Manages 20-30 agents with advanced file coordination and 3D visualization
 */
export class OrchestraConductor extends ConductorAgent {
  private fileCoordinator: MultiFileCoordinator;
  private visualizer?: AgentVisualizer3D;
  private orchestraMode = true;

  constructor(apiKey?: string, visualizerContainer?: HTMLElement) {
    super(apiKey);
    // Override agent pool for Orchestra mode (30 agents)
    this.agentPool = new AgentPool(30);
    this.fileCoordinator = new MultiFileCoordinator();
    
    if (visualizerContainer) {
      this.visualizer = new AgentVisualizer3D(visualizerContainer);
    }
  }

  /**
   * Override analyzeProject to use Orchestra-optimized models
   */
  async analyzeProject(requirements: string): Promise<BuildPlan> {
    if (!this.openRouterClient) {
      throw new Error('OpenRouter client not initialized');
    }

    console.log('🎺 Orchestra Conductor analyzing project requirements...');

    // Use the best model optimized for Orchestra mode (complex coordination)
    const orchestraModel = this.modelManager?.getBestModelForOrchestra() || 'openai/o1-preview';

    const response = await this.openRouterClient.getCompletionWithUsage({
      model: orchestraModel,
      messages: [{
        role: 'system',
        content: `You are the master conductor for an Orchestra of 20-30 AI agents. 
                  Analyze these requirements and create a comprehensive build plan optimized for large-scale coordination.
                  Break down into parallel tasks for specialized agents with advanced file coordination.
                  
                  IMPORTANT: Plan for REAL implementation with complex multi-file coordination.
                  
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

    try {
      const plan = JSON.parse(response.content);
      console.log('🎺 Orchestra build plan created successfully');
      return plan;
    } catch (error) {
      console.warn('Failed to parse Orchestra plan JSON, using fallback:', error);
      return this.createFallbackPlan(requirements);
    }
  }

  /**
   * Orchestrate a project with enhanced coordination
   */
  async orchestrateProject(requirements: string): Promise<void> {
    console.log('🎺 Starting Orchestra orchestration...');

    // Create comprehensive build plan
    const plan = await this.analyzeProject(requirements);

    // Set up file coordination
    const fileGraph = await this.fileCoordinator.analyzeFileDependencies(plan);

    // Distribute work across many agents with optimized assignments
    const assignments = this.optimizeAgentAssignments(plan, fileGraph);

    console.log(`🎼 Orchestra launching ${assignments.length} optimized assignments`);

    // Launch all agents in parallel
    const agents = await Promise.all(
      assignments.map(async (assignment) => {
        try {
          const agent = await this.agentPool.getAgent(assignment.agentType);
          await this.launchAgentWithAssignment(agent, assignment);
          return agent;
        } catch (error) {
          console.error(`Failed to launch agent for assignment:`, error);
          return null;
        }
      })
    );

    const activeAgents = agents.filter(Boolean) as SpecializedAgent[];

    // Start 3D visualization
    if (this.visualizer) {
      this.visualizer.startVisualization(activeAgents);
    }

    // Monitor and coordinate with enhanced coordination
    this.startOrchestraCoordination(activeAgents);
  }

  /**
   * Optimize agent assignments using graph algorithms
   */
  private optimizeAgentAssignments(
    plan: BuildPlan, 
    fileGraph: FileDependencyGraph
  ): Assignment[] {
    console.log('🧮 Optimizing agent assignments with graph algorithms...');

    const assignments: Assignment[] = [];

    // Get critical path and parallelizable tasks
    const criticalPath = fileGraph.getCriticalPath();
    const parallelizableTasks = fileGraph.getParallelizableTasks();

    console.log(`📊 Critical path: ${criticalPath.length} tasks, Parallelizable groups: ${parallelizableTasks.length}`);

    // Assign multiple agents to critical path items for faster completion
    criticalPath.forEach(task => {
      assignments.push({
        agentType: this.getAgentTypeForTask(task),
        task,
        priority: 'critical',
        parallelWorkers: Math.min(3, Math.ceil(task.estimatedTime / 10)) // More workers for longer tasks
      });
    });

    // Assign single agents to parallelizable tasks
    parallelizableTasks.forEach(taskGroup => {
      taskGroup.forEach(task => {
        // Skip if already assigned in critical path
        if (!criticalPath.find(cp => cp.id === task.id)) {
          assignments.push({
            agentType: this.getAgentTypeForTask(task),
            task,
            priority: 'normal',
            parallelWorkers: 1
          });
        }
      });
    });

    // Handle remaining tasks not in critical path or parallelizable groups
    plan.tasks.forEach(task => {
      const alreadyAssigned = assignments.find(a => a.task.id === task.id);
      if (!alreadyAssigned) {
        assignments.push({
          agentType: this.getAgentTypeForTask(task),
          task,
          priority: task.priority === 'high' ? 'critical' : 'normal',
          parallelWorkers: 1
        });
      }
    });

    return assignments;
  }

  /**
   * Determine the best agent type for a task
   */
  private getAgentTypeForTask(task: Task): AgentType {
    // Map task types or keywords to agent types
    const taskContent = `${task.title} ${task.description}`.toLowerCase();

    if (taskContent.includes('component') || taskContent.includes('react') || taskContent.includes('frontend')) {
      return 'frontend-architect';
    }
    if (taskContent.includes('api') && taskContent.includes('design')) {
      return 'api-designer';
    }
    if (taskContent.includes('api') || taskContent.includes('backend') || taskContent.includes('server')) {
      return 'backend-engineer';
    }
    if (taskContent.includes('database') || taskContent.includes('schema') || taskContent.includes('sql')) {
      return 'database-designer';
    }
    if (taskContent.includes('deploy') || taskContent.includes('docker') || taskContent.includes('ci/cd')) {
      return 'devops-specialist';
    }
    if (taskContent.includes('security') || taskContent.includes('auth') || taskContent.includes('audit')) {
      return 'security-auditor';
    }
    if (taskContent.includes('performance') || taskContent.includes('optimize')) {
      return 'performance-optimizer';
    }
    if (taskContent.includes('test') || taskContent.includes('spec')) {
      return 'testing-specialist';
    }
    if (taskContent.includes('docs') || taskContent.includes('documentation')) {
      return 'documentation-writer';
    }
    if (taskContent.includes('ui') || taskContent.includes('ux') || taskContent.includes('design')) {
      return 'ui-ux-designer';
    }

    // Default to frontend architect for general tasks
    return 'frontend-architect';
  }

  /**
   * Launch an agent with a specific assignment
   */
  private async launchAgentWithAssignment(agent: SpecializedAgent, assignment: Assignment): Promise<void> {
    console.log(`🚀 Orchestra launching ${agent.type} agent for ${assignment.task.title} (${assignment.parallelWorkers} workers)`);

    // For critical assignments with multiple workers, we could spawn multiple instances
    if (assignment.parallelWorkers > 1) {
      console.log(`⚡ Spawning ${assignment.parallelWorkers} parallel workers for critical task`);
      
      // Launch multiple workers for the same task (simplified implementation)
      for (let i = 0; i < assignment.parallelWorkers; i++) {
        try {
          const workerAgent = i === 0 ? agent : await this.agentPool.getAgent(assignment.agentType);
          await this.launchAgent(workerAgent, assignment.task);
          
          if (this.visualizer) {
            this.visualizer.addAgent(workerAgent);
          }
        } catch (error) {
          console.error(`Failed to launch worker ${i} for critical task:`, error);
        }
      }
    } else {
      await this.launchAgent(agent, assignment.task);
      
      if (this.visualizer) {
        this.visualizer.addAgent(agent);
      }
    }
  }

  /**
   * Start enhanced Orchestra coordination
   */
  private startOrchestraCoordination(agents: SpecializedAgent[]): void {
    console.log(`🎼 Starting Orchestra coordination for ${agents.length} agents`);

    // Enhanced coordination with more frequent checks and file coordination
    const coordinationInterval = setInterval(() => {
      this.coordinateOrchestraAgents();
    }, 2000); // Check every 2 seconds for more responsive coordination

    // Set up file coordination monitoring
    const fileCoordinationInterval = setInterval(() => {
      this.coordinateFileOperations();
    }, 1000); // Check file operations every second

    // Store intervals for cleanup
    (this as any).orchestraCoordinationInterval = coordinationInterval;
    (this as any).fileCoordinationInterval = fileCoordinationInterval;

    // Start visualization updates if available
    if (this.visualizer) {
      this.startVisualizationUpdates();
    }
  }

  /**
   * Enhanced agent coordination for Orchestra mode
   */
  private coordinateOrchestraAgents(): void {
    const stats = this.taskQueue.getStats();
    const agentStats = this.agentPool.getStats();

    // More aggressive agent spawning for Orchestra mode
    if (stats.pending > 0 && agentStats.available > 0) {
      const maxNewAgents = Math.min(stats.pending, agentStats.available, 5);
      const nextTasks = this.taskQueue.getParallelTasks(maxNewAgents);
      
      nextTasks.forEach(async (task) => {
        try {
          const agent = await this.agentPool.getAgent(this.getAgentTypeForTask(task));
          await this.launchAgent(agent, task);
          
          if (this.visualizer) {
            this.visualizer.addAgent(agent);
          }
        } catch (error) {
          console.error('Failed to launch additional Orchestra agent:', error);
        }
      });
    }

    // Show agent communications in visualizer
    if (this.visualizer && this.activeAgents.size > 1) {
      this.simulateAgentCommunications();
    }

    // Emit enhanced coordination status
    this.emitEvent('orchestraCoordination', {
      mode: 'orchestra',
      activeAgents: this.activeAgents.size,
      queueStats: stats,
      agentStats,
      memoryStats: this.memoryBridge.getStats(),
      fileCoordination: this.fileCoordinator.getStats()
    });
  }

  /**
   * Coordinate file operations to prevent conflicts
   */
  private coordinateFileOperations(): void {
    // This would integrate with the MultiFileCoordinator
    const fileStats = this.fileCoordinator.getStats();
    
    if (fileStats.activeOperations > 0) {
      console.log(`📁 Coordinating ${fileStats.activeOperations} active file operations`);
    }

    // Emit file coordination updates
    this.emitEvent('fileCoordination', fileStats);
  }

  /**
   * Start visualization updates
   */
  private startVisualizationUpdates(): void {
    if (!this.visualizer) return;

    const updateInterval = setInterval(() => {
      this.updateVisualization();
    }, 100); // 10 FPS updates

    (this as any).visualizationInterval = updateInterval;
  }

  /**
   * Update 3D visualization with current agent states
   */
  private updateVisualization(): void {
    if (!this.visualizer) return;

    // Update agent positions and states
    for (const [agentId, agent] of this.activeAgents.entries()) {
      this.visualizer.updateAgentStatus(agentId, {
        status: agent.status,
        progress: agent.currentTask?.progress || 0,
        currentTask: agent.currentTask?.title
      });
    }
  }

  /**
   * Simulate agent communications for visualization
   */
  private simulateAgentCommunications(): void {
    if (!this.visualizer || this.activeAgents.size < 2) return;

    const agents = Array.from(this.activeAgents.keys());
    const fromAgent = agents[Math.floor(Math.random() * agents.length)];
    const toAgent = agents[Math.floor(Math.random() * agents.length)];

    if (fromAgent !== toAgent) {
      const messageTypes = ['task-handoff', 'file-update', 'help-request', 'progress-update'];
      const messageType = messageTypes[Math.floor(Math.random() * messageTypes.length)];
      
      this.visualizer.showCommunication(fromAgent, toAgent, messageType);
    }
  }

  /**
   * Override the stop method to clean up Orchestra-specific resources
   */
  async stopOrchestra(): Promise<void> {
    console.log('🛑 Stopping Orchestra orchestration...');

    // Clear Orchestra-specific intervals
    if ((this as any).orchestraCoordinationInterval) {
      clearInterval((this as any).orchestraCoordinationInterval);
    }
    if ((this as any).fileCoordinationInterval) {
      clearInterval((this as any).fileCoordinationInterval);
    }
    if ((this as any).visualizationInterval) {
      clearInterval((this as any).visualizationInterval);
    }

    // Stop visualization
    if (this.visualizer) {
      this.visualizer.stop();
    }

    // Call parent stop method
    await this.stopSymphony();
    
    console.log('✅ Orchestra stopped successfully');
  }

  /**
   * Get Orchestra-specific statistics
   */
  getOrchestraStats() {
    return {
      ...this.getStats(),
      mode: 'orchestra',
      fileCoordination: this.fileCoordinator.getStats(),
      visualization: this.visualizer ? this.visualizer.getStats() : null,
      maxAgents: 30,
      orchestraMode: this.orchestraMode
    };
  }
}