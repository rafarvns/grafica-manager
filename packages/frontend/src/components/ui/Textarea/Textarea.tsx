import React, { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import styles from './Textarea.module.css';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, id, label, error, ...props }, ref) => {
    const generatedId = id || React.useId();
    const errorId = `${generatedId}-error`;

    return (
      <div className={cn(styles.wrapper, className)}>
        {label && (
          <label htmlFor={generatedId} className={styles.label}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={generatedId}
          className={cn(styles.textarea, {
            [styles.hasError]: !!error,
          })}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        {error && (
          <span id={errorId} className={styles.errorMessage} role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
