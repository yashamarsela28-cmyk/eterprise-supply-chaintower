import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Warehouse, MapPin, ArrowUpRight, X, Boxes } from 'lucide-react';
import * as warehouseService from '../services/warehouseService';
import { getWarehouseKpis, getWarehouseUtilizationKpis } from '../services/analyticsService';
import { normalizeList } from '../utils/responseNormalizer';
import { PageHeader } from '../components/common/PageHeader';
import { Panel, PanelHead, PanelBody, Stat, StatGrid, Meter } from '../components/common/Panel';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatCurrency, formatNumber, formatPercentage } from '../utils/formatters';
import { pageStagger, riseIn, popIn } from '../utils/motion';

export function WarehousesPage() {
  const [data, setData] = useState({ warehouses: [], kpis: [], util: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([warehouseService.getWarehouses(), getWarehouseKpis(), getWarehouseUtilizationKpis()])
      .then(([w, k, u]) => {
        setData({ warehouses: normalizeList(w), kpis: normalizeList(k), util: normalizeList(u) });
        setLoading(false);
      })
      .catch((e) => { setError(e?.message || 'Facility services unavailable.'); setLoading(false); });
  };
  useEffect(load, []);

  const merged = useMemo(() => data.warehouses.map((w) => {
    const k = data.kpis.find((x) => x.warehouse_id === w.warehouse_id) || {};
    const u = data.util.find((x) => x.warehouse_id === w.warehouse_id) || {};
    return { ...w, ...k, utilization: u };
  }), [data]);

  const totals = useMemo(() => merged.reduce((a, w) => {
    a.units += Number(w.total_stock_units || 0);
    a.value += Number(w.inventory_value || 0);
    a.orders += Number(w.active_orders || 0);
    a.capacity += Number(w.capacity_units || 0);
    return a;
  }, { units: 0, value: 0, orders: 0, capacity: 0 }), [merged]);

  return (
    <motion.div className="page" variants={pageStagger} initial="hidden" animate="visible">
      <motion.div variants={riseIn}>
        <PageHeader
          eyebrow="NETWORK / DISTRIBUTION CENTRES"
          title="Warehouse network"
          description="Physical capacity, occupied stock and demand load for every distribution centre in the network."
          actions={<button className="btn btn-outline" onClick={load}><RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh</button>}
        />
      </motion.div>

      <motion.div variants={riseIn}>
        <StatGrid cols={4}>
          <Stat label="Facilities" value={formatNumber(merged.length)} meta="Active distribution centres" icon={Warehouse} />
          <Stat label="Stock on hand" value={formatNumber(totals.units)} meta={`${formatNumber(totals.capacity)} unit capacity`} icon={Boxes} />
          <Stat label="Inventory value" value={formatCurrency(totals.value)} meta="Valued at unit price" />
          <Stat label="Active orders" value={formatNumber(totals.orders)} meta="Across all facilities" tone="accent" />
        </StatGrid>
      </motion.div>

      {error && (
        <Panel><PanelBody><div style={{ textAlign: 'center', padding: 20, color: 'var(--color-danger-text)', fontSize: 11 }}>{error}</div></PanelBody></Panel>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 14 }}>
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 210, borderRadius: 6 }} />
        ))}

        {!loading && merged.map((w, i) => {
          const util = Number(w.utilization?.utilization_percentage || 0);
          const tone = util > 85 ? 'bad' : util > 65 ? 'warn' : 'good';
          return (
            <motion.button
              key={w.warehouse_id}
              onClick={() => setSelected(w)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="panel"
              style={{ textAlign: 'left', padding: 0 }}
            >
              <div className="panel-head" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--color-accent)', letterSpacing: '0.08em' }}>{w.warehouse_code}</div>
                  <h3 style={{ fontSize: 12.5, marginTop: 3 }}>{w.warehouse_name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 9.5, color: 'var(--color-text-muted)' }}>
                    <MapPin size={9} /> {w.city}, {w.state} · {w.country}
                  </div>
                </div>
                <StatusBadge status={w.status || 'ACTIVE'} size="sm" />
              </div>
              <div style={{ padding: 14, display: 'grid', gap: 11 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <Figure label="Units" value={formatNumber(w.total_stock_units)} />
                  <Figure label="Value" value={formatCurrency(w.inventory_value)} />
                  <Figure label="Orders" value={formatNumber(w.active_orders)} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>Occupied capacity</span>
                    <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-secondary)' }}>{formatPercentage(util)}</span>
                  </div>
                  <Meter value={util} tone={tone} />
                  <div className="mono" style={{ fontSize: 8.5, color: 'var(--color-text-dim)', marginTop: 4 }}>
                    {formatNumber(w.utilization?.occupied_stock_units || w.total_stock_units)} / {formatNumber(w.capacity_units)} units
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 8 }}>
                  <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{w.shipments_in_transit || 0} shipments in transit</span>
                  <span style={{ fontSize: 9, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>Inspect <ArrowUpRight size={9} /></span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 45, display: 'flex', justifyContent: 'flex-end' }}
            onClick={() => setSelected(null)}
          >
            <motion.aside
              variants={popIn} initial="hidden" animate="visible" exit="exit"
              onClick={(e) => e.stopPropagation()}
              style={{ width: 380, maxWidth: '100%', height: '100%', background: 'var(--color-bg-card)', borderLeft: '1px solid var(--color-border-default)', overflowY: 'auto' }}
            >
              <div className="panel-head">
                <div>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--color-accent)' }}>{selected.warehouse_code}</div>
                  <h3 style={{ fontSize: 13, marginTop: 2 }}>{selected.warehouse_name}</h3>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => setSelected(null)}><X size={13} /></button>
              </div>
              <div style={{ padding: 16, display: 'grid', gap: 10 }}>
                <Detail label="Address" value={selected.address} />
                <Detail label="City / state" value={`${selected.city}, ${selected.state}`} />
                <Detail label="Country" value={selected.country} />
                <Detail label="Status" value={selected.status} />
                <Detail label="Capacity" value={`${formatNumber(selected.capacity_units)} units`} />
                <Detail label="On hand" value={`${formatNumber(selected.total_stock_units)} units`} />
                <Detail label="Reserved" value={`${formatNumber(selected.reserved_stock_units)} units`} />
                <Detail label="Available" value={`${formatNumber(selected.available_stock_units)} units`} />
                <Detail label="Inventory value" value={formatCurrency(selected.inventory_value)} />
                <Detail label="Occupied locations" value={`${selected.utilization?.occupied_locations ?? '—'} of ${selected.utilization?.total_locations ?? '—'}`} />
                <Detail label="Utilisation" value={formatPercentage(selected.utilization?.utilization_percentage || 0)} />
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Figure({ label, value }) {
  return (
    <div>
      <div className="eyebrow" style={{ fontSize: 8 }}>{label}</div>
      <div className="mono truncate" style={{ fontSize: 10.5, marginTop: 3, color: 'var(--color-text-primary)' }}>{value}</div>
    </div>
  );
}
function Detail({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 8, borderBottom: '1px solid var(--color-border-subtle)' }}>
      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ fontSize: 10.5, color: 'var(--color-text-primary)', textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );
}

export default WarehousesPage;
