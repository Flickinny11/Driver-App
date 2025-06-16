import type { 
  BuildPlan, 
  FileState, 
  FileOperation, 
  Conflict, 
  FileDependencyGraph,
  Task 
} from '@/types';

/**
 * Coordinates simultaneous file editing across multiple agents
 * Prevents conflicts and manages file dependencies
 */
export class MultiFileCoordinator {
  private fileStates: Map<string, FileState> = new Map();
  private lockManager: FileLockManager;
  private conflictResolver: ConflictResolver;
  private activeOperations: Map<string, FileOperation[]> = new Map();
  private operationHistory: FileOperation[] = [];

  constructor() {
    this.lockManager = new FileLockManager();
    this.conflictResolver = new ConflictResolver();
  }

  /**
   * Analyze file dependencies from a build plan
   */
  async analyzeFileDependencies(plan: BuildPlan): Promise<FileDependencyGraph> {
    console.log(`📊 Analyzing file dependencies for ${plan.tasks.length} tasks`);

    const dependencyGraph: FileDependencyGraph = {
      files: new Map(),
      getCriticalPath: () => this.calculateCriticalPath(plan.tasks),
      getParallelizableTasks: () => this.calculateParallelizableTasks(plan.tasks)
    };

    // Build file dependency map
    plan.tasks.forEach(task => {
      task.files.forEach(filePath => {
        if (!dependencyGraph.files.has(filePath)) {
          dependencyGraph.files.set(filePath, []);
        }
        
        // Add dependencies based on task dependencies
        task.dependencies.forEach(depTaskId => {
          const depTask = plan.tasks.find(t => t.id === depTaskId);
          if (depTask) {
            depTask.files.forEach(depFilePath => {
              const deps = dependencyGraph.files.get(filePath) || [];
              if (!deps.includes(depFilePath) && depFilePath !== filePath) {
                deps.push(depFilePath);
                dependencyGraph.files.set(filePath, deps);
              }
            });
          }
        });
      });
    });

    console.log(`📁 Analyzed ${dependencyGraph.files.size} files with dependencies`);
    return dependencyGraph;
  }

  /**
   * Calculate critical path of tasks
   */
  private calculateCriticalPath(tasks: Task[]): Task[] {
    const visited = new Set<string>();
    const paths: Task[][] = [];

    // Find root tasks (no dependencies)
    const rootTasks = tasks.filter(task => task.dependencies.length === 0);

    // Calculate longest path from each root
    rootTasks.forEach(rootTask => {
      const path = this.findLongestTaskPath(rootTask, tasks, visited);
      paths.push(path);
    });

    // Return the longest path overall
    return paths.reduce((longest, current) => 
      current.length > longest.length ? current : longest, []
    );
  }

  /**
   * Find longest path from a task
   */
  private findLongestTaskPath(task: Task, allTasks: Task[], visited: Set<string>): Task[] {
    if (visited.has(task.id)) {
      return [];
    }

    visited.add(task.id);

    // Find tasks that depend on this task
    const dependentTasks = allTasks.filter(t => t.dependencies.includes(task.id));

    if (dependentTasks.length === 0) {
      visited.delete(task.id);
      return [task];
    }

    let longestPath: Task[] = [];
    dependentTasks.forEach(depTask => {
      const path = this.findLongestTaskPath(depTask, allTasks, new Set(visited));
      if (path.length > longestPath.length) {
        longestPath = path;
      }
    });

    visited.delete(task.id);
    return [task, ...longestPath];
  }

  /**
   * Calculate tasks that can be parallelized
   */
  private calculateParallelizableTasks(tasks: Task[]): Task[][] {
    const parallelGroups: Task[][] = [];
    const processed = new Set<string>();

    // Group tasks by dependency level
    const dependencyLevels = this.calculateDependencyLevels(tasks);
    const maxLevel = Math.max(...Object.values(dependencyLevels));

    for (let level = 0; level <= maxLevel; level++) {
      const levelTasks = tasks.filter(task => 
        dependencyLevels[task.id] === level && !processed.has(task.id)
      );

      if (levelTasks.length > 0) {
        parallelGroups.push(levelTasks);
        levelTasks.forEach(task => processed.add(task.id));
      }
    }

    console.log(`⚡ Found ${parallelGroups.length} parallelizable groups`);
    return parallelGroups;
  }

