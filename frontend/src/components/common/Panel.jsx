import React from 'react';

/** Flat bordered surface used by every module. */
export function Panel({ children, className = '', style, ...props }) {
  return <section className={`panel ${className}`} style={style} {...props}>{children}</section>;
}

export function PanelHead({ title, subtitle, action, children }) {
  return (
    <div className="panel-head">
      <div style={{ minWidth: 0 }}>
        {title && <h3>{title}</h3>}
        {subtitle && <div className="panel-sub">{subtitle}</div>}
        {children}
      </div>
      {action}
    </div>
  );
}

export function PanelBody({ children, flush = false, className = '', style }) {
  return <div className={`panel-body${flush ? ' flush' : ''} ${className}`} style={style}>{children}</div>;
}

/** One figure inside a stat strip. */
export function Stat({ label, value, meta, tone = '', icon: Icon }) {
  return (
    <div className={`stat ${tone}`}>
      <div className="label">
        {Icon && <Icon size={11} style={{ opacity: 0.75 }} />}
        {label}
      </div>
      <div className="value">{value}</div>
      {meta && <div className="meta">{meta}</div>}
    </div>
  );
}

export function StatGrid({ cols = 4, children }) {
  return <div className={`stat-grid cols-${cols}`}>{children}</div>;
}

export function Meter({ value = 0, tone = '', label, right }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div>
      {(label || right) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 10.5, color: 'var(--color-text-secondary)' }}>{label}</span>
          <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{right}</span>
        </div>
      )}
      <div className={`meter ${tone}`}>
        <span style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export default Panel;
