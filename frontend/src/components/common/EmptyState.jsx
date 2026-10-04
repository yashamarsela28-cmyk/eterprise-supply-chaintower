import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

/**
 * Standard Empty State Component
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = 'No Data Available',
  message = 'There are no records matching your current criteria.',
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--space-4)',
        textAlign: 'center'
      }}
      className={`empty-state ${className}`}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'rgba(51, 65, 85, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
          marginBottom: 'var(--space-4)'
        }}
      >
        <Icon size={28} />
      </div>

      <h4
        style={{
          fontSize: 'var(--font-size-base)',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--space-1)'
        }}
      >
        {title}
      </h4>

      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-secondary)',
          maxWidth: '380px',
          marginBottom: actionLabel && onAction ? 'var(--space-4)' : 0
        }}
      >
        {message}
      </p>

      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