  /**
   * Calculate dependency level for each task
   */
  private calculateDependencyLevels(tasks: Task[]): Record<string, number> {
    const levels: Record<string, number> = {};
    const calculating = new Set<string>();

    const calculateLevel = (task: Task): number => {
      if (levels[task.id] !== undefined) {
        return levels[task.id];
      }

      if (calculating.has(task.id)) {
        // Circular dependency detected, assign level 0
        return 0;
      }

      calculating.add(task.id);

      if (task.dependencies.length === 0) {
        levels[task.id] = 0;
      } else {
        const depLevels = task.dependencies.map(depId => {
          const depTask = tasks.find(t => t.id === depId);
          return depTask ? calculateLevel(depTask) : 0;
        });
        levels[task.id] = Math.max(...depLevels) + 1;
      }

      calculating.delete(task.id);
      return levels[task.id];
    };

    tasks.forEach(task => calculateLevel(task));
    return levels;
  }

  /**
   * Coordinate a file edit operation
   */
  async coordinateFileEdit(
    filePath: string, 
    agentId: string, 
    operation: FileOperation
  ): Promise<void> {
    console.log(`📝 Coordinating file edit: ${filePath} by agent ${agentId}`);

    try {
      // Acquire lock for file section
      const lock = await this.lockManager.acquireLock(
        filePath, 
        operation.startLine || 0, 
        operation.endLine || -1,
        agentId
      );

      // Get current file state
      const currentState = this.fileStates.get(filePath) || this.createFileState(filePath);

      // Check for conflicts with other agents
      const conflicts = await this.detectConflicts(filePath, operation);

      let newState: FileState;
      
      if (conflicts.length > 0) {
        console.log(`⚠️ Detected ${conflicts.length} conflicts for ${filePath}`);
        const resolved = await this.conflictResolver.resolve(
          conflicts,
          currentState,
          operation
        );
        newState = resolved;
      } else {
        newState = this.applyOperation(currentState, operation);
      }

      // Update file state
      this.fileStates.set(filePath, newState);

      // Track operation
      this.trackOperation(operation);

      // Notify other agents of change
      this.broadcastFileChange(filePath, operation, agentId);

      // Release lock
      this.lockManager.releaseLock(lock);

      console.log(`✅ File edit coordinated successfully: ${filePath}`);
    } catch (error) {
      console.error(`❌ Failed to coordinate file edit: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Create initial file state
   */
  private createFileState(filePath: string): FileState {
    return {
      path: filePath,
      content: '',
      lastModified: new Date(),
      version: 1
    };
  }

  /**
   * Apply an operation to a file state
   */
  private applyOperation(state: FileState, operation: FileOperation): FileState {
    let newContent = state.content;

    switch (operation.type) {
      case 'create':
      case 'update':
        if (operation.startLine !== undefined && operation.endLine !== undefined) {
          // Line-based edit
          const lines = newContent.split('\n');
          const newLines = operation.content.split('\n');
          lines.splice(operation.startLine, operation.endLine - operation.startLine, ...newLines);
          newContent = lines.join('\n');
        } else {
          // Full file replacement
          newContent = operation.content;
        }
        break;
      case 'delete':
        if (operation.startLine !== undefined && operation.endLine !== undefined) {
          const lines = newContent.split('\n');
          lines.splice(operation.startLine, operation.endLine - operation.startLine);
          newContent = lines.join('\n');
        } else {
          newContent = '';
        }
        break;
    }

    return {
      ...state,
      content: newContent,
      lastModified: new Date(),
      version: state.version + 1
    };
  }

  /**
   * Detect conflicts with other agents
   */
  private async detectConflicts(
    filePath: string, 
    operation: FileOperation
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];
    const activeOps = this.activeOperations.get(filePath) || [];

    for (const activeOp of activeOps) {
      if (this.operationsOverlap(operation, activeOp)) {
        conflicts.push({
          type: 'overlapping-edit',
          operations: [operation, activeOp],
          severity: this.calculateConflictSeverity(operation, activeOp)
        });
      }
    }

    return conflicts;
  }

  /**
   * Check if two operations overlap
   */
  private operationsOverlap(op1: FileOperation, op2: FileOperation): boolean {
    // If either operation affects the whole file, they overlap
    if (op1.startLine === undefined || op2.startLine === undefined) {
      return true;
    }

    const start1 = op1.startLine || 0;
    const end1 = op1.endLine || start1;
    const start2 = op2.startLine || 0;
    const end2 = op2.endLine || start2;

    // Check for range overlap
    return !(end1 < start2 || end2 < start1);
  }

  /**
   * Calculate conflict severity
   */
  private calculateConflictSeverity(op1: FileOperation, op2: FileOperation): 'low' | 'medium' | 'high' {
    if (op1.type === 'delete' || op2.type === 'delete') {
      return 'high';
    }
    if (op1.agentId === op2.agentId) {
      return 'low';
    }
    return 'medium';
  }

  /**
   * Track an operation for history
   */
  private trackOperation(operation: FileOperation): void {
    this.operationHistory.push(operation);
    
    // Add to active operations
    const filePath = operation.filePath;
    const activeOps = this.activeOperations.get(filePath) || [];
    activeOps.push(operation);
    this.activeOperations.set(filePath, activeOps);

    // Clean up old operations (keep last 100)
    if (this.operationHistory.length > 100) {
      this.operationHistory = this.operationHistory.slice(-100);
    }
  }

  /**
   * Broadcast file change to listeners
   */
  private broadcastFileChange(filePath: string, operation: FileOperation, agentId: string): void {
    const event = new CustomEvent('fileChange', {
      detail: { filePath, operation, agentId }
    });
    document.dispatchEvent(event);
  }

  /**
   * Get coordination statistics
   */
  getStats() {
    const activeOpsCount = Array.from(this.activeOperations.values())
      .reduce((sum, ops) => sum + ops.length, 0);

    return {
      totalFiles: this.fileStates.size,
      activeOperations: activeOpsCount,
      totalOperations: this.operationHistory.length,
      conflictsResolved: this.conflictResolver.getStats().resolved,
      locksActive: this.lockManager.getActiveLocks()
    };
  }

  /**
   * Clean up completed operations
   */
  cleanup(): void {
    // Remove old operations and states
    this.activeOperations.clear();
    this.operationHistory = [];
    this.fileStates.clear();
  }
}

/**
 * Manages file locks to prevent concurrent edits
 */
class FileLockManager {
  private locks: Map<string, FileLock> = new Map();
  private lockCounter = 0;

  async acquireLock(
    filePath: string, 
    startLine: number, 
    endLine: number, 
    agentId: string
  ): Promise<FileLock> {
    const lockKey = `${filePath}:${startLine}:${endLine}`;
    
    // Wait for any existing locks to be released
    while (this.locks.has(lockKey)) {
      await this.sleep(10);
    }

    const lock: FileLock = {
      id: `lock-${++this.lockCounter}`,
      filePath,
      startLine,
      endLine,
      agentId,
      acquiredAt: new Date()
    };

    this.locks.set(lockKey, lock);
    return lock;
  }

  releaseLock(lock: FileLock): void {
    const lockKey = `${lock.filePath}:${lock.startLine}:${lock.endLine}`;
    this.locks.delete(lockKey);
  }

  getActiveLocks(): number {
    return this.locks.size;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Resolves conflicts between concurrent file operations
 */
class ConflictResolver {
  private resolvedCount = 0;

  async resolve(
    conflicts: Conflict[], 
    currentState: FileState, 
    operation: FileOperation
  ): Promise<FileState> {
    console.log(`🔧 Resolving ${conflicts.length} conflicts for ${currentState.path}`);

    // Simple conflict resolution strategy
    // In a production system, this could be much more sophisticated
    let resolvedState = currentState;

    for (const conflict of conflicts) {
      resolvedState = await this.resolveConflict(conflict, resolvedState, operation);
      this.resolvedCount++;
    }

    return resolvedState;
  }

  private async resolveConflict(
    conflict: Conflict, 
    state: FileState, 
    operation: FileOperation
  ): Promise<FileState> {
    switch (conflict.type) {
      case 'overlapping-edit':
        return this.resolveOverlappingEdit(conflict, state, operation);
      case 'concurrent-modification':
        return this.resolveConcurrentModification(conflict, state, operation);
      default:
        console.warn(`Unknown conflict type: ${conflict.type}`);
        return state;
    }
  }

  private resolveOverlappingEdit(
    _conflict: Conflict, 
    state: FileState, 
    operation: FileOperation
  ): FileState {
    // Simple strategy: merge changes by applying them sequentially
    console.log(`🔀 Resolving overlapping edit conflict`);
    
    // Apply the operation with a slight modification to avoid exact overlap
    const adjustedOperation = {
      ...operation,
      startLine: (operation.startLine || 0) + 1
    };

    return this.applyOperationToState(state, adjustedOperation);
  }

  private resolveConcurrentModification(
    _conflict: Conflict, 
    state: FileState, 
    operation: FileOperation
  ): FileState {
    console.log(`🔄 Resolving concurrent modification conflict`);
    // Default to applying the operation
    return this.applyOperationToState(state, operation);
  }

  private applyOperationToState(state: FileState, operation: FileOperation): FileState {
    // This duplicates logic from MultiFileCoordinator.applyOperation
    // In a real implementation, this should be shared
    let newContent = state.content;

    switch (operation.type) {
      case 'create':
      case 'update':
        newContent = operation.content;
        break;
      case 'delete':
        newContent = '';
        break;
    }

    return {
      ...state,
      content: newContent,
      lastModified: new Date(),
      version: state.version + 1
    };
  }

  getStats() {
    return {
      resolved: this.resolvedCount
    };
  }
}

interface FileLock {
  id: string;
  filePath: string;
  startLine: number;
  endLine: number;
  agentId: string;
  acquiredAt: Date;
}