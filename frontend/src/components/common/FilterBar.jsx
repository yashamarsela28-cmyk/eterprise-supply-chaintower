import React from 'react';
import SearchInput from './SearchInput';
import Button from './Button';
import { RotateCcw } from 'lucide-react';

/**
 * Enterprise Filter Bar for table lists
 */
export function FilterBar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  children, // Additional filters (selects, datepickers, buttons)
  onReset,
  hasActiveFilters = false,
  className = ''
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
        padding: 'var(--space-4)',
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-xl)',
        marginBottom: 'var(--space-4)'
      }}
      className={`filter-bar ${className}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', flex: 1 }}>
        {onSearchChange && (
          <SearchInput
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
          />
        )}
        {children}
      </div>

      {onReset && hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          icon={RotateCcw}
          onClick={onReset}
          title="Reset all filters"
        >
          Reset Filters
        </Button>
      )}
    </div>
  );
}

export default FilterBar;
