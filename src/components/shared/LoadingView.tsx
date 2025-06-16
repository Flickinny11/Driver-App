import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * Loading view for lazy-loaded components
 */
export const LoadingView = () => {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="mb-4"
        >
          <Loader2 className="h-8 w-8 text-primary mx-auto" />
        </motion.div>
        <p className="text-muted-foreground">Loading view...</p>
      </motion.div>
    </div>
  );
};