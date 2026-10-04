import React from 'react';

/**
 * Skeleton placeholder for loading content
 */
export function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius = 'var(--radius-md)',
  className = '',
  style = {}
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'rgba(51, 65, 85, 0.4)',
        animation: 'pulse 1.5s ease-in-out infinite',
        ...style
      }}
      className={`skeleton-loader ${className}`}
    />
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', padding: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.75rem' }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="1.25rem" width={`${100 / columns}%`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0' }}>
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} height="1rem" width={`${100 / columns}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
