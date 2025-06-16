import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Loader, Terminal } from 'lucide-react';
import { PreviewSandbox } from '../../preview/PreviewSandbox';
import { InterjectSystem } from '../../preview/InterjectSystem';
import { DeviceIcon } from '../shared/DeviceIcon';
import { getDeviceFrame } from '../../preview/utils';
import type { PreviewWindow, ElementInfo, ConsoleMessage, PreviewError } from '@/types';

interface PreviewWindowFrameProps {
  window: PreviewWindow;
  onClose: () => void;
  onInterject: (element: ElementInfo) => void;
}

export const PreviewWindowFrame: React.FC<PreviewWindowFrameProps> = ({
  window,
  onClose,
  onInterject
}) => {
  const [isInterjectMode, setInterjectMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [errors, setErrors] = useState<PreviewError[]>([]);
  const sandboxRef = useRef<PreviewSandbox>();
  const interjectRef = useRef<InterjectSystem>();

  useEffect(() => {
    const containerId = `preview-${window.id}`;
    
    // Create sandbox instance
    sandboxRef.current = new PreviewSandbox(containerId);
    interjectRef.current = new InterjectSystem();
    
    // Set up event handlers
    sandboxRef.current.setOnReady(() => {
      setIsLoading(false);
    });

    sandboxRef.current.setOnConsoleMessage((message) => {
      setConsoleMessages(prev => [...prev.slice(-49), message]); // Keep last 50 messages
    });

    sandboxRef.current.setOnError((error) => {
      setErrors(prev => [...prev.slice(-9), error]); // Keep last 10 errors
    });

    // Initialize sandbox
    sandboxRef.current.initialize().catch(console.error);

    // Subscribe to file changes (mock implementation)
    // In a real implementation, this would connect to the file store
    const mockFiles = {
      'src/App.tsx': `
import React from 'react';

function App() {
  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center'
    }}>
      <h1 style={{ color: '#3b82f6', marginBottom: '1rem' }}>
        Hello from Preview Window!
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        This is a live preview of your app in ${window.type} view.
      </p>
      <button 
        style={{
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontSize: '1rem'
        }}
        onClick={() => alert('Hello from preview!')}
      >
        Click me!
      </button>
    </div>
  );
}

export default App;
      `,
      'src/main.tsx': `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
      `
    };

    sandboxRef.current.loadProject(mockFiles, 'react');

    return () => {
      sandboxRef.current?.destroy();
      interjectRef.current?.destroy();
    };
  }, [window.id, window.type]);

  const handleInterjectClick = (e: React.MouseEvent) => {
    if (!isInterjectMode) return;

    e.preventDefault();
    e.stopPropagation();

    // Get element info from iframe
    const element = sandboxRef.current?.getElementAtPoint(e.clientX, e.clientY);
    if (element) {
      onInterject(element);
      
      // Show interject dialog
      const comment = prompt('What would you like to change about this element?');
      if (comment && interjectRef.current) {
        interjectRef.current.captureInterject(window.id, element, comment);
      }
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-gray-800 rounded-lg overflow-hidden flex flex-col h-full"
    >
      {/* Window Header */}
      <div className="flex items-center gap-2 p-2 bg-gray-700 border-b border-gray-600">
        <DeviceIcon type={window.type} size={16} className="text-gray-300" />
        <span className="text-sm text-gray-300 capitalize">{window.type}</span>
        
        <div className="flex-1" />
        
        <button
          onClick={() => setInterjectMode(!isInterjectMode)}
          className={`p-1 rounded text-white transition-colors ${
            isInterjectMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-500'
          }`}
          title="Toggle interject mode"
        >
          <MessageSquare size={16} />
        </button>
        
        <button
          onClick={() => setErrors([])}
          className="p-1 rounded bg-gray-600 hover:bg-gray-500 text-white"
          title="Clear errors"
          disabled={errors.length === 0}
        >
          <Terminal size={16} />
        </button>
        
        <button
          onClick={onClose}
          className="p-1 rounded bg-gray-600 hover:bg-red-600 text-white"
          title="Close window"
        >
          <X size={16} />
        </button>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-900/75 flex items-center justify-center z-10"
          >
            <div className="text-center">
              <Loader className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-gray-300">Loading preview...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Frame */}
      <div
        className={`flex-1 relative ${getDeviceFrame(window.type)} ${
          isInterjectMode ? 'cursor-crosshair' : ''
        }`}
        onClick={handleInterjectClick}
        style={{ minHeight: '400px' }}
      >
        <div id={`preview-${window.id}`} className="w-full h-full" />
        
        {/* Interject Mode Overlay */}
        {isInterjectMode && (
          <div className="absolute inset-0 bg-purple-500/10 border-2 border-purple-500 border-dashed rounded pointer-events-none">
            <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-xs">
              Click any element to provide feedback
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="bg-red-900/20 border-t border-red-500/30 overflow-hidden"
          >
            <div className="p-2 max-h-24 overflow-y-auto">
              {errors.slice(-3).map((error, index) => (
                <div key={index} className="text-red-400 text-xs mb-1">
                  <strong>{error.message}</strong>
                  {error.filename && (
                    <span className="text-red-300 ml-2">
                      {error.filename}:{error.line}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Console Output */}
      {window.showConsole && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 120 }}
          className="bg-gray-900 border-t border-gray-700 flex flex-col"
        >
          <div className="p-2 bg-gray-800 border-b border-gray-700">
            <span className="text-xs text-gray-400">Console</span>
            <button
              onClick={() => setConsoleMessages([])}
              className="float-right text-xs text-gray-400 hover:text-white"
            >
              Clear
            </button>
          </div>
          <div className="flex-1 p-2 overflow-y-auto font-mono text-xs">
            {consoleMessages.length === 0 ? (
              <div className="text-gray-500">No console output</div>
            ) : (
              consoleMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-1 ${
                    msg.type === 'error' ? 'text-red-400' :
                    msg.type === 'warn' ? 'text-yellow-400' :
                    msg.type === 'info' ? 'text-blue-400' :
                    'text-gray-300'
                  }`}
                >
                  <span className="text-gray-500 mr-2">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                  {msg.args.join(' ')}
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};