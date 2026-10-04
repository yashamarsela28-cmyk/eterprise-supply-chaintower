import React, { useState } from 'react';
import { Building2, Plus, RefreshCw, Mail, Phone, Star } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as supplierService from '../services/supplierService';
import { PageHeader } from '../components/common/PageHeader';
import { FilterBar } from '../components/common/FilterBar';
import { Table } from '../components/common/Table';
import { Pagination } from '../components/common/Pagination';
import { Select } from '../components/common/Select';
import { Button } from '../components/common/Button';
import { Drawer } from '../components/common/Drawer';
import { StatusBadge } from '../components/common/StatusBadge';

export function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const { page, limit, setPage, setLimit } = usePagination(1, 20);

  const { data, loading, error, refetch } = useApiQuery(
    supplierService.getSuppliers,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  const suppliers = data?.data || [];
  const pagination = data?.pagination || { total: suppliers.length, page, limit, totalPages: Math.ceil(suppliers.length / limit) || 1 };

  const columns = [
    {
      key: 'name',
      header: 'Supplier Organization',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.name}</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Code: {r.code || 'N/A'} • Contact: {r.contact_name || 'Primary'}
          </div>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Contact Info',
      render: (r) => (
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          {r.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Mail size={12} /> {r.email}
            </div>
          )}
          {r.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '2px' }}>
              <Phone size={12} /> {r.phone}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'payment_terms',
      header: 'Payment Terms',
      render: (r) => r.payment_terms || 'Net 30'
    },
    {
      key: 'rating',
      header: 'Reliability Rating',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-warning)' }}>
          <Star size={14} fill="var(--color-warning)" />
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' }}>
            {r.rating || r.quality_rating || 4.8}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status || (r.is_active !== false ? 'active' : 'inactive')} />
    }
  ];

  return (
    <div className="suppliers-page">
      <PageHeader
        title="Suppliers & Vendor Directory"
        description="Vendor partner master profiles, quality ratings, lead-time commitments, and commercial terms."
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
        searchPlaceholder="Search supplier name, code, contact or email..."
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
        data={suppliers}
        loading={loading}
        onRowClick={(s) => setSelectedSupplier(s)}
        emptyTitle="No Suppliers Found"
      />

      <Pagination
        currentPage={page}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.total || suppliers.length}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      <Drawer
        isOpen={Boolean(selectedSupplier)}
        onClose={() => setSelectedSupplier(null)}
        title={selectedSupplier?.name || 'Supplier Details'}
        subtitle={`Code: ${selectedSupplier?.code || 'N/A'}`}
      >
        {selectedSupplier && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Primary Contact</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {selectedSupplier.contact_name || 'Accounts Representative'}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                {selectedSupplier.email} • {selectedSupplier.phone}
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Billing Address</div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>
                {selectedSupplier.address || 'Address on file'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Payment Terms</div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {selectedSupplier.payment_terms || 'Net 30'}
                </div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Status</div>
                <StatusBadge status={selectedSupplier.status || 'active'} />
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default SuppliersPage;
