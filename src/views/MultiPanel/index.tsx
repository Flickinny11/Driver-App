import { motion } from 'framer-motion';
import { Layout, Grid, Split, Maximize } from 'lucide-react';

/**
 * MultiPanel view - Advanced multi-panel workspace
 */
const MultiPanelView = () => {
  return (
    <div className="h-full bg-background">
      <motion.div 
        className="glass-card border-b border-border p-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layout className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Multi-Panel Builder</h1>
              <p className="text-muted-foreground">Advanced workspace with multiple AI agents and tools</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost px-3 py-2" title="Grid Layout">
              <Grid className="h-4 w-4" />
            </button>
            <button className="btn-ghost px-3 py-2" title="Split Layout">
              <Split className="h-4 w-4" />
            </button>
            <button className="btn-ghost px-3 py-2" title="Maximize">
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 p-4">
        <motion.div 
          className="h-full grid grid-cols-2 grid-rows-2 gap-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* Panel 1 - Code Chat */}
          <div className="glass-card p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium">Code Chat</span>
            </div>
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Chat interface placeholder
            </div>
          </div>

          {/* Panel 2 - Code Editor */}
          <div className="glass-card p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-medium">Code Editor</span>
            </div>
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Code editor placeholder
            </div>
          </div>

          {/* Panel 3 - File Explorer */}
          <div className="glass-card p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="font-medium">File Explorer</span>
            </div>
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              File tree placeholder
            </div>
          </div>

          {/* Panel 4 - Preview */}
          <div className="glass-card p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="font-medium">Preview</span>
            </div>
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Live preview placeholder
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MultiPanelView;