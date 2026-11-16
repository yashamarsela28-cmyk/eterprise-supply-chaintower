import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Search, X, Plus, ArrowRight, CheckCircle, Truck, PackageCheck, XCircle, ArrowLeftRight } from 'lucide-react';
import * as transferService from '../services/transferService';
import * as warehouseService from '../services/warehouseService';
import * as productService from '../services/productService';
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

export function TransfersPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [lookups, setLookups] = useState({ warehouses: [], products: [] });
  const [form, setForm] = useState({ source_warehouse_id: '', destination_warehouse_id: '', notes: '', items: [] });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true); setError(null);
    transferService.getTransfers({ limit: 200 })
      .then((res) => { setRows(normalizeList(res)); setLoading(false); })
      .catch((e) => { setError(e?.message || 'Transfer service unavailable.'); setLoading(false); });
  };
  useEffect(load, []);

  const openCreate = async () => {
    setCreateOpen(true);
    if (!lookups.warehouses.length) {
      try {
        const [w, p] = await Promise.all([warehouseService.getWarehouses(), productService.getProducts({ limit: 100 })]);
        const next = { warehouses: normalizeList(w), products: normalizeList(p) };
        setLookups(next);
        const prod = next.products[0] || {};
        setForm({
          source_warehouse_id: next.warehouses[0]?.warehouse_id || '',
          destination_warehouse_id: next.warehouses[1]?.warehouse_id || '',
          notes: '',
          items: prod.product_id ? [{ product_id: prod.product_id, requested_quantity: 10 }] : []
        });
      } catch (e) { toast.error(e?.message || 'Could not load transfer references.'); }
    }
  };

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.trim().toLowerCase();
    const match = !q || [r.transfer_number, r.source_warehouse_name, r.destination_warehouse_name].some((v) => String(v || '').toLowerCase().includes(q));
    return match && (!status || r.status === status);
  }), [rows, search, status]);

  const stats = useMemo(() => filtered.reduce((a, r) => {
    a.units += (r.items || []).reduce((s, i) => s + Number(i.requested_quantity || 0), 0);
    if (r.status === 'IN_TRANSIT') a.transit += 1;
    if (r.status === 'COMPLETED') a.done += 1;
    return a;
  }, { units: 0, transit: 0, done: 0 }), [filtered]);

  const act = async (fn, label) => {
    if (!selected) return;
    setBusy(true);
    try {
      await fn(selected.transfer_id);
      toast.success(`${selected.transfer_number} → ${label}`);
      setSelected(null); load();
    } catch (e) { toast.error(e?.message || 'Transfer action failed.'); }
    finally { setBusy(false); }
  };

  const submit = async () => {
    if (!form.source_warehouse_id || !form.destination_warehouse_id || !form.items.length) {
      toast.error('Source, destination and at least one item are required.');
      return;
    }
    if (String(form.source_warehouse_id) === String(form.destination_warehouse_id)) {
      toast.error('Source and destination must differ.');
      return;
    }
    setSubmitting(true);
    try {
      await transferService.createTransfer({
        source_warehouse_id: Number(form.source_warehouse_id),
        destination_warehouse_id: Number(form.destination_warehouse_id),
        notes: form.notes,
        items: form.items.map((i) => ({ product_id: Number(i.product_id), requested_quantity: Number(i.requested_quantity) }))
      });
      toast.success('Transfer requested.');
      setCreateOpen(false); load();
    } catch (e) { toast.error(e?.message || 'Transfer creation failed.'); }
    finally { setSubmitting(false); }
  };

  return (
    <motion.div className="page" variants={pageStagger} initial="hidden" animate="visible">
      <motion.div variants={riseIn}>
        <PageHeader
          eyebrow="INVENTORY / REBALANCING"
          title="Stock transfers"
          description="Inter-facility stock movements with explicit approval, dispatch and receipt gates."
          actions={
            <>
              <button className="btn btn-outline" onClick={load}><RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh</button>
              <button className="btn btn-primary" onClick={openCreate}><Plus size={11} /> New transfer</button>
            </>
          }
        />
      </motion.div>

      <motion.div variants={riseIn}>
        <StatGrid cols={4}>
          <Stat label="Transfers" value={formatNumber(filtered.length)} meta={`${formatNumber(rows.length)} total records`} icon={ArrowLeftRight} />
          <Stat label="Units in scope" value={formatNumber(stats.units)} meta="Requested quantity" />
          <Stat label="In transit" value={formatNumber(stats.transit)} meta="Between facilities" tone="accent" />
          <Stat label="Completed" value={formatNumber(stats.done)} meta="Received at destination" tone="good" />
        </StatGrid>
      </motion.div>

      <motion.div variants={riseIn}>
        <Panel>
          <div className="toolbar">
            <div className="toolbar-group">
              <label className="search-field">
                <Search size={12} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Transfer or facility…" />
                {search && <button onClick={() => setSearch('')}><X size={11} /></button>}
              </label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ height: 30, fontSize: 11 }}>
                <option value="">All statuses</option>
                {['REQUESTED', 'APPROVED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
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
                    <th>Transfer</th>
                    <th>Lane</th>
                    <th>Requested</th>
                    <th style={{ textAlign: 'right' }}>Lines</th>
                    <th style={{ textAlign: 'right' }}>Units</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 6 }).map((__, j) => <td key={j}><div className="skeleton" style={{ height: 9 }} /></td>)}</tr>
                  ))}
                  {!loading && filtered.map((r) => (
                    <tr key={r.transfer_id} className="clickable" onClick={() => setSelected(r)}>
                      <td className="mono" style={{ fontSize: 10 }}>{r.transfer_number}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11 }}>{r.source_warehouse_name}</span>
                          <ArrowRight size={10} style={{ color: 'var(--color-text-dim)' }} />
                          <span style={{ fontSize: 11 }}>{r.destination_warehouse_name}</span>
                        </div>
                        <div className="cell-sub mono">{r.source_warehouse_code} → {r.destination_warehouse_code}</div>
                      </td>
                      <td className="mono" style={{ color: 'var(--color-text-muted)' }}>{formatDate(r.requested_at)}</td>
                      <td className="mono" style={{ textAlign: 'right' }}>{r.items?.length || 0}</td>
                      <td className="mono" style={{ textAlign: 'right' }}>{formatNumber((r.items || []).reduce((s, i) => s + Number(i.requested_quantity || 0), 0))}</td>
                      <td><StatusBadge status={r.status} size="sm" /></td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>No transfers match this filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </motion.div>

      <Drawer isOpen={Boolean(selected)} onClose={() => setSelected(null)}
        title={selected?.transfer_number || 'Transfer'}
        subtitle={selected ? `${selected.source_warehouse_name} → ${selected.destination_warehouse_name}` : ''}
        footer={selected && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {selected.status === 'REQUESTED' && <Button variant="primary" loading={busy} icon={CheckCircle} onClick={() => act(transferService.approveTransfer, 'APPROVED')}>Approve</Button>}
            {selected.status === 'APPROVED' && <Button variant="primary" loading={busy} icon={Truck} onClick={() => act(transferService.dispatchTransfer, 'IN TRANSIT')}>Dispatch</Button>}
            {selected.status === 'IN_TRANSIT' && <Button variant="success" loading={busy} icon={PackageCheck} onClick={() => act(transferService.receiveTransfer, 'COMPLETED')}>Receive</Button>}
            {['REQUESTED', 'APPROVED'].includes(selected.status) && <Button variant="danger" loading={busy} icon={XCircle} onClick={() => act(transferService.cancelTransfer, 'CANCELLED')}>Cancel</Button>}
          </div>
        )}>
        {selected && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Fact label="Status" value={<StatusBadge status={selected.status} size="sm" />} />
              <Fact label="Requested" value={formatDate(selected.requested_at)} />
              <Fact label="Source" value={selected.source_warehouse_name} />
              <Fact label="Destination" value={selected.destination_warehouse_name} />
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 7 }}>Movement lines</div>
              {(selected.items || []).map((i) => (
                <div key={i.transfer_item_id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <div>
                    <div style={{ fontSize: 11 }}>{i.product_name}</div>
                    <div className="mono" style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{i.sku} · {i.source_location} → {i.destination_location}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontSize: 10 }}>{i.requested_quantity} requested</div>
                    <div className="mono" style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{i.shipped_quantity} shipped · {i.received_quantity} received</div>
                  </div>
                </div>
              ))}
            </div>
            {selected.notes && <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{selected.notes}</div>}
          </div>
        )}
      </Drawer>

      <Modal isOpen={createOpen} onClose={() => !submitting && setCreateOpen(false)}
        title="Request stock transfer" subtitle="Move inventory between distribution centres." size="lg"
        footer={<><Button variant="ghost" disabled={submitting} onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" loading={submitting} onClick={submit}>Request transfer</Button></>}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="form-grid cols-2">
            <Select label="Source hub" value={form.source_warehouse_id} onChange={(e) => setForm({ ...form, source_warehouse_id: e.target.value })}
              options={lookups.warehouses.map((w) => ({ value: w.warehouse_id, label: w.warehouse_name }))} />
            <Select label="Destination hub" value={form.destination_warehouse_id} onChange={(e) => setForm({ ...form, destination_warehouse_id: e.target.value })}
              options={lookups.warehouses.map((w) => ({ value: w.warehouse_id, label: w.warehouse_name }))} />
          </div>
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Reason for rebalancing" />
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span className="eyebrow">Items</span>
              <button className="btn btn-ghost" onClick={() => {
                const p = lookups.products[0] || {};
                setForm((f) => ({ ...f, items: [...f.items, { product_id: p.product_id || '', requested_quantity: 5 }] }));
              }}><Plus size={10} /> Add item</button>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {form.items.map((it, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: 6, alignItems: 'end' }}>
                  <Select value={it.product_id} onChange={(e) => {
                    const items = [...form.items]; items[idx] = { ...items[idx], product_id: e.target.value }; setForm({ ...form, items });
                  }} options={lookups.products.map((p) => ({ value: p.product_id, label: `${p.sku} · ${p.product_name}` }))} />
                  <Input type="number" min="1" value={it.requested_quantity} label={idx === 0 ? 'Units' : undefined} onChange={(e) => {
                    const items = [...form.items]; items[idx] = { ...items[idx], requested_quantity: e.target.value }; setForm({ ...form, items });
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
      <div style={{ fontSize: 10.5 }}>{value || '—'}</div>
    </div>
  );
}

export default TransfersPage;
