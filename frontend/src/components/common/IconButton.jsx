import React from 'react';

/**
 * Reusable Icon Button
 */
export function IconButton({
  icon: Icon,
  variant = 'ghost', // ghost | secondary | outline | primary | danger
  size = 'md', // sm | md | lg
  title,
  ariaLabel,
  disabled = false,
  onClick,
  className = '',
  ...props
}) {
  const sizeStyles = {
    sm: { width: '28px', height: '28px', iconSize: 14 },
    md: { width: '36px', height: '36px', iconSize: 18 },
    lg: { width: '44px', height: '44px', iconSize: 22 }
  };

  const variantStyles = {
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
      border: 'none'
    },
    secondary: {
      backgroundColor: 'var(--color-bg-active)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border-subtle)'
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
      border: '1px solid var(--color-border-default)'
    },
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: '#ffffff',
      border: 'none'
    },
    danger: {
      backgroundColor: 'var(--color-danger-subtle)',
      color: 'var(--color-danger-text)',
      border: '1px solid var(--color-danger-subtle)'
    }
  };

  const { width, height, iconSize } = sizeStyles[size] || sizeStyles.md;

  return (
    <button
      type="button"
      title={title || ariaLabel}
      aria-label={ariaLabel || title}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width,
        height,
        borderRadius: 'var(--radius-md)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all var(--transition-fast)',
        ...variantStyles[variant]
      }}
      className={`icon-btn ${className}`}
      {...props}
    >
      {Icon && <Icon size={iconSize} />}
    </button>
  );
}

export default IconButton;
