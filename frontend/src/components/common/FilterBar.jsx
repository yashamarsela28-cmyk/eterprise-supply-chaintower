import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';

/**
 * Inline list toolbar: search, filters, reset.
 */
export function FilterBar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search records…',
  children,
  onReset,
  hasActiveFilters = false,
  className = ''
}) {
  return (
    <div className={`toolbar ${className}`}>
      <div className="toolbar-group">
        {onSearchChange && (
          <label className="search-field">
            <Search size={12} />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
            {search && (
              <button onClick={() => onSearchChange('')} aria-label="Clear search" style={{ display: 'flex', color: 'var(--color-text-muted)' }}>
                <X size={11} />
              </button>
            )}
          </label>
        )}
        {children}
      </div>
      {onReset && hasActiveFilters && (
        <button className="btn btn-ghost" onClick={onReset}>
          <RotateCcw size={11} /> Reset
        </button>
      )}
    </div>
  );
}

export default FilterBar;
