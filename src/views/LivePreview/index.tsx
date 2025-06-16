import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { MultiWindowManager } from '../../components/preview/MultiWindowManager';

/**
 * Live Preview view - Multi-window preview with HMR and interject support
 */
const LivePreviewView = () => {
  return (
    <div className="h-full bg-gray-900 flex flex-col">
      <motion.div 
        className="glass-card border-b border-border p-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <Play className="h-8 w-8 text-green-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">Live Preview</h1>
            <p className="text-gray-400">
              Real-time multi-window visualization with hot module replacement
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 overflow-hidden">
        <MultiWindowManager />
      </div>
    </div>
  );
};

export default LivePreviewView;