import React, { useState, useMemo } from 'react';
import { Warehouse, RefreshCw, MapPin, Layers } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as warehouseService from '../services/warehouseService';
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

export function WarehousesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  const { page, limit, setPage, setLimit } = usePagination(1, 20);

  const { data: rawData, loading, error, refetch } = useApiQuery(
    warehouseService.getWarehouses,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  const warehouses = useMemo(() => normalizeList(rawData), [rawData]);
  const pagination = useMemo(() => normalizePagination(rawData, warehouses, page, limit), [rawData, warehouses, page, limit]);

  // Compute live summary stats
  const summaryStats = useMemo(() => {
    let totalCapacity = 0;
    let activeHubs = 0;

    warehouses.forEach((w) => {
      totalCapacity += Number(w.capacity || w.total_capacity || 50000);
      if (w.status === 'active' || w.is_active !== false) activeHubs += 1;
    });

    return {
      total: pagination.total || warehouses.length,
      active: activeHubs,
      totalCapacity
    };
  }, [warehouses, pagination.total]);

  const columns = [
    {
      key: 'name',
      header: 'Warehouse Facility',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
            Code: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>{r.code || 'N/A'}</span>
            {' • '}
            <span>{r.type || 'Distribution Center'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'location',
      header: 'Location / City',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
          <MapPin size={13} style={{ opacity: 0.7 }} />
          <span>{r.city ? `${r.city}, ${r.country || ''}` : r.address || 'Central'}</span>
        </div>
      )
    },
    {
      key: 'capacity',
      header: 'Storage Capacity',
      align: 'right',
      render: (r) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {formatNumber(r.capacity || r.total_capacity || 50000)} units
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
    <div className="warehouses-page animate-fade-in">
      <PageHeader
        eyebrow="INFRASTRUCTURE // PHYSICAL HUBS"
        title="Warehouses & Fulfillment Hubs"
        description="Physical node infrastructure, regional distribution centers, and aggregate storage capacities."
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={refetch}
          >
            Refresh Hubs
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
            Registered Facilities
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
            Active Operational Hubs
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
            Total Network Capacity
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summaryStats.totalCapacity)} units
          </div>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Filter by warehouse name, code or city..."
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
        emptyMessage="No facility records matched your filter criteria."
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
        subtitle={`Facility Code: ${selectedWarehouse?.code || 'N/A'}`}
      >
        {selectedWarehouse && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Facility Address</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '0.2rem', fontSize: 'var(--font-size-xs)' }}>
                {selectedWarehouse.address || 'Standard logistics center'}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                {selectedWarehouse.city}{selectedWarehouse.state ? `, ${selectedWarehouse.state}` : ''} {selectedWarehouse.postal_code} {selectedWarehouse.country}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Capacity</div>
                <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                  {formatNumber(selectedWarehouse.capacity || 50000)} units
                </div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Facility Status</div>
                <div style={{ marginTop: '0.2rem' }}>
                  <StatusBadge status={selectedWarehouse.status || 'active'} size="sm" />
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default WarehousesPage;
