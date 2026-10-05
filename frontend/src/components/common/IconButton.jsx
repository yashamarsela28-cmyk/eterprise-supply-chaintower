import React from 'react';

/**
 * Enterprise Icon Button
 */
export function IconButton({
  icon: Icon,
  size = 'md', // sm | md | lg
  variant = 'ghost', // ghost | secondary | primary | outline
  badge = null,
  disabled = false,
  loading = false,
  onClick,
  title,
  className = '',
  style = {},
  ...props
}) {
  const sizeMap = {
    sm: { buttonSize: '28px', iconSize: 14 },
    md: { buttonSize: '32px', iconSize: 16 },
    lg: { buttonSize: '38px', iconSize: 18 }
  };

  const variantStyles = {
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
      borderColor: 'transparent'
    },
    secondary: {
      backgroundColor: 'var(--color-bg-tertiary)',
      color: 'var(--color-text-primary)',
      borderColor: 'var(--color-border-default)'
    },
    primary: {
      backgroundColor: 'var(--color-text-primary)',
      color: 'var(--color-bg-primary)',
      borderColor: 'var(--color-text-primary)'
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
      borderColor: 'var(--color-border-default)'
    }
  };

  const { buttonSize, iconSize } = sizeMap[size] || sizeMap.md;
  const currentVariant = variantStyles[variant] || variantStyles.ghost;

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
      style={{
        width: buttonSize,
        height: buttonSize,
        borderRadius: 'var(--radius-md)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1,
        border: '1px solid',
        position: 'relative',
        transition: 'all var(--transition-fast)',
        ...currentVariant,
        ...style
      }}
      className={`icon-btn ${className}`}
      onMouseEnter={(e) => {
        if (!disabled && !loading && variant === 'ghost') {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
          e.currentTarget.style.color = 'var(--color-text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading && variant === 'ghost') {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--color-text-secondary)';
        }
      }}
      {...props}
    >
      {loading ? (
        <span
          style={{
            width: '12px',
            height: '12px',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%'
          }}
          className="animate-spin"
        />
      ) : (
        Icon && <Icon size={iconSize} />
      )}

      {badge && (
        <span
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            minWidth: '14px',
            height: '14px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-warning)',
            color: '#000000',
            fontSize: '9px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 2px',
            lineHeight: 1
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export default IconButton;
