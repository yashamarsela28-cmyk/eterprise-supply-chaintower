import React from 'react';

/**
 * Reusable Form Input
 */
export function Input({
  label,
  error,
  helperText,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  className = '',
  id,
  ...props
}) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: '100%' }} className={className}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 500,
            color: 'var(--color-text-secondary)'
          }}
        >
          {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <div
            style={{
              position: 'absolute',
              left: '0.75rem',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Icon size={16} />
          </div>
        )}

        <input
          id={inputId}
          type={type}
          value={value !== undefined ? value : ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          style={{
            width: '100%',
            padding: Icon ? '0.5rem 0.75rem 0.5rem 2.25rem' : '0.5rem 0.75rem',
            backgroundColor: 'var(--color-bg-input)',
            border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border-default)'}`,
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-sm)',
            outline: 'none',
            transition: 'border-color var(--transition-fast)',
            fontFamily: 'inherit'
          }}
          {...props}
        />
      </div>

      {error && (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger-text)' }}>
          {error}
        </span>
      )}
      {!error && helperText && (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {helperText}
        </span>
      )}
    </div>
  );
}

export default Input;
