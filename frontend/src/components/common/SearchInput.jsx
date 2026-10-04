import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * Reusable Search Input with clear button
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  onClear,
  disabled = false,
  className = '',
  width = '280px',
  ...props
}) {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: width,
        maxWidth: '100%'
      }}
      className={`search-input-wrap ${className}`}
    >
      <div
        style={{
          position: 'absolute',
          left: '0.75rem',
          color: 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none'
        }}
      >
        <Search size={16} />
      </div>

      <input
        type="text"
        value={value !== undefined ? value : ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '0.5rem 2rem 0.5rem 2.25rem',
          backgroundColor: 'var(--color-bg-input)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--font-size-sm)',
          outline: 'none',
          fontFamily: 'inherit',
          transition: 'border-color var(--transition-fast)'
        }}
        {...props}
      />

      {value && (
        <button
          type="button"
          onClick={handleClear}
          title="Clear search"
          style={{
            position: 'absolute',
            right: '0.5rem',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.25rem',
            borderRadius: '50%',
            cursor: 'pointer'
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
