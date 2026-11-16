import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Search, X, Plus, CheckCircle, PackageCheck, XCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import * as returnService from '../services/returnService';
import * as orderService from '../services/orderService';
import { normalizeList } from '../utils/responseNormalizer';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import { Panel, PanelBody, Stat, StatGrid } from '../components/common/Panel';
import { StatusBadge } from '../components/common/StatusBadge';
import { Drawer } from '../components/common/Drawer';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { formatDate, formatNumber } from '../utils/formatters';
import { pageStagger, riseIn } from '../utils/motion';

const REASONS = ['DAMAGED', 'DEFECTIVE', 'WRONG_PRODUCT', 'NOT_AS_DESCRIBED', 'CHANGED_MIND', 'OTHER'];

export function ReturnsPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [orderDetail, setOrderDetail] = useState(null);
  const [form, setForm] = useState({ sales_order_id: '', reason: 'DEFECTIVE', notes: '', items: [] });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true); setError(null);
    returnService.getReturns({ limit: 200 })
      .then((res) => { setRows(normalizeList(res)); setLoading(false); })
      .catch((e) => { setError(e?.message || 'Returns service unavailable.'); setLoading(false); });
  };
  useEffect(load, []);

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.trim().toLowerCase();
    const match = !q || [r.return_number, r.order_number, r.customer_name, r.warehouse_name].some((v) => String(v || '').toLowerCase().includes(q));
    return match && (!status || r.status === status);
  }), [rows, search, status]);

  const stats = useMemo(() => filtered.reduce((a, r) => {
    a.units += (r.items || []).reduce((s, i) => s + Number(i.requested_quantity || 0), 0);
    if (['REQUESTED', 'APPROVED', 'INSPECTING'].includes(r.status)) a.open += 1;
    if (r.status === 'COMPLETED') a.done += 1;
    return a;
  }, { units: 0, open: 0, done: 0 }), [filtered]);

  const act = async (fn, label, payload) => {
    if (!selected) return;
    setBusy(true);
    try {
      await fn(selected.return_id, payload);
      toast.success(`${selected.return_number} → ${label}`);
      setSelected(null); load();
    } catch (e) { toast.error(e?.message || 'Return action failed.'); }
    finally { setBusy(false); }
  };

  const openCreate = async () => {
    setCreateOpen(true);
    if (!orders.length) {
      try {
        const res = await orderService.getOrders({ limit: 100 });
        const list = normalizeList(res);
        setOrders(list);
        if (list[0]) pickOrder(list[0].sales_order_id);
      } catch (e) { toast.error(e?.message || 'Could not load sales orders.'); }
    }
  };

  const pickOrder = async (id) => {
    try {
      const res = await orderService.getOrderById(id);
      const detail = res?.data || res;
      setOrderDetail(detail);
      setForm((f) => ({
        ...f,
        sales_order_id: id,
        items: (detail.items || []).map((i) => ({
          product_id: i.product_id,
          product_name: i.product_name,
          sku: i.sku,
          requested_quantity: 1,
          condition: 'PENDING_INSPECTION'
        }))
      }));
    } catch (e) { toast.error(e?.message || 'Could not load order lines.'); }
  };

  const submit = async () => {
    if (!orderDetail || !form.items.length) { toast.error('Select an order and at least one item.'); return; }
    setSubmitting(true);
    try {
      await returnService.createReturn({
        sales_order_id: Number(orderDetail.sales_order_id),
        customer_id: Number(orderDetail.customer_id),
        warehouse_id: Number(orderDetail.warehouse_id),
        reason: form.reason,
        notes: form.notes,
        items: form.items.filter((i) => Number(i.requested_quantity) > 0).map((i) => ({
          product_id: Number(i.product_id),
          requested_quantity: Number(i.requested_quantity),
          condition: i.condition
        }))
      });
      toast.success('Return request created.');
      setCreateOpen(false); load();
    } catch (e) { toast.error(e?.message || 'Return request failed.'); }
    finally { setSubmitting(false); }
  };

  return (
    <motion.div className="page" variants={pageStagger} initial="hidden" animate="visible">
      <motion.div variants={riseIn}>
        <PageHeader
          eyebrow="QUALITY / REVERSE LOGISTICS"
          title="Returns & RMA"
          description="Customer returns from request through inspection, restock or rejection."
          actions={
            <>
              <button className="btn btn-outline" onClick={load}><RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh</button>
              <button className="btn btn-primary" onClick={openCreate}><Plus size={11} /> New RMA</button>
            </>
          }
        />
      </motion.div>

      <motion.div variants={riseIn}>
        <StatGrid cols={4}>
          <Stat label="Return requests" value={formatNumber(filtered.length)} meta={`${formatNumber(rows.length)} total RMAs`} icon={RotateCcw} />
          <Stat label="Open cases" value={formatNumber(stats.open)} meta="Awaiting disposition" tone="accent" />
          <Stat label="Units returned" value={formatNumber(stats.units)} meta="Requested quantity" />
          <Stat label="Completed" value={formatNumber(stats.done)} meta="Inspected and closed" tone="good" />
        </StatGrid>
      </motion.div>

      <motion.div variants={riseIn}>
        <Panel>
          <div className="toolbar">
            <div className="toolbar-group">
              <label className="search-field">
                <Search size={12} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="RMA, order, customer or hub…" />
                {search && <button onClick={() => setSearch('')}><X size={11} /></button>}
              </label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ height: 30, fontSize: 11 }}>
                <option value="">All statuses</option>
                {['REQUESTED', 'APPROVED', 'INSPECTING', 'RECEIVED', 'COMPLETED', 'REJECTED'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{filtered.length} CASES</span>
          </div>

          {error ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--color-danger-text)', fontSize: 11 }}>{error}</div>
          ) : (
            <div className="table-scroll tall">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>RMA</th>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Reason</th>
                    <th>Requested</th>
                    <th style={{ textAlign: 'right' }}>Units</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 7 }).map((__, j) => <td key={j}><div className="skeleton" style={{ height: 9 }} /></td>)}</tr>
                  ))}
                  {!loading && filtered.map((r) => (
                    <tr key={r.return_id} className="clickable" onClick={() => setSelected(r)}>
                      <td className="mono" style={{ fontSize: 10 }}>{r.return_number}</td>
                      <td className="mono" style={{ color: 'var(--color-text-secondary)' }}>{r.order_number}</td>
                      <td className="cell-strong">{r.customer_name}</td>
                      <td><span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{r.reason?.replace('_', ' ')}</span></td>
                      <td className="mono" style={{ color: 'var(--color-text-muted)' }}>{formatDate(r.requested_at)}</td>
                      <td className="mono" style={{ textAlign: 'right' }}>{formatNumber((r.items || []).reduce((s, i) => s + Number(i.requested_quantity || 0), 0))}</td>
                      <td><StatusBadge status={r.status} size="sm" /></td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>No returns match this filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </motion.div>

      <Drawer isOpen={Boolean(selected)} onClose={() => setSelected(null)}
        title={selected?.return_number || 'Return'}
        subtitle={selected ? `${selected.customer_name} · ${selected.order_number}` : ''}
        footer={selected && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {selected.status === 'REQUESTED' && <Button variant="primary" loading={busy} icon={CheckCircle} onClick={() => act(returnService.approveReturn, 'APPROVED')}>Approve</Button>}
            {['APPROVED', 'INSPECTING'].includes(selected.status) && <Button variant="success" loading={busy} icon={PackageCheck} onClick={() => act(returnService.receiveReturn, 'COMPLETED', { restock: true })}>Receive & restock</Button>}
            {['REQUESTED', 'APPROVED', 'INSPECTING'].includes(selected.status) && <Button variant="danger" loading={busy} icon={XCircle} onClick={() => act(returnService.rejectReturn, 'REJECTED')}>Reject</Button>}
          </div>
        )}>
        {selected && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Fact label="Status" value={<StatusBadge status={selected.status} size="sm" />} />
              <Fact label="Reason" value={selected.reason?.replace('_', ' ')} />
              <Fact label="Requested" value={formatDate(selected.requested_at)} />
              <Fact label="Processed" value={formatDate(selected.processed_at)} />
              <Fact label="Hub" value={selected.warehouse_name} />
              <Fact label="Warehouse code" value={selected.warehouse_code} />
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 7 }}>Return lines</div>
              {(selected.items || []).map((i) => (
                <div key={i.return_item_id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <div>
                    <div style={{ fontSize: 11 }}>{i.product_name}</div>
                    <div className="mono" style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{i.sku} · {i.condition}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontSize: 10 }}>{i.requested_quantity} requested</div>
                    <div className="mono" style={{ fontSize: 8.5, color: 'var(--color-text-muted)' }}>{i.approved_quantity} approved · {i.received_quantity} received</div>
                  </div>
                </div>
              ))}
            </div>
            {selected.notes && <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{selected.notes}</div>}
          </div>
        )}
      </Drawer>

      <Modal isOpen={createOpen} onClose={() => !submitting && setCreateOpen(false)}
        title="Create return request" subtitle="Raise an RMA against a delivered sales order." size="lg"
        footer={<><Button variant="ghost" disabled={submitting} onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" loading={submitting} onClick={submit}>Create RMA</Button></>}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="form-grid cols-2">
            <Select label="Sales order" value={form.sales_order_id} onChange={(e) => pickOrder(e.target.value)}
              options={orders.map((o) => ({ value: o.sales_order_id, label: `${o.order_number} · ${o.customer_name}` }))} />
            <Select label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
              options={REASONS.map((r) => ({ value: r, label: r.replace(/_/g, ' ') }))} />
          </div>
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Inspection context" />
          {orderDetail && (
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Return lines · {orderDetail.order_number}</div>
              <table className="data-table">
                <thead><tr><th>Item</th><th>Condition</th><th>Qty</th></tr></thead>
                <tbody>
                  {form.items.map((it, idx) => (
                    <tr key={it.product_id}>
                      <td>
                        <div style={{ fontSize: 10.5 }}>{it.product_name}</div>
                        <div className="mono" style={{ fontSize: 8.5, color: 'var(--color-text-muted)' }}>{it.sku}</div>
                      </td>
                      <td>
                        <select value={it.condition} style={{ height: 26, fontSize: 10 }} onChange={(e) => {
                          const items = [...form.items]; items[idx] = { ...items[idx], condition: e.target.value }; setForm({ ...form, items });
                        }}>
                          {['PENDING_INSPECTION', 'GOOD', 'DAMAGED', 'DEFECTIVE'].map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                        </select>
                      </td>
                      <td>
                        <input type="number" min="0" value={it.requested_quantity} style={{ width: 64 }} onChange={(e) => {
                          const items = [...form.items]; items[idx] = { ...items[idx], requested_quantity: e.target.value }; setForm({ ...form, items });
                        }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </motion.div>
  );
}

function Fact({ label, value }) {
  return (
    <div style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 4, padding: '7px 9px' }}>
      <div className="eyebrow" style={{ fontSize: 8, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 10.5 }}>{value || '—'}</div>
    </div>
  );
}

export default ReturnsPage;
