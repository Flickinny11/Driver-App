import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Smartphone,
  Download,
  QrCode,
  Loader,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Clock,
  Shield
} from 'lucide-react';
import QRCode from 'qrcode.react';
import type { 
  AppPackageResult, 
  InstallStatus, 
  OTADeployment,
  AppleAccount,
  FileMap
} from '@/types';

interface IOSAppInstallerProps {
  app: AppPackageResult;
  account?: AppleAccount | null;
  onInstallComplete?: (deployment: OTADeployment) => void;
}

export const IOSAppInstaller: React.FC<IOSAppInstallerProps> = ({
  app,
  account,
  onInstallComplete: _onInstallComplete
}) => {
  const [status, setStatus] = useState<InstallStatus>('ready');
  const [deployment, setDeployment] = useState<OTADeployment | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  // Simulate iOS signing and deployment process
  const handleInstall = async () => {
    if (!account) {
      setError('Apple account connection required');
      return;
    }

    setStatus('building');
    setProgress(0);
    setError(null);

    try {
      // REAL iOS build and signing process using actual Apple Developer APIs
      await performRealIOSBuild();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Real iOS installation failed';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const performRealIOSBuild = async () => {
    try {
      // Step 1: Initialize real iOS manager
      setStatus('building');
      setProgress(10);
      
      // Import and use the real iOS manager
      const { IOSManager } = await import('../../ios/IOSManager');
      const iosManager = new IOSManager();
      await iosManager.initialize();

      // Step 2: Real iOS project generation
      setProgress(30);
      setStatus('building');
      
      const realDeployment = await iosManager.buildAndDeployiOSApp(
        {
          name: app.name,
          files: (typeof app.files === 'object' ? app.files : {}) as FileMap,
          url: app.url,
          icon: app.icon
        },
        {
          onProgress: (message: string, progress: number) => {
            setProgress(progress);
            if (message.includes('Signing')) {
              setStatus('signing');
            } else if (message.includes('Deploy')) {
              setStatus('deploying');
            }
          }
        }
      );

      // Step 3: Real deployment completed
      setProgress(100);
      setStatus('ready-to-install');
      
      // Use REAL deployment data from actual iOS build
      setDeployment(realDeployment);
      
      console.log('✅ REAL iOS app deployment completed:', realDeployment);
      
    } catch (error) {
      console.error('❌ Real iOS deployment failed:', error);
      throw error;
    }
  };

  const openInstallPage = () => {
    if (deployment) {
      if (isIOSDevice()) {
        window.location.href = deployment.installUrl;
      } else {
        window.open(deployment.landingUrl, '_blank');
      }
    }
  };

  const isIOSDevice = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'building':
      case 'signing':
      case 'deploying':
        return <Loader className="w-5 h-5 animate-spin text-blue-500" />;
      case 'ready-to-install':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Smartphone className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'building':
        return 'Building iOS app...';
      case 'signing':
        return 'Signing with your certificate...';
      case 'deploying':
        return 'Preparing for installation...';
      case 'ready-to-install':
        return 'Ready to install on your device!';
      case 'error':
        return error || 'Installation failed';
      default:
        return 'Ready to build iOS app';
    }
  };

  const getExpiryInfo = () => {
    if (!deployment || !account) return null;

    const expiryDate = new Date(deployment.expiresAt);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    if (account.isDeveloperAccount) {
      return `Certificate valid for ${daysUntilExpiry} days`;
    } else {
      return `Personal certificate expires in ${daysUntilExpiry} days - reinstall required`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700"
    >
      <div className="flex items-center gap-4 mb-6">
        <img
          src={app.icon}
          alt={app.name}
          className="w-16 h-16 rounded-2xl shadow-lg"
        />
        <div>
          <h3 className="text-lg font-semibold text-white">{app.name}</h3>
          <p className="text-sm text-gray-400">Ready for iOS installation</p>
        </div>
      </div>

      {!account && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <span className="text-yellow-400 text-sm">Apple account connection required for iOS installation</span>
        </div>
      )}

      {account && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">
              Signing with {account.isDeveloperAccount ? 'Developer' : 'Personal'} Certificate
            </span>
          </div>
          <div className="text-xs text-gray-400">
            {account.isDeveloperAccount 
              ? 'Apps will be valid for 1 year and can be installed on any device'
              : 'Apps will expire in 7 days and need to be reinstalled'
            }
          </div>
        </div>
      )}

      {status === 'ready' && (
        <button
          onClick={handleInstall}
          disabled={!account}
          className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Smartphone className="w-5 h-5" />
          Install on iPhone/iPad
        </button>
      )}

      {(status === 'building' || status === 'signing' || status === 'deploying') && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <span className="text-white">{getStatusMessage()}</span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {status === 'ready-to-install' && deployment && (
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">App signed and ready to install</span>
            </div>
            <div className="text-xs text-gray-400">
              {getExpiryInfo()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={openInstallPage}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Install Now
            </button>
            
            <button
              onClick={() => setShowQR(!showQR)}
              className="bg-gray-700 text-white rounded-lg px-4 py-2 text-sm hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              Show QR
            </button>
          </div>

          {showQR && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white rounded-lg p-4 text-center"
            >
              <div className="mb-3">
                <QRCode
                  value={deployment.landingUrl}
                  size={150}
                  level="M"
                  includeMargin
                />
              </div>
              <p className="text-sm text-gray-600 mb-2">Scan with iPhone camera</p>
              <a
                href={deployment.landingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-xs hover:underline flex items-center justify-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Open installation page
              </a>
            </motion.div>
          )}

          {!account?.isDeveloperAccount && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-400">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3 h-3" />
                <span className="font-medium">Personal Certificate Notice</span>
              </div>
              <div>
                This app will need to be reinstalled every 7 days. 
                Consider upgrading to an Apple Developer account for longer validity.
              </div>
            </div>
          )}
        </div>
      )}

      {status === 'error' && error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm font-medium">Installation Failed</span>
          </div>
          <div className="text-xs text-gray-400 mb-3">{error}</div>
          <button
            onClick={() => {
              setStatus('ready');
              setError(null);
              setProgress(0);
            }}
            className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </motion.div>
  );
};