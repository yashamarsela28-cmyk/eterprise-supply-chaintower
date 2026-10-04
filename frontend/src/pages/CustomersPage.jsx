import React, { useState } from 'react';
import { Users, Plus, RefreshCw, Mail, Phone, DollarSign } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as customerService from '../services/customerService';
import { PageHeader } from '../components/common/PageHeader';
import { FilterBar } from '../components/common/FilterBar';
import { Table } from '../components/common/Table';
import { Pagination } from '../components/common/Pagination';
import { Select } from '../components/common/Select';
import { Button } from '../components/common/Button';
import { Drawer } from '../components/common/Drawer';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatCurrency } from '../utils/formatters';

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const { page, limit, setPage, setLimit } = usePagination(1, 20);

  const { data, loading, error, refetch } = useApiQuery(
    customerService.getCustomers,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  const customers = data?.data || [];
  const pagination = data?.pagination || { total: customers.length, page, limit, totalPages: Math.ceil(customers.length / limit) || 1 };

  const columns = [
    {
      key: 'name',
      header: 'Customer Account',
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
      key: 'contact',
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
      key: 'credit_limit',
      header: 'Credit Limit',
      align: 'right',
      render: (r) => (
        <span style={{ fontWeight: 600 }}>
          {formatCurrency(r.credit_limit || 100000)}
        </span>
      )
    },
    {
      key: 'payment_terms',
      header: 'Payment Terms',
      render: (r) => r.payment_terms || 'Net 30'
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status || (r.is_active !== false ? 'active' : 'inactive')} />
    }
  ];

  return (
    <div className="customers-page">
      <PageHeader
        title="Customers & B2B Accounts Directory"
        description="Client master directory, commercial credit terms, and shipping profiles."
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
        searchPlaceholder="Search customer name, contact, code or email..."
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
        data={customers}
        loading={loading}
        onRowClick={(c) => setSelectedCustomer(c)}
        emptyTitle="No Customers Found"
      />

      <Pagination
        currentPage={page}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.total || customers.length}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      <Drawer
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer?.name || 'Customer Details'}
        subtitle={`Account Code: ${selectedCustomer?.code || 'N/A'}`}
      >
        {selectedCustomer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Primary Contact</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {selectedCustomer.contact_name || 'Account Manager'}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                {selectedCustomer.email} • {selectedCustomer.phone}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Credit Limit</div>
                <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {formatCurrency(selectedCustomer.credit_limit || 100000)}
                </div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Payment Terms</div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {selectedCustomer.payment_terms || 'Net 30'}
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default CustomersPage;
