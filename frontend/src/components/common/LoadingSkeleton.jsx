import React from 'react';

/**
 * Premium Loading Skeleton Component
 * Smooth shimmer animation for content loading states
 */
export function LoadingSkeleton({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius-md)',
  className = '',
  style = {}
}) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
    />
  );
}

/**
 * Card Loading Skeleton
 */
export function CardSkeleton({ rows = 3 }) {
  return (
    <div
      style={{
        padding: 'var(--space-5)',
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)'
      }}
    >
      <LoadingSkeleton width="60%" height="24px" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {Array.from({ length: rows }).map((_, idx) => (
          <LoadingSkeleton key={idx} width={`${80 + Math.random() * 20}%`} height="16px" />
        ))}
      </div>
    </div>
  );
}

/**
 * Table Row Loading Skeleton
 */
export function TableRowSkeleton({ columns = 5 }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 'var(--space-4)',
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: '1px solid var(--color-border-subtle)'
      }}
    >
      {Array.from({ length: columns }).map((_, idx) => (
        <LoadingSkeleton key={idx} width="90%" height="16px" />
      ))}
    </div>
  );
}

/**
 * KPI Card Loading Skeleton
 */
export function KpiCardSkeleton() {
  return (
    <div
      style={{
        padding: 'var(--space-5)',
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <LoadingSkeleton width="40px" height="40px" borderRadius="var(--radius-md)" />
        <LoadingSkeleton width="60px" height="20px" borderRadius="var(--radius-full)" />
      </div>
      <LoadingSkeleton width="70%" height="14px" />
      <LoadingSkeleton width="50%" height="32px" />
      <LoadingSkeleton width="40%" height="12px" />
    </div>
  );
}

export default LoadingSkeleton;
