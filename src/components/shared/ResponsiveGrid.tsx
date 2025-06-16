import React from 'react';
import { motion } from 'framer-motion';

interface ResponsiveGridProps {
  columns: number;
  children: React.ReactNode;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({ columns, children }) => {
  const getGridClass = () => {
    switch (columns) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 lg:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
      default:
        return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
    }
  };

  return (
    <motion.div 
      className={`grid gap-4 h-full ${getGridClass()}`}
      layout
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};