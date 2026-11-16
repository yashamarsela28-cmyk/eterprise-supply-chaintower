import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Search, X, Plus, Send, CheckCircle, XCircle, FileSpreadsheet } from 'lucide-react';
import * as poService from '../services/purchaseOrderService';
import * as supplierService from '../services/supplierService';
import * as warehouseService from '../services/warehouseService';
import * as productService from '../services/productService';
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

const STAGES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED'];

export function PurchaseOrdersPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [lookups, setLookups] = useState({ suppliers: [], warehouses: [], products: [] });
  const [form, setForm] = useState({ supplier_id: '', warehouse_id: '', expected_delivery_date: '', notes: '', items: [] });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true); setError(null);
    poService.getPurchaseOrders({ limit: 200 })
      .then((res) => { setRows(normalizeList(res)); setLoading(false); })
      .catch((e) => { setError(e?.message || 'Procurement service unavailable.'); setLoading(false); });
  };
  useEffect(load, []);

  const openCreate = async () => {
    setCreateOpen(true);
    if (!lookups.suppliers.length) {
      try {
        const [s, w, p] = await Promise.all([
          supplierService.getSuppliers({ limit: 100 }),
          warehouseService.getWarehouses(),
          productService.getProducts({ limit: 100 })
        ]);
        const next = { suppliers: normalizeList(s), warehouses: normalizeList(w), products: normalizeList(p) };
        setLookups(next);
        const prod = next.products[0] || {};
        setForm({
          supplier_id: next.suppliers[0]?.supplier_id || '',
          warehouse_id: next.warehouses[0]?.warehouse_id || '',
          expected_delivery_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          notes: '',
          items: prod.product_id ? [{ product_id: prod.product_id, ordered_quantity: 10, unit_price: prod.unit_price || 0 }] : []
        });
      } catch (e) {
        toast.error(e?.message || 'Could not load procurement references.');
      }
    }
  };

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.trim().toLowerCase();
    const match = !q || [r.po_number, r.supplier_name, r.warehouse_name].some((v) => String(v || '').toLowerCase().includes(q));
    return match && (!status || r.status === status);
  }), [rows, search, status]);

  const stageCounts = useMemo(() => {
    const m = {};
    rows.forEach((r) => { m[r.status] = (m[r.status] || 0) + 1; });
    return m;
  }, [rows]);

  const stats = useMemo(() => filtered.reduce((a, r) => {
    a.value += Number(r.total_amount || 0);
    a.units += (r.items || []).reduce((s, i) => s + Number(i.ordered_quantity || 0), 0);
    if (['SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED'].includes(r.status)) a.open += 1;
    return a;
  }, { value: 0, units: 0, open: 0 }), [filtered]);

  const act = async (fn, label) => {
    if (!selected) return;
    setBusy(true);
    try {
      await fn(selected.purchase_order_id);
      toast.success(`${selected.po_number} → ${label}`);
      setSelected(null); load();
    } catch (e) {
      toast.error(e?.message || 'Purchase order action failed.');
    } finally { setBusy(false); }
  };

  const submit = async () => {
    if (!form.supplier_id || !form.warehouse_id || !form.items.length) {
      toast.error('Supplier, warehouse and at least one line are required.');
      return;
    }
    setSubmitting(true);
    try {
      await poService.createPurchaseOrder({
        supplier_id: Number(form.supplier_id),
        warehouse_id: Number(form.warehouse_id),
        expected_delivery_date: form.expected_delivery_date || undefined,
        notes: form.notes,
        items: form.items.map((i) => ({
          product_id: Number(i.product_id),
          ordered_quantity: Number(i.ordered_quantity),
          unit_price: Number(i.unit_price)
        }))
      });
      toast.success('Purchase order created as a draft.');
      setCreateOpen(false); load();
    } catch (e) {
      toast.error(e?.message || 'Purchase order creation failed.');
    } finally { setSubmitting(false); }
  };

  return (
    <motion.div className="page" variants={pageStagger} initial="hidden" animate="visible">
      <motion.div variants={riseIn}>
        <PageHeader
          eyebrow="PROCUREMENT / INBOUND"
          title="Purchase orders"
          description="Supplier commitments, approval gates and the progress of inbound replenishment."
          actions={
            <>
              <button className="btn btn-outline" onClick={load}><RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh</button>
              <button className="btn btn-primary" onClick={openCreate}><Plus size={11} /> New PO</button>
            </>
          }
        />
      </motion.div>

      <motion.div variants={riseIn}>
        <StatGrid cols={4}>
          <Stat label="Purchase orders" value={formatNumber(filtered.length)} meta={`${formatNumber(stageCounts.DRAFT || 0)} in draft`} icon={FileSpreadsheet} />
          <Stat label="Open inbound" value={formatNumber(stats.open)} meta="Approved or in receipt" tone="accent" />
          <Stat label="Ordered units" value={formatNumber(stats.units)} meta="Across filtered POs" />
          <Stat label="Committed value" value={formatCurrency(stats.value)} meta="Supplier spend in view" />
        </StatGrid>
      </motion.div>

      <motion.div variants={riseIn}>
        <Panel>
          <PanelBody style={{ display: 'grid', gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`, gap: 1, padding: 0 }}>
            {STAGES.map((s) => (
              <button key={s} onClick={() => setStatus(status === s ? '' : s)}
                style={{ padding: '11px 13px', textAlign: 'left', borderRight: '1px solid var(--color-border-subtle)', background: status === s ? 'var(--color-bg-active)' : 'transparent' }}>
                <div className="eyebrow" style={{ fontSize: 8 }}>{s.replace(/_/g, ' ')}</div>
                <div className="mono" style={{ fontSize: 17, marginTop: 3 }}>{formatNumber(stageCounts[s] || 0)}</div>
              </button>
            ))}
          </PanelBody>
        </Panel>
      </motion.div>

      <motion.div variants={riseIn}>
        <Panel>
          <div className="toolbar">
            <div className="toolbar-group">
              <label className="search-field">
                <Search size={12} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="PO, supplier or hub…" />
                {search && <button onClick={() => setSearch('')}><X size={11} /></button>}
              </label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ height: 30, fontSize: 11 }}>
                <option value="">All stages</option>
                {STAGES.concat(['CANCELLED']).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{filtered.length} RECORDS</span>
          </div>

          {error ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--color-danger-text)', fontSize: 11 }}>{error}</div>
          ) : (
            <div className="table-scroll tall">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PO</th>
                    <th>Supplier</th>
                    <th>Destination</th>
                    <th>Expected</th>
                    <th style={{ width: 130 }}>Receipt</th>
                    <th style={{ textAlign: 'right' }}>Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 7 }).map((__, j) => <td key={j}><div className="skeleton" style={{ height: 9 }} /></td>)}</tr>
                  ))}
                  {!loading && filtered.map((r) => (
                    <tr key={r.purchase_order_id} className="clickable" onClick={() => setSelected(r)}>
                      <td className="mono" style={{ fontSize: 10 }}>{r.po_number}</td>
                      <td className="cell-strong">{r.supplier_name}</td>
                      <td>{r.warehouse_name}</td>
                      <td className="mono" style={{ color: 'var(--color-text-muted)' }}>{formatDate(r.expected_delivery_date)}</td>
                      <td>
                        <Meter value={Number(r.receiving_percentage || 0)} tone={r.status === 'RECEIVED' ? 'good' : 'warn'} />
                        <div className="mono" style={{ fontSize: 8, color: 'var(--color-text-muted)', marginTop: 3 }}>
                          {formatNumber((r.items || []).reduce((s, i) => s + Number(i.received_quantity || 0), 0))} / {formatNumber((r.items || []).reduce((s, i) => s + Number(i.ordered_quantity || 0), 0))}
                        </div>
                      </td>
                      <td className="num" style={{ textAlign: 'right' }}>{formatCurrency(r.total_amount)}</td>
                      <td><StatusBadge status={r.status} size="sm" /></td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>No purchase orders match this filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </motion.div>

      <Drawer
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.po_number || 'Purchase order'}
        subtitle={selected ? `${selected.supplier_name} · ${selected.warehouse_name}` : ''}
        footer={selected && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {selected.status === 'DRAFT' && <Button variant="primary" loading={busy} icon={Send} onClick={() => act(poService.submitPurchaseOrder, 'SUBMITTED')}>Submit for approval</Button>}
            {selected.status === 'SUBMITTED' && <Button variant="primary" loading={busy} icon={CheckCircle} onClick={() => act(poService.approvePurchaseOrder, 'APPROVED')}>Approve</Button>}
            {['DRAFT', 'SUBMITTED', 'APPROVED'].includes(selected.status) && <Button variant="danger" loading={busy} icon={XCircle} onClick={() => act(poService.cancelPurchaseOrder, 'CANCELLED')}>Cancel</Button>}
            {['RECEIVED', 'CANCELLED'].includes(selected.status) && <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Terminal state.</span>}
          </div>
        )}
      >
        {selected && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Fact label="Status" value={<StatusBadge status={selected.status} size="sm" />} />
              <Fact label="Value" value={formatCurrency(selected.total_amount)} />
              <Fact label="Ordered" value={formatDate(selected.order_date)} />
              <Fact label="Expected" value={formatDate(selected.expected_delivery_date)} />
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 7 }}>Receipt progress · {formatPercentage(selected.receiving_percentage || 0)}</div>
              <Meter value={Number(selected.receiving_percentage || 0)} tone={selected.status === 'RECEIVED' ? 'good' : 'warn'} />
              <div className="mono" style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 4 }}>
                                    {formatNumber((selected.items || []).reduce((s, i) => s + Number(i.received_quantity || 0), 0))} received of {formatNumber((selected.items || []).reduce((s, i) => s + Number(i.ordered_quantity || 0), 0))} ordered
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 7 }}>Line items</div>
              {(selected.items || []).map((it) => (
                <div key={it.purchase_order_item_id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <div>
                    <div style={{ fontSize: 11 }}>{it.product_name}</div>
                    <div className="mono" style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{it.sku} · {it.ordered_quantity} ordered / {it.received_quantity} received</div>
                  </div>
                  <span className="mono" style={{ fontSize: 10 }}>{formatCurrency(it.subtotal)}</span>
                </div>
              ))}
              {!selected.items?.length && <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)' }}>No line items returned.</div>}
            </div>
            {selected.notes && <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Note: {selected.notes}</div>}
          </div>
        )}
      </Drawer>

      <Modal
        isOpen={createOpen}
        onClose={() => !submitting && setCreateOpen(false)}
        title="Create purchase order"
        subtitle="Draft an inbound replenishment against a supplier."
        size="lg"
        footer={
          <>
            <Button variant="ghost" disabled={submitting} onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={submitting} onClick={submit}>Create draft PO</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="form-grid cols-2">
            <Select label="Supplier" value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
              options={lookups.suppliers.map((s) => ({ value: s.supplier_id, label: `${s.supplier_name} (${s.supplier_code})` }))} />
            <Select label="Receiving hub" value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
              options={lookups.warehouses.map((w) => ({ value: w.warehouse_id, label: w.warehouse_name }))} />
            <Input label="Expected delivery" type="date" value={form.expected_delivery_date} onChange={(e) => setForm({ ...form, expected_delivery_date: e.target.value })} />
            <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional" />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span className="eyebrow">Line items</span>
              <button className="btn btn-ghost" onClick={() => {
                const p = lookups.products[0] || {};
                setForm((f) => ({ ...f, items: [...f.items, { product_id: p.product_id || '', ordered_quantity: 10, unit_price: p.unit_price || 0 }] }));
              }}><Plus size={10} /> Add line</button>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {form.items.map((it, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 6, alignItems: 'end' }}>
                  <Select value={it.product_id} onChange={(e) => {
                    const prod = lookups.products.find((p) => String(p.product_id) === e.target.value);
                    const items = [...form.items];
                    items[idx] = { ...items[idx], product_id: e.target.value, unit_price: prod?.unit_price ?? items[idx].unit_price };
                    setForm({ ...form, items });
                  }} options={lookups.products.map((p) => ({ value: p.product_id, label: `${p.sku} · ${p.product_name}` }))} />
                  <Input type="number" min="1" label={idx === 0 ? 'Qty' : undefined} value={it.ordered_quantity} onChange={(e) => {
                    const items = [...form.items]; items[idx] = { ...items[idx], ordered_quantity: e.target.value }; setForm({ ...form, items });
                  }} />
                  <Input type="number" min="0" step="0.01" label={idx === 0 ? 'Unit price' : undefined} value={it.unit_price} onChange={(e) => {
                    const items = [...form.items]; items[idx] = { ...items[idx], unit_price: e.target.value }; setForm({ ...form, items });
                  }} />
                  <button className="btn btn-ghost btn-icon" disabled={form.items.length === 1} onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })}><X size={12} /></button>
                </div>
              ))}
            </div>
          </div>
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

export default PurchaseOrdersPage;
