import React from 'react';
import { cn } from '@/utils/cn';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: styles.variantPrimary ?? '',
  secondary: styles.variantSecondary ?? '',
  ghost: styles.variantGhost ?? '',
};

const SIZE_CLASS: Record<ButtonSize, string | undefined> = {
  sm: styles.sizeSm,
  md: undefined,
  lg: styles.sizeLg,
};

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      disabled = false,
      className,
      onClick,
      children,
      ...rest
    },
    ref,
  ) {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type="button"
        aria-disabled={disabled}
        className={cn(
          styles.button,
          VARIANT_CLASS[variant],
          SIZE_CLASS[size],
          disabled && styles.disabled,
          className,
        )}
        onClick={handleClick}
        tabIndex={disabled ? -1 : undefined}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
