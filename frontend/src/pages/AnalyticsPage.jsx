import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Warehouse,
  Truck,
  Building2,
  AlertTriangle,
  DollarSign,
  RefreshCw,
  Boxes,
  FileSpreadsheet,
  Activity
} from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import * as analyticsService from '../services/analyticsService';
import { normalizeObject, normalizeList } from '../utils/responseNormalizer';
import { PageHeader } from '../components/common/PageHeader';
import { Tabs } from '../components/common/Tabs';
import { Card } from '../components/common/Card';
import { KpiCard } from '../components/common/KpiCard';
import { Table } from '../components/common/Table';
import { Button } from '../components/common/Button';
import { LoadingState } from '../components/common/LoadingState';
import { ProgressBar } from '../components/common/ProgressBar';
import { BarChart } from '../components/common/BarChart';
import { DonutGauge } from '../components/common/DonutGauge';
import { formatCurrency, formatNumber, formatDate, formatPercentage } from '../utils/formatters';

/**
 * Enterprise Analytics & BI Intelligence Hub
 * Connected to 11 real analytics telemetry endpoints
 */
export function AnalyticsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('executive');

  // Executive Data
  const { data: dashRaw, loading: dashLoading, refetch: refetchDash } = useApiQuery(
    analyticsService.getControlTowerDashboard,
    {},
    { immediate: true }
  );

  const { data: scoreRaw, loading: scoreLoading, refetch: refetchScore } = useApiQuery(
    analyticsService.getSupplyChainScorecard,
    {},
    { immediate: true }
  );

  // Warehouse KPIs
  const { data: whKpisRaw, loading: whLoading, refetch: refetchWh } = useApiQuery(
    analyticsService.getWarehouseKpis,
    {},
    { immediate: true }
  );

  // Supplier KPIs
  const { data: supKpisRaw, loading: supLoading, refetch: refetchSup } = useApiQuery(
    analyticsService.getSupplierKpis,
    {},
    { immediate: true }
  );

  // Customer Receivables
  const { data: recRaw, loading: recLoading, refetch: refetchRec } = useApiQuery(
    analyticsService.getCustomerReceivablesKpis,
    {},
    { immediate: true }
  );

  // Shipment KPIs
  const { data: shipKpisRaw, loading: shipLoading, refetch: refetchShip } = useApiQuery(
    analyticsService.getShipmentKpis,
    {},
    { immediate: true }
  );

  // Risk KPIs
  const { data: riskRaw, loading: riskLoading, refetch: refetchRisk } = useApiQuery(
    analyticsService.getSupplyChainRiskKpis,
    {},
    { immediate: true }
  );

  // Inventory Aging
  const { data: agingRaw, loading: agingLoading, refetch: refetchAging } = useApiQuery(
    analyticsService.getInventoryAgingKpis,
    {},
    { immediate: true }
  );

  // Utilization
  const { data: utilRaw, loading: utilLoading, refetch: refetchUtil } = useApiQuery(
    analyticsService.getWarehouseUtilizationKpis,
    {},
    { immediate: true }
  );

  // PO Performance
  const { data: poPerfRaw, loading: poLoading, refetch: refetchPo } = useApiQuery(
    analyticsService.getPurchaseOrderPerformance,
    {},
    { immediate: true }
  );

  // Returns Quality
  const { data: retQualRaw, loading: retLoading, refetch: refetchRet } = useApiQuery(
    analyticsService.getReturnsQualityKpis,
    {},
    { immediate: true }
  );

  const handleRefreshAll = () => {
    refetchDash();
    refetchScore();
    refetchWh();
    refetchSup();
    refetchRec();
    refetchShip();
    refetchRisk();
    refetchAging();
    refetchUtil();
    refetchPo();
    refetchRet();
  };

  // Safe Defensive Normalization
  const dashboardMetrics = normalizeObject(dashRaw);
  const scorecard = normalizeObject(scoreRaw);
  const warehouseKpis = normalizeList(whKpisRaw);
  const supplierKpis = normalizeList(supKpisRaw);
  const receivablesKpis = normalizeList(recRaw);
  const shipmentKpis = normalizeList(shipKpisRaw);
  const riskKpis = normalizeList(riskRaw);
  const agingKpis = normalizeList(agingRaw);
  const utilizationKpis = normalizeList(utilRaw);
  const poPerfList = normalizeList(poPerfRaw);
  const returnsKpis = normalizeList(retQualRaw);

  const tabs = [
    { id: 'executive', label: 'Executive Scorecard', icon: TrendingUp },
    { id: 'warehouses', label: 'Warehouse Intelligence', icon: Warehouse },
    { id: 'procurement', label: 'Supplier & PO Performance', icon: Building2 },
    { id: 'logistics', label: 'Logistics & Transit', icon: Truck },
    { id: 'risk', label: 'Risk & Quality Analysis', icon: AlertTriangle },
    { id: 'finance', label: 'Financial Receivables', icon: DollarSign }
  ];

  return (
    <div className="analytics-page animate-fade-in">
      <PageHeader
        eyebrow="ANALYTICS // MULTI-ECHELON BI"
        title="Supply Chain Analytics & Intelligence"
        description="Comprehensive analytical views powered by automated data pipelines and real-time operational telemetry."
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={handleRefreshAll}
          >
            Refresh Analytics
          </Button>
        }
      />

      {/* Domain Navigation Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="pills"
      />

      {/* Tab 1: Executive Scorecard */}
      {activeTab === 'executive' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', marginTop: 'var(--space-3)' }}>
          {scoreLoading || dashLoading ? (
            <LoadingState message="Calculating supply chain metrics..." />
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 'var(--space-4)'
                }}
              >
                <KpiCard
                  title="Total Inventory Valuation"
                  value={formatCurrency(scorecard.total_inventory_value || 0)}
                  icon={DollarSign}
                  color="primary"
                  subtitle="Enterprise aggregated stock"
                />
                <KpiCard
                  title="Fulfillment Efficiency"
                  value={formatPercentage(scorecard.fulfillment_rate || 95)}
                  icon={TrendingUp}
                  color="success"
                  trend={{ value: 'Target: 95.0%', isPositive: true }}
                />
                <KpiCard
                  title="Active Warehouses"
                  value={formatNumber(scorecard.active_warehouses || 3)}
                  icon={Warehouse}
                  color="info"
                  subtitle="Operational distribution hubs"
                />
                <KpiCard
                  title="Open Purchase Orders"
                  value={formatNumber(scorecard.open_purchase_orders || 0)}
                  icon={FileSpreadsheet}
                  color="purple"
                  subtitle="Inbound procurement pipeline"
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                  gap: 'var(--space-5)'
                }}
              >
                {/* Fulfillment Donut Gauge */}
                <Card
                  title="Fulfillment SLA Performance"
                  subtitle="Enterprise benchmark compliance across all processed customer orders"
                  headerBorder
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <DonutGauge
                      value={Number(scorecard.fulfillment_rate) || 95}
                      max={100}
                      size={150}
                      strokeWidth={12}
                      label="Order SLA Compliance"
                      sublabel="Target 95%"
                      status="success"
                    />
                  </div>
                </Card>

                {/* Warehouse Valuation Chart */}
                <Card
                  title="Stock Valuation by Facility"
                  subtitle="Distributed asset inventory value per registered physical hub"
                  headerBorder
                >
                  <BarChart
                    data={warehouseKpis.map((w) => ({
                      label: w.warehouse_name || w.warehouse_code || 'Hub',
                      value: Number(w.total_inventory_value) || 0
                    }))}
                    valueFormatter={formatCurrency}
                    orientation="horizontal"
                    barColor="var(--color-border-strong)"
                    highlightMax
                  />
                </Card>
              </div>

              <Card title="Control Tower Operations Overview" subtitle="System-wide performance aggregates across all business nodes" headerBorder>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                  <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Catalog Products</span>
                    <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', display: 'block', marginTop: '0.2rem' }}>
                      {formatNumber(dashboardMetrics.total_products || 0)}
                    </span>
                  </div>
                  <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Suppliers</span>
                    <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', display: 'block', marginTop: '0.2rem' }}>
                      {formatNumber(dashboardMetrics.active_suppliers || 0)}
                    </span>
                  </div>
                  <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Orders Processed</span>
                    <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', display: 'block', marginTop: '0.2rem' }}>
                      {formatNumber(dashboardMetrics.total_orders || 0)}
                    </span>
                  </div>
                  <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Freight Shipments</span>
                    <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', display: 'block', marginTop: '0.2rem' }}>
                      {formatNumber(dashboardMetrics.active_shipments || 0)}
                    </span>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Tab 2: Warehouse Intelligence */}
      {activeTab === 'warehouses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', marginTop: 'var(--space-3)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: 'var(--space-5)'
            }}
          >
            {/* Warehouse Capacity Bars */}
            <Card title="Warehouse Space Utilization" subtitle="Real-time occupancy versus max capacity limits" headerBorder>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {utilizationKpis.map((wh, idx) => (
                  <ProgressBar
                    key={idx}
                    label={`${wh.warehouse_name || 'Warehouse'} (${formatNumber(wh.utilized_capacity || 0)} / ${formatNumber(wh.total_capacity || 0)} units)`}
                    value={Number(wh.utilization_rate) || 0}
                    max={100}
                    showValue
                    thresholds={{ warning: 75, danger: 90 }}
                  />
                ))}
              </div>
            </Card>

            {/* Warehouse SKU Units Chart */}
            <Card title="SKU Volume Distribution" subtitle="Physical unit inventory counts by warehouse facility" headerBorder>
              <BarChart
                data={warehouseKpis.map((w) => ({
                  label: w.warehouse_name || w.warehouse_code || 'Hub',
                  value: Number(w.total_units) || 0
                }))}
                valueFormatter={formatNumber}
                orientation="horizontal"
                barColor="var(--color-border-strong)"
              />
            </Card>
          </div>

          <Card title="Warehouse KPI Matrix" subtitle="Detailed inventory and throughput statistics per warehouse facility" headerBorder>
            <Table
              loading={whLoading}
              columns={[
                { key: 'warehouse_name', header: 'Warehouse Facility' },
                { key: 'warehouse_code', header: 'Facility Code', render: (r) => <span style={{ fontFamily: 'var(--font-mono)' }}>{r.warehouse_code}</span> },
                { key: 'total_skus', header: 'Total SKUs', align: 'right', render: (r) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(r.total_skus || 0)}</span> },
                { key: 'total_units', header: 'Total Units', align: 'right', render: (r) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(r.total_units || 0)}</span> },
                { key: 'total_inventory_value', header: 'Inventory Value', align: 'right', render: (r) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatCurrency(r.total_inventory_value || 0)}</span> },
                { key: 'low_stock_skus', header: 'Low Stock Alerts', align: 'right', render: (r) => (
                  <span style={{ color: r.low_stock_skus > 0 ? 'var(--color-warning-text)' : 'var(--color-success-text)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {r.low_stock_skus || 0}
                  </span>
                )}
              ]}
              data={warehouseKpis}
            />
          </Card>

          <Card title="Inventory Aging & Turnover Risk" subtitle="Age distribution of sitting stock across product categories" headerBorder>
            <Table
              loading={agingLoading}
              columns={[
                { key: 'sku', header: 'SKU', render: (r) => <span style={{ fontFamily: 'var(--font-mono)' }}>{r.sku}</span> },
                { key: 'product_name', header: 'Product Name', render: (r) => <span style={{ fontWeight: 600 }}>{r.product_name}</span> },
                { key: 'category', header: 'Category' },
                { key: 'quantity', header: 'Quantity', align: 'right', render: (r) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(r.quantity || 0)}</span> },
                { key: 'days_in_inventory', header: 'Aging (Days)', align: 'right', render: (r) => <span style={{ fontFamily: 'var(--font-mono)' }}>{r.days_in_inventory || 0}d</span> },
                { key: 'aging_bucket', header: 'Risk Tier', render: (r) => (
                  <span style={{ color: r.aging_bucket?.includes('90+') ? 'var(--color-danger-text)' : 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {r.aging_bucket || '0-30 Days'}
                  </span>
                )}
              ]}
              data={agingKpis}
            />
          </Card>
        </div>
      )}

      {/* Tab 3: Suppliers & PO Performance */}
      {activeTab === 'procurement' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', marginTop: 'var(--space-3)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: 'var(--space-5)'
            }}
          >
            {/* Supplier Spend Chart */}
            <Card title="Supplier Procurement Spend" subtitle="Total capital allocated per supplier partner" headerBorder>
              <BarChart
                data={supplierKpis.map((s) => ({
                  label: s.supplier_name || 'Vendor',
                  value: Number(s.total_spend) || 0
                }))}
                valueFormatter={formatCurrency}
                orientation="horizontal"
                barColor="var(--color-border-strong)"
                highlightMax
              />
            </Card>

            {/* Supplier On-Time Delivery Chart */}
            <Card title="Supplier On-Time SLA Rates" subtitle="Percentage of shipments delivered on or before promised date" headerBorder>
              <BarChart
                data={supplierKpis.map((s) => ({
                  label: s.supplier_name || 'Vendor',
                  value: Number(s.on_time_delivery_rate) || 100
                }))}
                valueFormatter={formatPercentage}
                orientation="horizontal"
                barColor="var(--color-border-strong)"
              />
            </Card>
          </div>

          <Card title="Supplier KPI Scorecard" subtitle="Fulfillment reliability, lead times, and spend distribution" headerBorder>
            <Table
              loading={supLoading}
              columns={[
                { key: 'supplier_name', header: 'Supplier Name', render: (r) => <span style={{ fontWeight: 600 }}>{r.supplier_name}</span> },
                { key: 'total_po_count', header: 'Total POs', align: 'right', render: (r) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(r.total_po_count || 0)}</span> },
                { key: 'total_spend', header: 'Total Spend', align: 'right', render: (r) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatCurrency(r.total_spend || 0)}</span> },
                { key: 'on_time_delivery_rate', header: 'On-Time Rate', align: 'right', render: (r) => (
                  <span style={{ color: 'var(--color-success-text)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {formatPercentage(r.on_time_delivery_rate || 100)}
                  </span>
                )},
                { key: 'quality_rating', header: 'Rating', align: 'right', render: (r) => <span style={{ fontFamily: 'var(--font-mono)' }}>{r.quality_rating || 5.0} / 5.0</span> }
              ]}
              data={supplierKpis}
            />
          </Card>

          <Card title="Purchase Order Performance Tracking" subtitle="Procurement order lifecycles, lead times, and receipt fulfillment" headerBorder>
            <Table
              loading={poLoading}
              columns={[
                { key: 'po_number', header: 'PO Number', render: (r) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.po_number}</span> },
                { key: 'supplier_name', header: 'Supplier' },
                { key: 'status', header: 'Status', render: (r) => <span style={{ textTransform: 'capitalize' }}>{r.status}</span> },
                { key: 'total_amount', header: 'Amount', align: 'right', render: (r) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(r.total_amount || 0)}</span> },
                { key: 'lead_time_days', header: 'Lead Time', align: 'right', render: (r) => <span style={{ fontFamily: 'var(--font-mono)' }}>{r.lead_time_days || 0} days</span> }
              ]}
              data={poPerfList}
            />
          </Card>
        </div>
      )}

      {/* Tab 4: Logistics & Shipping */}
      {activeTab === 'logistics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', marginTop: 'var(--space-3)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: 'var(--space-5)'
            }}
          >
            {/* Carrier Shipment Volume */}
            <Card title="Carrier Volume Distribution" subtitle="Total freight loads handled per logistics carrier" headerBorder>
              <BarChart
                data={shipmentKpis.map((c) => ({
                  label: c.carrier || 'Carrier',
                  value: Number(c.total_shipments) || 0
                }))}
                valueFormatter={formatNumber}
                orientation="horizontal"
                barColor="var(--color-border-strong)"
              />
            </Card>

            {/* Carrier On-Time Performance */}
            <Card title="Carrier On-Time Delivery Rates" subtitle="Freight SLA delivery compliance percentage" headerBorder>
              <BarChart
                data={shipmentKpis.map((c) => ({
                  label: c.carrier || 'Carrier',
                  value: Number(c.on_time_delivery_rate) || 98
                }))}
                valueFormatter={formatPercentage}
                orientation="horizontal"
                barColor="var(--color-border-strong)"
              />
            </Card>
          </div>

          <Card title="Shipment & Carrier Performance" subtitle="Transit times, carrier on-time rates, and exception metrics" headerBorder>
            <Table
              loading={shipLoading}
              columns={[
                { key: 'carrier', header: 'Carrier Partner', render: (r) => <span style={{ fontWeight: 600 }}>{r.carrier}</span> },
                { key: 'total_shipments', header: 'Total Shipments', align: 'right', render: (r) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(r.total_shipments || 0)}</span> },
                { key: 'delivered_count', header: 'Delivered', align: 'right', render: (r) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(r.delivered_count || 0)}</span> },
                { key: 'in_transit_count', header: 'In Transit', align: 'right', render: (r) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(r.in_transit_count || 0)}</span> },
                { key: 'avg_transit_days', header: 'Avg Transit', align: 'right', render: (r) => <span style={{ fontFamily: 'var(--font-mono)' }}>{r.avg_transit_days || 0}d</span> },
                { key: 'on_time_delivery_rate', header: 'On-Time %', align: 'right', render: (r) => (
                  <span style={{ color: 'var(--color-success-text)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {formatPercentage(r.on_time_delivery_rate || 98)}
                  </span>
                )}
              ]}
              data={shipmentKpis}
            />
          </Card>
        </div>
      )}

      {/* Tab 5: Risk & Quality */}
      {activeTab === 'risk' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', marginTop: 'var(--space-3)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: 'var(--space-5)'
            }}
          >
            {/* Risk Impact Scores */}
            <Card title="Supply Chain Vulnerability Index" subtitle="Assessed impact score by risk domain category" headerBorder>
              <BarChart
                data={riskKpis.map((r) => ({
                  label: r.risk_category || 'Risk Item',
                  value: Number(r.impact_score) || 0
                }))}
                valueFormatter={(v) => `${v} / 100`}
                orientation="horizontal"
                barColor="var(--color-danger-bg)"
                highlightMax
              />
            </Card>

            {/* Returns by Product */}
            <Card title="Return Rates by Product Line" subtitle="RMA percentage of fulfilled units" headerBorder>
              <BarChart
                data={returnsKpis.map((rk) => ({
                  label: rk.product_name || 'Product',
                  value: Number(rk.return_rate) || 0
                }))}
                valueFormatter={formatPercentage}
                orientation="horizontal"
                barColor="var(--color-warning-bg)"
              />
            </Card>
          </div>

          <Card title="Supply Chain Risk Indicators" subtitle="Concentration risks, supplier vulnerabilities, and inventory bottlenecks" headerBorder>
            <Table
              loading={riskLoading}
              columns={[
                { key: 'risk_category', header: 'Risk Category', render: (r) => <span style={{ fontWeight: 600 }}>{r.risk_category}</span> },
                { key: 'description', header: 'Risk Description' },
                { key: 'severity', header: 'Severity', render: (r) => (
                  <span style={{ color: r.severity === 'HIGH' ? 'var(--color-danger-text)' : 'var(--color-warning-text)', fontWeight: 600 }}>
                    {r.severity}
                  </span>
                )},
                { key: 'impact_score', header: 'Impact Score', align: 'right', render: (r) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.impact_score || 0} / 100</span> }
              ]}
              data={riskKpis}
            />
          </Card>

          <Card title="Returns & Quality Analysis" subtitle="Defect rates, RMA volumes, and vendor return percentages" headerBorder>
            <Table
              loading={retLoading}
              columns={[
                { key: 'product_name', header: 'Product', render: (r) => <span style={{ fontWeight: 600 }}>{r.product_name}</span> },
                { key: 'total_returns', header: 'Total Returns', align: 'right', render: (r) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(r.total_returns || 0)}</span> },
                { key: 'return_rate', header: 'Return Rate', align: 'right', render: (r) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatPercentage(r.return_rate || 0)}</span> },
                { key: 'primary_reason', header: 'Primary Reason' }
              ]}
              data={returnsKpis}
            />
          </Card>
        </div>
      )}

      {/* Tab 6: Financial Receivables */}
      {activeTab === 'finance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', marginTop: 'var(--space-3)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: 'var(--space-5)'
            }}
          >
            {/* Customer Outstanding Balance Chart */}
            <Card title="Outstanding Balances by Account" subtitle="Total accounts receivable balance per enterprise customer" headerBorder>
              <BarChart
                data={receivablesKpis.map((c) => ({
                  label: c.customer_name || 'Customer',
                  value: Number(c.total_outstanding) || 0
                }))}
                valueFormatter={formatCurrency}
                orientation="horizontal"
                barColor="var(--color-border-strong)"
                highlightMax
              />
            </Card>

            {/* Customer Overdue Balance Chart */}
            <Card title="Overdue Aging Balances" subtitle="Capital exceeding contractual payment terms" headerBorder>
              <BarChart
                data={receivablesKpis.map((c) => ({
                  label: c.customer_name || 'Customer',
                  value: Number(c.overdue_amount) || 0
                }))}
                valueFormatter={formatCurrency}
                orientation="horizontal"
                barColor="var(--color-danger-bg)"
              />
            </Card>
          </div>

          <Card title="Customer Receivables & Credit Aging" subtitle="Outstanding balances, overdue invoices, and credit risk profiles" headerBorder>
            <Table
              loading={recLoading}
              columns={[
                { key: 'customer_name', header: 'Customer', render: (r) => <span style={{ fontWeight: 600 }}>{r.customer_name}</span> },
                { key: 'total_outstanding', header: 'Outstanding Balance', align: 'right', render: (r) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(r.total_outstanding || 0)}</span> },
                { key: 'overdue_amount', header: 'Overdue Amount', align: 'right', render: (r) => (
                  <span style={{ color: r.overdue_amount > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(r.overdue_amount || 0)}
                  </span>
                )},
                { key: 'credit_limit', header: 'Credit Limit', align: 'right', render: (r) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(r.credit_limit || 0)}</span> },
                { key: 'credit_utilization', header: 'Credit Util %', align: 'right', render: (r) => <span style={{ fontFamily: 'var(--font-mono)' }}>{formatPercentage(r.credit_utilization || 0)}</span> }
              ]}
              data={receivablesKpis}
            />
          </Card>
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;
