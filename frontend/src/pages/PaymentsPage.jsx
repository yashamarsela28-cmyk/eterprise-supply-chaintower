import React, { useState, useEffect, useMemo } from 'react';
import { CreditCard, Plus, RefreshCw, DollarSign, Calendar, CheckCircle } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as paymentService from '../services/paymentService';
import * as invoiceService from '../services/invoiceService';
import { normalizeList, normalizePagination } from '../utils/responseNormalizer';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import { FilterBar } from '../components/common/FilterBar';
import { Table } from '../components/common/Table';
import { Pagination } from '../components/common/Pagination';
import { Select } from '../components/common/Select';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Drawer } from '../components/common/Drawer';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatCurrency, formatDate, formatNumber } from '../utils/formatters';

export function PaymentsPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Record Payment Modal
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [recordSubmitting, setCreateSubmitting] = useState(false);
  const [invoices, setInvoices] = useState([]);

  const [newPayment, setNewPayment] = useState({
    invoice_id: '',
    amount: 500.00,
    payment_method: 'ACH',
    payment_reference: '',
    notes: 'Invoice installment payment'
  });

  const { page, limit, setPage, setLimit } = usePagination(1, 20);

  const { data: rawData, loading, error, refetch } = useApiQuery(
    paymentService.getPayments,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  const payments = useMemo(() => normalizeList(rawData), [rawData]);
  const pagination = useMemo(() => normalizePagination(rawData, payments, page, limit), [rawData, payments, page, limit]);

  // Compute live summary stats
  const summaryStats = useMemo(() => {
    let totalCashSettled = 0;
    let completedCount = 0;

    payments.forEach((p) => {
      const st = (p.status || 'COMPLETED').toUpperCase();
      if (st === 'COMPLETED' || st === 'SUCCESS') {
        completedCount += 1;
        totalCashSettled += Number(p.amount || 0);
      }
    });

    return {
      total: pagination.total || payments.length,
      completedCount,
      totalCashSettled
    };
  }, [payments, pagination.total]);

  useEffect(() => {
    if (isRecordOpen) {
      invoiceService.getInvoices({ limit: 50 }).then((res) => {
        const invs = normalizeList(res);
        setInvoices(invs);
        setNewPayment((prev) => ({
          ...prev,
          invoice_id: prev.invoice_id || (invs[0]?.invoice_id || invs[0]?.id || 1),
          payment_reference: prev.payment_reference || `PAY-${Date.now().toString().slice(-6)}`
        }));
      }).catch(() => {});
    }
  }, [isRecordOpen]);

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!newPayment.invoice_id) {
      toast.error('Please select an invoice');
      return;
    }

    setCreateSubmitting(true);
    try {
      const payload = {
        invoice_id: Number(newPayment.invoice_id),
        amount: Number(newPayment.amount) || 100,
        payment_method: newPayment.payment_method || 'ACH',
        payment_reference: newPayment.payment_reference || `PAY-${Date.now()}`,
        notes: newPayment.notes || 'Settlement'
      };

      const res = await paymentService.recordPayment(payload);
      toast.success(`Payment #${res?.data?.payment_reference || ''} recorded successfully`);
      setIsRecordOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to record payment');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'payment_reference',
      header: 'Settlement Reference',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {r.payment_reference || `PAY-${r.payment_id || r.id}`}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
            Settled: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>{formatDate(r.payment_date || r.created_at)}</span>
          </div>
        </div>
      )
    },
    {
      key: 'invoice_number',
      header: 'Linked Invoice Ref',
      render: (r) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          {r.invoices?.invoice_number || r.invoice_number || `INV #${r.invoice_id}`}
        </span>
      )
    },
    {
      key: 'customer',
      header: 'Customer Account',
      render: (r) => (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-primary)' }}>
          {r.customer_name || r.invoices?.customers?.customer_name || r.invoices?.customers?.name || 'Enterprise Account'}
        </span>
      )
    },
    {
      key: 'payment_method',
      header: 'Method',
      render: (r) => (
        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
          {r.payment_method || 'ACH'}
        </span>
      )
    },
    {
      key: 'amount',
      header: 'Gross Amount',
      align: 'right',
      render: (r) => (
        <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-success-text)' }}>
          {formatCurrency(r.amount || 0)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Posting State',
      render: (r) => <StatusBadge status={r.status || 'COMPLETED'} size="sm" />
    }
  ];

  return (
    <div className="payments-page animate-fade-in">
      <PageHeader
        eyebrow="TREASURY // CASH LEDGER"
        title="Payments & Cash Settlements"
        description="Inbound transaction receipts, bank clearance settlements, and cash reconciliation logs."
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={refetch}
            >
              Refresh Ledger
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsRecordOpen(true)}
            >
              Record Payment
            </Button>
          </div>
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
            Posted Transactions
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
            Settled Transfers
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-success-text)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summaryStats.completedCount)}
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
            Total Cash Inflow
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-success-text)', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(summaryStats.totalCashSettled)}
          </div>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Filter by reference, customer or invoice..."
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
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'FAILED', label: 'Failed' },
            { value: 'REFUNDED', label: 'Refunded' }
          ]}
        />
      </FilterBar>

      <Table
        columns={columns}
        data={payments}
        loading={loading}
        onRowClick={(p) => setSelectedPayment(p)}
        emptyTitle="No Payments Found"
        emptyMessage="No treasury payment records matched your filter criteria."
      />

      <Pagination
        currentPage={page}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.total || payments.length}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      {/* Payment Details Drawer */}
      <Drawer
        isOpen={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        title={selectedPayment?.payment_reference || `Payment #${selectedPayment?.payment_id || selectedPayment?.id}`}
        subtitle={`Settled Amount: ${formatCurrency(selectedPayment?.amount || 0)}`}
      >
        {selectedPayment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Posting Status</span>
                <StatusBadge status={selectedPayment.status || 'COMPLETED'} size="sm" />
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Linked Invoice:</span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{selectedPayment.invoices?.invoice_number || selectedPayment.invoice_number || `Invoice #${selectedPayment.invoice_id}`}</strong>
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                <span>Payment Method:</span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{selectedPayment.payment_method || 'ACH'}</strong>
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '0.4rem', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.4rem' }}>
                <strong style={{ color: 'var(--color-text-muted)' }}>Recorded Date:</strong> {formatDate(selectedPayment.payment_date || selectedPayment.created_at)}
              </div>
              {selectedPayment.notes && (
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '0.3rem' }}>
                  <strong style={{ color: 'var(--color-text-muted)' }}>Notes:</strong> {selectedPayment.notes}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordOpen}
        onClose={() => !recordSubmitting && setIsRecordOpen(false)}
        title="Record Cash Settlement"
        subtitle="Post an incoming customer payment against an invoice."
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              disabled={recordSubmitting}
              onClick={() => setIsRecordOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={recordSubmitting}
              onClick={handleRecordSubmit}
            >
              Post Payment
            </Button>
          </>
        }
      >
        <form onSubmit={handleRecordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Select
            label="Linked Invoice"
            required
            value={newPayment.invoice_id}
            onChange={(e) => setNewPayment({ ...newPayment, invoice_id: e.target.value })}
            options={invoices.map((inv) => ({
              value: inv.invoice_id || inv.id,
              label: `${inv.invoice_number || `INV-${inv.invoice_id || inv.id}`} (${formatCurrency(inv.total_amount || 0)} - ${inv.status})`
            }))}
          />

          <Input
            label="Payment Amount ($)"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={newPayment.amount}
            onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
          />

          <Select
            label="Payment Method"
            required
            value={newPayment.payment_method}
            onChange={(e) => setNewPayment({ ...newPayment, payment_method: e.target.value })}
            options={[
              { value: 'ACH', label: 'ACH / Wire Transfer' },
              { value: 'CREDIT_CARD', label: 'Credit Card' },
              { value: 'CHECK', label: 'Commercial Check' },
              { value: 'LETTER_OF_CREDIT', label: 'Letter of Credit' }
            ]}
          />

          <Input
            label="Payment Reference"
            required
            value={newPayment.payment_reference}
            onChange={(e) => setNewPayment({ ...newPayment, payment_reference: e.target.value })}
          />

          <Input
            label="Notes"
            value={newPayment.notes}
            onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}

export default PaymentsPage;
