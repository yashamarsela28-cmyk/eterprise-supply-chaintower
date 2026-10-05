import React from 'react';
import Card from './Card';
import Badge from './Badge';

/**
 * Enterprise KPI Metric Card
 * Crisp monospace figures, subtle borders, trend indicators
 */
export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = null, // { value: '+12%', isPositive: true }
  badge = null, // { text: 'Live', variant: 'success' }
  color = 'primary', // primary | success | warning | danger | info | purple | neutral
  loading = false,
  className = '',
  onClick,
  ...props
}) {
  const colorMap = {
    neutral: {
      bg: 'var(--color-bg-tertiary)',
      text: 'var(--color-text-secondary)',
      border: 'var(--color-border-default)'
    },
    primary: {
      bg: 'rgba(247, 247, 245, 0.05)',
      text: 'var(--color-text-primary)',
      border: 'var(--color-border-default)'
    },
    success: {
      bg: 'var(--color-success-bg)',
      text: 'var(--color-success-text)',
      border: 'var(--color-success-border)'
    },
    warning: {
      bg: 'var(--color-warning-bg)',
      text: 'var(--color-warning-text)',
      border: 'var(--color-warning-border)'
    },
    danger: {
      bg: 'var(--color-danger-bg)',
      text: 'var(--color-danger-text)',
      border: 'var(--color-danger-border)'
    },
    info: {
      bg: 'var(--color-info-bg)',
      text: 'var(--color-info-text)',
      border: 'var(--color-info-border)'
    },
    purple: {
      bg: 'var(--color-purple-bg)',
      text: 'var(--color-purple-text)',
      border: 'var(--color-purple-border)'
    }
  };

  const scheme = colorMap[color] || colorMap.primary;

  return (
    <Card
      padding="md"
      className={`kpi-card ${className}`}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all var(--transition-fast)',
        position: 'relative'
      }}
      onClick={onClick}
      {...props}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
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
              fontSize: '1.65rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              lineHeight: 1.15,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '-0.02em'
            }}
          >
            {loading ? (
              <span
                style={{
                  display: 'inline-block',
                  width: '90px',
                  height: '28px',
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderRadius: 'var(--radius-sm)'
                }}
                className="animate-pulse"
              />
            ) : (
              value ?? '—'
            )}
          </div>

          {(subtitle || trend) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginTop: '0.45rem',
                fontSize: '11px',
                color: 'var(--color-text-muted)'
              }}
            >
              {trend && (
                <span
                  style={{
                    color: trend.isPositive ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)'
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
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: scheme.bg,
              color: scheme.text,
              border: `1px solid ${scheme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>
    </Card>
  );
}

export default KpiCard;
