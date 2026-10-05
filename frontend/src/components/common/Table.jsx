import React from 'react';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

/**
 * Enterprise Data Table Component
 * High density, crisp borders, sticky header, row hover
 * @param {Array} columns - [{ key, header, render, width, align }]
 * @param {Array} data - Array of row objects
 */
export function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found',
  emptyTitle = 'No Data',
  onRowClick = null,
  keyExtractor = (item, index) => item.id || item._id || index,
  className = '',
  stickyHeader = false
}) {
  return (
    <div
      style={{
        width: '100%',
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)'
      }}
      className={`table-wrapper ${className}`}
    >
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: 'var(--font-size-sm)'
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderBottom: '1px solid var(--color-border-default)'
              }}
            >
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  style={{
                    padding: '0.75rem 1rem',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    width: col.width || 'auto',
                    textAlign: col.align || 'left',
                    whiteSpace: 'nowrap',
                    position: stickyHeader ? 'sticky' : 'static',
                    top: 0,
                    zIndex: 1
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length} style={{ padding: '3.5rem 1rem' }}>
                  <LoadingState message="Loading records..." />
                </td>
              </tr>
            )}

            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{ padding: '3.5rem 1rem' }}>
                  <EmptyState title={emptyTitle} message={emptyMessage} />
                </td>
              </tr>
            )}

            {!loading &&
              data.length > 0 &&
              data.map((row, rowIdx) => {
                const rowKey = keyExtractor(row, rowIdx);
                const isClickable = typeof onRowClick === 'function';

                return (
                  <tr
                    key={rowKey}
                    onClick={() => isClickable && onRowClick(row)}
                    style={{
                      borderBottom: '1px solid var(--color-border-subtle)',
                      transition: 'background-color var(--transition-fast)',
                      cursor: isClickable ? 'pointer' : 'default',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {columns.map((col, colIdx) => {
                      const cellValue = col.key ? row[col.key] : null;
                      const content = col.render ? col.render(row, rowIdx) : (cellValue !== null && cellValue !== undefined ? String(cellValue) : '—');

                      return (
                        <td
                          key={col.key || colIdx}
                          style={{
                            padding: '0.8rem 1rem',
                            color: 'var(--color-text-primary)',
                            textAlign: col.align || 'left',
                            verticalAlign: 'middle',
                            fontSize: 'var(--font-size-xs)'
                          }}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
