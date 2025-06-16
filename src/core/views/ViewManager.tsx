import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Sidebar } from '@/components/shared/Sidebar';
import { LoadingView } from '@/components/shared/LoadingView';

// Lazy load all views for code splitting
const CodeChatView = lazy(() => import('@/views/CodeChat'));
const HistoryView = lazy(() => import('@/views/History'));
const CreationsView = lazy(() => import('@/views/Creations'));
const SearchView = lazy(() => import('@/views/Search'));
const KnowledgeView = lazy(() => import('@/views/Knowledge'));
const VisionView = lazy(() => import('@/views/Vision'));
const MultiPanelView = lazy(() => import('@/views/MultiPanel'));
const OrchestraView = lazy(() => import('@/views/Orchestra'));
const LivePreviewView = lazy(() => import('@/views/LivePreview'));

/**
 * Manages view routing and lazy loading
 */
export const ViewManager = () => {
  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Suspense fallback={<LoadingView />}>
          <Routes>
            <Route path="/" element={<CodeChatView />} />
            <Route path="/history" element={<HistoryView />} />
            <Route path="/creations" element={<CreationsView />} />
            <Route path="/search" element={<SearchView />} />
            <Route path="/knowledge" element={<KnowledgeView />} />
            <Route path="/vision" element={<VisionView />} />
            <Route path="/builder" element={<MultiPanelView />} />
            <Route path="/orchestra" element={<OrchestraView />} />
            <Route path="/preview" element={<LivePreviewView />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};