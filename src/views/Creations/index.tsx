import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, 
  Plus, 
  FolderOpen, 
  Play, 
  Code, 
  Share2, 
  Download, 
  Grid3x3,
  List
} from 'lucide-react';
import { useCreatedApps, getTotalSize, useCreatedAppStore } from '@/store/createdAppStore';
import { formatBytes, formatRelativeTime } from '../../preview/utils';
import type { CreatedApp } from '@/types';

/**
 * Creations view - App gallery and project management
 */
const CreationsView = () => {
  const { apps, loading } = useCreatedApps();
  const { filter, sortBy, setFilter, setSortBy, incrementOpens } = useCreatedAppStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const openApp = (app: CreatedApp) => {
    window.open(app.url, '_blank');
    incrementOpens(app.id);
  };

  const shareApp = (app: CreatedApp) => {
    if (navigator.share) {
      navigator.share({
        title: app.name,
        text: app.description,
        url: app.url
      });
    } else {
      navigator.clipboard.writeText(app.url);
    }
  };

  const downloadApp = (app: CreatedApp) => {
    // Create a download link for the app bundle
    const link = document.createElement('a');
    link.href = app.url;
    link.download = `${app.name.toLowerCase().replace(/\s+/g, '-')}.zip`;
    link.click();
  };

  const openInEditor = (app: CreatedApp) => {
    // Navigate to code chat with the app loaded
    console.log('Opening app in editor:', app.id);
    // In a real implementation, this would load the app files into the editor
  };

  return (
    <div className="h-full bg-background">
      <motion.div 
        className="glass-card border-b border-border p-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Folder className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Your Creations</h1>
              <p className="text-muted-foreground">
                {apps.length} apps created • {formatBytes(getTotalSize(apps))} total
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
            >
              {viewMode === 'grid' ? <List size={20} /> : <Grid3x3 size={20} />}
            </button>
            
            <button className="btn-primary px-4 py-2 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New App
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filters and Controls */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
            >
              <option value="all">All Apps</option>
              <option value="web">Web Apps</option>
              <option value="mobile">Mobile Apps</option>
              <option value="game">Games</option>
              <option value="tool">Tools</option>
            </select>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
            >
              <option value="newest">Newest First</option>
              <option value="largest">Largest First</option>
              <option value="mostUsed">Most Used</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your creations...</p>
          </div>
        ) : apps.length === 0 ? (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No apps yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Start building with AI assistance to create your first app. Your completed projects will appear here as interactive, installable apps.
            </p>
            <button className="btn-primary px-6 py-3 flex items-center gap-2 mx-auto">
              <Plus className="h-5 w-5" />
              Create First App
            </button>
          </motion.div>
        ) : (
          <motion.div 
            className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}
            layout
          >
            {apps.map(app => (
              <AppGalleryCard 
                key={app.id} 
                app={app} 
                viewMode={viewMode}
                onOpen={() => openApp(app)}
                onEdit={() => openInEditor(app)}
                onShare={() => shareApp(app)}
                onDownload={() => downloadApp(app)}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

interface AppGalleryCardProps {
  app: CreatedApp;
  viewMode: 'grid' | 'list';
  onOpen: () => void;
  onEdit: () => void;
  onShare: () => void;
  onDownload: () => void;
}

const AppGalleryCard: React.FC<AppGalleryCardProps> = ({ 
  app, 
  viewMode, 
  onOpen, 
  onEdit, 
  onShare, 
  onDownload 
}) => {
  const [showActions, setShowActions] = useState(false);

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-gray-800 rounded-lg p-4 flex items-center gap-4 hover:bg-gray-750 transition-colors cursor-pointer"
        onClick={onOpen}
      >
        <img 
          src={app.icon} 
          alt={app.name} 
          className="w-12 h-12 rounded-lg" 
        />
        <div className="flex-1">
          <h3 className="font-semibold text-white">{app.name}</h3>
          <p className="text-sm text-gray-400">
            {formatRelativeTime(app.createdAt)} • {app.opens} opens • {formatBytes(app.size)}
          </p>
        </div>
        <div className="flex gap-2">
          <ActionButton icon={<Play />} onClick={onOpen} />
          <ActionButton icon={<Code />} onClick={onEdit} />
          <ActionButton icon={<Share2 />} onClick={onShare} />
          <ActionButton icon={<Download />} onClick={onDownload} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="bg-gray-800 rounded-xl overflow-hidden group cursor-pointer"
      onClick={onOpen}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Preview */}
      <div className="relative aspect-video bg-gray-900">
        <img 
          src={app.screenshot} 
          alt={app.name} 
          className="w-full h-full object-cover" 
        />
        
        {/* Hover Actions */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 flex items-center justify-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <ActionButton 
                icon={<Play />}
                label="Open"
                onClick={onOpen}
              />
              <ActionButton 
                icon={<Code />}
                label="Edit"
                onClick={onEdit}
              />
              <ActionButton 
                icon={<Share2 />}
                label="Share"
                onClick={onShare}
              />
              <ActionButton 
                icon={<Download />}
                label="Download"
                onClick={onDownload}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Info */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <img 
            src={app.icon} 
            alt="" 
            className="w-12 h-12 rounded-lg" 
          />
          <div className="flex-1">
            <h3 className="font-semibold text-white">{app.name}</h3>
            <p className="text-sm text-gray-400">
              {formatRelativeTime(app.createdAt)}
            </p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span>{app.opens} opens</span>
          <span>•</span>
          <span>{formatBytes(app.size)}</span>
          <span>•</span>
          <span>v{app.version}</span>
        </div>
      </div>
    </motion.div>
  );
};

interface ActionButtonProps {
  icon: React.ReactNode;
  label?: string;
  onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className="p-3 bg-gray-900/75 hover:bg-gray-800 text-white rounded-lg transition-colors flex flex-col items-center gap-1"
    title={label}
  >
    {icon}
    {label && <span className="text-xs">{label}</span>}
  </button>
);

export default CreationsView;