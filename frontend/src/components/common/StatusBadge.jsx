import React from 'react';
import Badge from './Badge';
import { getStatusVariant, formatStatusLabel } from '../../utils/formatters';

/**
 * Status Badge Component with automatic variant mapping
 */
export function StatusBadge({
  status,
  size = 'md',
  showDot = true,
  customLabel = null,
  className = '',
  ...props
}) {
  if (!status) return <span className="text-subtle">—</span>;

  const variant = getStatusVariant(status);
  const label = customLabel || formatStatusLabel(status);

  return (
    <Badge variant={variant} size={size} className={className} {...props}>
      {showDot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            display: 'inline-block'
          }}
        />
      )}
      {label}
    </Badge>
  );
}

export default StatusBadge;
