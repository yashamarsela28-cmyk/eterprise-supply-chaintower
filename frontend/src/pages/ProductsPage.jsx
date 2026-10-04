import React, { useState } from 'react';
import { Package, Plus, RefreshCw, Tag, DollarSign } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as productService from '../services/productService';
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

  const { data, loading, error, refetch } = useApiQuery(
    productService.getProducts,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  const products = data?.data || [];
  const pagination = data?.pagination || { total: products.length, page, limit, totalPages: Math.ceil(products.length / limit) || 1 };

  const columns = [
    {
      key: 'name',
      header: 'Product Name / SKU',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.name}</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            SKU: {r.sku || 'N/A'} • Barcode: {r.barcode || '—'}
          </div>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (r) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-text-secondary)' }}>
          <Tag size={12} />
          {r.category || 'Standard'}
        </span>
      )
    },
    {
      key: 'unit_price',
      header: 'Unit Price',
      align: 'right',
      render: (r) => (
        <span style={{ fontWeight: 600 }}>
          {formatCurrency(r.unit_price || r.price || 0)}
        </span>
      )
    },
    {
      key: 'cost_price',
      header: 'Cost Price',
      align: 'right',
      render: (r) => formatCurrency(r.cost_price || 0)
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status || (r.is_active !== false ? 'active' : 'inactive')} />
    }
  ];

  return (
    <div className="products-page">
      <PageHeader
        title="Product Catalog & Master Data"
        description="Master SKU repository, unit valuations, category taxonomies, and item specs."
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={RefreshCw}
            onClick={refetch}
          >
            Refresh
          </Button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search product name, SKU or barcode..."
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
            <div style={{ padding: '1rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Description</div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>
                {selectedProduct.description || 'No description provided.'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Unit Price</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {formatCurrency(selectedProduct.unit_price || selectedProduct.price || 0)}
                </div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Cost Price</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                  {formatCurrency(selectedProduct.cost_price || 0)}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Category</div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {selectedProduct.category || 'Standard'}
                </div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Status</div>
                <StatusBadge status={selectedProduct.status || 'active'} />
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default ProductsPage;
