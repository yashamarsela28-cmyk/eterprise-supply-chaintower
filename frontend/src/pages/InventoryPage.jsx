import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Search, X, SlidersHorizontal, AlertTriangle, Boxes, Check } from 'lucide-react';
import * as inventoryService from '../services/inventoryService';
import { normalizeList } from '../utils/responseNormalizer';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import { Panel, PanelHead, PanelBody, Stat, StatGrid, Meter } from '../components/common/Panel';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { Input } from '../components/common/Input';
import { formatNumber } from '../utils/formatters';
import { pageStagger, riseIn } from '../utils/motion';

const PAGE_SIZE = 20;

export function InventoryPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [adjust, setAdjust] = useState({ quantity: '', reason: 'Cycle count reconciliation', notes: '' });

  const load = () => {
    setLoading(true);
    setError(null);
    inventoryService
      .getInventory({ limit: 200 })
      .then((res) => { setRows(normalizeList(res)); setLoading(false); })
      .catch((e) => { setError(e?.message || 'Inventory service unavailable.'); setLoading(false); });
  };
  useEffect(load, []);

  const warehouses = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => map.set(r.warehouse_id, r.warehouse_name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rows]);

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.trim().toLowerCase();
    const match = !q || [r.product_name, r.sku, r.warehouse_name].some((v) => String(v || '').toLowerCase().includes(q));
    return match && (!warehouse || String(r.warehouse_id) === warehouse);
  }), [rows, search, warehouse]);

  const stats = useMemo(() => filtered.reduce((acc, r) => {
    acc.onHand += Number(r.quantity_on_hand || 0);
    acc.reserved += Number(r.quantity_reserved || 0);
    acc.available += Number(r.quantity_available || 0);
    if (Number(r.quantity_available || 0) <= Number(r.reorder_level || 0)) acc.below += 1;
    return acc;
  }, { onHand: 0, reserved: 0, available: 0, below: 0 }), [filtered]);

  const concentration = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      const key = r.warehouse_name || 'Unassigned';
      map[key] = (map[key] || 0) + Number(r.quantity_on_hand || 0);
    });
    const total = Object.values(map).reduce((s, n) => s + n, 0) || 1;
    return Object.entries(map).map(([name, units]) => ({ name, units, pct: (units / total) * 100 })).sort((a, b) => b.units - a.units);
  }, [filtered]);

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => setPage(1), [search, warehouse]);

  const openAdjust = (row) => { setSelected(row); setAdjust({ quantity: '', reason: 'Cycle count reconciliation', notes: '' }); setAdjustOpen(true); };

  const submitAdjust = async () => {
    const qty = Number(adjust.quantity);
    if (!selected || !qty) { toast.error('Enter a non-zero adjustment quantity.'); return; }
    setSubmitting(true);
    try {
      await inventoryService.adjustStock({
        inventory_id: selected.inventory_id,
        adjustment_quantity: qty,
        reason: adjust.reason,
        notes: adjust.notes,
        performed_by: 1
      });
      toast.success(`Stock adjusted by ${qty > 0 ? '+' : ''}${qty} for ${selected.product_name}.`);
      setAdjustOpen(false);
      load();
    } catch (err) {
      toast.error(err?.message || 'Stock adjustment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div className="page" variants={pageStagger} initial="hidden" animate="visible">
      <motion.div variants={riseIn}>
        <PageHeader
          eyebrow="INVENTORY / STOCK POSITION"
          title="Inventory control"
          description="Live quantities by product and facility, with reserved stock separated from what can actually be promised."
          actions={<button className="btn btn-outline" onClick={load}><RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh</button>}
        />
      </motion.div>

      <motion.div variants={riseIn}>
        <StatGrid cols={4}>
          <Stat label="On hand" value={formatNumber(stats.onHand)} meta={`${filtered.length} stock records`} icon={Boxes} />
          <Stat label="Available to promise" value={formatNumber(stats.available)} meta="After reservations" tone="good" />
          <Stat label="Reserved" value={formatNumber(stats.reserved)} meta="Committed to demand" />
          <Stat label="Below reorder" value={formatNumber(stats.below)} meta="Requires replenishment" tone={stats.below ? 'warn' : ''} icon={AlertTriangle} />
        </StatGrid>
      </motion.div>

      <div className="split split-aside-wide">
        <motion.div variants={riseIn} style={{ minWidth: 0 }}>
          <Panel>
            <div className="toolbar">
              <div className="toolbar-group">
                <label className="search-field">
                  <Search size={12} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Product, SKU or facility…" />
                  {search && <button onClick={() => setSearch('')}><X size={11} /></button>}
                </label>
                <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} style={{ height: 30, fontSize: 11 }}>
                  <option value="">All facilities</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{filtered.length} RECORDS</span>
            </div>

            {error && (
              <div style={{ padding: 30, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--color-danger-text)' }}>{error}</div>
                <button className="btn btn-outline" style={{ marginTop: 10 }} onClick={load}>Retry</button>
              </div>
            )}

            {!error && (
              <div className="table-scroll tall">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Facility</th>
                      <th style={{ textAlign: 'right' }}>On hand</th>
                      <th style={{ textAlign: 'right' }}>Reserved</th>
                      <th style={{ textAlign: 'right' }}>Available</th>
                      <th style={{ width: 120 }}>Cover</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {loading && Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 7 }).map((__, j) => <td key={j}><div className="skeleton" style={{ height: 9 }} /></td>)}</tr>
                    ))}
                    {!loading && pageRows.map((r) => {
                      const available = Number(r.quantity_available || 0);
                      const reorder = Number(r.reorder_level || 0);
                      const ratio = reorder ? Math.min(100, (available / (reorder * 2)) * 100) : 100;
                      const low = available <= reorder;
                      return (
                        <tr key={r.inventory_id} className="clickable" onClick={() => setSelected(r)}>
                          <td>
                            <div className="cell-strong">{r.product_name}</div>
                            <div className="cell-sub mono">{r.sku}</div>
                          </td>
                          <td>
                            <div style={{ color: 'var(--color-text-secondary)' }}>{r.warehouse_name}</div>
                            <div className="cell-sub mono">{r.warehouse_code}</div>
                          </td>
                          <td className="num" style={{ textAlign: 'right' }}>{formatNumber(r.quantity_on_hand)}</td>
                          <td className="num" style={{ textAlign: 'right', color: 'var(--color-warning-text)' }}>{formatNumber(r.quantity_reserved)}</td>
                          <td className="num" style={{ textAlign: 'right', color: low ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>{formatNumber(available)}</td>
                          <td>
                            <Meter value={ratio} tone={low ? 'bad' : 'good'} />
                            <div className="mono" style={{ fontSize: 8, color: 'var(--color-text-muted)', marginTop: 3 }}>ROP {formatNumber(reorder)}</div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-ghost btn-icon" onClick={(e) => { e.stopPropagation(); openAdjust(r); }} title="Adjust stock">
                              <SlidersHorizontal size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {!loading && pageRows.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>No stock records match this filter.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderTop: '1px solid var(--color-border-subtle)' }}>
              <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>
                {filtered.length ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}` : '0 records'}
              </span>
              <div style={{ display: 'flex', gap: 5 }}>
                <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <button className="btn btn-ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          </Panel>
        </motion.div>

        <motion.div variants={riseIn} style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <Panel>
            <PanelHead title="Stock concentration" subtitle="On-hand units by facility" />
            <PanelBody style={{ display: 'grid', gap: 12 }}>
              {concentration.map((c) => (
                <div key={c.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10.5, color: 'var(--color-text-secondary)' }}>{c.name}</span>
                    <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{formatNumber(c.units)}</span>
                  </div>
                  <Meter value={c.pct} />
                </div>
              ))}
              {concentration.length === 0 && <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)' }}>No stock to chart.</div>}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead title="Selected record" subtitle={selected ? selected.product_name : 'Choose a row to inspect'} />
            <PanelBody>
              {!selected ? (
                <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  Select an inventory row to see its facility, reorder point and adjustment control.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 9 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{selected.sku}</span>
                    <StatusBadge status={Number(selected.quantity_available) <= Number(selected.reorder_level) ? 'LOW_STOCK' : 'IN_STOCK'} size="sm" />
                  </div>
                  <Detail label="Facility" value={selected.warehouse_name} />
                  <Detail label="Location capacity" value={`${formatNumber(selected.quantity_on_hand)} on hand`} />
                  <Detail label="Reorder level" value={formatNumber(selected.reorder_level)} />
                  <Detail label="Last counted" value={selected.last_counted_at ? new Date(selected.last_counted_at).toLocaleDateString() : 'Not recorded'} />
                  <button className="btn btn-primary" style={{ marginTop: 4 }} onClick={() => openAdjust(selected)}>
                    <SlidersHorizontal size={11} /> Adjust stock
                  </button>
                </div>
              )}
            </PanelBody>
          </Panel>
        </motion.div>
      </div>

      <Modal
        isOpen={adjustOpen}
        onClose={() => !submitting && setAdjustOpen(false)}
        title="Adjust stock"
        subtitle={selected ? `${selected.product_name} · ${selected.warehouse_name}` : ''}
        size="sm"
        footer={
          <>
            <Button variant="ghost" disabled={submitting} onClick={() => setAdjustOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={submitting} onClick={submitAdjust}><Check size={12} /> Commit adjustment</Button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-hint">
            Quantities are signed. Use a negative value to remove damaged or lost units. Adjustment will fail if it takes
            on-hand stock below the reserved quantity.
          </div>
          <Input
            label="Adjustment quantity"
            type="number"
            value={adjust.quantity}
            onChange={(e) => setAdjust({ ...adjust, quantity: e.target.value })}
            placeholder="e.g. -3 or 25"
          />
          <Select
            label="Reason"
            value={adjust.reason}
            onChange={(e) => setAdjust({ ...adjust, reason: e.target.value })}
            options={[
              { value: 'Cycle count reconciliation', label: 'Cycle count reconciliation' },
              { value: 'Damaged goods', label: 'Damaged goods' },
              { value: 'Stock received', label: 'Stock received' },
              { value: 'Quality hold', label: 'Quality hold' }
            ]}
          />
          <Input
            label="Notes"
            value={adjust.notes}
            onChange={(e) => setAdjust({ ...adjust, notes: e.target.value })}
            placeholder="Optional audit note"
          />
        </div>
      </Modal>
    </motion.div>
  );
}

function Detail({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, paddingBottom: 7, borderBottom: '1px solid var(--color-border-subtle)' }}>
      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ fontSize: 10.5, color: 'var(--color-text-primary)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default InventoryPage;
