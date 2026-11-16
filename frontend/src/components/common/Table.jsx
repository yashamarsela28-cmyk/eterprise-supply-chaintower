import React from 'react';
import { motion } from 'framer-motion';
import EmptyState from './EmptyState';

/**
 * Dense operational data grid.
 * `columns: [{ key, header, render, width, align }]`
 */
export function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records match the current criteria.',
  emptyTitle = 'Nothing to report',
  onRowClick = null,
  keyExtractor = (item, index) => item.id || item._id || index,
  className = '',
  maxHeight
}) {
  return (
    <div className={`table-wrap ${className}`}>
      <div className="table-scroll" style={maxHeight ? { maxHeight } : undefined}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={col.key || idx} style={{ width: col.width, textAlign: col.align || 'left' }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  {columns.map((col, ci) => (
                    <td key={ci}>
                      <div className="skeleton" style={{ height: 9, width: `${45 + ((i * 13 + ci * 21) % 45)}%` }} />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{ padding: '46px 16px' }}>
                  <EmptyState title={emptyTitle} message={emptyMessage} />
                </td>
              </tr>
            )}

            {!loading &&
              data.map((row, rowIdx) => (
                <motion.tr
                  key={keyExtractor(row, rowIdx)}
                  className={onRowClick ? 'clickable' : ''}
                  onClick={() => onRowClick?.(row)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.18, delay: Math.min(rowIdx * 0.012, 0.18) }}
                >
                  {columns.map((col, colIdx) => (
                    <td key={col.key || colIdx} style={{ textAlign: col.align || 'left' }}>
                      {col.render
                        ? col.render(row, rowIdx)
                        : row[col.key] !== null && row[col.key] !== undefined
                          ? String(row[col.key])
                          : '—'}
                    </td>
                  ))}
                </motion.tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
