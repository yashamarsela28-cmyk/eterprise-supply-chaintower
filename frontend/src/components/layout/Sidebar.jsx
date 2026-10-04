import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAVIGATION_SECTIONS } from '../../routes/navigation';

/**
 * Enterprise Sidebar Navigation Component
 * Control Tower Multi-Echelon Navigation Hierarchy
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
        zIndex: 'var(--z-header)',
        flexShrink: 0
      }}
      className="app-sidebar"
    >
      {/* Navigation List */}
      <div style={{ padding: 'var(--space-4) var(--space-3)' }}>
        {NAVIGATION_SECTIONS.map((section, sIdx) => (
          <div key={sIdx} style={{ marginBottom: 'var(--space-5)' }}>
            {isOpen && (
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--color-text-muted)',
                  padding: '0 var(--space-3) var(--space-2) var(--space-3)'
                }}
              >
                {section.title}
              </div>
            )}

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
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
                      gap: '0.75rem',
                      padding: isOpen ? '0.55rem 0.75rem' : '0.55rem',
                      justifyContent: isOpen ? 'flex-start' : 'center',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                      backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all var(--transition-fast)',
                      position: 'relative'
                    })}
                    title={!isOpen ? item.title : undefined}
                  >
                    {Icon && (
                      <Icon
                        size={18}
                        style={{
                          flexShrink: 0
                        }}
                      />
                    )}
                    {isOpen && (
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </span>
                    )}
                    {isOpen && item.badge && (
                      <span
                        style={{
                          backgroundColor: 'rgba(59, 130, 246, 0.2)',
                          color: '#60a5fa',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '0.1rem 0.4rem',
                          borderRadius: 'var(--radius-full)',
                          textTransform: 'uppercase'
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

      {/* Sidebar Footer */}
      {isOpen && (
        <div
          style={{
            padding: 'var(--space-4)',
            borderTop: '1px solid var(--color-border-subtle)',
            backgroundColor: 'rgba(15, 23, 42, 0.3)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Control Tower Enterprise</span>
            <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>Live Telemetry</span>
          </div>
          <span>Multi-Echelon Operational Platform</span>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
