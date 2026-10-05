import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import IconButton from './IconButton';

/**
 * Enterprise Slide-over Drawer
 */
export function Drawer({
  isOpen = false,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = '520px',
  position = 'right',
  className = ''
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 'var(--z-drawer)',
        display: 'flex',
        justifyContent: position === 'right' ? 'flex-end' : 'flex-start',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: width,
          height: '100%',
          backgroundColor: 'var(--color-bg-card)',
          borderLeft: position === 'right' ? '1px solid var(--color-border-default)' : 'none',
          borderRight: position === 'left' ? '1px solid var(--color-border-default)' : 'none',
          boxShadow: 'var(--shadow-drawer)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        className={`drawer-panel ${className}`}
        role="dialog"
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--color-border-default)',
            backgroundColor: 'var(--color-bg-secondary)'
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                margin: 0,
                letterSpacing: '-0.01em'
              }}
            >
              {title}
            </h3>
            {subtitle && (
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  margin: '0.2rem 0 0 0'
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {onClose && (
            <IconButton
              icon={X}
              size="sm"
              variant="ghost"
              onClick={onClose}
              title="Close panel"
            />
          )}
        </div>

        {/* Content */}
        <div
          style={{
            padding: 'var(--space-5)',
            overflowY: 'auto',
            flex: 1
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-5)',
              borderTop: '1px solid var(--color-border-default)',
              backgroundColor: 'var(--color-bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)'
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Drawer;
