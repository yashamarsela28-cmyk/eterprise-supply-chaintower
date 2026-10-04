import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Warehouse,
  Truck,
  Building2,
  AlertTriangle,
  RotateCcw,
  DollarSign,
  Boxes,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import * as analyticsService from '../services/analyticsService';
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
 * Desktop-First, 11 Real Analytics Endpoints Connected
 */
export function AnalyticsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('executive');

  // Executive Data
  const { data: dashboardData, loading: dashLoading, refetch: refetchDash } = useApiQuery(
    analyticsService.getControlTowerDashboard,
    {},
    { immediate: true }
  );

  const { data: scorecardData, loading: scoreLoading, refetch: refetchScore } = useApiQuery(
    analyticsService.getSupplyChainScorecard,
    {},
    { immediate: true }
  );

  // Warehouse KPIs
  const { data: whKpisData, loading: whLoading, refetch: refetchWh } = useApiQuery(
    analyticsService.getWarehouseKpis,
    {},
    { immediate: true }
  );

  // Supplier KPIs
  const { data: supKpisData, loading: supLoading, refetch: refetchSup } = useApiQuery(
    analyticsService.getSupplierKpis,
    {},
    { immediate: true }
  );

  // Customer Receivables
  const { data: recData, loading: recLoading, refetch: refetchRec } = useApiQuery(
    analyticsService.getCustomerReceivablesKpis,
    {},
    { immediate: true }
  );

  // Shipment KPIs
  const { data: shipKpisData, loading: shipLoading, refetch: refetchShip } = useApiQuery(
    analyticsService.getShipmentKpis,
    {},
    { immediate: true }
  );

  // Risk KPIs
  const { data: riskData, loading: riskLoading, refetch: refetchRisk } = useApiQuery(
    analyticsService.getSupplyChainRiskKpis,
    {},
    { immediate: true }
  );

  // Inventory Aging
  const { data: agingData, loading: agingLoading, refetch: refetchAging } = useApiQuery(
    analyticsService.getInventoryAgingKpis,
    {},
    { immediate: true }
  );

  // Utilization
  const { data: utilData, loading: utilLoading, refetch: refetchUtil } = useApiQuery(
    analyticsService.getWarehouseUtilizationKpis,
    {},
    { immediate: true }
  );

  // PO Performance
  const { data: poPerfData, loading: poLoading, refetch: refetchPo } = useApiQuery(
    analyticsService.getPurchaseOrderPerformance,
    {},
    { immediate: true }
  );

  // Returns Quality
  const { data: retQualData, loading: retLoading, refetch: refetchRet } = useApiQuery(
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

  const dashboardMetrics = dashboardData?.data || {};
  const scorecard = scorecardData?.data || {};
  const warehouseKpis = whKpisData?.data || [];
  const supplierKpis = supKpisData?.data || [];
  const receivablesKpis = recData?.data || [];
  const shipmentKpis = shipKpisData?.data || [];
  const riskKpis = riskData?.data || [];
  const agingKpis = agingData?.data || [];
  const utilizationKpis = utilData?.data || [];
  const poPerfList = poPerfData?.data || [];
  const returnsKpis = retQualData?.data || [];

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
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
                  status="primary"
                />
                <KpiCard
                  title="Fulfillment Efficiency"
                  value={formatPercentage(scorecard.fulfillment_rate || 95)}
                  icon={TrendingUp}
                  status="success"
                />
                <KpiCard
                  title="Active Warehouses"
                  value={formatNumber(scorecard.active_warehouses || 3)}
                  icon={Warehouse}
                  status="info"
                />
                <KpiCard
                  title="Open Purchase Orders"
                  value={formatNumber(scorecard.open_purchase_orders || 0)}
                  icon={FileSpreadsheet}
                  status="warning"
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                  gap: 'var(--space-6)'
                }}
              >
                {/* Fulfillment Donut Gauge */}
                <Card
                  title="Fulfillment Target & Rate"
                  subtitle="Enterprise SLA benchmark compliance rate across all sales orders"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <DonutGauge
                      value={Number(scorecard.fulfillment_rate) || 95}
                      max={100}
                      size={160}
                      strokeWidth={14}
                      label="Current Fulfillment SLA"
                      sublabel="Target 95%"
                      status="success"
                    />
                  </div>
                </Card>

                {/* Warehouse Valuation Chart */}
                <Card
                  title="Stock Valuation by Facility"
                  subtitle="Distributed asset inventory value per registered hub"
                >
                  <BarChart
                    data={warehouseKpis.map(w => ({
                      label: w.warehouse_name || w.warehouse_code,
                      value: Number(w.total_inventory_value) || 0
                    }))}
                    valueFormatter={formatCurrency}
                    orientation="horizontal"
                    barColor="var(--color-primary)"
                    highlightMax
                  />
                </Card>
              </div>

              <Card title="Control Tower Operations Overview" subtitle="System-wide performance aggregates across all business nodes">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                  <div style={{ padding: '1rem', backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: 'var(--radius-lg)' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'block' }}>Total Catalog Products</span>
                    <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {formatNumber(dashboardMetrics.total_products || 0)}
                    </span>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: 'var(--radius-lg)' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'block' }}>Active Suppliers</span>
                    <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {formatNumber(dashboardMetrics.active_suppliers || 0)}
                    </span>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: 'var(--radius-lg)' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'block' }}>Total Orders Processed</span>
                    <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {formatNumber(dashboardMetrics.total_orders || 0)}
                    </span>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: 'var(--radius-lg)' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'block' }}>Active Freight Shipments</span>
                    <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: 'var(--space-6)'
            }}
          >
            {/* Warehouse Capacity Bars */}
            <Card title="Warehouse Space Utilization" subtitle="Real-time occupancy versus max capacity limits">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            <Card title="SKU Volume Distribution" subtitle="Physical unit inventory counts by warehouse">
              <BarChart
                data={warehouseKpis.map(w => ({
                  label: w.warehouse_name || w.warehouse_code,
                  value: Number(w.total_units) || 0
                }))}
                valueFormatter={formatNumber}
                orientation="horizontal"
                barColor="var(--color-info)"
              />
            </Card>
          </div>

          <Card title="Warehouse KPI Matrix" subtitle="Detailed inventory and throughput statistics per warehouse facility">
            <Table
              loading={whLoading}
              columns={[
                { key: 'warehouse_name', header: 'Warehouse Facility' },
                { key: 'warehouse_code', header: 'Facility Code' },
                { key: 'total_skus', header: 'Total SKUs', render: (r) => formatNumber(r.total_skus || 0) },
                { key: 'total_units', header: 'Total Units', render: (r) => formatNumber(r.total_units || 0) },
                { key: 'total_inventory_value', header: 'Inventory Value', render: (r) => formatCurrency(r.total_inventory_value || 0) },
                { key: 'low_stock_skus', header: 'Low Stock Alerts', render: (r) => (
                  <span style={{ color: r.low_stock_skus > 0 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
                    {r.low_stock_skus || 0}
                  </span>
                )}
              ]}
              data={warehouseKpis}
            />
          </Card>

          <Card title="Inventory Aging & Turnover Risk" subtitle="Age distribution of sitting stock across product categories">
            <Table
              loading={agingLoading}
              columns={[
                { key: 'sku', header: 'SKU' },
                { key: 'product_name', header: 'Product Name' },
                { key: 'category', header: 'Category' },
                { key: 'quantity', header: 'Quantity', render: (r) => formatNumber(r.quantity || 0) },
                { key: 'days_in_inventory', header: 'Aging (Days)', render: (r) => `${r.days_in_inventory || 0} days` },
                { key: 'aging_bucket', header: 'Risk Tier' }
              ]}
              data={agingKpis}
            />
          </Card>
        </div>
      )}

      {/* Tab 3: Suppliers & PO Performance */}
      {activeTab === 'procurement' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: 'var(--space-6)'
            }}
          >
            {/* Supplier Spend Chart */}
            <Card title="Supplier Procurement Spend" subtitle="Total capital allocated per supplier partner">
              <BarChart
                data={supplierKpis.map(s => ({
                  label: s.supplier_name || 'Vendor',
                  value: Number(s.total_spend) || 0
                }))}
                valueFormatter={formatCurrency}
                orientation="horizontal"
                barColor="var(--color-purple)"
                highlightMax
              />
            </Card>

            {/* Supplier On-Time Delivery Chart */}
            <Card title="Supplier On-Time SLA Rates" subtitle="Percentage of shipments delivered on or before promised date">
              <BarChart
                data={supplierKpis.map(s => ({
                  label: s.supplier_name || 'Vendor',
                  value: Number(s.on_time_delivery_rate) || 100
                }))}
                valueFormatter={formatPercentage}
                orientation="horizontal"
                barColor="var(--color-success)"
              />
            </Card>
          </div>

          <Card title="Supplier KPI Scorecard" subtitle="Fulfillment reliability, lead times, and spend distribution">
            <Table
              loading={supLoading}
              columns={[
                { key: 'supplier_name', header: 'Supplier Name' },
                { key: 'total_po_count', header: 'Total POs', render: (r) => formatNumber(r.total_po_count || 0) },
                { key: 'total_spend', header: 'Total Spend', render: (r) => formatCurrency(r.total_spend || 0) },
                { key: 'on_time_delivery_rate', header: 'On-Time Rate', render: (r) => formatPercentage(r.on_time_delivery_rate || 100) },
                { key: 'quality_rating', header: 'Rating', render: (r) => `${r.quality_rating || 5.0} / 5.0` }
              ]}
              data={supplierKpis}
            />
          </Card>

          <Card title="Purchase Order Performance Tracking" subtitle="Procurement order lifecycles, lead times, and receipt fulfillment">
            <Table
              loading={poLoading}
              columns={[
                { key: 'po_number', header: 'PO Number' },
                { key: 'supplier_name', header: 'Supplier' },
                { key: 'status', header: 'Status' },
                { key: 'total_amount', header: 'Amount', render: (r) => formatCurrency(r.total_amount || 0) },
                { key: 'lead_time_days', header: 'Lead Time', render: (r) => `${r.lead_time_days || 0} days` }
              ]}
              data={poPerfList}
            />
          </Card>
        </div>
      )}

      {/* Tab 4: Logistics & Shipping */}
      {activeTab === 'logistics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: 'var(--space-6)'
            }}
          >
            {/* Carrier Shipment Volume */}
            <Card title="Carrier Volume Distribution" subtitle="Total freight loads handled per logistics carrier">
              <BarChart
                data={shipmentKpis.map(c => ({
                  label: c.carrier || 'Carrier',
                  value: Number(c.total_shipments) || 0
                }))}
                valueFormatter={formatNumber}
                orientation="horizontal"
                barColor="var(--color-primary)"
              />
            </Card>

            {/* Carrier On-Time Performance */}
            <Card title="Carrier On-Time Delivery Rates" subtitle="Freight SLA delivery compliance percentage">
              <BarChart
                data={shipmentKpis.map(c => ({
                  label: c.carrier || 'Carrier',
                  value: Number(c.on_time_delivery_rate) || 98
                }))}
                valueFormatter={formatPercentage}
                orientation="horizontal"
                barColor="var(--color-success)"
              />
            </Card>
          </div>

          <Card title="Shipment & Carrier Performance" subtitle="Transit times, carrier on-time rates, and exception metrics">
            <Table
              loading={shipLoading}
              columns={[
                { key: 'carrier', header: 'Carrier Partner' },
                { key: 'total_shipments', header: 'Total Shipments', render: (r) => formatNumber(r.total_shipments || 0) },
                { key: 'delivered_count', header: 'Delivered', render: (r) => formatNumber(r.delivered_count || 0) },
                { key: 'in_transit_count', header: 'In Transit', render: (r) => formatNumber(r.in_transit_count || 0) },
                { key: 'avg_transit_days', header: 'Avg Transit (Days)', render: (r) => `${r.avg_transit_days || 0} days` },
                { key: 'on_time_delivery_rate', header: 'On-Time %', render: (r) => formatPercentage(r.on_time_delivery_rate || 98) }
              ]}
              data={shipmentKpis}
            />
          </Card>
        </div>
      )}

      {/* Tab 5: Risk & Quality */}
      {activeTab === 'risk' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: 'var(--space-6)'
            }}
          >
            {/* Risk Impact Scores */}
            <Card title="Supply Chain Vulnerability Index" subtitle="Assessed impact score by risk domain category">
              <BarChart
                data={riskKpis.map(r => ({
                  label: r.risk_category || 'Risk Item',
                  value: Number(r.impact_score) || 0
                }))}
                valueFormatter={(v) => `${v} / 100`}
                orientation="horizontal"
                barColor="var(--color-danger)"
                highlightMax
              />
            </Card>

            {/* Returns by Product */}
            <Card title="Return Rates by Product Line" subtitle="RMA percentage of fulfilled units">
              <BarChart
                data={returnsKpis.map(rk => ({
                  label: rk.product_name || 'Product',
                  value: Number(rk.return_rate) || 0
                }))}
                valueFormatter={formatPercentage}
                orientation="horizontal"
                barColor="var(--color-warning)"
              />
            </Card>
          </div>

          <Card title="Supply Chain Risk Indicators" subtitle="Concentration risks, supplier vulnerabilities, and inventory bottlenecks">
            <Table
              loading={riskLoading}
              columns={[
                { key: 'risk_category', header: 'Risk Category' },
                { key: 'description', header: 'Risk Description' },
                { key: 'severity', header: 'Severity' },
                { key: 'impact_score', header: 'Impact Score', render: (r) => `${r.impact_score || 0} / 100` }
              ]}
              data={riskKpis}
            />
          </Card>

          <Card title="Returns & Quality Analysis" subtitle="Defect rates, RMA volumes, and vendor return percentages">
            <Table
              loading={retLoading}
              columns={[
                { key: 'product_name', header: 'Product' },
                { key: 'total_returns', header: 'Total Returns', render: (r) => formatNumber(r.total_returns || 0) },
                { key: 'return_rate', header: 'Return Rate', render: (r) => formatPercentage(r.return_rate || 0) },
                { key: 'primary_reason', header: 'Primary Reason' }
              ]}
              data={returnsKpis}
            />
          </Card>
        </div>
      )}

      {/* Tab 6: Financial Receivables */}
      {activeTab === 'finance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: 'var(--space-6)'
            }}
          >
            {/* Customer Outstanding Balance Chart */}
            <Card title="Outstanding Balances by Account" subtitle="Total accounts receivable balance per enterprise customer">
              <BarChart
                data={receivablesKpis.map(c => ({
                  label: c.customer_name || 'Customer',
                  value: Number(c.total_outstanding) || 0
                }))}
                valueFormatter={formatCurrency}
                orientation="horizontal"
                barColor="var(--color-primary)"
                highlightMax
              />
            </Card>

            {/* Customer Overdue Balance Chart */}
            <Card title="Overdue Aging Balances" subtitle="Capital exceeding contractual payment terms">
              <BarChart
                data={receivablesKpis.map(c => ({
                  label: c.customer_name || 'Customer',
                  value: Number(c.overdue_amount) || 0
                }))}
                valueFormatter={formatCurrency}
                orientation="horizontal"
                barColor="var(--color-danger)"
              />
            </Card>
          </div>

          <Card title="Customer Receivables & Credit Aging" subtitle="Outstanding balances, overdue invoices, and credit risk profiles">
            <Table
              loading={recLoading}
              columns={[
                { key: 'customer_name', header: 'Customer' },
                { key: 'total_outstanding', header: 'Outstanding Balance', render: (r) => formatCurrency(r.total_outstanding || 0) },
                { key: 'overdue_amount', header: 'Overdue Amount', render: (r) => (
                  <span style={{ color: r.overdue_amount > 0 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
                    {formatCurrency(r.overdue_amount || 0)}
                  </span>
                )},
                { key: 'credit_limit', header: 'Credit Limit', render: (r) => formatCurrency(r.credit_limit || 0) },
                { key: 'credit_utilization', header: 'Credit Util %', render: (r) => formatPercentage(r.credit_utilization || 0) }
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
