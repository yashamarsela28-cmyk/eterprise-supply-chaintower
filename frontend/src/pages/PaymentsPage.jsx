import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, RefreshCw, DollarSign, Calendar, CheckCircle } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as paymentService from '../services/paymentService';
import * as invoiceService from '../services/invoiceService';
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
import { formatCurrency, formatDate } from '../utils/formatters';

export function PaymentsPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Record Payment Modal
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [recordSubmitting, setRecordSubmitting] = useState(false);
  const [invoices, setInvoices] = useState([]);

  const [newPayment, setNewPayment] = useState({
    invoice_id: '',
    amount: 500.00,
    payment_method: 'ACH',
    payment_reference: '',
    notes: 'Invoice installment payment'
  });

  const { page, limit, setPage, setLimit } = usePagination(1, 20);

  const { data, loading, error, refetch } = useApiQuery(
    paymentService.getPayments,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  useEffect(() => {
    if (isRecordOpen) {
      invoiceService.getInvoices({ limit: 50 }).then((res) => {
        const invs = res?.data || [];
        setInvoices(invs);
        setNewPayment((prev) => ({
          ...prev,
          invoice_id: prev.invoice_id || (invs[0]?.invoice_id || invs[0]?.id || 1),
          payment_reference: prev.payment_reference || `PAY-${Date.now().toString().slice(-6)}`
        }));
      }).catch(() => {});
    }
  }, [isRecordOpen]);

  const payments = data?.data || [];
  const pagination = data?.pagination || { total: payments.length, page, limit, totalPages: Math.ceil(payments.length / limit) || 1 };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!newPayment.invoice_id) {
      toast.error('Please select an invoice');
      return;
    }

    setRecordSubmitting(true);
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
      setRecordSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'payment_reference',
      header: 'Payment Reference',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {r.payment_reference || `PAY-${r.payment_id || r.id}`}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Date: {formatDate(r.payment_date || r.created_at)}
          </div>
        </div>
      )
    },
    {
      key: 'invoice_number',
      header: 'Linked Invoice',
      render: (r) => r.invoices?.invoice_number || r.invoice_number || `INV #${r.invoice_id}`
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (r) => r.customer_name || r.invoices?.customers?.customer_name || 'Enterprise Client'
    },
    {
      key: 'payment_method',
      header: 'Method',
      render: (r) => r.payment_method || 'ACH'
    },
    {
      key: 'amount',
      header: 'Amount Paid',
      align: 'right',
      render: (r) => (
        <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>
          {formatCurrency(r.amount || 0)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status || 'COMPLETED'} />
    }
  ];

  return (
    <div className="payments-page">
      <PageHeader
        title="Payments & Cash Ledger"
        description="Inbound transaction receipts, bank settlements, and reconciliation logs."
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={refetch}
            >
              Refresh
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

      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search payment reference or invoice..."
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
        subtitle={`Amount: ${formatCurrency(selectedPayment?.amount || 0)}`}
      >
        {selectedPayment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Status</span>
                <StatusBadge status={selectedPayment.status || 'COMPLETED'} />
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                <strong>Linked Invoice:</strong> {selectedPayment.invoices?.invoice_number || selectedPayment.invoice_number || `Invoice #${selectedPayment.invoice_id}`}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                <strong>Payment Method:</strong> {selectedPayment.payment_method || 'ACH'}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                <strong>Recorded Date:</strong> {formatDate(selectedPayment.payment_date || selectedPayment.created_at)}
              </div>
              {selectedPayment.notes && (
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  <strong>Notes:</strong> {selectedPayment.notes}
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
