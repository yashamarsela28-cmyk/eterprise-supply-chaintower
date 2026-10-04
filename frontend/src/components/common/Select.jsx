import React from 'react';

/**
 * Reusable Select Dropdown
 */
export function Select({
  label,
  options = [], // [{ value: '1', label: 'Option 1' }]
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  error,
  className = '',
  id,
  ...props
}) {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }} className={className}>
      {label && (
        <label
          htmlFor={selectId}
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 500,
            color: 'var(--color-text-secondary)'
          }}
        >
          {label}
        </label>
      )}

      <select
        id={selectId}
        value={value !== undefined ? value : ''}
        onChange={onChange}
        disabled={disabled}
        style={{
          padding: '0.5rem 2rem 0.5rem 0.75rem',
          backgroundColor: 'var(--color-bg-input)',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border-default)'}`,
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--font-size-sm)',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.6rem center'
        }}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val} style={{ backgroundColor: 'var(--color-bg-secondary)', color: '#fff' }}>
              {lbl}
            </option>
          );
        })}
      </select>

      {error && (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger-text)' }}>
          {error}
        </span>
      )}
    </div>
  );
}

export default Select;
