import React from 'react';

/**
 * Enterprise Tabs Navigation Component
 */
export function Tabs({
  tabs = [], // [{ id: 'all', label: 'All', icon: Icon, badge: 5 }]
  activeTab,
  onChange,
  variant = 'underline', // 'underline' | 'pills'
  className = ''
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: variant === 'pills' ? 'var(--space-2)' : 'var(--space-4)',
        borderBottom: variant === 'underline' ? '1px solid var(--color-border-subtle)' : 'none',
        overflowX: 'auto',
        marginBottom: 'var(--space-4)'
      }}
      className={`tabs-nav ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        if (variant === 'pills') {
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.875rem',
                fontSize: 'var(--font-size-xs)',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                backgroundColor: isActive ? 'var(--color-primary)' : 'rgba(30, 41, 59, 0.5)',
                border: `1px solid ${isActive ? 'transparent' : 'var(--color-border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)'
              }}
            >
              {Icon && <Icon size={14} />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(51,65,85,0.6)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '10px',
                    fontWeight: 600
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        }

        // Underline variant
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 0.25rem',
              fontSize: 'var(--font-size-sm)',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${isActive ? 'var(--color-primary)' : 'transparent'}`,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              marginBottom: '-1px',
              transition: 'all var(--transition-fast)'
            }}
          >
            {Icon && <Icon size={16} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                style={{
                  backgroundColor: isActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(51, 65, 85, 0.4)',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  padding: '0.1rem 0.45rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
