import { nanoid } from 'nanoid';
import type { CreatedApp, PWAManifest } from '@/types';

export const createSampleApps = (): CreatedApp[] => {
  const now = new Date();
  
  const sampleManifest: PWAManifest = {
    name: 'Sample App',
    short_name: 'Sample',
    description: 'A sample application',
    start_url: '/',
    display: 'standalone',
    theme_color: '#3b82f6',
    background_color: '#ffffff',
    icons: {
      '192x192': {
        dataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE5MiIgaGVpZ2h0PSIxOTIiIGZpbGw9IiMzYjgyZjYiLz48dGV4dCB4PSI5NiIgeT0iMTA0IiBmb250LWZhbWlseT0ic3lzdGVtLXVpIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QTwvdGV4dD48L3N2Zz4=',
        size: 192
      }
    }
  };

  return [
    {
      id: nanoid(),
      name: 'Todo App',
      description: 'A modern task management application',
      url: 'https://todo-app-example.vercel.app',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxMiIgZmlsbD0iIzEwYjk4MSIvPjxwYXRoIGQ9Im0yMCAzMiA4IDggMTYtMTYiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+',
      size: 156789,
      files: 12,
      category: 'web',
      buildProgress: 100,
      version: '1.0.0',
      opens: 23,
      screenshot: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmOWZhZmIiLz48cmVjdCB4PSIyMCIgeT0iMjAiIHdpZHRoPSIzNjAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjMTBiOTgxIi8+PHRleHQgeD0iMjAwIiB5PSI0NSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSIxOCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPnRvZG8gYXBwPC90ZXh0Pjx0ZXh0IHg9IjIwIiB5PSIxMDAiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWkiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjcyODAiPuKclCBDb21wbGV0ZSBwcm9qZWN0PC90ZXh0Pjx0ZXh0IHg9IjIwIiB5PSIxMzAiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWkiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjcyODAiPuKclCBSZXZpZXcgY29kZTwvdGV4dD48dGV4dCB4PSIyMCIgeT0iMTYwIiBmb250LWZhbWlseT0ic3lzdGVtLXVpIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNmI3MjgwIj7imoEgQWRkIG5ldyBmZWF0dXJlPC90ZXh0PjwvU3ZnPg==',
      installable: true,
      manifest: { ...sampleManifest, name: 'Todo App' },
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: nanoid(),
      name: 'Weather Dashboard',
      description: 'Real-time weather information and forecasts',
      url: 'https://weather-dashboard-example.vercel.app',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxMiIgZmlsbD0iIzNiODJmNiIvPjxjaXJjbGUgY3g9IjMyIiBjeT0iMjQiIHI9IjgiIGZpbGw9IiNmYmJmMjQiLz48cGF0aCBkPSJNMTYgNDBoMzJjNiAwIDEwLTQgMTAtMTBzLTQtMTAtMTAtMTBjLTItMi00LTItNi0ycy00IDAtNiAyYy0yIDAtNCAyLTQgNHMtMiA0LTQgNGMtNiAwLTEwIDQtMTAgMTBzNCA2IDggNloiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=',
      size: 234567,
      files: 18,
      category: 'web',
      buildProgress: 100,
      version: '2.1.0',
      opens: 45,
      screenshot: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMzYjgyZjYiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxMDAiIHI9IjMwIiBmaWxsPSIjZmJiZjI0Ii8+PHRleHQgeD0iMjAwIiB5PSIxNjAiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWkiIGZvbnQtc2l6ZT0iMzYiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4yM8KwPC90ZXh0Pjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0ic3lzdGVtLXVpIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U3VubnkgaW4gU2FuIEZyYW5jaXNjbzwvdGV4dD48L3N2Zz4=',
      installable: true,
      manifest: { ...sampleManifest, name: 'Weather Dashboard' },
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: nanoid(),
      name: 'Chat App',
      description: 'Real-time messaging application with AI features',
      url: 'https://chat-app-example.vercel.app',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxMiIgZmlsbD0iIzg4NTVmNiIvPjxwYXRoIGQ9Ik0xNiAyMGgyNGE0IDQgMCAwIDEgNCA0djE2YTQgNCA0IDAgMS00IDRIMjhsLTggOFYyNGE0IDQgMCAwIDEgNC00WiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=',
      size: 345678,
      files: 25,
      category: 'web',
      buildProgress: 85,
      version: '1.5.0',
      opens: 12,
      screenshot: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM4ODU1ZjYiLz48cmVjdCB4PSIyMCIgeT0iMjAiIHdpZHRoPSIzNjAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjNjk0NmYzIi8+PHRleHQgeD0iMjAwIiB5PSI0NSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSIxOCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkNoYXQgQXBwPC90ZXh0Pjx0ZXh0IHg9IjIwIiB5PSIxMDAiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWkiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIj7wn5GkIEFsaWNlOiBIZWxsbyB0aGVyZSE8L3RleHQ+PHRleHQgeD0iMjAiIHk9IjEzMCIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiPvCfkZggQm9iOiBIaSBBbGljZSE8L3RleHQ+PC9zdmc+',
      installable: true,
      manifest: { ...sampleManifest, name: 'Chat App' },
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      updatedAt: now
    }
  ];
};