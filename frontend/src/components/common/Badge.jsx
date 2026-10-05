import React from 'react';

/**
 * Enterprise Badge Component
 * Muted, understated semantic tags with clean borders
 */
export function Badge({
  children,
  variant = 'neutral', // neutral | primary | success | warning | danger | info | purple
  size = 'md', // sm | md
  icon: Icon,
  className = '',
  style = {},
  ...props
}) {
  const variantStyles = {
    neutral: {
      backgroundColor: 'var(--color-bg-tertiary)',
      color: 'var(--color-text-secondary)',
      borderColor: 'var(--color-border-default)'
    },
    primary: {
      backgroundColor: 'rgba(247, 247, 245, 0.08)',
      color: 'var(--color-text-primary)',
      borderColor: 'var(--color-border-strong)'
    },
    success: {
      backgroundColor: 'var(--color-success-bg)',
      color: 'var(--color-success-text)',
      borderColor: 'var(--color-success-border)'
    },
    warning: {
      backgroundColor: 'var(--color-warning-bg)',
      color: 'var(--color-warning-text)',
      borderColor: 'var(--color-warning-border)'
    },
    danger: {
      backgroundColor: 'var(--color-danger-bg)',
      color: 'var(--color-danger-text)',
      borderColor: 'var(--color-danger-border)'
    },
    info: {
      backgroundColor: 'var(--color-info-bg)',
      color: 'var(--color-info-text)',
      borderColor: 'var(--color-info-border)'
    },
    purple: {
      backgroundColor: 'var(--color-purple-bg)',
      color: 'var(--color-purple-text)',
      borderColor: 'var(--color-purple-border)'
    }
  };

  const sizeStyles = {
    sm: { padding: '0.1rem 0.35rem', fontSize: '10px', iconSize: 10 },
    md: { padding: '0.15rem 0.5rem', fontSize: '11px', iconSize: 12 }
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;
  const currentVariant = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        border: '1px solid',
        lineHeight: 1.2,
        userSelect: 'none',
        letterSpacing: '0.02em',
        ...currentSize,
        ...currentVariant,
        ...style
      }}
      className={`badge badge-${variant} ${className}`}
      {...props}
    >
      {Icon && <Icon size={currentSize.iconSize} />}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
