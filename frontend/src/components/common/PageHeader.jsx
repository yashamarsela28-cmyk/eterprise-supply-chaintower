import React from 'react';

/**
 * Editorial Page Header with eyebrow, large title, description, and action group
 */
export function PageHeader({
  eyebrow = null,
  title,
  description,
  badge,
  actions,
  children,
  className = ''
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-6)',
        paddingBottom: 'var(--space-4)',
        borderBottom: '1px solid var(--color-border-subtle)'
      }}
      className={`page-header ${className}`}
    >
      <div style={{ flex: 1, minWidth: '260px' }}>
        {eyebrow && (
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--color-text-dim)',
              marginBottom: '0.25rem'
            }}
          >
            {eyebrow}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <h1
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.025em',
              margin: 0
            }}
          >
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              marginTop: '0.35rem',
              marginBottom: 0,
              maxWidth: '720px',
              lineHeight: 1.5
            }}
          >
            {description}
          </p>
        )}
        {children}
      </div>

      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
