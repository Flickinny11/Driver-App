import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { 
  MessageSquare, 
  History, 
  Folder, 
  Search, 
  Brain, 
  Eye, 
  Layout, 
  Music,
  Settings,
  Menu,
  X
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

/**
 * Navigation sidebar component
 */
export const Sidebar = () => {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();

  const navigationItems = [
    { path: '/', icon: MessageSquare, label: 'Code Chat', description: 'AI-powered coding assistant' },
    { path: '/history', icon: History, label: 'History', description: 'Conversation history' },
    { path: '/creations', icon: Folder, label: 'Creations', description: 'Your projects and files' },
    { path: '/search', icon: Search, label: 'Search', description: 'Search across all content' },
    { path: '/knowledge', icon: Brain, label: 'Knowledge', description: 'Knowledge base and docs' },
    { path: '/vision', icon: Eye, label: 'Vision', description: 'Visual analysis and generation' },
    { path: '/builder', icon: Layout, label: 'Multi-Panel', description: 'Advanced multi-panel view' },
    { path: '/orchestra', icon: Music, label: 'Orchestra', description: 'Agent orchestration' }
  ];

  return (
    <motion.aside
      className={cn(
        'glass-card border-r border-border bg-card/50 transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 256 }}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">Driver</h1>
                  <p className="text-xs text-muted-foreground">AI Platform</p>
                </div>
              </motion.div>
            )}
            
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="glass-button p-2 rounded-lg hover:bg-accent/50 transition-colors"
            >
              {sidebarCollapsed ? (
                <Menu className="h-5 w-5" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative',
                  'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring',
                  isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex-1 min-w-0"
                >
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </div>
                </motion.div>
              )}

              {/* Tooltip for collapsed state */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-border">
          <button
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 w-full',
              'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring text-muted-foreground hover:text-foreground'
            )}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-medium"
              >
                Settings
              </motion.span>
            )}
          </button>
        </div>
      </div>
    </motion.aside>
  );
};