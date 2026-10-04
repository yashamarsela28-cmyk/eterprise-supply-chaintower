import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Standard Breadcrumbs Component
 */
export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Format path segment into human readable text
  const formatSegment = (seg) => {
    return seg
      .replace(/-/g, ' ')
      .replace(/^[a-z]/, (m) => m.toUpperCase());
  };

  if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === 'dashboard')) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-muted)',
        marginBottom: 'var(--space-4)'
      }}
    >
      <Link
        to="/dashboard"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          color: 'var(--color-text-muted)',
          textDecoration: 'none',
          transition: 'color var(--transition-fast)'
        }}
      >
        <Home size={14} />
        <span>Control Tower</span>
      </Link>

      {pathnames.map((segment, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            {isLast ? (
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                {formatSegment(segment)}
              </span>
            ) : (
              <Link
                to={routeTo}
                style={{
                  color: 'var(--color-text-secondary)',
                  textDecoration: 'none',
                  transition: 'color var(--transition-fast)'
                }}
              >
                {formatSegment(segment)}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
