import React from 'react';

/**
 * Enterprise Circular Donut Gauge Component
 * Displays percentage metrics with SVG circle stroke animation
 */
export function DonutGauge({
  value = 0,
  max = 100,
  size = 140,
  strokeWidth = 12,
  label = '',
  sublabel = '',
  status = 'primary' // 'primary', 'success', 'warning', 'danger', 'info'
}) {
  const percentage = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let color = 'var(--color-primary)';
  if (status === 'success') color = 'var(--color-success)';
  else if (status === 'warning') color = 'var(--color-warning)';
  else if (status === 'danger') color = 'var(--color-danger)';
  else if (status === 'info') color = 'var(--color-info)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.5rem'
      }}
      className="donut-gauge"
    >
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(51, 65, 85, 0.4)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Indicator */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>

        {/* Center Text */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {percentage.toFixed(1)}%
          </span>
          {sublabel && (
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              {sublabel}
            </span>
          )}
        </div>
      </div>

      {label && (
        <span style={{ marginTop: '0.5rem', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
          {label}
        </span>
      )}
    </div>
  );
}

export default DonutGauge;
