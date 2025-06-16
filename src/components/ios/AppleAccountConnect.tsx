import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Apple, 
  Shield, 
  Building, 
  AlertCircle, 
  CheckCircle,
  Loader,
  X
} from 'lucide-react';
import type { AppleAccount } from '@/types';
import { AppleAuthManager } from '@/ios/auth/AppleAuthManager';

interface AppleAccountConnectProps {
  onAccountConnected?: (account: AppleAccount) => void;
  onAccountDisconnected?: () => void;
}

export const AppleAccountConnect: React.FC<AppleAccountConnectProps> = ({
  onAccountConnected,
  onAccountDisconnected
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<AppleAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authManager] = useState(() => new AppleAuthManager());

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await authManager.initialize();
        const existingAccount = authManager.getCurrentAccount();
        if (existingAccount) {
          setAccount(existingAccount);
        }
      } catch (err) {
        console.error('Failed to initialize auth manager:', err);
      }
    };

    initializeAuth();
  }, [authManager]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const connectedAccount = await authManager.initiateAppleSignIn();
      setAccount(connectedAccount);
      
      if (connectedAccount.isDeveloperAccount) {
        await authManager.setupDeveloperIntegration(connectedAccount);
      }
      
      onAccountConnected?.(connectedAccount);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect Apple account';
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await authManager.disconnect();
      setAccount(null);
      onAccountDisconnected?.();
    } catch (err) {
      console.error('Failed to disconnect account:', err);
    }
  };

  if (account) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-lg p-6 border border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Apple Account</h3>
          <div className={`px-3 py-1 rounded-full text-xs ${
            account.isDeveloperAccount 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}>
            {account.isDeveloperAccount ? 'Developer' : 'Personal'}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Apple className="w-5 h-5 text-gray-400" />
            <span className="text-gray-300">{account.email}</span>
          </div>
          
          {account.isDeveloperAccount && account.teamName && (
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-gray-400" />
              <span className="text-gray-300">{account.teamName}</span>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-400" />
            <span className="text-gray-300">
              {account.certificates?.length || 0} certificates
            </span>
          </div>

          {account.isDeveloperAccount && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Full signing capabilities enabled</span>
            </div>
          )}

          {!account.isDeveloperAccount && (
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Personal signing (7-day certificate expiry)</span>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={handleDisconnect}
            className="text-red-400 hover:text-red-300 text-sm transition-colors"
          >
            Disconnect Account
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-lg p-6 border border-gray-700"
    >
      <h3 className="text-lg font-semibold text-white mb-2">
        Connect Apple Account
      </h3>
      <p className="text-gray-400 text-sm mb-6">
        Sign iOS apps using your Apple ID or Developer account
      </p>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-red-400 text-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      <div className="space-y-4">
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full bg-black text-white rounded-lg px-4 py-3 flex items-center justify-center gap-3 hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isConnecting ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Apple className="w-5 h-5" />
          )}
          {isConnecting ? 'Connecting...' : 'Sign in with Apple'}
        </button>

        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="text-green-400 font-medium mb-1">Developer Account</div>
            <div>• $99/year subscription</div>
            <div>• Unlimited app installs</div>
            <div>• 1-year certificates</div>
            <div>• App Store distribution</div>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="text-yellow-400 font-medium mb-1">Personal Account</div>
            <div>• Free Apple ID</div>
            <div>• Reinstall every 7 days</div>
            <div>• Development only</div>
            <div>• Device registration required</div>
          </div>
        </div>

        <div className="text-xs text-gray-500 bg-gray-700/30 rounded-lg p-3">
          <div className="font-medium text-gray-400 mb-2">How it works:</div>
          <div className="space-y-1">
            <div>1. Connect your Apple account securely</div>
            <div>2. Generate signing certificates automatically</div>
            <div>3. Install apps directly on your devices</div>
            <div>4. Certificates auto-renew (personal accounts)</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};