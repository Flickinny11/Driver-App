import { motion } from 'framer-motion';
import { History, Clock } from 'lucide-react';

/**
 * History view - Conversation history and chat management
 */
const HistoryView = () => {
  return (
    <div className="h-full bg-background">
      <motion.div 
        className="glass-card border-b border-border p-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <History className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">History</h1>
            <p className="text-muted-foreground">Your conversation history and past interactions</p>
          </div>
        </div>
      </motion.div>

      <div className="p-6">
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No history yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your conversation history will appear here. Start a conversation in Code Chat to begin.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default HistoryView;