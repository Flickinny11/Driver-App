import type { WindowType } from '@/types';

export const getDeviceFrame = (type: WindowType): string => {
  switch (type) {
    case 'mobile':
      return 'w-[375px] h-[667px] bg-gray-800 rounded-[2.5rem] p-2 shadow-2xl';
    case 'tablet':
      return 'w-[768px] h-[1024px] bg-gray-800 rounded-[1.5rem] p-3 shadow-2xl';
    case 'desktop':
    default:
      return 'w-full h-full bg-gray-800 rounded-lg shadow-xl';
  }
};

export const getGridColumns = (windowCount: number): number => {
  if (windowCount <= 1) return 1;
  if (windowCount <= 2) return 2;
  if (windowCount <= 4) return 2;
  return 3;
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}d ago`;
  }
  
  return date.toLocaleDateString();
};