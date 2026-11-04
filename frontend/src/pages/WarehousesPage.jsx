import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Warehouse, MapPin, Users, Package, TrendingUp, RefreshCw, Search,
  Building2, Globe, Phone, Mail, Clock, AlertCircle
} from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as warehouseService from '../services/warehouseService';
import { normalizeList, normalizePagination } from '../utils/responseNormalizer';
import { formatNumber, formatDate } from '../utils/formatters';

export function WarehousesPage() {
  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const { page, limit, setPage, setLimit } = usePagination(1, 20);

  const { data: rawData, loading, refetch } = useApiQuery(
    warehouseService.getWarehouses,
    { page, limit, search },
    { immediate: true }
  );

  const warehouses = useMemo(() => normalizeList(rawData), [rawData]);
  const pagination = useMemo(() => normalizePagination(rawData, warehouses, page, limit), [rawData, warehouses, page, limit]);

  const stats = useMemo(() => {
    let activeWarehouses = 0;
    let totalCapacity = 0;
    let regions = new Set();

    warehouses.forEach(w => {
      if (w.status === 'active' || w.is_active !== false) activeWarehouses++;
      totalCapacity += Number(w.max_capacity || 0);
      if (w.country) regions.add(w.country);
    });

    return {
      total: pagination.total || warehouses.length,
      active: activeWarehouses,
      regions: regions.size,
      capacity: totalCapacity
    };
  }, [warehouses, pagination.total]);

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

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    hover: { y: -4, transition: { duration: 0.2 } }
  };

  return (
    <motion.div
      className="warehouses-page"
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
              FACILITIES MANAGEMENT
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
              Warehouse Network & Operations
            </h1>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                maxWidth: '600px'
              }}
            >
              Global warehouse locations, capacity metrics, operational staff, and facility management across all distribution centers
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
          { label: 'Total Warehouses', value: stats.total, icon: Warehouse, color: 'var(--color-info-text)' },
          { label: 'Active Facilities', value: stats.active, icon: Building2, color: 'var(--color-success-text)' },
          { label: 'Geographic Regions', value: stats.regions, icon: Globe, color: 'var(--color-accent-blue)' },
          { label: 'Total Capacity', value: formatNumber(stats.capacity), icon: Package, color: 'var(--color-warning-text)' }
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
              {typeof kpi.value === 'number' ? formatNumber(kpi.value) : kpi.value}
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
          justifyContent: 'space-between'
        }}
      >
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', maxWidth: '400px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search by warehouse name, code, or location..."
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

      {/* Warehouses Grid */}
      <motion.div
        variants={itemVariants}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 'var(--space-4)',
          flex: 1
        }}
      >
        <AnimatePresence>
          {loading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
              Loading warehouses...
            </div>
          ) : warehouses.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
              No warehouses found
            </div>
          ) : (
            warehouses.map((warehouse, idx) => (
              <motion.div
                key={warehouse.warehouse_id || idx}
                variants={cardVariants}
                whileHover="hover"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setSelectedWarehouse(warehouse)}
                style={{
                  padding: 'var(--space-4)',
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-xl)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                      {warehouse.warehouse_name || 'Warehouse'}
                    </h3>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {warehouse.warehouse_code || 'N/A'}
                    </span>
                  </div>
                  <span style={{
                    padding: '0.25rem 0.6rem',
                    backgroundColor: warehouse.status === 'active' || warehouse.is_active !== false ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: warehouse.status === 'active' || warehouse.is_active !== false ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '9px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {warehouse.status || 'Active'}
                  </span>
                </div>

                {/* Location */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <MapPin size={14} style={{ color: 'var(--color-accent-blue)', marginTop: '0.15rem', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    <span>{warehouse.address || 'N/A'}</span>
                    <span>{warehouse.city}, {warehouse.state} {warehouse.postal_code}</span>
                    <span>{warehouse.country}</span>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', backgroundColor: 'var(--color-border-subtle)' }} />

                {/* Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                  <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>Capacity</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {formatNumber(warehouse.max_capacity || 0)}
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>Staff</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {formatNumber(warehouse.staff_count || 0)}
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  <Phone size={12} />
                  <span>{warehouse.phone || 'N/A'}</span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedWarehouse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedWarehouse(null)}
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
                width: '400px',
                background: 'var(--color-bg-card)',
                borderLeft: '1px solid var(--color-border-default)',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                maxHeight: '100%'
              }}
            >
              <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
                  {selectedWarehouse.warehouse_name}
                </h3>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  Code: {selectedWarehouse.warehouse_code}
                </p>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {[
                  { label: 'Address', value: selectedWarehouse.address },
                  { label: 'City', value: selectedWarehouse.city },
                  { label: 'State', value: selectedWarehouse.state },
                  { label: 'Country', value: selectedWarehouse.country },
                  { label: 'Postal Code', value: selectedWarehouse.postal_code },
                  { label: 'Capacity', value: formatNumber(selectedWarehouse.max_capacity || 0) },
                  { label: 'Staff Count', value: formatNumber(selectedWarehouse.staff_count || 0) },
                  { label: 'Phone', value: selectedWarehouse.phone },
                  { label: 'Email', value: selectedWarehouse.email },
                  { label: 'Manager', value: selectedWarehouse.manager_name }
                ].map((row, idx) => (
                  row.value && (
                    <div key={idx} style={{
                      padding: 'var(--space-3)',
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--color-border-subtle)'
                    }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                        {row.label}
                      </span>
                      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                        {row.value}
                      </span>
                    </div>
                  )
                ))}
              </div>

              <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border-subtle)' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedWarehouse(null)}
                  style={{
                    width: '100%',
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

export default WarehousesPage;
