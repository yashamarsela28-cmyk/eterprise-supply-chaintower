import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import IconButton from './IconButton';

/**
 * Enterprise Pagination Component
 */
export function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  limit = 20,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50, 100],
  className = ''
}) {
  if (totalItems <= 0 && totalPages <= 1) {
    return null;
  }

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const left = currentPage - delta;
    const right = currentPage + delta + 1;
    let lastPushed = 0;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i < right)) {
        if (lastPushed && i - lastPushed > 1) {
          pages.push('...');
        }
        pages.push(i);
        lastPushed = i;
      }
    }
    return pages;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        borderTop: '1px solid var(--color-border-default)',
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-secondary)',
        backgroundColor: 'var(--color-bg-secondary)',
        borderBottomLeftRadius: 'var(--radius-xl)',
        borderBottomRightRadius: 'var(--radius-xl)'
      }}
      className={`pagination-bar ${className}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span>
          Showing <strong style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>{startItem}</strong> to{' '}
          <strong style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>{endItem}</strong> of{' '}
          <strong style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>{totalItems}</strong> entries
        </span>

        {onLimitChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginLeft: 'var(--space-2)' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              style={{
                padding: '0.2rem 0.4rem',
                backgroundColor: 'var(--color-bg-input)',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-primary)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt} style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <IconButton
          icon={ChevronsLeft}
          size="sm"
          variant="ghost"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          title="First page"
        />
        <IconButton
          icon={ChevronLeft}
          size="sm"
          variant="ghost"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Previous page"
        />

        {getPageNumbers().map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${idx}`} style={{ padding: '0 0.4rem', color: 'var(--color-text-dim)' }}>
                ...
              </span>
            );
          }

          const isActive = p === currentPage;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              style={{
                minWidth: '1.85rem',
                height: '1.85rem',
                padding: '0 0.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: isActive ? 700 : 500,
                backgroundColor: isActive ? 'var(--color-text-primary)' : 'transparent',
                color: isActive ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)',
                border: isActive ? '1px solid var(--color-text-primary)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {p}
            </button>
          );
        })}

        <IconButton
          icon={ChevronRight}
          size="sm"
          variant="ghost"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Next page"
        />
        <IconButton
          icon={ChevronsRight}
          size="sm"
          variant="ghost"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Last page"
        />
      </div>
    </div>
  );
}

export default Pagination;
