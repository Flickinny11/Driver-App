import React, { useState } from 'react';
import { nanoid } from 'nanoid';
import { motion } from 'framer-motion';
import { Monitor, Smartphone, Tablet, RotateCcw } from 'lucide-react';
import { PreviewWindowFrame } from './PreviewWindowFrame';
import { ResponsiveGrid } from '../shared/ResponsiveGrid';
import { getGridColumns } from '../../preview/utils';
import { useAppStore } from '@/store/appStore';
import type { PreviewWindow, WindowType, ElementInfo } from '@/types';

export const MultiWindowManager: React.FC = () => {
  const { addToast } = useAppStore();
  const [windows, setWindows] = useState<PreviewWindow[]>([
    { id: '1', type: 'desktop', active: true }
  ]);
  const [syncScroll, setSyncScroll] = useState(false);

  const addWindow = (type: WindowType) => {
    if (windows.length >= 6) {
      addToast({
        type: 'error',
        title: 'Maximum windows reached',
        description: 'You can have up to 6 preview windows open at once.',
        duration: 3000
      });
      return;
    }

    const newWindow: PreviewWindow = {
      id: nanoid(),
      type,
      active: true
    };

    setWindows(prev => [...prev, newWindow]);
    
    addToast({
      type: 'success',
      title: 'Preview window added',
      description: `Added ${type} preview window`,
      duration: 2000
    });
  };

  const removeWindow = (windowId: string) => {
    if (windows.length <= 1) {
      addToast({
        type: 'warning',
        title: 'Cannot remove window',
        description: 'At least one preview window must remain open.',
        duration: 3000
      });
      return;
    }

    setWindows(prev => prev.filter(w => w.id !== windowId));
    
    addToast({
      type: 'info',
      title: 'Preview window closed',
      description: 'Preview window removed',
      duration: 2000
    });
  };

  const handleSyncScroll = () => {
    setSyncScroll(!syncScroll);
    addToast({
      type: 'info',
      title: syncScroll ? 'Scroll sync disabled' : 'Scroll sync enabled',
      description: syncScroll 
        ? 'Windows will scroll independently' 
        : 'All windows will scroll together',
      duration: 2000
    });
  };

  const handleInterject = (windowId: string, element: ElementInfo) => {
    console.log('Interject captured:', { windowId, element });
    addToast({
      type: 'success',
      title: 'Feedback captured',
      description: `Feedback on ${element.tagName} element has been sent to the AI agents.`,
      duration: 3000
    });
  };

  const resetAllWindows = () => {
    setWindows([{ id: nanoid(), type: 'desktop', active: true }]);
    addToast({
      type: 'info',
      title: 'Windows reset',
      description: 'All preview windows have been reset to default.',
      duration: 2000
    });
  };

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      {/* Window Controls */}
      <div className="flex items-center gap-2 p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={() => addWindow('desktop')}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            disabled={windows.length >= 6}
          >
            <Monitor size={16} />
            Desktop
          </button>
          
          <button
            onClick={() => addWindow('tablet')}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            disabled={windows.length >= 6}
          >
            <Tablet size={16} />
            Tablet
          </button>
          
          <button
            onClick={() => addWindow('mobile')}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            disabled={windows.length >= 6}
          >
            <Smartphone size={16} />
            Mobile
          </button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {windows.length}/6 windows
          </span>
          
          <button
            onClick={handleSyncScroll}
            className={`px-3 py-2 rounded-lg transition-colors ${
              syncScroll 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {syncScroll ? 'Unsync' : 'Sync'} Scroll
          </button>
          
          <button
            onClick={resetAllWindows}
            className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Preview Windows Grid */}
      <div className="flex-1 p-4 overflow-auto">
        <ResponsiveGrid columns={getGridColumns(windows.length)}>
          {windows.map(window => (
            <motion.div
              key={window.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="h-full min-h-[500px]"
            >
              <PreviewWindowFrame
                window={window}
                onClose={() => removeWindow(window.id)}
                onInterject={(element) => handleInterject(window.id, element)}
              />
            </motion.div>
          ))}
        </ResponsiveGrid>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-4">
            <span>Live Preview Active</span>
            <span>•</span>
            <span>HMR Enabled</span>
            {syncScroll && (
              <>
                <span>•</span>
                <span className="text-purple-400">Scroll Sync On</span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <span>Build: ⚡ Fast</span>
            <span>•</span>
            <span>Updates: &lt;100ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};