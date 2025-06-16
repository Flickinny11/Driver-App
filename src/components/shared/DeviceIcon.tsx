import React from 'react';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import type { WindowType } from '@/types';

interface DeviceIconProps {
  type: WindowType;
  size?: number;
  className?: string;
}

export const DeviceIcon: React.FC<DeviceIconProps> = ({ type, size = 16, className = '' }) => {
  const Icon = {
    desktop: Monitor,
    mobile: Smartphone,
    tablet: Tablet
  }[type];

  return <Icon size={size} className={className} />;
};