import React from 'react';

/**
 * Generic Badge Component
 */
export function Badge({
  children,
  variant = 'neutral', // neutral | primary | success | warning | danger | info | purple
  size = 'md', // sm | md
  icon: Icon,
  className = '',
  ...props
}) {
  const variantStyles = {
    neutral: {
      backgroundColor: 'var(--color-bg-active)',
      color: 'var(--color-text-secondary)',
      borderColor: 'var(--color-border-subtle)'
    },
    primary: {
      backgroundColor: 'var(--color-primary-subtle)',
      color: 'var(--color-primary)',
      borderColor: 'rgba(59, 130, 246, 0.2)'
    },
    success: {
      backgroundColor: 'var(--color-success-subtle)',
      color: 'var(--color-success-text)',
      borderColor: 'rgba(16, 185, 129, 0.2)'
    },
    warning: {
      backgroundColor: 'var(--color-warning-subtle)',
      color: 'var(--color-warning-text)',
      borderColor: 'rgba(245, 158, 11, 0.2)'
    },
    danger: {
      backgroundColor: 'var(--color-danger-subtle)',
      color: 'var(--color-danger-text)',
      borderColor: 'rgba(239, 68, 68, 0.2)'
    },
    info: {
      backgroundColor: 'var(--color-info-subtle)',
      color: 'var(--color-info-text)',
      borderColor: 'rgba(6, 182, 212, 0.2)'
    },
    purple: {
      backgroundColor: 'var(--color-purple-subtle)',
      color: 'var(--color-purple-text)',
      borderColor: 'rgba(139, 92, 246, 0.2)'
    }
  };

  const sizeStyles = {
    sm: { padding: '0.125rem 0.375rem', fontSize: '11px', iconSize: 10 },
    md: { padding: '0.25rem 0.625rem', fontSize: 'var(--font-size-xs)', iconSize: 12 }
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        border: '1px solid',
        lineHeight: 1.2,
        userSelect: 'none',
        ...sizeStyles[size],
        ...variantStyles[variant]
      }}
      className={`badge badge-${variant} ${className}`}
      {...props}
    >
      {Icon && <Icon size={sizeStyles[size].iconSize} />}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
