import { motion } from 'framer-motion';
import { Folder, Plus, FolderOpen } from 'lucide-react';

/**
 * Creations view - Project and file management
 */
const CreationsView = () => {
  return (
    <div className="h-full bg-background">
      <motion.div 
        className="glass-card border-b border-border p-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Folder className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Creations</h1>
              <p className="text-muted-foreground">Your projects, files, and generated content</p>
            </div>
          </div>
          <button className="btn-primary px-4 py-2 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>
      </motion.div>

      <div className="p-6">
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Create your first project to start building with AI assistance. Projects help organize your code, files, and conversations.
          </p>
          <button className="btn-primary px-6 py-3 flex items-center gap-2 mx-auto">
            <Plus className="h-5 w-5" />
            Create First Project
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default CreationsView;