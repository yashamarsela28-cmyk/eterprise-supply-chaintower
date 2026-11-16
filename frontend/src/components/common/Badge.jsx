import React from 'react';

/**
 * Compact operational tag. Uppercase, dot-led, low-chrome.
 */
export function Badge({ children, variant = 'neutral', size = 'md', icon: Icon, className = '', style = {}, ...props }) {
  return (
    <span
      className={`badge badge-${variant}${size === 'sm' ? ' badge-sm' : ''} ${className}`}
      style={{ fontSize: size === 'sm' ? 8 : undefined, ...style }}
      {...props}
    >
      {Icon && <Icon size={9} />}
      {children}
    </span>
  );
}

export default Badge;
