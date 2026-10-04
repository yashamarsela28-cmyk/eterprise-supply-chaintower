import React from 'react';

/**
 * Enterprise Card Container
 */
export function Card({
  children,
  title,
  subtitle,
  action,
  headerBorder = false,
  padding = 'md', // none | sm | md | lg
  className = '',
  style = {},
  ...props
}) {
  const paddingStyles = {
    none: { padding: '0' },
    sm: { padding: 'var(--space-3)' },
    md: { padding: 'var(--space-5)' },
    lg: { padding: 'var(--space-6)' }
  };

  const hasHeader = title || subtitle || action;

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...style
      }}
      className={`card ${className}`}
      {...props}
    >
      {hasHeader && (
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: headerBorder ? '1px solid var(--color-border-subtle)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)'
          }}
        >
          <div>
            {title && (
              <h3
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)'
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  marginTop: '0.125rem'
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={{ flex: 1, ...paddingStyles[padding] }}>
        {children}
      </div>
    </div>
  );
}

export default Card;
