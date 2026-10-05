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
        borderBottom: variant === 'underline' ? '1px solid var(--color-border-default)' : 'none',
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
                gap: '0.45rem',
                padding: '0.4rem 0.8rem',
                fontSize: 'var(--font-size-xs)',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                backgroundColor: isActive ? 'var(--color-bg-hover)' : 'var(--color-bg-secondary)',
                border: `1px solid ${isActive ? 'var(--color-border-strong)' : 'var(--color-border-default)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)'
              }}
            >
              {Icon && <Icon size={13} />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  style={{
                    backgroundColor: isActive ? 'rgba(247, 247, 245, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                    padding: '0.1rem 0.35rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '10px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)'
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
              gap: '0.45rem',
              padding: '0.65rem 0.25rem',
              fontSize: 'var(--font-size-xs)',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${isActive ? 'var(--color-text-primary)' : 'transparent'}`,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              marginBottom: '-1px',
              transition: 'all var(--transition-fast)'
            }}
          >
            {Icon && <Icon size={14} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                style={{
                  backgroundColor: isActive ? 'var(--color-bg-hover)' : 'var(--color-bg-tertiary)',
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  border: '1px solid var(--color-border-default)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)'
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
