import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { CreatedApp } from '@/types';

interface CreatedAppState {
  apps: CreatedApp[];
  loading: boolean;
  filter: string;
  sortBy: 'newest' | 'largest' | 'mostUsed';
  initialized: boolean;

  // Actions
  addApp: (app: CreatedApp) => void;
  updateApp: (id: string, updates: Partial<CreatedApp>) => void;
  removeApp: (id: string) => void;
  setFilter: (filter: string) => void;
  setSortBy: (sortBy: 'newest' | 'largest' | 'mostUsed') => void;
  setLoading: (loading: boolean) => void;
  incrementOpens: (id: string) => void;
  // Real production app store - no sample data methods
}

export const useCreatedAppStore = create<CreatedAppState>()(
  persist(
    immer((set) => ({
      apps: [],
      loading: false,
      filter: 'all',
      sortBy: 'newest',
      initialized: false,

      addApp: (app) => set((state) => {
        const existingIndex = state.apps.findIndex(a => a.id === app.id);
        if (existingIndex > -1) {
          state.apps[existingIndex] = app;
        } else {
          state.apps.push(app);
        }
      }),

      updateApp: (id, updates) => set((state) => {
        const index = state.apps.findIndex(a => a.id === id);
        if (index > -1) {
          Object.assign(state.apps[index], updates);
          state.apps[index].updatedAt = new Date();
        }
      }),

      removeApp: (id) => set((state) => {
        const index = state.apps.findIndex(a => a.id === id);
        if (index > -1) {
          state.apps.splice(index, 1);
        }
      }),

      setFilter: (filter) => set((state) => {
        state.filter = filter;
      }),

      setSortBy: (sortBy) => set((state) => {
        state.sortBy = sortBy;
      }),

      setLoading: (loading) => set((state) => {
        state.loading = loading;
      }),

      incrementOpens: (id) => set((state) => {
        const app = state.apps.find(a => a.id === id);
        if (app) {
          app.opens += 1;
        }
      }),

      // Real production app store - no sample data initialization
      // Apps are created through real user interactions and AI generation
    })),
    {
      name: 'driver-created-apps-store',
      partialize: (state) => ({
        apps: state.apps,
        filter: state.filter,
        sortBy: state.sortBy,
        initialized: state.initialized
      }),
      onRehydrateStorage: () => {
        return (state) => {
          // Real production app - no automatic data initialization
          // Apps are loaded from real user data and API calls
          if (state) {
            console.log('User app data loaded from storage');
          }
        };
      }
    }
  )
);

// Real production app - no automatic sample data loading
// Apps are created through real user interactions

// Selectors
export const useCreatedApps = () => {
  const { apps, loading, filter, sortBy } = useCreatedAppStore();
  
  const filteredAndSortedApps = React.useMemo(() => {
    let filtered = [...apps];
    
    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(app => app.category === filter);
    }
    
    // Apply sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'largest':
        filtered.sort((a, b) => b.size - a.size);
        break;
      case 'mostUsed':
        filtered.sort((a, b) => b.opens - a.opens);
        break;
    }
    
    return filtered;
  }, [apps, filter, sortBy]);
  
  return {
    apps: filteredAndSortedApps,
    loading
  };
};

export const getTotalSize = (apps: CreatedApp[]): number => {
  return apps.reduce((total, app) => total + app.size, 0);
};