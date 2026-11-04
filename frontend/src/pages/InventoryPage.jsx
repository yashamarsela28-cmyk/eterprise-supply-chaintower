import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Boxes, RefreshCw, Plus, AlertCircle, TrendingDown, Lock, Unlock,
  ChevronRight, Search, Filter, MoreVertical, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as inventoryService from '../services/inventoryService';
import { useToast } from '../context/ToastContext';
import { normalizeList, normalizePagination } from '../utils/responseNormalizer';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatNumber, formatDate } from '../utils/formatters';

export function InventoryPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustmentMode, setAdjustmentMode] = useState(null);
  const [adjustmentQty, setAdjustmentQty] = useState(1);

  const { page, limit, setPage, setLimit } = usePagination(1, 25);

  const { data: rawData, loading, refetch } = useApiQuery(
    inventoryService.getInventory,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  const items = useMemo(() => normalizeList(rawData), [rawData]);
  const pagination = useMemo(() => normalizePagination(rawData, items, page, limit), [rawData, items, page, limit]);

  // Summary stats
  const stats = useMemo(() => {
    let onHand = 0, reserved = 0, available = 0, lowStock = 0, critical = 0;

    items.forEach(item => {
      const oh = Number(item.quantity_on_hand || item.quantity || 0);
      const res = Number(item.quantity_reserved || 0);
      const avail = Number(item.quantity_available || oh - res);
      const safety = Number(item.reorder_point || item.safety_stock || 5);

      onHand += oh;
      reserved += res;
      available += avail;

      if (avail <= safety) lowStock++;
      if (avail <= safety * 0.5) critical++;
    });

    return { onHand, reserved, available, lowStock, critical, total: items.length };
  }, [items]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    hover: { x: 4, transition: { duration: 0.2 } }
  };

  return (
    <motion.div
      className="inventory-page"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        minHeight: '100vh'
      }}
    >
      {/* Premium Header */}
      <motion.div variants={itemVariants}>
        <div
          style={{
            background: 'linear-gradient(135deg, var(--color-bg-elevated) 0%, var(--color-bg-card) 100%)',
            borderRadius: 'var(--radius-2xl)',
            padding: 'var(--space-6)',
            border: '1px solid var(--color-border-default)',
            boxShadow: 'var(--shadow-card)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '150px',
              height: '150px',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'var(--color-accent-blue)',
                marginBottom: 'var(--space-2)'
              }}
            >
              WAREHOUSE OPERATIONS
            </div>
            <h1
              style={{
                fontSize: 'var(--font-size-4xl)',
                fontWeight: 800,
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: 'var(--space-2)'
              }}
            >
              Inventory Management & Stock Control
            </h1>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                maxWidth: '600px'
              }}
            >
              Real-time stock levels, warehouse locations, reserved quantities, and inventory alerts across all facilities
            </p>
          </div>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <motion.div
        variants={itemVariants}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)'
        }}
      >
        {[
          { label: 'On-Hand Units', value: stats.onHand, icon: Boxes, color: 'var(--color-info-text)' },
          { label: 'Reserved Units', value: stats.reserved, icon: Lock, color: 'var(--color-warning-text)' },
          { label: 'Available Stock', value: stats.available, icon: Unlock, color: 'var(--color-success-text)' },
          { label: 'Low Stock Items', value: stats.lowStock, icon: AlertCircle, color: 'var(--color-danger-text)' }
        ].map((kpi, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -2 }}
            style={{
              padding: 'var(--space-4)',
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--color-text-muted)'
                }}
              >
                {kpi.label}
              </span>
              <kpi.icon size={16} style={{ color: kpi.color, opacity: 0.6 }} />
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 800,
                color: kpi.color,
                fontFamily: 'var(--font-mono)'
              }}
            >
              {formatNumber(kpi.value)}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Control Bar */}
      <motion.div
        variants={itemVariants}
        style={{
          display: 'flex',
          gap: 'var(--space-3)',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-2)', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search by item name, SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                paddingLeft: '2.2rem',
                padding: '0.6rem 0.75rem',
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={refetch}
          style={{
            padding: '0.6rem 1.2rem',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid var(--color-accent-blue)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-accent-blue)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all var(--transition-fast)'
          }}
        >
          <RefreshCw size={14} />
          Refresh
        </motion.button>
      </motion.div>

      {/* Inventory Table */}
      <motion.div
        variants={itemVariants}
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          flex: 1
        }}
      >
        {loading ? (
          <div
            style={{
              padding: 'var(--space-8)',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-sm)'
            }}
          >
            Loading inventory...
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              padding: 'var(--space-8)',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-sm)'
            }}
          >
            No inventory items found
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)', backgroundColor: 'var(--color-bg-secondary)' }}>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '10.5px', letterSpacing: '0.05em' }}>Item / SKU</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '10.5px', letterSpacing: '0.05em' }}>On Hand</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '10.5px', letterSpacing: '0.05em' }}>Reserved</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '10.5px', letterSpacing: '0.05em' }}>Available</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '10.5px', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '10.5px', letterSpacing: '0.05em' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {items.map((item, idx) => {
                    const onHand = Number(item.quantity_on_hand || item.quantity || 0);
                    const reserved = Number(item.quantity_reserved || 0);
                    const available = Number(item.quantity_available || onHand - reserved);
                    const reorder = Number(item.reorder_point || item.safety_stock || 5);
                    const isLow = available <= reorder;
                    const isCritical = available <= reorder * 0.5;

                    return (
                      <motion.tr
                        key={item.inventory_id || idx}
                        variants={rowVariants}
                        whileHover="hover"
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, x: -10 }}
                        onClick={() => setSelectedItem(item)}
                        style={{
                          borderBottom: '1px solid var(--color-border-subtle)',
                          cursor: 'pointer',
                          transition: 'background var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: 'var(--space-3)', paddingLeft: 'var(--space-4)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {item.item_name || item.product_name || 'Item'}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {item.sku || item.product_code || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'center', color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {formatNumber(onHand)}
                        </td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'center', color: 'var(--color-warning-text)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {formatNumber(reserved)}
                        </td>
                        <td style={{
                          padding: 'var(--space-3)',
                          textAlign: 'center',
                          color: isCritical ? 'var(--color-danger-text)' : isLow ? 'var(--color-warning-text)' : 'var(--color-success-text)',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600
                        }}>
                          {formatNumber(available)}
                        </td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex' }}>
                            {isCritical ? (
                              <span style={{
                                padding: '0.25rem 0.6rem',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                color: 'var(--color-danger-text)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '9px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}>
                                Critical
                              </span>
                            ) : isLow ? (
                              <span style={{
                                padding: '0.25rem 0.6rem',
                                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                color: 'var(--color-warning-text)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '9px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}>
                                Low Stock
                              </span>
                            ) : (
                              <span style={{
                                padding: '0.25rem 0.6rem',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                color: 'var(--color-success-text)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '9px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}>
                                In Stock
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'right', paddingRight: 'var(--space-4)' }}>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                              setAdjustmentMode('adjust');
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--color-accent-blue)',
                              padding: '0.4rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 'var(--radius-md)',
                              transition: 'background var(--transition-fast)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <ChevronRight size={16} />
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {!loading && items.length > 0 && (
        <motion.div
          variants={itemVariants}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--space-4)',
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border-default)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)'
          }}
        >
          <span>
            Showing {(page - 1) * limit + 1} - {Math.min(page * limit, pagination.total || 0)} of{' '}
            {formatNumber(pagination.total || items.length)}
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              disabled={page === 1}
              onClick={() => setPage(Math.max(1, page - 1))}
              style={{
                padding: '0.4rem 0.8rem',
                backgroundColor: page === 1 ? 'var(--color-bg-secondary)' : 'var(--color-accent-blue)',
                color: page === 1 ? 'var(--color-text-muted)' : 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600
              }}
            >
              Previous
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              disabled={!pagination.hasNext && page > 1}
              onClick={() => setPage(page + 1)}
              style={{
                padding: '0.4rem 0.8rem',
                backgroundColor: !pagination.hasNext && page > 1 ? 'var(--color-bg-secondary)' : 'var(--color-accent-blue)',
                color: !pagination.hasNext && page > 1 ? 'var(--color-text-muted)' : 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: !pagination.hasNext && page > 1 ? 'not-allowed' : 'pointer',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600
              }}
            >
              Next
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Detail Panel Overlay */}
      <AnimatePresence>
        {selectedItem && !adjustmentMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              zIndex: 50
            }}
          >
            <motion.div
              initial={{ x: 500, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 500, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '380px',
                background: 'var(--color-bg-card)',
                borderLeft: '1px solid var(--color-border-default)',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                maxHeight: '100%'
              }}
            >
              {/* Header */}
              <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
                  {selectedItem.item_name || 'Item Details'}
                </h3>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {selectedItem.sku || 'SKU N/A'}
                </p>
              </div>

              {/* Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {[
                  { label: 'On-Hand Quantity', value: formatNumber(Number(selectedItem.quantity_on_hand || 0)), icon: Boxes },
                  { label: 'Reserved Quantity', value: formatNumber(Number(selectedItem.quantity_reserved || 0)), icon: Lock },
                  { label: 'Available Quantity', value: formatNumber(Number(selectedItem.quantity_available || 0)), icon: Unlock },
                  { label: 'Reorder Point', value: formatNumber(Number(selectedItem.reorder_point || 5)), icon: AlertCircle },
                  { label: 'Warehouse', value: selectedItem.warehouse_name || selectedItem.warehouse_id || 'N/A', icon: null },
                  { label: 'Last Updated', value: formatDate(selectedItem.updated_at), icon: null }
                ].map((row, idx) => (
                  <div key={idx} style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                        {row.label}
                      </span>
                    </div>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', gap: 'var(--space-2)' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setAdjustmentMode('adjust')}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    backgroundColor: 'var(--color-accent-blue)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    fontSize: 'var(--font-size-xs)',
                    cursor: 'pointer'
                  }}
                >
                  Adjust Stock
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedItem(null)}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border-default)',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    fontSize: 'var(--font-size-xs)',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default InventoryPage;
