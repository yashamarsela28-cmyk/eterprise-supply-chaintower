import React, { useState, useEffect } from 'react';
import { Receipt, Plus, RefreshCw, DollarSign, Calendar, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as invoiceService from '../services/invoiceService';
import * as orderService from '../services/orderService';
import * as customerService from '../services/customerService';
import * as paymentService from '../services/paymentService';
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

export function InvoicesPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Create Invoice Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);

  const [newInvoice, setNewInvoice] = useState({
    customer_id: '',
    sales_order_id: '',
    subtotal: 1000.00,
    tax_amount: 80.00,
    discount_amount: 0.00,
    due_date: ''
  });

  // Record Payment Modal from Invoice Drawer
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payForm, setPayForm] = useState({
    amount: 1000.00,
    payment_method: 'ACH',
    payment_reference: '',
    notes: 'Settlement for invoice'
  });

  const { page, limit, setPage, setLimit } = usePagination(1, 20);

  const { data, loading, error, refetch } = useApiQuery(
    invoiceService.getInvoices,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  useEffect(() => {
    if (isCreateOpen) {
      Promise.all([
        customerService.getCustomers({ limit: 50 }).catch(() => ({ data: [] })),
        orderService.getOrders({ limit: 50 }).catch(() => ({ data: [] }))
      ]).then(([custRes, ordRes]) => {
        const custs = custRes?.data || [];
        const ords = ordRes?.data || [];
        setCustomers(custs);
        setOrders(ords);

        setNewInvoice((prev) => ({
          ...prev,
          customer_id: prev.customer_id || (custs[0]?.customer_id || custs[0]?.id || 1),
          sales_order_id: prev.sales_order_id || (ords[0]?.sales_order_id || ords[0]?.id || 1),
          due_date: prev.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
        }));
      });
    }
  }, [isCreateOpen]);

  const invoices = data?.data || [];
  const pagination = data?.pagination || { total: invoices.length, page, limit, totalPages: Math.ceil(invoices.length / limit) || 1 };

  // Status Action Handler
  const handleStatusChange = async (targetStatus) => {
    if (!selectedInvoice) return;
    const invId = selectedInvoice.invoice_id || selectedInvoice.id;
    setActionLoading(true);

    try {
      const res = await invoiceService.updateInvoiceStatus(invId, targetStatus);
      toast.success(`Invoice status updated to ${targetStatus}`);
      setSelectedInvoice(res?.data || { ...selectedInvoice, status: targetStatus });
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update invoice');
    } finally {
      setActionLoading(false);
    }
  };

  // Create Invoice Submission
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newInvoice.customer_id) {
      toast.error('Please select a customer');
      return;
    }

    setCreateSubmitting(true);
    try {
      const subtotal = Number(newInvoice.subtotal) || 0;
      const tax = Number(newInvoice.tax_amount) || 0;
      const discount = Number(newInvoice.discount_amount) || 0;
      const total = Math.max(0, subtotal + tax - discount);

      const payload = {
        customer_id: Number(newInvoice.customer_id),
        sales_order_id: newInvoice.sales_order_id ? Number(newInvoice.sales_order_id) : undefined,
        subtotal,
        tax_amount: tax,
        discount_amount: discount,
        total_amount: total,
        due_date: newInvoice.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
      };

      const res = await invoiceService.createInvoice(payload);
      toast.success(`Invoice #${res?.data?.invoice_number || ''} generated successfully`);
      setIsCreateOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create invoice');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Record Payment against Selected Invoice
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    const invId = selectedInvoice.invoice_id || selectedInvoice.id;

    setPaySubmitting(true);
    try {
      const payload = {
        invoice_id: Number(invId),
        amount: Number(payForm.amount) || 100,
        payment_method: payForm.payment_method || 'ACH',
        payment_reference: payForm.payment_reference || `PAY-${Date.now().toString().slice(-6)}`,
        notes: payForm.notes || 'Commercial settlement'
      };

      await paymentService.recordPayment(payload);
      toast.success('Payment recorded successfully. Invoice balance updated.');
      setIsPayModalOpen(false);

      // Refresh invoice
      const updated = await invoiceService.getInvoiceById(invId);
      if (updated?.data) setSelectedInvoice(updated.data);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to record payment');
    } finally {
      setPaySubmitting(false);
    }
  };

  const openPaymentModal = () => {
    const total = Number(selectedInvoice?.total_amount) || 0;
    const paid = Number(selectedInvoice?.paid_amount) || 0;
    const remaining = Math.max(0, total - paid);
    setPayForm({
      amount: remaining || total || 100,
      payment_method: 'ACH',
      payment_reference: `PAY-${Date.now().toString().slice(-6)}`,
      notes: `Settlement for invoice ${selectedInvoice?.invoice_number || ''}`
    });
    setIsPayModalOpen(true);
  };

  const columns = [
    {
      key: 'invoice_number',
      header: 'Invoice Number',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {r.invoice_number || `INV-${r.invoice_id || r.id}`}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Issued: {formatDate(r.invoice_date || r.created_at)}
          </div>
        </div>
      )
    },
    {
      key: 'customer',
      header: 'Billed Customer',
      render: (r) => r.customers?.name || r.customers?.customer_name || r.customer_name || `Customer #${r.customer_id}`
    },
    {
      key: 'due_date',
      header: 'Due Date',
      render: (r) => formatDate(r.due_date)
    },
    {
      key: 'total_amount',
      header: 'Invoice Total',
      align: 'right',
      render: (r) => (
        <span style={{ fontWeight: 600 }}>
          {formatCurrency(r.total_amount || 0)}
        </span>
      )
    },
    {
      key: 'paid_amount',
      header: 'Paid Amount',
      align: 'right',
      render: (r) => (
        <span style={{ color: (r.paid_amount || 0) >= (r.total_amount || 1) ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
          {formatCurrency(r.paid_amount || 0)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Payment Status',
      render: (r) => <StatusBadge status={r.status || 'DRAFT'} />
    }
  ];

  const currentStatus = (selectedInvoice?.status || '').toUpperCase();

  return (
    <div className="invoices-page">
      <PageHeader
        title="Invoices & Commercial Billing"
        description="Receivables billing, automated invoice generation, and customer payment terms."
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
              onClick={() => setIsCreateOpen(true)}
            >
              Generate Invoice
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
        searchPlaceholder="Search invoice number or customer..."
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
            { value: 'DRAFT', label: 'Draft' },
            { value: 'ISSUED', label: 'Issued' },
            { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
            { value: 'PAID', label: 'Paid' },
            { value: 'OVERDUE', label: 'Overdue' },
            { value: 'CANCELLED', label: 'Cancelled' }
          ]}
        />
      </FilterBar>

      <Table
        columns={columns}
        data={invoices}
        loading={loading}
        onRowClick={(inv) => setSelectedInvoice(inv)}
        emptyTitle="No Invoices Found"
      />

      <Pagination
        currentPage={page}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.total || invoices.length}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      {/* Invoice Drawer */}
      <Drawer
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        title={selectedInvoice?.invoice_number || `Invoice #${selectedInvoice?.invoice_id || selectedInvoice?.id}`}
        subtitle={`Customer: ${selectedInvoice?.customers?.name || selectedInvoice?.customers?.customer_name || 'Client'}`}
      >
        {selectedInvoice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Status</span>
                <StatusBadge status={selectedInvoice.status || 'DRAFT'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  <strong>Subtotal:</strong> {formatCurrency(selectedInvoice.subtotal || 0)}
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  <strong>Tax:</strong> {formatCurrency(selectedInvoice.tax_amount || 0)}
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  <strong>Total:</strong> {formatCurrency(selectedInvoice.total_amount || 0)}
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-success)', fontWeight: 600 }}>
                  <strong>Paid:</strong> {formatCurrency(selectedInvoice.paid_amount || 0)}
                </div>
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                <strong>Due Date:</strong> {formatDate(selectedInvoice.due_date)}
              </div>
            </div>

            {/* Billing Operational Actions */}
            <div style={{ padding: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                Billing Operations
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {currentStatus === 'DRAFT' && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={CheckCircle}
                      loading={actionLoading}
                      onClick={() => handleStatusChange('ISSUED')}
                    >
                      Issue Invoice
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={XCircle}
                      loading={actionLoading}
                      onClick={() => handleStatusChange('CANCELLED')}
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(currentStatus) && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      icon={CreditCard}
                      onClick={openPaymentModal}
                    >
                      Record Payment
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={XCircle}
                      loading={actionLoading}
                      onClick={() => handleStatusChange('CANCELLED')}
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {currentStatus === 'PAID' && (
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)', fontWeight: 600 }}>
                    ✓ Invoice is fully settled and paid in full.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => !createSubmitting && setIsCreateOpen(false)}
        title="Generate Customer Invoice"
        subtitle="Create commercial billing invoice against sales fulfillment."
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              disabled={createSubmitting}
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={createSubmitting}
              onClick={handleCreateSubmit}
            >
              Generate Invoice
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Select
            label="Billed Customer"
            required
            value={newInvoice.customer_id}
            onChange={(e) => setNewInvoice({ ...newInvoice, customer_id: e.target.value })}
            options={customers.map((c) => ({
              value: c.customer_id || c.id,
              label: `${c.name} (${c.customer_code || 'Account'})`
            }))}
          />

          <Select
            label="Sales Order (Optional Link)"
            value={newInvoice.sales_order_id}
            onChange={(e) => setNewInvoice({ ...newInvoice, sales_order_id: e.target.value })}
            options={[
              { value: '', label: 'None (Direct Billing)' },
              ...orders.map((o) => ({
                value: o.sales_order_id || o.id,
                label: `${o.order_number || `ORD-${o.sales_order_id || o.id}`}`
              }))
            ]}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Input
              label="Subtotal ($)"
              type="number"
              step="0.01"
              required
              value={newInvoice.subtotal}
              onChange={(e) => setNewInvoice({ ...newInvoice, subtotal: e.target.value })}
            />

            <Input
              label="Tax Amount ($)"
              type="number"
              step="0.01"
              value={newInvoice.tax_amount}
              onChange={(e) => setNewInvoice({ ...newInvoice, tax_amount: e.target.value })}
            />
          </div>

          <Input
            label="Payment Due Date"
            type="date"
            required
            value={newInvoice.due_date}
            onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
          />
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => !paySubmitting && setIsPayModalOpen(false)}
        title="Record Invoice Settlement"
        subtitle={`Invoice: ${selectedInvoice?.invoice_number || ''}`}
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              disabled={paySubmitting}
              onClick={() => setIsPayModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={paySubmitting}
              onClick={handlePaymentSubmit}
            >
              Record Payment
            </Button>
          </>
        }
      >
        <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input
            label="Payment Amount ($)"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={payForm.amount}
            onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
          />

          <Select
            label="Payment Method"
            required
            value={payForm.payment_method}
            onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
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
            value={payForm.payment_reference}
            onChange={(e) => setPayForm({ ...payForm, payment_reference: e.target.value })}
          />

          <Input
            label="Notes"
            value={payForm.notes}
            onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}

export default InvoicesPage;
