import React from 'react';

/**
 * Enterprise Button Component
 * Polished, high-contrast, crisp borders, subtle hover transitions
 */
export function Button({
  children,
  variant = 'primary', // primary | secondary | outline | danger | ghost | success
  size = 'md', // sm | md | lg
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  style = {},
  ...props
}) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.45rem',
    fontWeight: 500,
    borderRadius: 'var(--radius-md)',
    transition: 'all var(--transition-fast)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'inherit',
    border: '1px solid transparent',
    outline: 'none',
    userSelect: 'none',
    lineHeight: 1.2
  };

  const sizeStyles = {
    sm: { padding: '0.35rem 0.65rem', fontSize: '11px', iconSize: 13 },
    md: { padding: '0.45rem 0.85rem', fontSize: 'var(--font-size-xs)', iconSize: 14 },
    lg: { padding: '0.65rem 1.15rem', fontSize: 'var(--font-size-sm)', iconSize: 16 }
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--color-text-primary)',
      color: 'var(--color-bg-primary)',
      borderColor: 'var(--color-text-primary)',
      fontWeight: 600
    },
    secondary: {
      backgroundColor: 'var(--color-bg-tertiary)',
      color: 'var(--color-text-primary)',
      borderColor: 'var(--color-border-default)'
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-primary)',
      borderColor: 'var(--color-border-strong)'
    },
    danger: {
      backgroundColor: 'var(--color-danger-bg)',
      color: 'var(--color-danger-text)',
      borderColor: 'var(--color-danger-border)',
      fontWeight: 600
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
      borderColor: 'transparent'
    },
    success: {
      backgroundColor: 'var(--color-success-bg)',
      color: 'var(--color-success-text)',
      borderColor: 'var(--color-success-border)',
      fontWeight: 600
    }
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;
  const currentVariant = variantStyles[variant] || variantStyles.primary;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        ...baseStyles,
        ...currentSize,
        ...currentVariant,
        ...style
      }}
      className={`btn btn-${variant} ${className}`}
      {...props}
    >
      {loading && (
        <span
          style={{
            width: '12px',
            height: '12px',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block'
          }}
          className="animate-spin"
        />
      )}
      {!loading && Icon && iconPosition === 'left' && <Icon size={currentSize.iconSize} />}
      {children && <span>{children}</span>}
      {!loading && Icon && iconPosition === 'right' && <Icon size={currentSize.iconSize} />}
    </button>
  );
}

export default Button;
