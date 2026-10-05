import React, { useState, useMemo } from 'react';
import { Package, RefreshCw, Tag, DollarSign, Layers } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as productService from '../services/productService';
import { normalizeList, normalizePagination } from '../utils/responseNormalizer';
import { PageHeader } from '../components/common/PageHeader';
import { FilterBar } from '../components/common/FilterBar';
import { Table } from '../components/common/Table';
import { Pagination } from '../components/common/Pagination';
import { Select } from '../components/common/Select';
import { Button } from '../components/common/Button';
import { Drawer } from '../components/common/Drawer';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatCurrency, formatNumber } from '../utils/formatters';

export function ProductsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { page, limit, setPage, setLimit } = usePagination(1, 20);

  const { data: rawData, loading, error, refetch } = useApiQuery(
    productService.getProducts,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  const products = useMemo(() => normalizeList(rawData), [rawData]);
  const pagination = useMemo(() => normalizePagination(rawData, products, page, limit), [rawData, products, page, limit]);

  // Compute live summary stats
  const summaryStats = useMemo(() => {
    let activeCount = 0;
    let totalValuation = 0;
    const categories = new Set();

    products.forEach((p) => {
      if (p.status === 'active' || p.is_active !== false) activeCount += 1;
      if (p.category) categories.add(p.category);
      totalValuation += Number(p.unit_price || p.price || 0);
    });

    return {
      total: pagination.total || products.length,
      active: activeCount,
      categoriesCount: categories.size || 1,
      avgPrice: products.length > 0 ? totalValuation / products.length : 0
    };
  }, [products, pagination.total]);

  const columns = [
    {
      key: 'name',
      header: 'Product Name / SKU',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
              {r.sku || 'N/A'}
            </span>
            {r.barcode && <span> • Barcode: {r.barcode}</span>}
          </div>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (r) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
          <Tag size={11} style={{ opacity: 0.7 }} />
          {r.category || 'Standard'}
        </span>
      )
    },
    {
      key: 'unit_price',
      header: 'Unit Price',
      align: 'right',
      render: (r) => (
        <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
          {formatCurrency(r.unit_price || r.price || 0)}
        </span>
      )
    },
    {
      key: 'cost_price',
      header: 'Cost Price',
      align: 'right',
      render: (r) => (
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
          {formatCurrency(r.cost_price || 0)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status || (r.is_active !== false ? 'active' : 'inactive')} size="sm" />
    }
  ];

  return (
    <div className="products-page animate-fade-in">
      <PageHeader
        eyebrow="MASTER DATA // CATALOG"
        title="Product Catalog & Master Data"
        description="Master SKU repository, unit valuations, category taxonomies, and item technical specifications."
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={refetch}
          >
            Refresh Data
          </Button>
        }
      />

      {/* KPI Summary Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)'
        }}
      >
        <div
          style={{
            padding: '0.85rem 1.15rem',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Catalog Products
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summaryStats.total)}
          </div>
        </div>

        <div
          style={{
            padding: '0.85rem 1.15rem',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active SKUs
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-success-text)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summaryStats.active)}
          </div>
        </div>

        <div
          style={{
            padding: '0.85rem 1.15rem',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Distinct Categories
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summaryStats.categoriesCount)}
          </div>
        </div>

        <div
          style={{
            padding: '0.85rem 1.15rem',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Average Unit Price
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(summaryStats.avgPrice)}
          </div>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Filter by product name, SKU or barcode..."
        hasActiveFilters={Boolean(search || statusFilter)}
        onReset={() => {
          setSearch('');
          setStatusFilter('');
          setPage(1);
        }}
      >
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ]}
        />
      </FilterBar>

      <Table
        columns={columns}
        data={products}
        loading={loading}
        onRowClick={(p) => setSelectedProduct(p)}
        emptyTitle="No Products Found"
        emptyMessage="No product items matched your filter criteria."
      />

      <Pagination
        currentPage={page}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.total || products.length}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      <Drawer
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name || 'Product Details'}
        subtitle={`SKU: ${selectedProduct?.sku || 'N/A'}`}
      >
        {selectedProduct && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Description</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-primary)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                {selectedProduct.description || 'Standard enterprise catalog product specification.'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Unit Price</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                  {formatCurrency(selectedProduct.unit_price || selectedProduct.price || 0)}
                </div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Cost Price</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                  {formatCurrency(selectedProduct.cost_price || 0)}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Category</div>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '0.15rem' }}>
                  {selectedProduct.category || 'Standard'}
                </div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Catalog Status</div>
                <div style={{ marginTop: '0.2rem' }}>
                  <StatusBadge status={selectedProduct.status || 'active'} size="sm" />
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default ProductsPage;
