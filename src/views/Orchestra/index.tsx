import { motion } from 'framer-motion';
import { Music, Play, Pause, Users, Settings } from 'lucide-react';
import { useState } from 'react';

/**
 * Orchestra view - Agent orchestration and coordination
 */
const OrchestraView = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const agents = [
    { id: 1, name: 'Code Generator', type: 'Coder', status: 'active', color: 'bg-green-500' },
    { id: 2, name: 'Design Assistant', type: 'Designer', status: 'idle', color: 'bg-blue-500' },
    { id: 3, name: 'Test Engineer', type: 'Tester', status: 'working', color: 'bg-yellow-500' },
    { id: 4, name: 'Project Manager', type: 'Orchestrator', status: 'monitoring', color: 'bg-purple-500' },
  ];

  return (
    <div className="h-full bg-background">
      <motion.div 
        className="glass-card border-b border-border p-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Music className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Orchestra</h1>
              <p className="text-muted-foreground">Coordinate multiple AI agents for complex tasks</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="btn-primary px-4 py-2 flex items-center gap-2"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Pause' : 'Start'} Orchestra
            </button>
            <button className="btn-ghost px-3 py-2">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      <div className="p-6">
        {/* Agent Status Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {agents.map((agent) => (
            <div key={agent.id} className="glass-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-3 h-3 rounded-full ${agent.color}`}></div>
                <span className="font-medium">{agent.name}</span>
              </div>
              <div className="text-sm text-muted-foreground mb-2">{agent.type}</div>
              <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                agent.status === 'active' ? 'bg-green-500/20 text-green-400' :
                agent.status === 'working' ? 'bg-yellow-500/20 text-yellow-400' :
                agent.status === 'monitoring' ? 'bg-purple-500/20 text-purple-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {agent.status}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Orchestration Controls */}
        <motion.div 
          className="glass-card p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Agent Coordination
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-2">Task Queue</h4>
              <div className="space-y-2">
                <div className="glass-button p-3 text-sm">
                  Generate login component
                </div>
                <div className="glass-button p-3 text-sm">
                  Add authentication logic
                </div>
                <div className="glass-button p-3 text-sm">
                  Write unit tests
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Active Tasks</h4>
              <div className="space-y-2">
                <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg text-sm">
                  Creating React component
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-sm">
                  Reviewing code quality
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Completed</h4>
              <div className="space-y-2">
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-sm">
                  Project structure created
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-sm">
                  Dependencies installed
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Agent Communication */}
        <motion.div 
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold mb-4">Agent Communications</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <div className="text-sm font-medium">Code Generator</div>
                <div className="text-sm text-muted-foreground">Component structure ready for review</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <div className="text-sm font-medium">Project Manager</div>
                <div className="text-sm text-muted-foreground">Assigning testing task to Test Engineer</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <div className="text-sm font-medium">Test Engineer</div>
                <div className="text-sm text-muted-foreground">Starting unit test generation</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrchestraView;