import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Standard Loading State Component
 */
export function LoadingState({
  message = 'Loading data...',
  size = 'md',
  fullPage = false,
  className = ''
}) {
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 36 : 24;

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-8)'
      }}
      className={`loading-state ${className}`}
    >
      <Loader2
        size={iconSize}
        style={{
          animation: 'spin 1s linear infinite',
          color: 'var(--color-primary)'
        }}
      />
      {message && (
        <span
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            fontWeight: 500
          }}
        >
          {message}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          width: '100%'
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}

export default LoadingState;
