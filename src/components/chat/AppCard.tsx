import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Link, QrCode, Check, Loader, Play } from 'lucide-react';
import QRCode from 'qrcode.react';
import { formatBytes } from '../../preview/utils';
import { useCreatedAppStore } from '@/store/createdAppStore';
import type { CreatedApp } from '@/types';

interface AppCardProps {
  app: CreatedApp;
}

export const AppCard: React.FC<AppCardProps> = ({ app }) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const { incrementOpens } = useCreatedAppStore();

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      // Try PWA install if supported
      if ('serviceWorker' in navigator && app.installable) {
        // Check if already installed
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          // Install PWA
          await navigator.serviceWorker.register('/sw.js');
        }
      }
      
      // Open in new tab as fallback
      window.open(app.url, '_blank');
      incrementOpens(app.id);
      
    } catch (error) {
      console.error('Installation failed:', error);
      // Fallback - just open in new tab
      window.open(app.url, '_blank');
      incrementOpens(app.id);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(app.url);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handlePreview = () => {
    window.open(app.url, '_blank');
    incrementOpens(app.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-6 border border-purple-500/30"
    >
      <div className="flex items-start gap-4">
        {/* App Icon */}
        <div className="relative">
          <img
            src={app.icon}
            alt={app.name}
            className="w-16 h-16 rounded-xl shadow-lg"
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <Check size={12} className="text-white" />
          </div>
        </div>
        
        {/* App Info */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{app.name}</h3>
          <p className="text-sm text-gray-400 mt-1">
            {Object.keys(app.files || {}).length} files • {formatBytes(app.size)} • v{app.version}
          </p>
          
          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {isInstalling ? (
                <Loader className="animate-spin" size={16} />
              ) : (
                <Download size={16} />
              )}
              {app.installable ? 'Install App' : 'Open App'}
            </button>
            
            <button
              onClick={handlePreview}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
            >
              <Play size={16} />
              Preview
            </button>
            
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              title="Copy link"
            >
              <Link size={16} />
            </button>
            
            <button
              onClick={() => setShowQR(!showQR)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              title="Show QR code"
            >
              <QrCode size={16} />
            </button>
          </div>
        </div>
        
        {/* Live Preview Thumbnail */}
        <div className="w-32 h-24 rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
          <iframe
            src={app.url}
            className="w-full h-full scale-50 origin-top-left pointer-events-none"
            style={{ width: '200%', height: '200%' }}
            title={`Preview of ${app.name}`}
          />
        </div>
      </div>
      
      {/* QR Code */}
      {showQR && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 flex justify-center"
        >
          <div className="bg-white p-4 rounded-lg">
            <QRCode
              value={app.url}
              size={200}
              level="H"
              includeMargin
              className="block"
            />
            <p className="text-center text-gray-600 mt-2 text-sm">
              Scan to open on mobile
            </p>
          </div>
        </motion.div>
      )}
      
      {/* Progress Bar (if still building) */}
      {app.buildProgress < 100 && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Building...</span>
            <span>{app.buildProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${app.buildProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};