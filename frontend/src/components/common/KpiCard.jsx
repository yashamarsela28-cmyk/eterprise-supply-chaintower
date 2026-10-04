import React from 'react';
import Card from './Card';
import Badge from './Badge';

/**
 * Enterprise KPI Metric Card (Stitch-ready)
 */
export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = null, // { value: '+12%', isPositive: true }
  badge = null, // { text: 'Live', variant: 'success' }
  color = 'primary', // primary | success | warning | danger | info | purple
  loading = false,
  className = '',
  onClick,
  ...props
}) {
  const colorMap = {
    primary: {
      bg: 'var(--color-primary-subtle)',
      text: 'var(--color-primary)',
      border: 'rgba(59, 130, 246, 0.25)'
    },
    success: {
      bg: 'var(--color-success-subtle)',
      text: 'var(--color-success-text)',
      border: 'rgba(16, 185, 129, 0.25)'
    },
    warning: {
      bg: 'var(--color-warning-subtle)',
      text: 'var(--color-warning-text)',
      border: 'rgba(245, 158, 11, 0.25)'
    },
    danger: {
      bg: 'var(--color-danger-subtle)',
      text: 'var(--color-danger-text)',
      border: 'rgba(239, 68, 68, 0.25)'
    },
    info: {
      bg: 'var(--color-info-subtle)',
      text: 'var(--color-info-text)',
      border: 'rgba(6, 182, 212, 0.25)'
    },
    purple: {
      bg: 'var(--color-purple-subtle)',
      text: 'var(--color-purple-text)',
      border: 'rgba(139, 92, 246, 0.25)'
    }
  };

  const scheme = colorMap[color] || colorMap.primary;

  return (
    <Card
      padding="md"
      className={`kpi-card ${className}`}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform var(--transition-fast), border-color var(--transition-fast)',
        position: 'relative'
      }}
      onClick={onClick}
      {...props}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {title}
            </span>
            {badge && (
              <Badge variant={badge.variant || 'neutral'} size="sm">
                {badge.text}
              </Badge>
            )}
          </div>

          <div
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              lineHeight: 1.2,
              fontFamily: 'var(--font-mono)'
            }}
          >
            {loading ? (
              <span
                style={{
                  display: 'inline-block',
                  width: '80px',
                  height: '28px',
                  backgroundColor: 'var(--color-bg-active)',
                  borderRadius: 'var(--radius-sm)'
                }}
                className="animate-pulse"
              />
            ) : (
              value
            )}
          </div>

          {(subtitle || trend) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)'
              }}
            >
              {trend && (
                <span
                  style={{
                    color: trend.isPositive ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                    fontWeight: 600
                  }}
                >
                  {trend.value}
                </span>
              )}
              {subtitle && <span>{subtitle}</span>}
            </div>
          )}
        </div>

        {Icon && (
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: scheme.bg,
              color: scheme.text,
              border: `1px solid ${scheme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Icon size={22} />
          </div>
        )}
      </div>
    </Card>
  );
}

export default KpiCard;
