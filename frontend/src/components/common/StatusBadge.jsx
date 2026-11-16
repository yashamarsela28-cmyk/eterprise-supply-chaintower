import React from 'react';
import Badge from './Badge';
import { getStatusVariant, formatStatusLabel } from '../../utils/formatters';

/**
 * Status chip with a semantic dot. Dot-led rather than pill-heavy,
 * matching operational tracking interfaces.
 */
export function StatusBadge({ status, size = 'md', showDot = true, customLabel = null, className = '', ...props }) {
  if (!status) return <span className="text-dim">—</span>;

  return (
    <Badge variant={getStatusVariant(status)} size={size} className={className} {...props}>
      {showDot && <span className="dot" />}
      <span>{customLabel || formatStatusLabel(status)}</span>
    </Badge>
  );
}

export default StatusBadge;
