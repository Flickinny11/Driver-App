import type { Task } from '@/types';

/**
 * Task queue implementation with priority handling and dependency management
 * Supports parallel task execution and dependency resolution
 */
export class TaskQueue {
  private tasks: Map<string, Task> = new Map();
  private dependencies: Map<string, string[]> = new Map();
  private completedTasks: Set<string> = new Set();
  private pendingTasks: Set<string> = new Set();
  private runningTasks: Set<string> = new Set();

  /**
   * Add a task to the queue
   */
  addTask(task: Task): void {
    this.tasks.set(task.id, task);
    this.pendingTasks.add(task.id);
    
    // Set up dependencies
    if (task.dependencies.length > 0) {
      this.dependencies.set(task.id, task.dependencies);
    }
  }

  /**
   * Add multiple tasks to the queue
   */
  addTasks(tasks: Task[]): void {
    tasks.forEach(task => this.addTask(task));
  }

  /**
   * Get the next available task based on priority and dependencies
   */
  getNextTask(): Task | null {
    // Find tasks that have no pending dependencies
    const availableTasks = Array.from(this.pendingTasks)
      .filter(taskId => this.areAllDependenciesCompleted(taskId))
      .map(taskId => this.tasks.get(taskId)!)
      .filter(task => task.status === 'pending');

    if (availableTasks.length === 0) {
      return null;
    }

    // Sort by priority and estimated time
    availableTasks.sort((a, b) => {
      // Priority order: critical > high > normal > low
      const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      
      // If same priority, prefer shorter tasks
      return a.estimatedTime - b.estimatedTime;
    });

    const task = availableTasks[0];
    
    // Mark task as assigned and remove from pending
    task.status = 'assigned';
    this.pendingTasks.delete(task.id);
    this.runningTasks.add(task.id);
    
    return task;
  }

  /**
   * Check if all dependencies for a task are completed
   */
  private areAllDependenciesCompleted(taskId: string): boolean {
    const dependencies = this.dependencies.get(taskId) || [];
    return dependencies.every(depId => this.completedTasks.has(depId));
  }

  /**
   * Mark a task as completed
   */
  completeTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'completed';
    task.completedAt = new Date();
    task.progress = 100;

    this.completedTasks.add(taskId);
    this.runningTasks.delete(taskId);
  }

  /**
   * Mark a task as failed
   */
  failTask(taskId: string, _error?: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'failed';
    this.runningTasks.delete(taskId);
    
    // Could add error details to task if needed
  }

  /**
   * Update task progress
   */
  updateTaskProgress(taskId: string, progress: number): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.progress = Math.max(0, Math.min(100, progress));
    
    if (task.status === 'assigned') {
      task.status = 'in-progress';
      task.startedAt = new Date();
    }
  }

  /**
   * Get tasks that can be executed in parallel
   */
  getParallelTasks(maxTasks = 10): Task[] {
    const parallelTasks: Task[] = [];
    
    for (let i = 0; i < maxTasks; i++) {
      const task = this.getNextTask();
      if (!task) break;
      parallelTasks.push(task);
    }
    
    return parallelTasks;
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    averageTime: number;
    estimatedRemaining: number;
  } {
    const allTasks = Array.from(this.tasks.values());
    const failedTasks = allTasks.filter(t => t.status === 'failed');
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    
    // Calculate average completion time
    const completedWithTimes = completedTasks.filter(t => t.startedAt && t.completedAt);
    const averageTime = completedWithTimes.length > 0
      ? completedWithTimes.reduce((sum, t) => {
          const duration = t.completedAt!.getTime() - t.startedAt!.getTime();
          return sum + duration;
        }, 0) / completedWithTimes.length
      : 0;

    // Estimate remaining time
    const pendingTasks = allTasks.filter(t => t.status === 'pending');
    const estimatedRemaining = pendingTasks.reduce((sum, t) => sum + t.estimatedTime, 0);

    return {
      total: allTasks.length,
      pending: pendingTasks.length,
      running: this.runningTasks.size,
      completed: this.completedTasks.size,
      failed: failedTasks.length,
      averageTime,
      estimatedRemaining
    };
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: Task['status']): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.status === status);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Clear completed tasks to free memory
   */
  clearCompleted(): void {
    const completedTaskIds = Array.from(this.completedTasks);
    completedTaskIds.forEach(taskId => {
      this.tasks.delete(taskId);
      this.dependencies.delete(taskId);
    });
    this.completedTasks.clear();
  }

  /**
   * Get the critical path of tasks (longest sequence of dependent tasks)
   */
  getCriticalPath(): Task[] {
    const visited = new Set<string>();
    
    // Find tasks with no dependencies
    const rootTasks = Array.from(this.tasks.values())
      .filter(task => !this.dependencies.has(task.id) || this.dependencies.get(task.id)!.length === 0);
    
    // For each root task, find the longest path
    let longestPath: Task[] = [];
    
    rootTasks.forEach(rootTask => {
      const path = this.findLongestPath(rootTask, visited);
      if (path.length > longestPath.length) {
        longestPath = path;
      }
    });
    
    return longestPath;
  }

  /**
   * Find the longest path from a given task
   */
  private findLongestPath(task: Task, visited: Set<string>): Task[] {
    if (visited.has(task.id)) {
      return [];
    }
    
    visited.add(task.id);
    
    // Find tasks that depend on this task
    const dependentTasks = Array.from(this.tasks.values())
      .filter(t => {
        const deps = this.dependencies.get(t.id) || [];
        return deps.includes(task.id);
      });
    
    if (dependentTasks.length === 0) {
      visited.delete(task.id);
      return [task];
    }
    
    let longestSubPath: Task[] = [];
    
    dependentTasks.forEach(dependentTask => {
      const subPath = this.findLongestPath(dependentTask, new Set(visited));
      if (subPath.length > longestSubPath.length) {
        longestSubPath = subPath;
      }
    });
    
    visited.delete(task.id);
    return [task, ...longestSubPath];
  }
}