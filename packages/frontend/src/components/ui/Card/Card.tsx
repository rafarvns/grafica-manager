import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children?: React.ReactNode;
  title?: string;
  className?: string;
  footer?: React.ReactNode;
  [key: string]: unknown;
}

export const Card: React.FC<CardProps> = ({ children, title, className, footer, ...rest }) => {
  return (
    <div className={`${styles.card} ${className || ''}`} {...rest}>
      {title && (
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>
      )}
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
};

interface CardSubProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}

export const CardHeader: React.FC<CardSubProps> = ({ children, className, ...rest }) => (
  <div className={`${styles.header} ${className || ''}`} {...rest}>{children}</div>
);

export const CardContent: React.FC<CardSubProps> = ({ children, className, ...rest }) => (
  <div className={`${styles.body} ${className || ''}`} {...rest}>{children}</div>
);

export const CardFooter: React.FC<CardSubProps> = ({ children, className, ...rest }) => (
  <div className={`${styles.footer} ${className || ''}`} {...rest}>{children}</div>
);
