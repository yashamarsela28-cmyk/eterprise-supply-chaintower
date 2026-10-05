import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAVIGATION_SECTIONS } from '../../routes/navigation';

/**
 * Enterprise Sidebar Navigation Component
 * Editorial, minimalist, grouped multi-echelon hierarchy
 */
export function Sidebar({ isOpen = true, onCloseMobile }) {
  return (
    <aside
      style={{
        width: isOpen ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed-width)',
        height: 'calc(100vh - var(--header-height))',
        position: 'sticky',
        top: 'var(--header-height)',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width var(--transition-normal)',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 'var(--z-sidebar)',
        flexShrink: 0
      }}
      className="app-sidebar"
    >
      {/* Navigation Sections */}
      <div style={{ padding: 'var(--space-3) var(--space-2)' }}>
        {NAVIGATION_SECTIONS.map((section, sIdx) => (
          <div key={sIdx} style={{ marginBottom: 'var(--space-4)' }}>
            {isOpen && (
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--color-text-dim)',
                  padding: '0 var(--space-3) var(--space-1) var(--space-3)'
                }}
              >
                {section.title}
              </div>
            )}

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: isOpen ? '0.45rem 0.65rem' : '0.45rem',
                      justifyContent: isOpen ? 'flex-start' : 'center',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      backgroundColor: isActive ? 'var(--color-bg-tertiary)' : 'transparent',
                      borderLeft: isActive ? '2px solid var(--color-text-primary)' : '2px solid transparent',
                      textDecoration: 'none',
                      transition: 'all var(--transition-fast)',
                      position: 'relative'
                    })}
                    title={!isOpen ? item.title : undefined}
                  >
                    {Icon && (
                      <Icon
                        size={15}
                        style={{
                          flexShrink: 0,
                          opacity: 0.85
                        }}
                      />
                    )}
                    {isOpen && (
                      <span
                        style={{
                          flex: 1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {item.title}
                      </span>
                    )}
                    {isOpen && item.badge && (
                      <span
                        style={{
                          backgroundColor: 'var(--color-success-bg)',
                          color: 'var(--color-success-text)',
                          border: '1px solid var(--color-success-border)',
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '0.05rem 0.35rem',
                          borderRadius: 'var(--radius-full)',
                          letterSpacing: '0.04em'
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Sidebar Footer Capsule */}
      {isOpen && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderTop: '1px solid var(--color-border-subtle)',
            backgroundColor: 'var(--color-bg-primary)',
            fontSize: '10px',
            color: 'var(--color-text-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Region: US-EAST-1</span>
            <span style={{ color: 'var(--color-success-text)', fontWeight: 600 }}>Active</span>
          </div>
          <span style={{ color: 'var(--color-text-dim)' }}>Supply Chain Protocol v2.4</span>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
