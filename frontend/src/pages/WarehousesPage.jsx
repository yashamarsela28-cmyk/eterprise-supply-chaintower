import React, { useState } from 'react';
import { Warehouse, Plus, RefreshCw, MapPin, Layers } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as warehouseService from '../services/warehouseService';
import { PageHeader } from '../components/common/PageHeader';
import { FilterBar } from '../components/common/FilterBar';
import { Table } from '../components/common/Table';
import { Pagination } from '../components/common/Pagination';
import { Select } from '../components/common/Select';
import { Button } from '../components/common/Button';
import { Drawer } from '../components/common/Drawer';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatNumber, formatDate } from '../utils/formatters';

export function WarehousesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  const { page, limit, setPage, setLimit } = usePagination(1, 20);

  const { data, loading, error, refetch } = useApiQuery(
    warehouseService.getWarehouses,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  const warehouses = data?.data || [];
  const pagination = data?.pagination || { total: warehouses.length, page, limit, totalPages: Math.ceil(warehouses.length / limit) || 1 };

  const columns = [
    {
      key: 'name',
      header: 'Warehouse Name',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.name}</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Code: {r.code || 'N/A'} • Type: {r.type || 'Distribution Center'}
          </div>
        </div>
      )
    },
    {
      key: 'location',
      header: 'Location / City',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <MapPin size={14} style={{ color: 'var(--color-text-muted)' }} />
          <span>{r.city ? `${r.city}, ${r.country || ''}` : r.address || 'Central'}</span>
        </div>
      )
    },
    {
      key: 'capacity',
      header: 'Storage Capacity',
      align: 'right',
      render: (r) => `${formatNumber(r.capacity || r.total_capacity || 50000)} units`
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status || (r.is_active !== false ? 'active' : 'inactive')} />
    }
  ];

  return (
    <div className="warehouses-page">
      <PageHeader
        title="Warehouses & Fulfillment Hubs"
        description="Physical node infrastructure, regional distribution hubs, and capacity tracking."
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
        searchPlaceholder="Search warehouse name, code or city..."
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
        data={warehouses}
        loading={loading}
        onRowClick={(w) => setSelectedWarehouse(w)}
        emptyTitle="No Warehouses Found"
      />

      <Pagination
        currentPage={page}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.total || warehouses.length}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      <Drawer
        isOpen={Boolean(selectedWarehouse)}
        onClose={() => setSelectedWarehouse(null)}
        title={selectedWarehouse?.name || 'Warehouse Details'}
        subtitle={`Code: ${selectedWarehouse?.code || 'N/A'}`}
      >
        {selectedWarehouse && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Location Address</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {selectedWarehouse.address || 'Not specified'}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                {selectedWarehouse.city}, {selectedWarehouse.state} {selectedWarehouse.postal_code} {selectedWarehouse.country}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Capacity</div>
                <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {formatNumber(selectedWarehouse.capacity || 50000)} units
                </div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Status</div>
                <StatusBadge status={selectedWarehouse.status || 'active'} />
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default WarehousesPage;
