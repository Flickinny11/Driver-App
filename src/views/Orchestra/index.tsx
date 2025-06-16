import { motion } from 'framer-motion';
import { Music, Settings } from 'lucide-react';
import { useState } from 'react';
import { OrchestrationDashboard } from '@/orchestration/ui/OrchestrationDashboard';
import type { OrchestrationMode } from '@/types';

/**
 * Orchestra view - Agent orchestration and coordination with real AI agents
 */
const OrchestraView = () => {
  const [mode, setMode] = useState<OrchestrationMode>('orchestra');
  
  // In a real implementation, this would come from user settings
  const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY || '';

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
              <h1 className="text-2xl font-bold">AI Orchestra</h1>
              <p className="text-muted-foreground">Real multi-agent orchestration with 3D visualization</p>
            </div>
          </div>
          <div className="flex gap-2">
            {/* Mode Selector */}
            <div className="flex rounded-lg overflow-hidden border border-border">
              <button 
                onClick={() => setMode('symphony')}
                className={`px-4 py-2 text-sm transition-colors ${
                  mode === 'symphony' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card hover:bg-accent'
                }`}
              >
                🎼 Symphony (15)
              </button>
              <button 
                onClick={() => setMode('orchestra')}
                className={`px-4 py-2 text-sm transition-colors ${
                  mode === 'orchestra' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card hover:bg-accent'
                }`}
              >
                🎺 Orchestra (30)
              </button>
            </div>
            <button className="btn-ghost px-3 py-2">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      <div className="h-[calc(100vh-140px)]">
        {apiKey ? (
          <OrchestrationDashboard mode={mode} apiKey={apiKey} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <motion.div 
              className="text-center p-8 glass-card max-w-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3 className="text-lg font-semibold mb-2">API Key Required</h3>
              <p className="text-muted-foreground mb-4">
                Please set your OpenRouter API key to enable real AI orchestration.
              </p>
              <p className="text-sm text-muted-foreground">
                Set <code className="bg-accent px-1 rounded">REACT_APP_OPENROUTER_API_KEY</code> environment variable
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrchestraView;