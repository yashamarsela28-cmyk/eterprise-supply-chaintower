import React from 'react';

/**
 * Enterprise Linear Capacity / Progress Meter Component
 */
export function ProgressBar({
  value = 0,
  max = 100,
  label = '',
  showValue = true,
  valueFormatter = (v) => `${v.toFixed(1)}%`,
  height = 6,
  status = 'default', // 'default', 'success', 'warning', 'danger', 'info'
  thresholds = null // optional { warning: 75, danger: 90 }
}) {
  const percentage = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));

  // Determine color based on status or dynamic thresholds
  let color = 'var(--color-text-primary)';
  if (thresholds) {
    if (percentage >= thresholds.danger) color = 'var(--color-danger)';
    else if (percentage >= thresholds.warning) color = 'var(--color-warning)';
    else color = 'var(--color-success)';
  } else if (status === 'success') {
    color = 'var(--color-success)';
  } else if (status === 'warning') {
    color = 'var(--color-warning)';
  } else if (status === 'danger') {
    color = 'var(--color-danger)';
  } else if (status === 'info') {
    color = 'var(--color-info)';
  }

  return (
    <div style={{ width: '100%' }} className="progress-bar-container">
      {(label || showValue) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.35rem',
            fontSize: 'var(--font-size-xs)'
          }}
        >
          {label && <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</span>}
          {showValue && (
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              {valueFormatter(percentage)}
            </span>
          )}
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          backgroundColor: 'var(--color-bg-tertiary)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid var(--color-border-subtle)'
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: 'var(--radius-full)',
            transition: 'width var(--transition-normal)'
          }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
