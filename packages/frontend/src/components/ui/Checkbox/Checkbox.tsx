import React, { forwardRef, InputHTMLAttributes, useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, id, label, indeterminate, ...props }, ref) => {
    const defaultRef = useRef<HTMLInputElement>(null);
    const resolvedRef = (ref as React.MutableRefObject<HTMLInputElement>) || defaultRef;

    useEffect(() => {
      if (resolvedRef.current) {
        resolvedRef.current.indeterminate = indeterminate || false;
      }
    }, [resolvedRef, indeterminate]);

    return (
      <div className={cn(styles.wrapper, className)}>
        <input
          type="checkbox"
          id={id}
          ref={resolvedRef}
          className={styles.input}
          {...props}
        />
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
