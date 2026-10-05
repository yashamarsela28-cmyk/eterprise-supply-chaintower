import React, { useState, useMemo } from 'react';
import { Users, RefreshCw, Mail, Phone, DollarSign, CreditCard } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as customerService from '../services/customerService';
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

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const { page, limit, setPage, setLimit } = usePagination(1, 20);

  const { data: rawData, loading, error, refetch } = useApiQuery(
    customerService.getCustomers,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  const customers = useMemo(() => normalizeList(rawData), [rawData]);
  const pagination = useMemo(() => normalizePagination(rawData, customers, page, limit), [rawData, customers, page, limit]);

  const summaryStats = useMemo(() => {
    let activeAccounts = 0;
    let totalCredit = 0;

    customers.forEach((c) => {
      if (c.status === 'active' || c.is_active !== false) activeAccounts += 1;
      totalCredit += Number(c.credit_limit || 100000);
    });

    return {
      total: pagination.total || customers.length,
      active: activeAccounts,
      totalCredit
    };
  }, [customers, pagination.total]);

  const columns = [
    {
      key: 'name',
      header: 'Customer Account',
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
      key: 'contact',
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
      key: 'credit_limit',
      header: 'Credit Line',
      align: 'right',
      render: (r) => (
        <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
          {formatCurrency(r.credit_limit || 100000)}
        </span>
      )
    },
    {
      key: 'payment_terms',
      header: 'Terms',
      render: (r) => <span style={{ color: 'var(--color-text-secondary)' }}>{r.payment_terms || 'Net 30'}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status || (r.is_active !== false ? 'active' : 'inactive')} size="sm" />
    }
  ];

  return (
    <div className="customers-page animate-fade-in">
      <PageHeader
        eyebrow="COMMERCIAL // ACCOUNTS"
        title="Customers & B2B Accounts Directory"
        description="Enterprise client master directory, commercial credit facilities, and account health profiles."
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={refetch}
          >
            Refresh Accounts
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
            Enterprise Accounts
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
            Active Accounts
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
            Total Credit Extended
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(summaryStats.totalCredit)}
          </div>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Filter by customer name, contact, code or email..."
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
        emptyMessage="No customer records matched your filter criteria."
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
            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Primary Contact</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '0.2rem', fontSize: 'var(--font-size-xs)' }}>
                {selectedCustomer.contact_name || 'Account Representative'}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                {selectedCustomer.email} • {selectedCustomer.phone}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Credit Limit</div>
                <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                  {formatCurrency(selectedCustomer.credit_limit || 100000)}
                </div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Payment Terms</div>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '0.15rem' }}>
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
