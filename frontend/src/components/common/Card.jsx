import React from 'react';

/**
 * Flat operational panel. No stacked shadows or decorative borders.
 */
export function Card({ children, title, subtitle, action, headerBorder = true, padding = 'md', className = '', style = {}, ...props }) {
  const pads = { none: 0, sm: 10, md: 14, lg: 18 };
  const hasHeader = title || subtitle || action;
  return (
    <section className={`panel ${className}`} style={style} {...props}>
      {hasHeader && (
        <div className="panel-head" style={{ borderBottom: headerBorder ? undefined : 'none' }}>
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <div className="panel-sub">{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      <div style={{ padding: pads[padding] }}>{children}</div>
    </section>
  );
}

export default Card;
