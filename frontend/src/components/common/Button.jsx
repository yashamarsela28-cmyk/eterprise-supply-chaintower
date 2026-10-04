import React from 'react';

/**
 * Reusable Button Component
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
  ...props
}) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: 500,
    borderRadius: 'var(--radius-md)',
    transition: 'all var(--transition-fast)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'inherit',
    border: '1px solid transparent',
    outline: 'none',
    userSelect: 'none'
  };

  const sizeStyles = {
    sm: { padding: '0.375rem 0.75rem', fontSize: 'var(--font-size-xs)' },
    md: { padding: '0.5rem 1rem', fontSize: 'var(--font-size-sm)' },
    lg: { padding: '0.75rem 1.5rem', fontSize: 'var(--font-size-base)' }
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: '#ffffff',
      borderColor: 'var(--color-primary)'
    },
    secondary: {
      backgroundColor: 'var(--color-bg-active)',
      color: 'var(--color-text-primary)',
      borderColor: 'var(--color-border-default)'
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-primary)',
      borderColor: 'var(--color-border-strong)'
    },
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: '#ffffff',
      borderColor: 'var(--color-danger)'
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
      borderColor: 'transparent'
    },
    success: {
      backgroundColor: 'var(--color-success)',
      color: '#ffffff',
      borderColor: 'var(--color-success)'
    }
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant]
      }}
      className={`btn btn-${variant} ${className}`}
      {...props}
    >
      {loading && (
        <span
          style={{
            width: '1em',
            height: '1em',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block'
          }}
          className="animate-spin"
        />
      )}
      {!loading && Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
    </button>
  );
}

export default Button;
