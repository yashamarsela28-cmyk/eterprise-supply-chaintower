import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAVIGATION_SECTIONS } from '../../routes/navigation';

/**
 * Operational navigation rail.
 * Mirrors the compact icon-led navigation of the logistics reference while
 * retaining grouped, accessible route labels on hover and on mobile.
 */
export function Sidebar({ isOpen = false, isMobile = false, onCloseMobile }) {
  return (
    <aside
      className={`rail${isMobile && isOpen ? ' mobile-open' : ''}`}
      aria-label="Primary navigation"
    >
      {NAVIGATION_SECTIONS.map((section, sIdx) => (
        <div className="rail-section" key={section.title + sIdx}>
          <div className="rail-label">{section.title === 'OVERVIEW' ? 'OVR' : section.title === 'OPERATIONS' ? 'OPS' : section.title === 'INVENTORY & HUBS' ? 'INV' : section.title === 'PROCUREMENT' ? 'PROC' : section.title === 'FINANCE & ACCOUNTS' ? 'FIN' : 'RTN'}</div>
          {section.items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onCloseMobile?.()}
                className={({ isActive }) => `rail-link${isActive ? ' active' : ''}`}
                aria-label={item.title}
              >
                <Icon size={16} strokeWidth={1.6} />
                <span className="rail-text">{item.title}</span>
                {!isMobile && <span className="rail-tip">{item.title}</span>}
                {item.badge && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: 9,
                      right: 10,
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: 'var(--color-success)'
                    }}
                  />
                )}
              </NavLink>
            );
          })}
        </div>
      ))}
    </aside>
  );
}

export default Sidebar;
