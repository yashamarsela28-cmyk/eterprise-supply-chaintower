import React, { useState } from 'react';

/**
 * Enterprise Responsive Bar Chart Component
 * Supports Horizontal & Vertical orientations, real data scaling, and hover tooltips
 */
export function BarChart({
  data = [],
  labelKey = 'label',
  valueKey = 'value',
  valueFormatter = (v) => String(v),
  orientation = 'horizontal', // 'horizontal' | 'vertical'
  height = 240,
  barColor = 'var(--color-primary)',
  highlightMax = false,
  emptyMessage = 'No chart data available.'
}) {
  const [hoveredItem, setHoveredItem] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-xs)'
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);

  if (orientation === 'vertical') {
    return (
      <div style={{ width: '100%', height: `${height}px`, display: 'flex', flexDirection: 'column' }}>
        {/* Tooltip display */}
        <div style={{ minHeight: '20px', marginBottom: '0.5rem', textAlign: 'right' }}>
          {hoveredItem ? (
            <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>
              {hoveredItem[labelKey]}: {valueFormatter(hoveredItem[valueKey])}
            </span>
          ) : (
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Hover a bar to inspect</span>
          )}
        </div>

        {/* Bars Container */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.5rem',
            borderBottom: '1px solid var(--color-border-subtle)',
            paddingBottom: '0.5rem'
          }}
        >
          {data.map((item, idx) => {
            const val = Number(item[valueKey]) || 0;
            const pct = Math.max(4, Math.round((val / maxValue) * 100));
            const isHovered = hoveredItem === item;
            const isMax = highlightMax && val === maxValue && val > 0;

            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredItem(item)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: '40px',
                    height: `${pct}%`,
                    backgroundColor: isMax ? 'var(--color-success)' : isHovered ? 'var(--color-primary-hover)' : barColor,
                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    transition: 'all var(--transition-fast)',
                    opacity: hoveredItem && !isHovered ? 0.5 : 1
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* X-Axis Labels */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
          {data.map((item, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: '10px',
                color: hoveredItem === item ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                fontWeight: hoveredItem === item ? 600 : 400,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={String(item[labelKey])}
            >
              {String(item[labelKey])}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Horizontal Layout
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        maxHeight: `${height}px`,
        overflowY: 'auto',
        paddingRight: '0.25rem'
      }}
    >
      {data.map((item, idx) => {
        const val = Number(item[valueKey]) || 0;
        const pct = Math.max(3, Math.round((val / maxValue) * 100));
        const isHovered = hoveredItem === item;
        const isMax = highlightMax && val === maxValue && val > 0;

        return (
          <div
            key={idx}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', cursor: 'pointer' }}
            onMouseEnter={() => setHoveredItem(item)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-size-xs)' }}>
              <span
                style={{
                  color: isHovered ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  fontWeight: isHovered ? 600 : 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '70%'
                }}
                title={String(item[labelKey])}
              >
                {String(item[labelKey])}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '11px' }}>
                {valueFormatter(val)}
              </span>
            </div>

            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(51, 65, 85, 0.4)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  backgroundColor: isMax ? 'var(--color-success)' : isHovered ? 'var(--color-primary-hover)' : barColor,
                  borderRadius: 'var(--radius-full)',
                  transition: 'width var(--transition-normal)'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default BarChart;
