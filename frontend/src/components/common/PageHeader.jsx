import React from 'react';

/**
 * Standard Page Header with actions and breadcrumb/status area
 */
export function PageHeader({
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
      <div style={{ flex: 1, minWidth: '240px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <h1
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.02em',
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
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              marginTop: 'var(--space-1)',
              marginBottom: 0
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
