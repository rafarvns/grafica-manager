import React, { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip = ({ 
  content, 
  children, 
  className,
  position = 'top' 
}: TooltipProps) => {
  return (
    <div className={cn(styles.wrapper, className)}>
      {children}
      <div 
        role="tooltip" 
        className={cn(styles.tooltip, styles[position])}
      >
        {content}
      </div>
    </div>
  );
};
