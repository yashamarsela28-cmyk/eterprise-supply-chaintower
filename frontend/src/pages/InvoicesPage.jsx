import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Search, X, Plus, Receipt, CircleDollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import * as invoiceService from '../services/invoiceService';
import * as paymentService from '../services/paymentService';
import * as orderService from '../services/orderService';
import { normalizeList } from '../utils/responseNormalizer';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import { Panel, PanelBody, Stat, StatGrid, Meter } from '../components/common/Panel';
import { StatusBadge } from '../components/common/StatusBadge';
import { Drawer } from '../components/common/Drawer';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { formatCurrency, formatDate, formatNumber, formatPercentage } from '../utils/formatters';
import { pageStagger, riseIn } from '../utils/motion';

export function InvoicesPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [orders, setOrders] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ sales_order_id: '', due_date: '', discount_amount: 0 });
  const [payOpen, setPayOpen] = useState(false);
  const [pay, setPay] = useState({ amount: '', payment_method: 'BANK_TRANSFER', transaction_reference: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true); setError(null);
    invoiceService.getInvoices({ limit: 200 })
      .then((res) => { setRows(normalizeList(res)); setLoading(false); })
      .catch((e) => { setError(e?.message || 'Billing service unavailable.'); setLoading(false); });
  };
  useEffect(load, []);

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.trim().toLowerCase();
    const match = !q || [r.invoice_number, r.customer_name, r.order_number].some((v) => String(v || '').toLowerCase().includes(q));
    return match && (!status || r.status === status);
  }), [rows, search, status]);

  const stats = useMemo(() => filtered.reduce((a, r) => {
    if (r.status === 'CANCELLED') return a;
    a.invoiced += Number(r.total_amount || 0);
    a.paid += Number(r.paid_amount || 0);
    a.outstanding += Number(r.outstanding_amount || 0);
    if (r.status === 'OVERDUE') a.overdue += 1;
    return a;
  }, { invoiced: 0, paid: 0, outstanding: 0, overdue: 0 }), [filtered]);

  const openCreate = async () => {
    setCreateOpen(true);
    if (!orders.length) {
      try {
        const res = await orderService.getOrders({ limit: 100 });
        setOrders(normalizeList(res));
        const first = normalizeList(res)[0];
        if (first) setForm((f) => ({ ...f, sales_order_id: first.sales_order_id }));
      } catch (e) { toast.error(e?.message || 'Could not load sales orders.'); }
    }
  };

  const submitInvoice = async () => {
    if (!form.sales_order_id) { toast.error('Select a sales order.'); return; }
    setSubmitting(true);
    try {
      await invoiceService.createInvoice({
        sales_order_id: Number(form.sales_order_id),
        due_date: form.due_date || undefined,
        discount_amount: Number(form.discount_amount) || 0
      });
      toast.success('Invoice issued.');
      setCreateOpen(false); load();
    } catch (e) { toast.error(e?.message || 'Invoice creation failed.'); }
    finally { setSubmitting(false); }
  };

  const openPay = () => {
    if (!selected) return;
    setPay({
      amount: selected.outstanding_amount || '',
      payment_method: 'BANK_TRANSFER',
      transaction_reference: '',
      notes: ''
    });
    setPayOpen(true);
  };

  const submitPayment = async () => {
    if (!selected || !Number(pay.amount)) { toast.error('Enter a payment amount.'); return; }
    setSubmitting(true);
    try {
      await paymentService.recordPayment({
        invoice_id: selected.invoice_id,
        amount: Number(pay.amount),
        payment_method: pay.payment_method,
        transaction_reference: pay.transaction_reference || undefined,
        notes: pay.notes
      });
      toast.success(`Payment recorded for ${selected.invoice_number}.`);
      setPayOpen(false); setSelected(null); load();
    } catch (e) { toast.error(e?.message || 'Payment could not be recorded.'); }
    finally { setSubmitting(false); }
  };

  return (
    <motion.div className="page" variants={pageStagger} initial="hidden" animate="visible">
      <motion.div variants={riseIn}>
        <PageHeader
          eyebrow="FINANCE / ACCOUNTS RECEIVABLE"
          title="Invoices"
          description="Billed value, settled cash and overdue exposure by customer account."
          actions={
            <>
              <button className="btn btn-outline" onClick={load}><RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh</button>
              <button className="btn btn-primary" onClick={openCreate}><Plus size={11} /> New invoice</button>
            </>
          }
        />
      </motion.div>

      <motion.div variants={riseIn}>
        <StatGrid cols={4}>
          <Stat label="Invoiced" value={formatCurrency(stats.invoiced)} meta={`${filtered.filter((r) => r.status !== 'CANCELLED').length} active invoices`} icon={Receipt} />
          <Stat label="Collected" value={formatCurrency(stats.paid)} meta="Settled against invoices" tone="good" />
          <Stat label="Outstanding" value={formatCurrency(stats.outstanding)} meta="Open receivable" tone="warn" icon={CircleDollarSign} />
          <Stat label="Overdue" value={formatNumber(stats.overdue)} meta="Past due date" tone={stats.overdue ? 'bad' : ''} icon={AlertTriangle} />
        </StatGrid>
      </motion.div>

      <motion.div variants={riseIn}>
        <Panel>
          <div className="toolbar">
            <div className="toolbar-group">
              <label className="search-field">
                <Search size={12} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Invoice, customer or order…" />
                {search && <button onClick={() => setSearch('')}><X size={11} /></button>}
              </label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ height: 30, fontSize: 11 }}>
                <option value="">All statuses</option>
                {['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{filtered.length} INVOICES</span>
          </div>

          {error ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--color-danger-text)', fontSize: 11 }}>{error}</div>
          ) : (
            <div className="table-scroll tall">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Sales order</th>
                    <th>Issued</th>
                    <th>Due</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th style={{ width: 120 }}>Settled</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 8 }).map((__, j) => <td key={j}><div className="skeleton" style={{ height: 9 }} /></td>)}</tr>
                  ))}
                  {!loading && filtered.map((r) => (
                    <tr key={r.invoice_id} className="clickable" onClick={() => setSelected(r)}>
                      <td className="mono" style={{ fontSize: 10 }}>{r.invoice_number}</td>
                      <td>
                        <div className="cell-strong">{r.customer_name}</div>
                        <div className="cell-sub mono">{r.customer_code}</div>
                      </td>
                      <td className="mono" style={{ color: 'var(--color-text-secondary)' }}>{r.order_number}</td>
                      <td className="mono" style={{ color: 'var(--color-text-muted)' }}>{formatDate(r.invoice_date)}</td>
                      <td className="mono" style={{ color: 'var(--color-text-muted)' }}>{formatDate(r.due_date)}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{formatCurrency(r.total_amount)}</td>
                      <td>
                        <Meter value={r.total_amount ? (Number(r.paid_amount) / Number(r.total_amount)) * 100 : 0} tone={r.status === 'PAID' ? 'good' : 'warn'} />
                        <div className="mono" style={{ fontSize: 8, color: 'var(--color-text-muted)', marginTop: 3 }}>
                          {formatCurrency(r.paid_amount)}
                        </div>
                      </td>
                      <td><StatusBadge status={r.status} size="sm" /></td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>No invoices match this filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </motion.div>

      <Drawer isOpen={Boolean(selected)} onClose={() => setSelected(null)}
        title={selected?.invoice_number || 'Invoice'}
        subtitle={selected ? `${selected.customer_name} · ${selected.order_number}` : ''}
        footer={selected && Number(selected.outstanding_amount) > 0 && selected.status !== 'CANCELLED' ? (
          <Button variant="primary" icon={CircleDollarSign} onClick={openPay}>Record payment</Button>
        ) : selected ? <span style={{ fontSize: 10, color: 'var(--color-success-text)' }}><CheckCircle size={11} /> Settled in full</span> : null}>
        {selected && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Fact label="Status" value={<StatusBadge status={selected.status} size="sm" />} />
              <Fact label="Total" value={formatCurrency(selected.total_amount)} />
              <Fact label="Paid" value={formatCurrency(selected.paid_amount)} />
              <Fact label="Outstanding" value={formatCurrency(selected.outstanding_amount)} />
              <Fact label="Issued" value={formatDate(selected.invoice_date)} />
              <Fact label="Due" value={formatDate(selected.due_date)} />
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 7 }}>Payment history</div>
              {(selected.payments || []).map((p) => (
                <div key={p.payment_id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <div>
                    <div className="mono" style={{ fontSize: 10 }}>{p.payment_reference}</div>
                    <div className="mono" style={{ fontSize: 8.5, color: 'var(--color-text-muted)' }}>{formatDate(p.payment_date)} · {p.payment_method}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--color-success-text)' }}>{formatCurrency(p.amount)}</span>
                </div>
              ))}
              {!selected.payments?.length && <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)' }}>No payments recorded against this invoice.</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'var(--color-text-muted)' }}>
              <span>Subtotal · tax · discount</span>
              <span className="mono">{formatCurrency(selected.subtotal)} · {formatCurrency(selected.tax_amount)} · {formatCurrency(selected.discount_amount)}</span>
            </div>
          </div>
        )}
      </Drawer>

      <Modal isOpen={createOpen} onClose={() => !submitting && setCreateOpen(false)}
        title="Issue invoice" subtitle="Generate a receivable from a sales order." size="md"
        footer={<><Button variant="ghost" disabled={submitting} onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" loading={submitting} onClick={submitInvoice}>Issue invoice</Button></>}>
        <div className="form-grid">
          <Select label="Sales order" value={form.sales_order_id} onChange={(e) => setForm({ ...form, sales_order_id: e.target.value })}
            options={orders.map((o) => ({ value: o.sales_order_id, label: `${o.order_number} · ${o.customer_name} · ${formatCurrency(o.total_amount)}` }))} />
          <Input label="Due date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          <Input label="Discount amount" type="number" min="0" value={form.discount_amount} onChange={(e) => setForm({ ...form, discount_amount: e.target.value })} />
          <div className="form-hint">Invoice totals are derived from the selected sales order's committed subtotal and tax.</div>
        </div>
      </Modal>

      <Modal isOpen={payOpen} onClose={() => !submitting && setPayOpen(false)}
        title="Record payment" subtitle={selected ? `${selected.invoice_number} · outstanding ${formatCurrency(selected.outstanding_amount)}` : ''} size="sm"
        footer={<><Button variant="ghost" disabled={submitting} onClick={() => setPayOpen(false)}>Cancel</Button><Button variant="primary" loading={submitting} onClick={submitPayment}>Record payment</Button></>}>
        <div className="form-grid">
          <Input label="Amount" type="number" min="0" step="0.01" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
          <Select label="Method" value={pay.payment_method} onChange={(e) => setPay({ ...pay, payment_method: e.target.value })}
            options={['BANK_TRANSFER', 'UPI', 'CARD', 'CASH', 'CHEQUE'].map((m) => ({ value: m, label: m.replace('_', ' ') }))} />
          <Input label="Transaction reference" value={pay.transaction_reference} onChange={(e) => setPay({ ...pay, transaction_reference: e.target.value })} placeholder="Optional bank reference" />
          <Input label="Notes" value={pay.notes} onChange={(e) => setPay({ ...pay, notes: e.target.value })} />
        </div>
      </Modal>
    </motion.div>
  );
}

function Fact({ label, value }) {
  return (
    <div style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 4, padding: '7px 9px' }}>
      <div className="eyebrow" style={{ fontSize: 8, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 10.5 }}>{value}</div>
    </div>
  );
}

export default InvoicesPage;
