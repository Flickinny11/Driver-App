import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { AppCore } from '@/core/architecture/AppCore';
import { useAppStore } from '@/store/appStore';
import { ViewManager } from '@/core/views/ViewManager';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { ToastContainer } from '@/components/shared/ToastContainer';

/**
 * Main application component
 */
function App() {
  const { isLoading, setLoading, addToast } = useAppStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading({ isLoading: true, message: 'Initializing Driver AI Platform...' });

        // Get the core instance
        const core = AppCore.getInstance();

        // Initialize core services
        await core.initialize();

        // Set up event handlers
        core.eventHandler.on('error', (event) => {
          addToast({
            type: 'error',
            title: 'System Error',
            description: event.data.error,
            duration: 5000
          });
        });

        core.eventHandler.on('system:initialized', () => {
          addToast({
            type: 'success',
            title: 'System Ready',
            description: 'Driver AI Platform initialized successfully',
            duration: 3000
          });
        });

        core.eventHandler.on('ai:ready', (event) => {
          addToast({
            type: 'success',
            title: 'AI Services Ready',
            description: `Connected to ${event.data.models.length} AI models`,
            duration: 3000
          });
        });

        setLoading({ isLoading: false });

      } catch (error) {
        console.error('Failed to initialize application:', error);
        setLoading({ isLoading: false });
        addToast({
          type: 'error',
          title: 'Initialization Failed',
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          duration: 0 // Persist until manually dismissed
        });
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      const core = AppCore.getInstance();
      core.dispose();
    };
  }, [setLoading, addToast]);

  // Show loading screen during initialization
  if (isLoading.isLoading) {
    return <LoadingScreen message={isLoading.message} progress={isLoading.progress} />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <div className="min-h-screen bg-background text-foreground">
          <ViewManager />
          <ToastContainer />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;