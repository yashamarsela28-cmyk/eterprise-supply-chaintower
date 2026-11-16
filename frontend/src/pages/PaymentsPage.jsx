import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Search, X, Plus, CreditCard, CircleDollarSign, Building2 } from 'lucide-react';
import * as paymentService from '../services/paymentService';
import * as invoiceService from '../services/invoiceService';
import { normalizeList } from '../utils/responseNormalizer';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import { Panel, PanelHead, PanelBody, Stat, StatGrid, Meter } from '../components/common/Panel';
import { StatusBadge } from '../components/common/StatusBadge';
import { Drawer } from '../components/common/Drawer';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { formatCurrency, formatDate, formatNumber } from '../utils/formatters';
import { pageStagger, riseIn } from '../utils/motion';

export function PaymentsPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [selected, setSelected] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [recordOpen, setRecordOpen] = useState(false);
  const [form, setForm] = useState({ invoice_id: '', amount: '', payment_method: 'BANK_TRANSFER', transaction_reference: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true); setError(null);
    paymentService.getPayments({ limit: 200 })
      .then((res) => { setRows(normalizeList(res)); setLoading(false); })
      .catch((e) => { setError(e?.message || 'Treasury service unavailable.'); setLoading(false); });
  };
  useEffect(load, []);

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.trim().toLowerCase();
    const match = !q || [r.payment_reference, r.invoice_number, r.customer_name, r.transaction_reference].some((v) => String(v || '').toLowerCase().includes(q));
    return match && (!method || r.payment_method === method);
  }), [rows, search, method]);

  const stats = useMemo(() => filtered.reduce((a, r) => {
    const amt = Number(r.amount || 0);
    a.total += amt;
    a.byMethod[r.payment_method] = (a.byMethod[r.payment_method] || 0) + amt;
    if (r.status === 'SUCCESS') a.success += 1;
    return a;
  }, { total: 0, success: 0, byMethod: {} }), [filtered]);

  const methods = useMemo(() => Object.entries(stats.byMethod).sort((a, b) => b[1] - a[1]), [stats]);

  const openRecord = async () => {
    setRecordOpen(true);
    if (!invoices.length) {
      try {
        const res = await invoiceService.getInvoices({ limit: 200 });
        const open = normalizeList(res).filter((i) => Number(i.outstanding_amount) > 0 && i.status !== 'CANCELLED');
        setInvoices(open);
        if (open[0]) setForm((f) => ({ ...f, invoice_id: open[0].invoice_id, amount: open[0].outstanding_amount }));
      } catch (e) { toast.error(e?.message || 'Could not load open invoices.'); }
    }
  };

  const chooseInvoice = (id) => {
    const inv = invoices.find((i) => String(i.invoice_id) === String(id));
    setForm((f) => ({ ...f, invoice_id: id, amount: inv?.outstanding_amount || f.amount }));
  };

  const submit = async () => {
    if (!form.invoice_id || !Number(form.amount)) { toast.error('Select an invoice and enter an amount.'); return; }
    setSubmitting(true);
    try {
      await paymentService.recordPayment({
        invoice_id: Number(form.invoice_id),
        amount: Number(form.amount),
        payment_method: form.payment_method,
        transaction_reference: form.transaction_reference || undefined,
        notes: form.notes
      });
      toast.success('Payment posted to the cash journal.');
      setRecordOpen(false); load();
    } catch (e) { toast.error(e?.message || 'Payment failed.'); }
    finally { setSubmitting(false); }
  };

  return (
    <motion.div className="page" variants={pageStagger} initial="hidden" animate="visible">
      <motion.div variants={riseIn}>
        <PageHeader
          eyebrow="FINANCE / CASH JOURNAL"
          title="Payments"
          description="Every settled receipt with its invoice, customer and settlement channel."
          actions={
            <>
              <button className="btn btn-outline" onClick={load}><RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh</button>
              <button className="btn btn-primary" onClick={openRecord}><Plus size={11} /> Record payment</button>
            </>
          }
        />
      </motion.div>

      <motion.div variants={riseIn}>
        <StatGrid cols={4}>
          <Stat label="Cash settled" value={formatCurrency(stats.total)} meta={`${filtered.length} postings`} icon={CircleDollarSign} />
          <Stat label="Successful" value={formatNumber(stats.success)} meta="Cleared transactions" tone="good" />
          <Stat label="Primary channel" value={methods[0]?.[0]?.replace('_', ' ') || '—'} meta={methods[0] ? formatCurrency(methods[0][1]) : 'No settlements'} icon={CreditCard} />
          <Stat label="Channels" value={formatNumber(methods.length)} meta="Distinct payment methods" icon={Building2} />
        </StatGrid>
      </motion.div>

      <div className="split split-aside">
        <motion.div variants={riseIn} style={{ minWidth: 0 }}>
          <Panel>
            <div className="toolbar">
              <div className="toolbar-group">
                <label className="search-field">
                  <Search size={12} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Reference, invoice or customer…" />
                  {search && <button onClick={() => setSearch('')}><X size={11} /></button>}
                </label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ height: 30, fontSize: 11 }}>
                  <option value="">All channels</option>
                  {Array.from(new Set(rows.map((r) => r.payment_method))).map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                </select>
              </div>
              <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{filtered.length} POSTINGS</span>
            </div>

            {error ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--color-danger-text)', fontSize: 11 }}>{error}</div>
            ) : (
              <div className="table-scroll tall">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Invoice</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Channel</th>
                      <th>Bank ref</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 8 }).map((__, j) => <td key={j}><div className="skeleton" style={{ height: 9 }} /></td>)}</tr>
                    ))}
                    {!loading && filtered.map((r) => (
                      <tr key={r.payment_id} className="clickable" onClick={() => setSelected(r)}>
                        <td className="mono" style={{ fontSize: 10 }}>{r.payment_reference}</td>
                        <td className="mono" style={{ color: 'var(--color-text-secondary)' }}>{r.invoice_number}</td>
                        <td className="cell-strong">{r.customer_name}</td>
                        <td className="mono" style={{ color: 'var(--color-text-muted)' }}>{formatDate(r.payment_date)}</td>
                        <td>{r.payment_method?.replace('_', ' ')}</td>
                        <td className="mono" style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{r.transaction_reference || '—'}</td>
                        <td className="num" style={{ textAlign: 'right' }}>{formatCurrency(r.amount)}</td>
                        <td><StatusBadge status={r.status || 'SUCCESS'} size="sm" /></td>
                      </tr>
                    ))}
                    {!loading && filtered.length === 0 && (
                      <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>No payments match this filter.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </motion.div>

        <motion.div variants={riseIn} style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <Panel>
            <PanelHead title="Settlement mix" subtitle="Value by payment channel" />
            <PanelBody style={{ display: 'grid', gap: 12 }}>
              {methods.map(([m, v]) => (
                <div key={m}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10.5, color: 'var(--color-text-secondary)' }}>{m.replace('_', ' ')}</span>
                    <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{formatCurrency(v)}</span>
                  </div>
                  <Meter value={stats.total ? (v / stats.total) * 100 : 0} />
                </div>
              ))}
              {methods.length === 0 && <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)' }}>No settlements to chart.</div>}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead title="Payment inspector" subtitle={selected ? selected.payment_reference : 'Select a posting'} />
            <PanelBody>
              {!selected ? (
                <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>Select a journal entry for its invoice, bank reference and notes.</div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  <Row label="Amount" value={formatCurrency(selected.amount)} />
                  <Row label="Invoice" value={selected.invoice_number} />
                  <Row label="Customer" value={selected.customer_name} />
                  <Row label="Date" value={formatDate(selected.payment_date)} />
                  <Row label="Channel" value={selected.payment_method?.replace('_', ' ')} />
                  <Row label="Bank ref" value={selected.transaction_reference} />
                  <Row label="Status" value={selected.status} />
                  {selected.notes && <div style={{ fontSize: 9.5, color: 'var(--color-text-muted)', marginTop: 4 }}>{selected.notes}</div>}
                </div>
              )}
            </PanelBody>
          </Panel>
        </motion.div>
      </div>

      <Modal isOpen={recordOpen} onClose={() => !submitting && setRecordOpen(false)}
        title="Record payment" subtitle="Apply a settlement against an open invoice." size="sm"
        footer={<><Button variant="ghost" disabled={submitting} onClick={() => setRecordOpen(false)}>Cancel</Button><Button variant="primary" loading={submitting} onClick={submit}>Post payment</Button></>}>
        <div className="form-grid">
          <Select label="Open invoice" value={form.invoice_id} onChange={(e) => chooseInvoice(e.target.value)}
            options={invoices.map((i) => ({ value: i.invoice_id, label: `${i.invoice_number} · ${i.customer_name} · ${formatCurrency(i.outstanding_amount)}` }))} />
          <Input label="Amount" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Select label="Channel" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
            options={['BANK_TRANSFER', 'UPI', 'CARD', 'CASH', 'CHEQUE'].map((m) => ({ value: m, label: m.replace('_', ' ') }))} />
          <Input label="Transaction reference" value={form.transaction_reference} onChange={(e) => setForm({ ...form, transaction_reference: e.target.value })} placeholder="Optional" />
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          {!invoices.length && <div className="form-hint">No invoices with an outstanding balance are available.</div>}
        </div>
      </Modal>
    </motion.div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, paddingBottom: 6, borderBottom: '1px solid var(--color-border-subtle)' }}>
      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ fontSize: 10.5, textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );
}

export default PaymentsPage;
