import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, BarChart3, ShieldAlert, Truck, Factory, RotateCcw } from 'lucide-react';
import {
  getSupplyChainScorecard, getWarehouseKpis, getWarehouseUtilizationKpis,
  getSupplierKpis, getShipmentKpis, getSupplyChainRiskKpis,
  getInventoryAgingKpis, getPurchaseOrderPerformance, getReturnsQualityKpis
} from '../services/analyticsService';
import * as invoiceService from '../services/invoiceService';
import * as customerService from '../services/customerService';
import { normalizeList, normalizeObject } from '../utils/responseNormalizer';
import { PageHeader } from '../components/common/PageHeader';
import { Panel, PanelHead, PanelBody, Stat, StatGrid, Meter } from '../components/common/Panel';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { formatCurrency, formatNumber, formatPercentage } from '../utils/formatters';
import { pageStagger, riseIn } from '../utils/motion';

const VIEWS = [
  { id: 'executive', label: 'Executive', icon: BarChart3 },
  { id: 'network', label: 'Network', icon: Factory },
  { id: 'procurement', label: 'Procurement', icon: Truck },
  { id: 'quality', label: 'Quality', icon: RotateCcw }
];

function countBy(rows, key) {
  const m = {};
  rows.forEach((r) => { const k = r[key] || 'UNKNOWN'; m[k] = (m[k] || 0) + 1; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}

export function AnalyticsPage() {
  const [view, setView] = useState('executive');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true); setError(null);
    Promise.all([
      getSupplyChainScorecard(), getWarehouseKpis(), getWarehouseUtilizationKpis(),
      getSupplierKpis(), getShipmentKpis(), getSupplyChainRiskKpis(),
      getInventoryAgingKpis(), getPurchaseOrderPerformance(), getReturnsQualityKpis(),
      invoiceService.getInvoices({ limit: 200 }), customerService.getCustomers({ limit: 200 })
    ]).then(([score, wh, util, sup, ship, risk, aging, po, ret, inv, cust]) => {
      setData({
        score: normalizeObject(score),
        warehouses: normalizeList(wh),
        utilization: normalizeList(util),
        suppliers: normalizeList(sup),
        shipments: normalizeList(ship),
        risk: normalizeList(risk),
        aging: normalizeList(aging),
        purchaseOrders: normalizeList(po),
        returns: normalizeList(ret),
        invoices: normalizeList(inv),
        customers: normalizeList(cust)
      });
      setLoading(false);
    }).catch((e) => { setError(e?.message || 'Analytics service unavailable.'); setLoading(false); });
  };
  useEffect(load, []);

  const derived = useMemo(() => {
    if (!data) return {};
    const shipStatus = countBy(data.shipments, 'status');
    const shipPerf = countBy(data.shipments, 'delivery_performance');
    const whValue = [...data.warehouses].sort((a, b) => Number(b.inventory_value) - Number(a.inventory_value));
    const agingStatus = countBy(data.aging, 'aging_status');
    const retReasons = countBy(data.returns, 'reason');
    const retQuality = countBy(data.returns, 'quality_status');
    const poPerf = countBy(data.purchaseOrders, 'delivery_performance');

    // Supplier and account money is aggregated from transaction ledgers: the
    // supplier/receivables analytical views fan out across child rows.
    const supplierMap = new Map();
    data.purchaseOrders.forEach((p) => {
      const cur = supplierMap.get(p.supplier_name) || { name: p.supplier_name, count: 0, spend: 0, completed: 0 };
      cur.count += 1;
      cur.spend += Number(p.total_amount || 0);
      if (p.status === 'RECEIVED') cur.completed += 1;
      supplierMap.set(p.supplier_name, cur);
    });
    const supplierRows = [...supplierMap.values()].map((s) => {
      const profile = data.suppliers.find((x) => x.supplier_name === s.name) || {};
      return {
        ...s,
        rating: Number(profile.supplier_rating || 0),
        completion: s.count ? (s.completed / s.count) * 100 : 0
      };
    }).sort((a, b) => b.spend - a.spend);

    const accountMap = new Map();
    data.invoices.forEach((i) => {
      if (i.status === 'CANCELLED') return;
      const cur = accountMap.get(i.customer_name) || {
        name: i.customer_name,
        type: (data.customers.find((c) => c.customer_name === i.customer_name) || {}).customer_type || '—',
        invoiced: 0, paid: 0, outstanding: 0, overdue: 0
      };
      cur.invoiced += Number(i.total_amount || 0);
      cur.paid += Number(i.paid_amount || 0);
      cur.outstanding += Number(i.outstanding_amount || 0);
      if (i.status === 'OVERDUE') cur.overdue += 1;
      accountMap.set(i.customer_name, cur);
    });
    const accountRows = [...accountMap.values()].sort((a, b) => b.outstanding - a.outstanding);

    return { shipStatus, shipPerf, whValue, agingStatus, retReasons, retQuality, poPerf, supplierRows, accountRows };
  }, [data]);

  if (loading) return <LoadingState message="Calculating network analytics…" fullPage />;
  if (error) return <ErrorState title="Analytics unavailable" message={error} onRetry={load} />;

  const { score = {}, warehouses = [], utilization = [], suppliers = [], shipments = [], risk = [], aging = [], purchaseOrders = [], returns = [] } = data;

  return (
    <motion.div className="page" variants={pageStagger} initial="hidden" animate="visible">
      <motion.div variants={riseIn}>
        <PageHeader
          eyebrow="ANALYTICS / MULTI-ECHELON"
          title="Supply chain report"
          description="Warehouse economics, carrier performance, procurement reliability and reverse-logistics quality from the live analytical views."
          actions={<button className="btn btn-outline" onClick={load}><RefreshCw size={11} /> Recalculate</button>}
        />
      </motion.div>

      <motion.div variants={riseIn} className="chips">
        {VIEWS.map((v) => {
          const Icon = v.icon;
          return (
            <button key={v.id} className={`chip${view === v.id ? ' active' : ''}`} onClick={() => setView(v.id)}>
              <Icon size={11} /> {v.label}
            </button>
          );
        })}
      </motion.div>

      <motion.div
        key={view}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
          {view === 'executive' && (
            <div style={{ display: 'grid', gap: 14 }}>
              <StatGrid cols={4}>
                <Stat label="Inventory units" value={formatNumber(score.total_inventory_units)} meta={`${formatNumber(score.active_products)} active SKUs`} />
                <Stat label="Order execution" value={formatPercentage(score.order_execution_rate)} meta="Completed order rate" tone="good" />
                <Stat label="On-time delivery" value={formatPercentage(score.on_time_delivery_rate)} meta="Carrier SLA" tone="good" />
                <Stat label="Receivables" value={formatCurrency(score.outstanding_receivables)} meta={`${score.overdue_invoices || 0} overdue invoices`} tone="warn" />
              </StatGrid>

              <div className="split split-2">
                <Panel>
                  <PanelHead title="Execution health" subtitle="Order, procurement and delivery completion" />
                  <PanelBody style={{ display: 'grid', gap: 14 }}>
                    <Meter label="Order execution" right={formatPercentage(score.order_execution_rate)} value={score.order_execution_rate} tone="good" />
                    <Meter label="Purchase completion" right={formatPercentage(score.purchase_completion_rate)} value={score.purchase_completion_rate} tone="warn" />
                    <Meter label="On-time delivery" right={formatPercentage(score.on_time_delivery_rate)} value={score.on_time_delivery_rate} tone="good" />
                  </PanelBody>
                </Panel>

                <Panel>
                  <PanelHead title="Risk register" subtitle="Threshold breaches by category" action={<ShieldAlert size={12} style={{ color: 'var(--color-text-muted)' }} />} />
                  <PanelBody style={{ display: 'grid', gap: 6 }}>
                    {risk.map((r) => (
                      <div key={r.risk_type} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <span style={{ flex: 1, fontSize: 10.5, color: 'var(--color-text-secondary)' }}>{r.risk_type.replace(/_/g, ' ')}</span>
                        <span className="mono" style={{ fontSize: 11 }}>{r.risk_count}</span>
                        <span className={`badge badge-${r.risk_level === 'CRITICAL' ? 'danger' : r.risk_level === 'WARNING' ? 'warning' : 'neutral'}`}>{r.risk_level}</span>
                      </div>
                    ))}
                  </PanelBody>
                </Panel>
              </div>

              <div className="split split-2">
                <Panel>
                  <PanelHead title="Inventory value by facility" subtitle="Capital held per distribution centre" />
                  <PanelBody style={{ display: 'grid', gap: 11 }}>
                    {derived.whValue?.map((w) => {
                      const max = Math.max(...warehouses.map((x) => Number(x.inventory_value) || 1));
                      return (
                        <div key={w.warehouse_id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 10.5, color: 'var(--color-text-secondary)' }}>{w.warehouse_name}</span>
                            <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{formatCurrency(w.inventory_value)}</span>
                          </div>
                          <Meter value={(Number(w.inventory_value) / max) * 100} />
                        </div>
                      );
                    })}
                  </PanelBody>
                </Panel>

                <Panel>
                  <PanelHead title="Shipment status mix" subtitle={`${formatNumber(shipments.length)} tracked movements`} />
                  <PanelBody style={{ display: 'grid', gap: 9 }}>
                    {derived.shipStatus?.map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span style={{ width: 88, fontSize: 10, color: 'var(--color-text-secondary)' }}>{k.replace('_', ' ')}</span>
                        <div style={{ flex: 1 }}><Meter value={(v / shipments.length) * 100} /></div>
                        <span className="mono" style={{ width: 24, textAlign: 'right', fontSize: 10 }}>{v}</span>
                      </div>
                    ))}
                  </PanelBody>
                </Panel>
              </div>
            </div>
          )}

          {view === 'network' && (
            <div style={{ display: 'grid', gap: 14 }}>
              <StatGrid cols={4}>
                <Stat label="Facilities" value={formatNumber(warehouses.length)} meta="Distribution centres" />
                <Stat label="Stock units" value={formatNumber(warehouses.reduce((s, w) => s + Number(w.total_stock_units || 0), 0))} meta="Across the network" />
                <Stat label="Inventory value" value={formatCurrency(warehouses.reduce((s, w) => s + Number(w.inventory_value || 0), 0))} meta="Valued stock" />
                <Stat label="In transit" value={formatNumber(warehouses.reduce((s, w) => s + Number(w.shipments_in_transit || 0), 0))} meta="Active outbound freight" tone="accent" />
              </StatGrid>

              <Panel>
                <PanelHead title="Facility scorecard" subtitle="Capacity, stock and demand load by hub" />
                <PanelBody flush>
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Facility</th><th>City</th>
                          <th style={{ textAlign: 'right' }}>Units</th>
                          <th style={{ textAlign: 'right' }}>Reserved</th>
                          <th style={{ textAlign: 'right' }}>Value</th>
                          <th style={{ width: 150 }}>Capacity used</th>
                          <th style={{ textAlign: 'right' }}>Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {warehouses.map((w) => {
                          const u = utilization.find((x) => x.warehouse_id === w.warehouse_id);
                          return (
                            <tr key={w.warehouse_id}>
                              <td><div className="cell-strong">{w.warehouse_name}</div><div className="cell-sub mono">{w.warehouse_code}</div></td>
                              <td>{w.city}</td>
                              <td className="mono" style={{ textAlign: 'right' }}>{formatNumber(w.total_stock_units)}</td>
                              <td className="mono" style={{ textAlign: 'right' }}>{formatNumber(w.reserved_stock_units)}</td>
                              <td className="num" style={{ textAlign: 'right' }}>{formatCurrency(w.inventory_value)}</td>
                              <td>
                                <Meter value={u?.utilization_percentage || 0} tone={(u?.utilization_percentage || 0) > 85 ? 'bad' : 'good'} />
                                <div className="mono" style={{ fontSize: 8, color: 'var(--color-text-muted)', marginTop: 3 }}>{formatPercentage(u?.utilization_percentage || 0)}</div>
                              </td>
                              <td className="mono" style={{ textAlign: 'right' }}>{formatNumber(w.active_orders)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </PanelBody>
              </Panel>

              <div className="split split-2">
                <Panel>
                  <PanelHead title="Inventory aging" subtitle="Batch status across all facilities" />
                  <PanelBody style={{ display: 'grid', gap: 10 }}>
                    {derived.agingStatus?.map(([k, v]) => (
                      <div key={k}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 10.5, color: 'var(--color-text-secondary)' }}>{k.replace('_', ' ')}</span>
                          <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{v} batches</span>
                        </div>
                        <Meter value={(v / Math.max(1, aging.length)) * 100} tone={k === 'EXPIRED' ? 'bad' : k === 'AGING' ? 'warn' : 'good'} />
                      </div>
                    ))}
                  </PanelBody>
                </Panel>
                <Panel>
                  <PanelHead title="Delivery performance" subtitle="Shipment outcomes by SLA" />
                  <PanelBody style={{ display: 'grid', gap: 10 }}>
                    {derived.shipPerf?.map(([k, v]) => (
                      <div key={k}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 10.5, color: 'var(--color-text-secondary)' }}>{k.replace('_', ' ')}</span>
                          <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{v} shipments</span>
                        </div>
                        <Meter value={(v / Math.max(1, shipments.length)) * 100} tone={k === 'LATE' ? 'bad' : 'good'} />
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Total freight cost</span>
                      <span className="mono" style={{ fontSize: 10 }}>{formatCurrency(shipments.reduce((s, x) => s + Number(x.shipping_cost || 0), 0))}</span>
                    </div>
                  </PanelBody>
                </Panel>
              </div>
            </div>
          )}

          {view === 'procurement' && (
            <div style={{ display: 'grid', gap: 14 }}>
              <StatGrid cols={4}>
                <Stat label="Suppliers" value={formatNumber(suppliers.length)} meta="Active vendor records" />
                <Stat label="Committed spend" value={formatCurrency(purchaseOrders.reduce((s, x) => s + Number(x.total_amount || 0), 0))} meta="Total PO value" />
                <Stat label="Open POs" value={formatNumber(purchaseOrders.filter((p) => !['RECEIVED', 'CANCELLED'].includes(p.status)).length)} meta="Inbound in progress" tone="accent" />
                <Stat label="Completed POs" value={formatNumber(purchaseOrders.filter((p) => p.status === 'RECEIVED').length)} meta="Fully received" tone="good" />
              </StatGrid>

              <div className="split split-2">
                <Panel>
                  <PanelHead title="Supplier spend" subtitle="Committed value by vendor" />
                  <PanelBody style={{ display: 'grid', gap: 10 }}>
                    {derived.supplierRows?.map((s) => {
                      const max = derived.supplierRows[0]?.spend || 1;
                      return (
                        <div key={s.name}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
                            <span className="truncate" style={{ fontSize: 10.5, color: 'var(--color-text-secondary)' }}>{s.name}</span>
                            <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{formatCurrency(s.spend)}</span>
                          </div>
                          <Meter value={(s.spend / max) * 100} />
                        </div>
                      );
                    })}
                  </PanelBody>
                </Panel>

                <Panel>
                  <PanelHead title="Supplier reliability" subtitle="Completion rate and rating" />
                  <PanelBody style={{ display: 'grid', gap: 0 }}>
                    {[...(derived.supplierRows || [])].sort((a, b) => b.completion - a.completion).map((s) => (
                      <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <span className="truncate" style={{ flex: 1, fontSize: 10.5 }}>{s.name}</span>
                        <span className="mono" style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>★ {s.rating.toFixed(1)}</span>
                        <span className="mono" style={{ fontSize: 10, width: 44, textAlign: 'right' }}>{formatPercentage(s.completion)}</span>
                      </div>
                    ))}
                  </PanelBody>
                </Panel>
              </div>

              <Panel>
                <PanelHead title="Purchase order receipt performance" subtitle="Ordered vs received units and delivery status" />
                <PanelBody flush>
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead>
                        <tr><th>PO</th><th>Supplier</th><th>Hub</th><th style={{ textAlign: 'right' }}>Ordered</th><th style={{ textAlign: 'right' }}>Received</th><th style={{ width: 150 }}>Receipt</th><th>Performance</th></tr>
                      </thead>
                      <tbody>
                        {purchaseOrders.slice(0, 14).map((p) => (
                          <tr key={p.purchase_order_id}>
                            <td className="mono" style={{ fontSize: 10 }}>{p.po_number}</td>
                            <td className="cell-strong">{p.supplier_name}</td>
                            <td>{p.warehouse_name}</td>
                            <td className="mono" style={{ textAlign: 'right' }}>{formatNumber(p.ordered_units)}</td>
                            <td className="mono" style={{ textAlign: 'right' }}>{formatNumber(p.received_units)}</td>
                            <td><Meter value={p.receiving_percentage} tone={p.receiving_percentage >= 100 ? 'good' : 'warn'} /></td>
                            <td style={{ fontSize: 10 }}>{p.delivery_performance?.replace('_', ' ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </PanelBody>
              </Panel>
            </div>
          )}

          {view === 'quality' && (
            <div style={{ display: 'grid', gap: 14 }}>
              <StatGrid cols={4}>
                <Stat label="Returns" value={formatNumber(returns.length)} meta="Reverse-logistics cases" />
                <Stat label="Quality issues" value={formatNumber(returns.reduce((s, r) => s + Number(r.quality_issue_units || 0), 0))} meta="Units flagged" tone="bad" />
                <Stat label="Received units" value={formatNumber(returns.reduce((s, r) => s + Number(r.received_units || 0), 0))} meta="Inspected back into stock" />
                <Stat label="Receivable accounts" value={formatNumber(derived.accountRows?.filter((r) => r.outstanding > 0).length || 0)} meta={`${formatNumber(score.overdue_invoices || 0)} overdue invoices`} tone="warn" />
              </StatGrid>

              <div className="split split-2">
                <Panel>
                  <PanelHead title="Return reasons" subtitle="Why customers send stock back" />
                  <PanelBody style={{ display: 'grid', gap: 10 }}>
                    {derived.retReasons?.map(([k, v]) => (
                      <div key={k}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 10.5, color: 'var(--color-text-secondary)' }}>{k.replace(/_/g, ' ')}</span>
                          <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{v}</span>
                        </div>
                        <Meter value={(v / Math.max(1, returns.length)) * 100} tone="warn" />
                      </div>
                    ))}
                  </PanelBody>
                </Panel>
                <Panel>
                  <PanelHead title="Quality disposition" subtitle="Inspection outcomes of returns" />
                  <PanelBody style={{ display: 'grid', gap: 10 }}>
                    {derived.retQuality?.map(([k, v]) => (
                      <div key={k}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 10.5, color: 'var(--color-text-secondary)' }}>{k.replace(/_/g, ' ')}</span>
                          <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{v}</span>
                        </div>
                        <Meter value={(v / Math.max(1, returns.length)) * 100} tone={k === 'QUALITY_ISSUE' ? 'bad' : 'good'} />
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Return units requested</span>
                      <span className="mono" style={{ fontSize: 10 }}>{formatNumber(returns.reduce((s, r) => s + Number(r.requested_units || 0), 0))}</span>
                    </div>
                  </PanelBody>
                </Panel>
              </div>

              <Panel>
                <PanelHead title="Receivables by account" subtitle="Highest outstanding balances" />
                <PanelBody flush>
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead><tr><th>Account</th><th>Type</th><th style={{ textAlign: 'right' }}>Invoiced</th><th style={{ textAlign: 'right' }}>Paid</th><th style={{ textAlign: 'right' }}>Outstanding</th><th style={{ textAlign: 'right' }}>Overdue</th></tr></thead>
                      <tbody>
                        {derived.accountRows?.slice(0, 10).map((r) => (
                          <tr key={r.name}>
                            <td className="cell-strong">{r.name}</td>
                            <td style={{ fontSize: 10 }}>{r.type}</td>
                            <td className="num" style={{ textAlign: 'right' }}>{formatCurrency(r.invoiced)}</td>
                            <td className="num" style={{ textAlign: 'right' }}>{formatCurrency(r.paid)}</td>
                            <td className="num" style={{ textAlign: 'right', color: 'var(--color-warning-text)' }}>{formatCurrency(r.outstanding)}</td>
                            <td className="mono" style={{ textAlign: 'right' }}>{r.overdue || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </PanelBody>
              </Panel>
            </div>
          )}
      </motion.div>
    </motion.div>
  );
}

export default AnalyticsPage;
