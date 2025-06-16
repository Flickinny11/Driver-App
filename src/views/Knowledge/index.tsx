import { motion } from 'framer-motion';
import { Brain, BookOpen, Upload } from 'lucide-react';

/**
 * Knowledge view - Knowledge base and documentation
 */
const KnowledgeView = () => {
  return (
    <div className="h-full bg-background">
      <motion.div 
        className="glass-card border-b border-border p-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Knowledge</h1>
              <p className="text-muted-foreground">Your personal knowledge base and documentation library</p>
            </div>
          </div>
          <button className="btn-primary px-4 py-2 flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Documents
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
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Build your knowledge base</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Upload documents, create notes, and build a searchable knowledge base that your AI assistants can reference.
          </p>
          <div className="flex gap-3 justify-center">
            <button className="btn-primary px-6 py-3 flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Documents
            </button>
            <button className="btn-secondary px-6 py-3">
              Create Note
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default KnowledgeView;