import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import IconButton from './IconButton';

/**
 * Enterprise Modal Dialog
 */
export function Modal({
  isOpen = false,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md', // sm, md, lg, xl
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

  const widthMap = {
    sm: '420px',
    md: '580px',
    lg: '780px',
    xl: '980px'
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 'var(--z-modal)',
        padding: 'var(--space-4)',
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
          maxWidth: widthMap[size] || widthMap.md,
          maxHeight: '90vh',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        className={`modal-container ${className}`}
        role="dialog"
        aria-modal="true"
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
              title="Close dialog"
            />
          )}
        </div>

        {/* Body */}
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

export default Modal;
