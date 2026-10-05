import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * Editorial Breadcrumbs Component
 */
export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

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
        gap: '0.35rem',
        fontSize: '11px',
        color: 'var(--color-text-muted)',
        marginBottom: 'var(--space-3)'
      }}
    >
      <Link
        to="/dashboard"
        style={{
          color: 'var(--color-text-muted)',
          textDecoration: 'none',
          transition: 'color var(--transition-fast)'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
      >
        Control Tower
      </Link>

      {pathnames.map((segment, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight size={11} style={{ color: 'var(--color-text-dim)', flexShrink: 0 }} />
            {isLast ? (
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                {formatSegment(segment)}
              </span>
            ) : (
              <Link
                to={routeTo}
                style={{
                  color: 'var(--color-text-muted)',
                  textDecoration: 'none',
                  transition: 'color var(--transition-fast)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
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
