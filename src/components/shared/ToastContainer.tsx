import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

/**
 * Toast container that displays notifications
 */
export const ToastContainer = () => {
  const { toasts, removeToast } = useAppStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-500/50 bg-green-500/10 text-green-400';
      case 'error':
        return 'border-red-500/50 bg-red-500/10 text-red-400';
      case 'warning':
        return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400';
      case 'info':
      default:
        return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'glass-card p-4 border pointer-events-auto',
              getColorClasses(toast.type)
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(toast.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground">{toast.title}</h4>
                {toast.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {toast.description}
                  </p>
                )}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 ml-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress bar for auto-dismiss */}
            {toast.duration && toast.duration > 0 && (
              <motion.div
                className="mt-3 h-1 bg-current/20 rounded-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <motion.div
                  className="h-full bg-current/60"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ 
                    duration: (toast.duration || 5000) / 1000,
                    ease: 'linear'
                  }}
                />
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};