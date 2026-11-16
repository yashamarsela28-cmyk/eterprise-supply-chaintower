import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Search, X, Building2, Star, TrendingUp } from 'lucide-react';
import * as supplierService from '../services/supplierService';
import { getPurchaseOrderPerformance } from '../services/analyticsService';
import { normalizeList } from '../utils/responseNormalizer';
import { PageHeader } from '../components/common/PageHeader';
import { Panel, PanelHead, PanelBody, Stat, StatGrid, Meter } from '../components/common/Panel';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatCurrency, formatNumber, formatPercentage } from '../utils/formatters';
import { pageStagger, riseIn } from '../utils/motion';

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true); setError(null);
    Promise.all([supplierService.getSuppliers({ limit: 200 }), getPurchaseOrderPerformance()])
      .then(([s, po]) => {
        setSuppliers(normalizeList(s));
        setPurchaseOrders(normalizeList(po));
        setLoading(false);
      })
      .catch((e) => { setError(e?.message || 'Supplier service unavailable.'); setLoading(false); });
  };
  useEffect(load, []);

  // Aggregate from the purchase-order ledger. The supplier KPI view fans out across
  // PO lines and overstates committed spend, so it is not used for money figures.
  const poBySupplier = useMemo(() => {
    const map = new Map();
    purchaseOrders.forEach((p) => {
      const key = p.supplier_name;
      const cur = map.get(key) || { count: 0, spend: 0, completed: 0, ordered: 0, received: 0 };
      cur.count += 1;
      cur.spend += Number(p.total_amount || 0);
      if (p.status === 'RECEIVED') cur.completed += 1;
      cur.ordered += Number(p.ordered_units || 0);
      cur.received += Number(p.received_units || 0);
      map.set(key, cur);
    });
    return map;
  }, [purchaseOrders]);

  const merged = useMemo(() => suppliers.map((s) => {
    const po = poBySupplier.get(s.supplier_name) || { count: 0, spend: 0, completed: 0, ordered: 0, received: 0 };
    return {
      ...s,
      po_count: po.count,
      po_spend: po.spend,
      po_completed: po.completed,
      po_receipt_rate: po.ordered ? (po.received / po.ordered) * 100 : 0,
      completion_rate: po.count ? (po.completed / po.count) * 100 : 0
    };
  }), [suppliers, poBySupplier]);

  const filtered = useMemo(() => merged.filter((s) => {
    const q = search.trim().toLowerCase();
    return !q || [s.supplier_name, s.supplier_code, s.city, s.contact_person].some((v) => String(v || '').toLowerCase().includes(q));
  }), [merged, search]);

  const stats = useMemo(() => filtered.reduce((a, s) => {
    a.spend += Number(s.po_spend || 0);
    a.orders += Number(s.po_count || 0);
    if (s.status === 'ACTIVE') a.active += 1;
    a.rating += Number(s.supplier_rating || 0);
    return a;
  }, { spend: 0, orders: 0, active: 0, rating: 0 }), [filtered]);

  const ranked = useMemo(() => [...filtered].sort((a, b) => Number(b.po_spend || 0) - Number(a.po_spend || 0)).slice(0, 5), [filtered]);

  return (
    <motion.div className="page" variants={pageStagger} initial="hidden" animate="visible">
      <motion.div variants={riseIn}>
        <PageHeader
          eyebrow="PROCUREMENT / VENDOR NETWORK"
          title="Suppliers"
          description="Vendor reliability, committed spend and completion performance across the inbound network."
          actions={<button className="btn btn-outline" onClick={load}><RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh</button>}
        />
      </motion.div>

      <motion.div variants={riseIn}>
        <StatGrid cols={4}>
          <Stat label="Suppliers" value={formatNumber(filtered.length)} meta={`${formatNumber(suppliers.length)} on record`} icon={Building2} />
          <Stat label="Active" value={formatNumber(stats.active)} meta="Trading relationships" tone="good" />
          <Stat label="Committed spend" value={formatCurrency(stats.spend)} meta={`${formatNumber(stats.orders)} purchase orders`} />
          <Stat label="Average rating" value={filtered.length ? (stats.rating / filtered.length).toFixed(2) : '—'} meta="Out of 5.00" icon={Star} />
        </StatGrid>
      </motion.div>

      <div className="split split-aside">
        <motion.div variants={riseIn} style={{ minWidth: 0 }}>
          <Panel>
            <div className="toolbar">
              <label className="search-field">
                <Search size={12} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Supplier, code, city or contact…" />
                {search && <button onClick={() => setSearch('')}><X size={11} /></button>}
              </label>
              <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{filtered.length} VENDORS</span>
            </div>

            {error ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--color-danger-text)', fontSize: 11 }}>{error}</div>
            ) : (
              <div className="table-scroll tall">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Location</th>
                      <th>Contact</th>
                      <th style={{ textAlign: 'right' }}>POs</th>
                      <th style={{ width: 120 }}>Completion</th>
                      <th style={{ textAlign: 'right' }}>Spend</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 7 }).map((__, j) => <td key={j}><div className="skeleton" style={{ height: 9 }} /></td>)}</tr>
                    ))}
                    {!loading && filtered.map((s) => (
                      <tr key={s.supplier_id} className="clickable" onClick={() => setSelected(s)}>
                        <td>
                          <div className="cell-strong">{s.supplier_name}</div>
                          <div className="cell-sub mono">{s.supplier_code} · ★ {Number(s.supplier_rating || 0).toFixed(1)}</div>
                        </td>
                        <td>{s.city}{s.state ? `, ${s.state}` : ''}</td>
                        <td>
                          <div style={{ fontSize: 10.5 }}>{s.contact_person || '—'}</div>
                          <div className="cell-sub">{s.email}</div>
                        </td>
                        <td className="mono" style={{ textAlign: 'right' }}>{formatNumber(s.po_count)}</td>
                        <td>
                          <Meter value={s.completion_rate} tone={s.completion_rate > 70 ? 'good' : 'warn'} />
                          <div className="mono" style={{ fontSize: 8, color: 'var(--color-text-muted)', marginTop: 3 }}>{formatPercentage(s.completion_rate)}</div>
                        </td>
                        <td className="num" style={{ textAlign: 'right' }}>{formatCurrency(s.po_spend)}</td>
                        <td><StatusBadge status={s.status || 'ACTIVE'} size="sm" /></td>
                      </tr>
                    ))}
                    {!loading && filtered.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>No suppliers match this search.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </motion.div>

        <motion.div variants={riseIn} style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <Panel>
            <PanelHead title="Spend concentration" subtitle="Top vendors by committed value" action={<TrendingUp size={12} style={{ color: 'var(--color-text-muted)' }} />} />
            <PanelBody style={{ display: 'grid', gap: 11 }}>
              {ranked.map((s) => (
                <button key={s.supplier_id} onClick={() => setSelected(s)} style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
                    <span className="truncate" style={{ fontSize: 10.5, color: 'var(--color-text-secondary)' }}>{s.supplier_name}</span>
                    <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{formatCurrency(s.po_spend)}</span>
                  </div>
                  <Meter value={stats.spend ? (Number(s.po_spend) / stats.spend) * 100 : 0} />
                </button>
              ))}
              {ranked.length === 0 && !loading && <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)' }}>No supplier spend recorded.</div>}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead title="Vendor inspector" subtitle={selected ? selected.supplier_name : 'Select a supplier'} />
            <PanelBody>
              {!selected ? (
                <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>Select a supplier to inspect contact details and fulfilment performance.</div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  <Row label="Code" value={selected.supplier_code} />
                  <Row label="Contact" value={selected.contact_person} />
                  <Row label="Email" value={selected.email} />
                  <Row label="Phone" value={selected.phone} />
                  <Row label="Location" value={`${selected.city}, ${selected.country}`} />
                  <Row label="Rating" value={`${Number(selected.supplier_rating || 0).toFixed(1)} / 5.0`} />
                  <Row label="Orders" value={`${selected.po_completed} completed of ${selected.po_count}`} />
                  <Row label="Spend" value={formatCurrency(selected.po_spend)} />
                  <Row label="Units received" value={formatPercentage(selected.po_receipt_rate)} />
                </div>
              )}
            </PanelBody>
          </Panel>
        </motion.div>
      </div>
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

export default SuppliersPage;
