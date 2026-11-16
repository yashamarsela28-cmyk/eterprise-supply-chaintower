import React from 'react';

/**
 * Module header: operational eyebrow, tight title, one supporting sentence.
 * Deliberately compact so data occupies the screen, not chrome.
 */
export function PageHeader({ eyebrow, title, description, badge, actions, children, className = '' }) {
  return (
    <div className={`page-head ${className}`}>
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h1>{title}</h1>
          {badge}
        </div>
        {description && <p className="sub">{description}</p>}
        {children}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}

export default PageHeader;
