import React, { useState, useMemo } from 'react';
import { Building2, RefreshCw, Mail, Phone, Star } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as supplierService from '../services/supplierService';
import { normalizeList, normalizePagination } from '../utils/responseNormalizer';
import { PageHeader } from '../components/common/PageHeader';
import { FilterBar } from '../components/common/FilterBar';
import { Table } from '../components/common/Table';
import { Pagination } from '../components/common/Pagination';
import { Select } from '../components/common/Select';
import { Button } from '../components/common/Button';
import { Drawer } from '../components/common/Drawer';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatNumber } from '../utils/formatters';

export function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const { page, limit, setPage, setLimit } = usePagination(1, 20);

  const { data: rawData, loading, error, refetch } = useApiQuery(
    supplierService.getSuppliers,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  const suppliers = useMemo(() => normalizeList(rawData), [rawData]);
  const pagination = useMemo(() => normalizePagination(rawData, suppliers, page, limit), [rawData, suppliers, page, limit]);

  const summaryStats = useMemo(() => {
    let activeVendors = 0;
    let totalRating = 0;

    suppliers.forEach((s) => {
      if (s.status === 'active' || s.is_active !== false) activeVendors += 1;
      totalRating += Number(s.rating || s.quality_rating || 4.8);
    });

    return {
      total: pagination.total || suppliers.length,
      active: activeVendors,
      avgRating: suppliers.length > 0 ? (totalRating / suppliers.length).toFixed(1) : '5.0'
    };
  }, [suppliers, pagination.total]);

  const columns = [
    {
      key: 'name',
      header: 'Supplier Organization',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
            Code: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>{r.code || 'N/A'}</span>
            {' • '}
            <span>Contact: {r.contact_name || 'Primary'}</span>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Mail size={11} style={{ opacity: 0.7 }} /> {r.email}
            </div>
          )}
          {r.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
              <Phone size={11} style={{ opacity: 0.7 }} /> {r.phone}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'payment_terms',
      header: 'Payment Terms',
      render: (r) => <span style={{ color: 'var(--color-text-secondary)' }}>{r.payment_terms || 'Net 30'}</span>
    },
    {
      key: 'rating',
      header: 'Reliability Rating',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-warning-text)' }}>
          <Star size={13} fill="currentColor" />
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)' }}>
            {r.rating || r.quality_rating || 4.8}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status || (r.is_active !== false ? 'active' : 'inactive')} size="sm" />
    }
  ];

  return (
    <div className="suppliers-page animate-fade-in">
      <PageHeader
        eyebrow="PROCUREMENT // VENDORS"
        title="Suppliers & Vendor Directory"
        description="Vendor partner master profiles, reliability ratings, lead-time commitments, and commercial payment terms."
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={refetch}
          >
            Refresh Directory
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
            Registered Suppliers
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
            Active Vendor Accounts
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
            Average Reliability Score
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {summaryStats.avgRating} / 5.0
          </div>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Filter by supplier name, code, contact or email..."
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
        emptyMessage="No supplier records matched your filter criteria."
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
        subtitle={`Supplier Code: ${selectedSupplier?.code || 'N/A'}`}
      >
        {selectedSupplier && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Primary Contact</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '0.2rem', fontSize: 'var(--font-size-xs)' }}>
                {selectedSupplier.contact_name || 'Accounts Representative'}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                {selectedSupplier.email} • {selectedSupplier.phone}
              </div>
            </div>

            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Billing Address</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-primary)', marginTop: '0.2rem' }}>
                {selectedSupplier.address || 'Address on record'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Payment Terms</div>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '0.15rem' }}>
                  {selectedSupplier.payment_terms || 'Net 30'}
                </div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Status</div>
                <div style={{ marginTop: '0.2rem' }}>
                  <StatusBadge status={selectedSupplier.status || 'active'} size="sm" />
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default SuppliersPage;
