import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import IconButton from './IconButton';

/**
 * Enterprise Toast Notification
 */
export function Toast({
  id,
  type = 'info',
  title,
  message,
  onDismiss
}) {
  const iconMap = {
    success: { icon: CheckCircle2, color: 'var(--color-success)', bg: 'var(--color-bg-secondary)', border: 'var(--color-success-border)' },
    danger: { icon: AlertCircle, color: 'var(--color-danger)', bg: 'var(--color-bg-secondary)', border: 'var(--color-danger-border)' },
    warning: { icon: AlertTriangle, color: 'var(--color-warning)', bg: 'var(--color-bg-secondary)', border: 'var(--color-warning-border)' },
    info: { icon: Info, color: 'var(--color-info)', bg: 'var(--color-bg-secondary)', border: 'var(--color-info-border)' }
  };

  const config = iconMap[type] || iconMap.info;
  const Icon = config.icon;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        padding: '0.75rem 1rem',
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        minWidth: '300px',
        maxWidth: '440px',
        animation: 'slideInRight 0.2s ease-out'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', flex: 1 }}>
        <Icon size={16} style={{ color: config.color, flexShrink: 0, marginTop: '2px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {title && (
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {title}
            </span>
          )}
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
            {message}
          </span>
        </div>
      </div>

      {onDismiss && (
        <IconButton
          icon={X}
          size="sm"
          variant="ghost"
          onClick={() => onDismiss(id)}
          title="Dismiss notification"
          style={{ padding: '2px', color: 'var(--color-text-muted)' }}
        />
      )}
    </div>
  );
}

export default Toast;
