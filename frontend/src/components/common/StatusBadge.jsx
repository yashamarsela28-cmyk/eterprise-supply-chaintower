import React from 'react';
import Badge from './Badge';
import { getStatusVariant, formatStatusLabel } from '../../utils/formatters';

/**
 * Status Badge Component with automatic variant mapping and micro-dot
 */
export function StatusBadge({
  status,
  size = 'md',
  showDot = true,
  customLabel = null,
  className = '',
  ...props
}) {
  if (!status) return <span className="text-dim">—</span>;

  const variant = getStatusVariant(status);
  const label = customLabel || formatStatusLabel(status);

  return (
    <Badge variant={variant} size={size} className={className} {...props}>
      {showDot && (
        <span
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            display: 'inline-block',
            opacity: 0.9
          }}
        />
      )}
      <span>{label}</span>
    </Badge>
  );
}

export default StatusBadge;
