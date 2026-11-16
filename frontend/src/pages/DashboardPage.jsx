import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  RefreshCw, ArrowUpRight, AlertTriangle, TrendingUp, Truck,
  ShoppingCart, Boxes, Warehouse, Receipt, RotateCcw, Activity,
  CircleDollarSign, Radio
} from 'lucide-react';
import { getDashboardMetrics } from '../services/dashboardService';
import { getSupplyChainScorecard, getWarehouseKpis, getWarehouseUtilizationKpis, getSupplyChainRiskKpis } from '../services/analyticsService';
import { getOrders } from '../services/orderService';
import { getShipments } from '../services/shipmentService';
import { normalizeList, normalizeObject } from '../utils/responseNormalizer';
import { PageHeader } from '../components/common/PageHeader';
import { Panel, PanelHead, PanelBody, Stat, StatGrid, Meter } from '../components/common/Panel';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { formatCurrency, formatDate, formatNumber, formatPercentage } from '../utils/formatters';
import { pageStagger, riseIn, EASE } from '../utils/motion';

export function DashboardPage() {
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: null });
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [m, sc, wh, util, risk, orders, shipments] = await Promise.all([
        getDashboardMetrics(),
        getSupplyChainScorecard(),
        getWarehouseKpis(),
        getWarehouseUtilizationKpis(),
        getSupplyChainRiskKpis(),
        getOrders({ limit: 6 }),
        getShipments({ limit: 5 })
      ]);
      setState({
        loading: false,
        error: null,
        metrics: normalizeObject(m),
        scorecard: normalizeObject(sc),
        warehouses: normalizeList(wh),
        utilization: normalizeList(util),
        risk: normalizeList(risk),
        orders: normalizeList(orders),
        shipments: normalizeList(shipments)
      });
    } catch (err) {
      setState({ loading: false, error: err?.message || 'Control Tower telemetry is unavailable.' });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const { metrics = {}, scorecard = {}, warehouses = [], utilization = [], risk = [], orders = [], shipments = [] } = state;

  const valuation = useMemo(
    () => warehouses.reduce((sum, w) => sum + Number(w.inventory_value || 0), 0),
    [warehouses]
  );
  const units = useMemo(
    () => warehouses.reduce((sum, w) => sum + Number(w.total_stock_units || 0), 0),
    [warehouses]
  );

  if (state.loading) return <LoadingState message="Connecting to network telemetry…" fullPage />;
  if (state.error) {
    return <ErrorState title="Control Tower unavailable" message={state.error} onRetry={() => load()} />;
  }

  const pipeline = [
    { key: 'Pending', value: metrics.pending_orders || 0, tone: 'var(--color-warning)' },
    { key: 'Processing', value: metrics.processing_orders || 0, tone: 'var(--color-accent-blue)' },
    { key: 'Shipped', value: metrics.shipped_orders || 0, tone: 'var(--color-info)' },
    { key: 'Delivered', value: metrics.delivered_orders || 0, tone: 'var(--color-success)' }
  ];
  const pipelineTotal = pipeline.reduce((s, p) => s + p.value, 0) || 1;

  const riskRows = risk.filter((r) => ['PENDING_SALES_ORDERS', 'OPEN_CUSTOMER_RECEIVABLES', 'OVERDUE_INVOICES', 'PARTIAL_PURCHASE_ORDERS', 'LOW_STOCK'].includes(r.risk_type));

  return (
    <motion.div className="page" variants={pageStagger} initial="hidden" animate="visible">
      <motion.div variants={riseIn}>
        <PageHeader
          eyebrow="CONTROL TOWER / NETWORK STATUS"
          title="Supply chain, in one picture"
          description="A live read of demand, stock, freight and cash across the distribution network. Every figure is committed PostgreSQL data."
          badge={
            <span className="badge badge-success">
              <span className="dot" />
              <span>Live</span>
            </span>
          }
          actions={
            <>
              <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)', marginRight: 4 }}>
                SNAPSHOT {formatDate(metrics.snapshot_date)}
              </span>
              <button className="btn btn-outline" onClick={() => load(true)}>
                <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </>
          }
        />
      </motion.div>

      <motion.div variants={riseIn}>
        <StatGrid cols={4}>
          <Stat
            label="Inventory on hand"
            value={formatCurrency(valuation)}
            meta={`${formatNumber(units)} units · ${warehouses.length} facilities`}
            icon={Boxes}
          />
          <Stat
            label="Order execution"
            value={formatPercentage(scorecard.order_execution_rate || 0)}
            meta={`${formatNumber(metrics.active_orders || 0)} active orders`}
            tone="good"
            icon={TrendingUp}
          />
          <Stat
            label="On-time delivery"
            value={formatPercentage(scorecard.on_time_delivery_rate || 0)}
            meta={`${formatNumber(metrics.delivered_shipments || 0)} shipments closed`}
            icon={Truck}
          />
          <Stat
            label="Open receivables"
            value={formatCurrency(scorecard.outstanding_receivables || 0)}
            meta={`${metrics.overdue_invoices || 0} overdue · ${metrics.customers_with_outstanding || 0} accounts`}
            tone={Number(metrics.overdue_invoices) > 0 ? 'warn' : ''}
            icon={CircleDollarSign}
          />
        </StatGrid>
      </motion.div>

      <div className="split split-aside">
        {/* Order flow + recent demand */}
        <motion.div variants={riseIn} style={{ display: 'grid', gap: 14, minWidth: 0 }}>
          <Panel>
            <PanelHead
              title="Demand pipeline"
              subtitle={`${formatNumber(pipelineTotal)} orders in tracked fulfilment stages`}
              action={<button className="btn btn-ghost" onClick={() => navigate('/orders')}>Open orders <ArrowUpRight size={11} /></button>}
            />
            <PanelBody>
              <div style={{ display: 'flex', height: 6, borderRadius: 99, overflow: 'hidden', gap: 2 }}>
                {pipeline.map((p) => (
                  <motion.div
                    key={p.key}
                    initial={{ width: 0 }}
                    animate={{ width: `${(p.value / pipelineTotal) * 100}%` }}
                    transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
                    style={{ background: p.tone, minWidth: p.value ? 6 : 0 }}
                  />
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 14 }}>
                {pipeline.map((p) => (
                  <div key={p.key}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 5, height: 5, borderRadius: 1, background: p.tone }} />
                      <span className="eyebrow" style={{ fontSize: 8 }}>{p.key}</span>
                    </div>
                    <div className="mono" style={{ fontSize: 16, marginTop: 3, color: 'var(--color-text-primary)' }}>
                      {formatNumber(p.value)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-subtle)', marginTop: 14 }}>
                {orders.length === 0 && (
                  <div style={{ padding: 18, fontSize: 10.5, color: 'var(--color-text-muted)' }}>No sales orders recorded.</div>
                )}
                {orders.slice(0, 5).map((o) => (
                  <button
                    key={o.sales_order_id || o.id}
                    onClick={() => navigate('/orders')}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 0', borderBottom: '1px solid var(--color-border-subtle)', textAlign: 'left'
                    }}
                  >
                    <span className="mono" style={{ fontSize: 10, width: 106, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                      {o.order_number || `#${o.sales_order_id}`}
                    </span>
                    <span className="truncate" style={{ flex: 1, fontSize: 11, color: 'var(--color-text-primary)' }}>
                      {o.customer_name || o.customers?.name || 'Account'}
                    </span>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      {formatCurrency(o.total_amount || 0)}
                    </span>
                    <StatusBadge status={o.status} size="sm" />
                  </button>
                ))}
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead
              title="Facility network"
              subtitle="Stock position and occupied capacity by distribution centre"
              action={<button className="btn btn-ghost" onClick={() => navigate('/warehouses')}>Facilities <ArrowUpRight size={11} /></button>}
            />
            <PanelBody flush>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Facility</th>
                      <th style={{ textAlign: 'right' }}>Units</th>
                      <th style={{ textAlign: 'right' }}>Value</th>
                      <th style={{ width: 150 }}>Utilisation</th>
                      <th style={{ textAlign: 'right' }}>Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouses.map((w) => {
                      const u = utilization.find((x) => x.warehouse_id === w.warehouse_id);
                      return (
                        <tr key={w.warehouse_id}>
                          <td>
                            <div className="cell-strong">{w.warehouse_name}</div>
                            <div className="cell-sub mono">{w.warehouse_code} · {w.city}</div>
                          </td>
                          <td className="num" style={{ textAlign: 'right' }}>{formatNumber(w.total_stock_units)}</td>
                          <td className="num" style={{ textAlign: 'right' }}>{formatCurrency(w.inventory_value)}</td>
                          <td>
                            <Meter
                              value={u?.utilization_percentage || 0}
                              tone={(u?.utilization_percentage || 0) > 85 ? 'bad' : (u?.utilization_percentage || 0) > 65 ? 'warn' : 'good'}
                            />
                            <div className="mono" style={{ fontSize: 8.5, color: 'var(--color-text-muted)', marginTop: 3 }}>
                              {formatPercentage(u?.utilization_percentage || 0)} occupied
                            </div>
                          </td>
                          <td className="num" style={{ textAlign: 'right' }}>{formatNumber(w.active_orders)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </PanelBody>
          </Panel>
        </motion.div>

        {/* Exceptions + dispatch + working capital */}
        <motion.div variants={riseIn} style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <Panel>
            <PanelHead title="Exceptions" subtitle="Threshold breaches requiring a decision" action={<Activity size={13} style={{ color: 'var(--color-text-muted)' }} />} />
            <PanelBody style={{ display: 'grid', gap: 7 }}>
              {riskRows.length === 0 && <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)' }}>No risk records returned.</div>}
              {riskRows.map((r) => {
                const tone = r.risk_level === 'CRITICAL' ? 'danger' : r.risk_level === 'WARNING' ? 'warning' : 'neutral';
                const labels = {
                  PENDING_SALES_ORDERS: 'Orders awaiting confirmation',
                  OPEN_CUSTOMER_RECEIVABLES: 'Accounts with balances',
                  OVERDUE_INVOICES: 'Invoices past due',
                  PARTIAL_PURCHASE_ORDERS: 'Partially received POs',
                  LOW_STOCK: 'Locations below reorder'
                };
                return (
                  <div key={r.risk_type} style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 9px', border: '1px solid var(--color-border-subtle)', borderRadius: 4
                  }}>
                    <AlertTriangle size={12} style={{ color: `var(--color-${tone === 'neutral' ? 'text-muted' : tone + '-text'})` }} />
                    <span style={{ flex: 1, fontSize: 10.5, color: 'var(--color-text-secondary)' }}>{labels[r.risk_type] || r.risk_type}</span>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>{r.risk_count}</span>
                    <span className={`badge badge-${tone === 'neutral' ? 'neutral' : tone}`}>{r.risk_level}</span>
                  </div>
                );
              })}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead title="Dispatch board" subtitle="Latest freight movements" action={<button className="btn btn-ghost" onClick={() => navigate('/shipments')}><Radio size={11} /> Track</button>} />
            <PanelBody style={{ display: 'grid', gap: 0 }}>
              {shipments.map((s) => (
                <button
                  key={s.shipment_id}
                  onClick={() => navigate('/shipments')}
                  style={{ textAlign: 'left', padding: '8px 0', borderBottom: '1px solid var(--color-border-subtle)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--color-text-primary)' }}>{s.tracking_number}</span>
                    <StatusBadge status={s.status} size="sm" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, gap: 8 }}>
                    <span className="truncate" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>
                      {s.destination_address}
                    </span>
                    <span className="mono" style={{ fontSize: 8.5, color: 'var(--color-text-dim)', whiteSpace: 'nowrap' }}>
                      {s.carrier_name}
                    </span>
                  </div>
                </button>
              ))}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead title="Working capital" subtitle="Invoiced value vs settled cash" />
            <PanelBody style={{ display: 'grid', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Collected</span>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--color-success-text)' }}>{formatCurrency(metrics.total_paid_value || 0)}</span>
                </div>
                <Meter value={scorecard.total_invoiced_value ? (Number(metrics.total_paid_value) / Number(scorecard.total_invoiced_value)) * 100 : 0} tone="good" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Outstanding</span>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--color-warning-text)' }}>{formatCurrency(scorecard.outstanding_receivables || 0)}</span>
                </div>
                <Meter
                  value={scorecard.total_invoiced_value ? (Number(scorecard.outstanding_receivables) / Number(scorecard.total_invoiced_value)) * 100 : 0}
                  tone="warn"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <SmallFigure icon={Receipt} label="Invoiced" value={formatCurrency(scorecard.total_invoiced_value || 0)} onClick={() => navigate('/invoices')} />
                <SmallFigure icon={RotateCcw} label="Open returns" value={formatNumber(metrics.open_returns || 0)} onClick={() => navigate('/returns')} />
                <SmallFigure icon={ShoppingCart} label="Open POs" value={formatNumber(metrics.open_purchase_orders || 0)} onClick={() => navigate('/purchase-orders')} />
                <SmallFigure icon={Warehouse} label="Suppliers" value={formatNumber(metrics.active_suppliers || 0)} onClick={() => navigate('/suppliers')} />
              </div>
            </PanelBody>
          </Panel>
        </motion.div>
      </div>
    </motion.div>
  );
}

function SmallFigure({ icon: Icon, label, value, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left', border: '1px solid var(--color-border-subtle)', borderRadius: 4,
        padding: '8px 9px', display: 'flex', flexDirection: 'column', gap: 4
      }}
    >
      <span className="eyebrow" style={{ fontSize: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
        <Icon size={9} /> {label}
      </span>
      <span className="mono" style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>{value}</span>
    </button>
  );
}

export default DashboardPage;
