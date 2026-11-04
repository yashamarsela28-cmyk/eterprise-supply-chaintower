import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, RefreshCw, Search, Tag, DollarSign, Layers, TrendingUp, BarChart3
} from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as productService from '../services/productService';
import { normalizeList, normalizePagination } from '../utils/responseNormalizer';
import { formatCurrency, formatNumber } from '../utils/formatters';

export function ProductsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { page, limit, setPage, setLimit } = usePagination(1, 24);

  const { data: rawData, loading, refetch } = useApiQuery(
    productService.getProducts,
    { page, limit, search, category: categoryFilter },
    { immediate: true }
  );

  const products = useMemo(() => normalizeList(rawData), [rawData]);
  const pagination = useMemo(() => normalizePagination(rawData, products, page, limit), [rawData, products, page, limit]);

  const stats = useMemo(() => {
    let active = 0, totalValue = 0, categories = new Set();
    products.forEach(p => {
      if (p.status === 'active' || p.is_active !== false) active++;
      totalValue += Number(p.unit_price || 0);
      if (p.category) categories.add(p.category);
    });
    return {
      total: pagination.total || products.length,
      active,
      categories: categories.size,
      avgPrice: products.length > 0 ? totalValue / products.length : 0
    };
  }, [products, pagination.total]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    hover: { y: -6, transition: { duration: 0.2 } }
  };

  return (
    <motion.div
      className="products-page"
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
              MASTER DATA & CATALOG
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
              Product Master Catalog
            </h1>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                maxWidth: '600px'
              }}
            >
              Comprehensive SKU repository with pricing, categories, technical specifications, and inventory valuations
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
          { label: 'Total SKUs', value: stats.total, icon: Package, color: 'var(--color-info-text)' },
          { label: 'Active Products', value: stats.active, icon: TrendingUp, color: 'var(--color-success-text)' },
          { label: 'Categories', value: stats.categories, icon: Layers, color: 'var(--color-accent-blue)' },
          { label: 'Avg Unit Price', value: formatCurrency(stats.avgPrice), icon: DollarSign, color: 'var(--color-warning-text)' }
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
              gap: 'var(--space-2)'
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
          justifyContent: 'space-between',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-2)', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, SKU, or barcode..."
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
            gap: '0.5rem'
          }}
        >
          <RefreshCw size={14} />
          Refresh
        </motion.button>
      </motion.div>

      {/* Products Grid */}
      <motion.div
        variants={itemVariants}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--space-4)',
          flex: 1
        }}
      >
        <AnimatePresence>
          {loading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
              No products found
            </div>
          ) : (
            products.map((product, idx) => (
              <motion.div
                key={product.product_id || idx}
                variants={cardVariants}
                whileHover="hover"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setSelectedProduct(product)}
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
                    <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem', lineHeight: 1.2 }}>
                      {product.name}
                    </h3>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {product.sku}
                    </span>
                  </div>
                  <span style={{
                    padding: '0.25rem 0.6rem',
                    backgroundColor: product.status === 'active' || product.is_active !== false ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: product.status === 'active' || product.is_active !== false ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '9px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap'
                  }}>
                    {product.status === 'active' || product.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {product.category && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Tag size={12} style={{ color: 'var(--color-accent-blue)', opacity: 0.7 }} />
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      {product.category}
                    </span>
                  </div>
                )}

                <div style={{ height: '1px', backgroundColor: 'var(--color-border-subtle)' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                  <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>Unit Price</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-accent-blue)', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(product.unit_price || product.price || 0)}
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>Cost Price</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(product.cost_price || 0)}
                    </div>
                  </div>
                </div>

                {product.description && (
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>
                    {product.description}
                  </p>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* Pagination */}
      {!loading && products.length > 0 && (
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
            {formatNumber(pagination.total || products.length)}
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
                fontWeight: 600,
                fontSize: 'var(--font-size-xs)'
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
                fontWeight: 600,
                fontSize: 'var(--font-size-xs)'
              }}
            >
              Next
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProduct(null)}
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
                  {selectedProduct.name}
                </h3>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  SKU: {selectedProduct.sku}
                </p>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {selectedProduct.description && (
                  <div style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border-subtle)'
                  }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                      Description
                    </span>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      {selectedProduct.description}
                    </p>
                  </div>
                )}

                {[
                  { label: 'Category', value: selectedProduct.category },
                  { label: 'Unit Price', value: formatCurrency(selectedProduct.unit_price || 0) },
                  { label: 'Cost Price', value: formatCurrency(selectedProduct.cost_price || 0) },
                  { label: 'Status', value: selectedProduct.status || 'Active' },
                  { label: 'Barcode', value: selectedProduct.barcode }
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
                  onClick={() => setSelectedProduct(null)}
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

export default ProductsPage;
