import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Users, Activity, FileText, Zap } from 'lucide-react';
import { ConductorAgent } from '../symphony/ConductorAgent';
import { OrchestraConductor } from '../orchestra/OrchestraConductor';
import type { OrchestrationMetrics, SpecializedAgent, OrchestrationMode } from '@/types';

interface OrchestrationDashboardProps {
  mode: OrchestrationMode;
  apiKey?: string;
}

/**
 * Real-time orchestration dashboard with 3D visualization and metrics
 */
export const OrchestrationDashboard: React.FC<OrchestrationDashboardProps> = ({ 
  mode, 
  apiKey 
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<OrchestrationMetrics | null>(null);
  const [activeAgents, setActiveAgents] = useState<SpecializedAgent[]>([]);
  const [conductor, setConductor] = useState<ConductorAgent | OrchestraConductor | null>(null);
  const [projectRequirements, setProjectRequirements] = useState('');
  const visualizerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize conductor based on mode
    if (visualizerRef.current && apiKey) {
      const newConductor = mode === 'orchestra' 
        ? new OrchestraConductor(apiKey, visualizerRef.current)
        : new ConductorAgent(apiKey);
      
      setConductor(newConductor);

      // Set up event listeners for real-time updates
      const handleProgress = (_event: CustomEvent) => {
        updateMetrics();
      };

      const handleAgentUpdate = (_event: CustomEvent) => {
        updateActiveAgents();
      };

      const handleCoordination = (event: CustomEvent) => {
        setMetrics(prev => ({
          ...prev,
          ...event.detail
        } as OrchestrationMetrics));
      };

      document.addEventListener('symphony:progress', handleProgress as EventListener);
      document.addEventListener('symphony:coordination', handleCoordination as EventListener);
      document.addEventListener('symphony:taskComplete', handleAgentUpdate as EventListener);

      return () => {
        document.removeEventListener('symphony:progress', handleProgress as EventListener);
        document.removeEventListener('symphony:coordination', handleCoordination as EventListener);
        document.removeEventListener('symphony:taskComplete', handleAgentUpdate as EventListener);
        
        // Cleanup conductor
        if (newConductor instanceof OrchestraConductor) {
          newConductor.stopOrchestra();
        } else {
          newConductor.stopSymphony();
        }
      };
    }
  }, [mode, apiKey]);

  const updateMetrics = () => {
    if (!conductor) return;

    try {
      const stats = conductor.getStats();

      const newMetrics: OrchestrationMetrics = {
        activeAgents: stats.activeAgents,
        tasksCompleted: stats.taskQueue.completed,
        tasksInProgress: stats.taskQueue.running,
        tasksPending: stats.taskQueue.pending,
        filesPerMinute: calculateFilesPerMinute(stats),
        linesOfCode: estimateLinesOfCode(stats),
        parallelOps: stats.memory.totalBuffers,
        averageTaskTime: stats.taskQueue.averageTime / 1000 / 60, // Convert to minutes
        successRate: calculateSuccessRate(stats),
        trend: calculateTrend(stats),
        fileProgress: []
      };

      setMetrics(newMetrics);
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  };

  const updateActiveAgents = () => {
    if (!conductor) return;

    try {
      const pool = (conductor as any).agentPool;
      if (pool) {
        const agents = pool.getAllAgents();
        setActiveAgents(agents);
      }
    } catch (error) {
      console.error('Error updating active agents:', error);
    }
  };

  const calculateFilesPerMinute = (stats: any): number => {
    const totalFiles = stats.taskQueue.completed * 2; // Estimate 2 files per task
    const runTimeMinutes = 1; // Placeholder - would need actual runtime tracking
    return Math.round(totalFiles / Math.max(runTimeMinutes, 1));
  };

  const estimateLinesOfCode = (stats: any): number => {
    return stats.taskQueue.completed * 50; // Estimate 50 lines per completed task
  };

  const calculateSuccessRate = (stats: any): number => {
    const total = stats.taskQueue.completed + stats.taskQueue.failed;
    if (total === 0) return 100;
    return Math.round((stats.taskQueue.completed / total) * 100);
  };

  const calculateTrend = (stats: any): 'up' | 'down' | 'stable' => {
    // Simplified trend calculation
    if (stats.taskQueue.running > stats.taskQueue.pending) return 'up';
    if (stats.taskQueue.pending > stats.taskQueue.running * 2) return 'down';
    return 'stable';
  };

  const handleStart = async () => {
    if (!conductor || !projectRequirements.trim()) {
      setError('Please enter project requirements and ensure API key is provided');
      return;
    }

    setError(null);
    setIsRunning(true);

    try {
      if (conductor instanceof OrchestraConductor) {
        await conductor.orchestrateProject(projectRequirements);
      } else {
        await conductor.analyzeProject(projectRequirements);
        await conductor.startSymphony();
      }

      // Start metrics updates
      const metricsInterval = setInterval(updateMetrics, 1000);
      (window as any).orchestrationMetricsInterval = metricsInterval;

    } catch (error) {
      console.error('Error starting orchestration:', error);
      setError(error instanceof Error ? error.message : 'Failed to start orchestration');
      setIsRunning(false);
    }
  };

  const handleStop = async () => {
    if (!conductor) return;

    setIsRunning(false);
    
    // Clear metrics interval
    if ((window as any).orchestrationMetricsInterval) {
      clearInterval((window as any).orchestrationMetricsInterval);
    }

    try {
      if (conductor instanceof OrchestraConductor) {
        await conductor.stopOrchestra();
      } else {
        await conductor.stopSymphony();
      }
    } catch (error) {
      console.error('Error stopping orchestration:', error);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-full bg-gray-900 p-4">
      {/* 3D Visualization */}
      <div className="col-span-8 bg-black rounded-lg overflow-hidden relative">
        <div ref={visualizerRef} className="w-full h-full min-h-[600px]" />
        
        {/* Overlay Controls */}
        <div className="absolute top-4 left-4 flex gap-2">
          <motion.button
            onClick={isRunning ? handleStop : handleStart}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isRunning 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            } text-white transition-colors`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!apiKey}
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isRunning ? 'Stop' : 'Start'} {mode === 'orchestra' ? 'Orchestra' : 'Symphony'}
          </motion.button>
        </div>

        {/* Mode Badge */}
        <div className="absolute top-4 right-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            mode === 'orchestra' 
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
          }`}>
            {mode === 'orchestra' ? '🎺 Orchestra Mode' : '🎼 Symphony Mode'}
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="col-span-4 space-y-4">
        {/* Project Requirements */}
        <motion.div 
          className="bg-gray-800 rounded-lg p-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-white font-bold mb-2">Project Requirements</h3>
          <textarea
            value={projectRequirements}
            onChange={(e) => setProjectRequirements(e.target.value)}
            placeholder="Describe your project requirements..."
            className="w-full h-24 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm resize-none"
            disabled={isRunning}
          />
          {error && (
            <div className="mt-2 text-red-400 text-sm">{error}</div>
          )}
        </motion.div>

        {/* Performance Metrics */}
        <motion.div 
          className="bg-gray-800 rounded-lg p-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance
          </h3>
          <div className="space-y-3">
            <MetricRow 
              label="Active Agents" 
              value={metrics?.activeAgents || 0} 
              trend={metrics?.trend}
              icon={<Users className="h-4 w-4" />}
            />
            <MetricRow 
              label="Files/minute" 
              value={metrics?.filesPerMinute || 0}
              icon={<FileText className="h-4 w-4" />}
            />
            <MetricRow 
              label="Lines of Code" 
              value={metrics?.linesOfCode || 0}
              icon={<FileText className="h-4 w-4" />}
            />
            <MetricRow 
              label="Parallel Ops" 
              value={metrics?.parallelOps || 0}
              icon={<Zap className="h-4 w-4" />}
            />
          </div>
        </motion.div>

        {/* Active Agents */}
        <motion.div 
          className="bg-gray-800 rounded-lg p-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-white font-bold mb-3">Active Agents</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {activeAgents.length > 0 ? (
              activeAgents.map(agent => (
                <AgentStatusCard key={agent.id} agent={agent} />
              ))
            ) : (
              <div className="text-gray-400 text-sm text-center py-4">
                {isRunning ? 'Initializing agents...' : 'No active agents'}
              </div>
            )}
          </div>
        </motion.div>

        {/* Task Progress */}
        <motion.div 
          className="bg-gray-800 rounded-lg p-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-white font-bold mb-3">Task Progress</h3>
          <div className="space-y-2">
            <TaskProgressBar 
              label="Completed" 
              value={metrics?.tasksCompleted || 0}
              color="bg-green-500"
            />
            <TaskProgressBar 
              label="In Progress" 
              value={metrics?.tasksInProgress || 0}
              color="bg-yellow-500"
            />
            <TaskProgressBar 
              label="Pending" 
              value={metrics?.tasksPending || 0}
              color="bg-gray-500"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

interface MetricRowProps {
  label: string;
  value: number;
  trend?: 'up' | 'down' | 'stable';
  icon?: React.ReactNode;
}

const MetricRow: React.FC<MetricRowProps> = ({ label, value, trend, icon }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-gray-300">
      {icon}
      <span className="text-sm">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-white font-medium">{value.toLocaleString()}</span>
      {trend && (
        <span className={`text-xs ${
          trend === 'up' ? 'text-green-400' : 
          trend === 'down' ? 'text-red-400' : 
          'text-yellow-400'
        }`}>
          {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
        </span>
      )}
    </div>
  </div>
);

interface AgentStatusCardProps {
  agent: SpecializedAgent;
}

const AgentStatusCard: React.FC<AgentStatusCardProps> = ({ agent }) => (
  <div className="flex items-center gap-2 p-2 bg-gray-700 rounded">
    <div className={`w-2 h-2 rounded-full ${
      agent.status === 'working' ? 'bg-green-500' :
      agent.status === 'idle' ? 'bg-yellow-500' :
      agent.status === 'error' ? 'bg-red-500' :
      'bg-gray-500'
    }`} />
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium text-white truncate">{agent.name}</div>
      <div className="text-xs text-gray-400">{agent.type}</div>
    </div>
    {agent.currentTask && (
      <div className="text-xs text-gray-300">
        {agent.currentTask.progress || 0}%
      </div>
    )}
  </div>
);

interface TaskProgressBarProps {
  label: string;
  value: number;
  color: string;
}

const TaskProgressBar: React.FC<TaskProgressBarProps> = ({ label, value, color }) => (
  <div>
    <div className="flex justify-between text-sm text-gray-300 mb-1">
      <span>{label}</span>
      <span>{value}</span>
    </div>
    <div className="w-full bg-gray-700 rounded-full h-2">
      <div 
        className={`h-2 rounded-full ${color} transition-all duration-300`}
        style={{ width: `${Math.min(value * 10, 100)}%` }}
      />
    </div>
  </div>
);