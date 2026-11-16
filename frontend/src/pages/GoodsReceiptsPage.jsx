import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Search, X, Plus, PackageCheck, AlertTriangle } from 'lucide-react';
import * as grnService from '../services/goodsReceiptService';
import * as poService from '../services/purchaseOrderService';
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

export function GoodsReceiptsPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [poList, setPoList] = useState([]);
  const [po, setPo] = useState(null);
  const [receiptItems, setReceiptItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true); setError(null);
    grnService.getGoodsReceipts({ limit: 200 })
      .then((res) => { setRows(normalizeList(res)); setLoading(false); })
      .catch((e) => { setError(e?.message || 'Receiving service unavailable.'); setLoading(false); });
  };
  useEffect(load, []);

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.trim().toLowerCase();
    const match = !q || [r.grn_number, r.po_number, r.supplier_name, r.warehouse_name].some((v) => String(v || '').toLowerCase().includes(q));
    return match && (!status || r.status === status);
  }), [rows, search, status]);

  const stats = useMemo(() => filtered.reduce((a, r) => {
    a.received += (r.items || []).reduce((s, i) => s + Number(i.received_quantity || 0), 0);
    a.damaged += (r.items || []).reduce((s, i) => s + Number(i.damaged_quantity || 0), 0);
    if (r.status === 'ACCEPTED') a.accepted += 1;
    return a;
  }, { received: 0, damaged: 0, accepted: 0 }), [filtered]);

  const openCreate = async () => {
    setCreateOpen(true);
    if (!poList.length) {
      try {
        const res = await poService.getPurchaseOrders({ limit: 100 });
        const list = normalizeList(res).filter((p) => !['RECEIVED', 'CANCELLED'].includes(p.status));
        setPoList(list);
        if (list[0]) await choosePo(list[0].purchase_order_id, list);
      } catch (e) {
        toast.error(e?.message || 'Could not load purchase orders.');
      }
    }
  };

  const choosePo = async (id, list = poList) => {
    try {
      const res = await poService.getPurchaseOrderById(id);
      const detail = res?.data || res;
      setPo(detail);
      setReceiptItems((detail.items || []).map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name,
        sku: i.sku,
        ordered_quantity: i.ordered_quantity,
        received_quantity: Math.max(0, Number(i.ordered_quantity) - Number(i.received_quantity || 0)),
        accepted_quantity: Math.max(0, Number(i.ordered_quantity) - Number(i.received_quantity || 0)),
        damaged_quantity: 0
      })));
      setNotes('');
    } catch (e) {
      toast.error(e?.message || 'Could not load purchase order.');
    }
  };

  const submit = async () => {
    if (!po || !receiptItems.length) { toast.error('Select a purchase order with open lines.'); return; }
    setSubmitting(true);
    try {
      await grnService.createGoodsReceipt({
        purchase_order_id: po.purchase_order_id,
        warehouse_id: po.warehouse_id,
        notes,
        items: receiptItems.filter((i) => Number(i.received_quantity) > 0).map((i) => ({
          product_id: i.product_id,
          ordered_quantity: Number(i.ordered_quantity),
          received_quantity: Number(i.received_quantity),
          accepted_quantity: Number(i.accepted_quantity),
          damaged_quantity: Number(i.damaged_quantity)
        }))
      });
      toast.success('Goods receipt posted and stock updated.');
      setCreateOpen(false); setPo(null); load();
    } catch (e) {
      toast.error(e?.message || 'Goods receipt failed.');
    } finally { setSubmitting(false); }
  };

  return (
    <motion.div className="page" variants={pageStagger} initial="hidden" animate="visible">
      <motion.div variants={riseIn}>
        <PageHeader
          eyebrow="RECEIVING / DOCK INTAKE"
          title="Goods receipts"
          description="Inbound inspection records that move accepted units into warehouse stock."
          actions={
            <>
              <button className="btn btn-outline" onClick={load}><RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh</button>
              <button className="btn btn-primary" onClick={openCreate}><Plus size={11} /> Receive against PO</button>
            </>
          }
        />
      </motion.div>

      <motion.div variants={riseIn}>
        <StatGrid cols={4}>
          <Stat label="Receipts" value={formatNumber(filtered.length)} meta={`${formatNumber(rows.length)} total GRNs`} icon={PackageCheck} />
          <Stat label="Accepted" value={formatNumber(stats.accepted)} meta="Closed receipts" tone="good" />
          <Stat label="Units received" value={formatNumber(stats.received)} meta="Across visible receipts" />
          <Stat label="Damaged units" value={formatNumber(stats.damaged)} meta="Quarantined on intake" tone={stats.damaged ? 'bad' : ''} icon={AlertTriangle} />
        </StatGrid>
      </motion.div>

      <motion.div variants={riseIn}>
        <Panel>
          <div className="toolbar">
            <div className="toolbar-group">
              <label className="search-field">
                <Search size={12} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="GRN, PO, supplier or hub…" />
                {search && <button onClick={() => setSearch('')}><X size={11} /></button>}
              </label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ height: 30, fontSize: 11 }}>
                <option value="">All statuses</option>
                {['ACCEPTED', 'PARTIAL', 'INSPECTING'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{filtered.length} RECEIPTS</span>
          </div>

          {error ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--color-danger-text)', fontSize: 11 }}>{error}</div>
          ) : (
            <div className="table-scroll tall">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>GRN</th>
                    <th>Purchase order</th>
                    <th>Supplier</th>
                    <th>Receiving hub</th>
                    <th>Received</th>
                    <th style={{ textAlign: 'right' }}>Units</th>
                    <th style={{ textAlign: 'right' }}>Damaged</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 8 }).map((__, j) => <td key={j}><div className="skeleton" style={{ height: 9 }} /></td>)}</tr>
                  ))}
                  {!loading && filtered.map((r) => {
                    const units = (r.items || []).reduce((s, i) => s + Number(i.received_quantity || 0), 0);
                    const damaged = (r.items || []).reduce((s, i) => s + Number(i.damaged_quantity || 0), 0);
                    return (
                      <tr key={r.goods_receipt_id} className="clickable" onClick={() => setSelected(r)}>
                        <td className="mono" style={{ fontSize: 10 }}>{r.grn_number}</td>
                        <td className="mono" style={{ color: 'var(--color-text-secondary)' }}>{r.po_number}</td>
                        <td className="cell-strong">{r.supplier_name}</td>
                        <td>{r.warehouse_name}</td>
                        <td className="mono" style={{ color: 'var(--color-text-muted)' }}>{formatDate(r.received_date)}</td>
                        <td className="num" style={{ textAlign: 'right' }}>{formatNumber(units)}</td>
                        <td className="num" style={{ textAlign: 'right', color: damaged ? 'var(--color-danger-text)' : 'var(--color-text-muted)' }}>{formatNumber(damaged)}</td>
                        <td><StatusBadge status={r.status || 'ACCEPTED'} size="sm" /></td>
                      </tr>
                    );
                  })}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>No goods receipts match this filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </motion.div>

      <Drawer isOpen={Boolean(selected)} onClose={() => setSelected(null)}
        title={selected?.grn_number || 'Goods receipt'}
        subtitle={selected ? `${selected.po_number} · ${selected.supplier_name}` : ''}>
        {selected && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Fact label="Status" value={<StatusBadge status={selected.status || 'ACCEPTED'} size="sm" />} />
              <Fact label="Received" value={formatDate(selected.received_date)} />
              <Fact label="Hub" value={selected.warehouse_name} />
              <Fact label="PO status" value={selected.po_status} />
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 7 }}>Inspected lines</div>
              {(selected.items || []).map((i) => (
                <div key={i.goods_receipt_item_id} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 11 }}>{i.product_name}</span>
                    <span className="mono" style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{i.sku}</span>
                  </div>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {i.received_quantity} received · {i.accepted_quantity} accepted · {i.damaged_quantity} damaged
                  </div>
                </div>
              ))}
              {!selected.items?.length && <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)' }}>No lines returned.</div>}
            </div>
            {selected.notes && <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{selected.notes}</div>}
          </div>
        )}
      </Drawer>

      <Modal isOpen={createOpen} onClose={() => !submitting && setCreateOpen(false)}
        title="Receive goods" subtitle="Post an inspected receipt against an open purchase order." size="lg"
        footer={<><Button variant="ghost" disabled={submitting} onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" loading={submitting} onClick={submit}>Post receipt</Button></>}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="form-grid cols-2">
            <Select label="Open purchase order" value={po?.purchase_order_id || ''} onChange={(e) => choosePo(e.target.value)}
              options={poList.map((p) => ({ value: p.purchase_order_id, label: `${p.po_number} · ${p.supplier_name}` }))} />
            <Input label="Receiving hub" value={po?.warehouse_name || ''} disabled />
          </div>
          <Input label="Receiving notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condition, seal, inspection notes" />

          {po && (
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Open lines</div>
              <table className="data-table">
                <thead><tr><th>Item</th><th>Ordered</th><th>Receiving</th><th>Accepted</th><th>Damaged</th></tr></thead>
                <tbody>
                  {receiptItems.map((i, idx) => (
                    <tr key={i.product_id}>
                      <td>
                        <div style={{ fontSize: 10.5 }}>{i.product_name}</div>
                        <div className="mono" style={{ fontSize: 8.5, color: 'var(--color-text-muted)' }}>{i.sku}</div>
                      </td>
                      <td className="mono">{i.ordered_quantity}</td>
                      <td><input type="number" min="0" value={i.received_quantity} style={{ width: 70 }} onChange={(e) => {
                        const next = [...receiptItems];
                        next[idx] = { ...next[idx], received_quantity: e.target.value, accepted_quantity: Math.max(0, Number(e.target.value) - Number(next[idx].damaged_quantity)) };
                        setReceiptItems(next);
                      }} /></td>
                      <td><input type="number" min="0" value={i.accepted_quantity} style={{ width: 70 }} onChange={(e) => {
                        const next = [...receiptItems]; next[idx] = { ...next[idx], accepted_quantity: e.target.value }; setReceiptItems(next);
                      }} /></td>
                      <td><input type="number" min="0" value={i.damaged_quantity} style={{ width: 70 }} onChange={(e) => {
                        const next = [...receiptItems];
                        next[idx] = { ...next[idx], damaged_quantity: e.target.value, accepted_quantity: Math.max(0, Number(next[idx].received_quantity) - Number(e.target.value)) };
                        setReceiptItems(next);
                      }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!poList.length && <div className="form-hint">No purchase orders are currently open for receiving.</div>}
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

export default GoodsReceiptsPage;
