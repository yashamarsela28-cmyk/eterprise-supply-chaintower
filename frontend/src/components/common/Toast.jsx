import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import IconButton from './IconButton';

/**
 * Individual Toast Item
 */
export function Toast({
  id,
  type = 'info',
  message,
  onDismiss
}) {
  const iconMap = {
    success: { icon: CheckCircle2, color: 'var(--color-success)', bg: 'var(--color-success-bg)', border: 'var(--color-success-border)' },
    error: { icon: AlertCircle, color: 'var(--color-danger)', bg: 'var(--color-danger-bg)', border: 'var(--color-danger-border)' },
    warning: { icon: AlertTriangle, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', border: 'var(--color-warning-border)' },
    info: { icon: Info, color: 'var(--color-info)', bg: 'var(--color-info-bg)', border: 'var(--color-info-border)' }
  };

  const config = iconMap[type] || iconMap.info;
  const Icon = config.icon;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        padding: '0.75rem 1rem',
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        minWidth: '280px',
        maxWidth: '420px',
        animation: 'slideInRight 0.25s ease-out'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
        <Icon size={18} style={{ color: config.color, flexShrink: 0 }} />
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
          {message}
        </span>
      </div>

      {onDismiss && (
        <IconButton
          icon={X}
          size="sm"
          variant="ghost"
          onClick={() => onDismiss(id)}
          title="Dismiss notification"
        />
      )}
    </div>
  );
}

export default Toast;
