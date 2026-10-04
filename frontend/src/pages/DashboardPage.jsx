import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  ShoppingCart,
  Truck,
  AlertTriangle,
  TrendingUp,
  Building2,
  DollarSign,
  PackageCheck,
  RefreshCw,
  ArrowRight,
  Warehouse,
  FileSpreadsheet
} from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { getDashboardMetrics } from '../services/dashboardService';
import {
  getSupplyChainScorecard,
  getWarehouseKpis,
  getWarehouseUtilizationKpis
} from '../services/analyticsService';
import { PageHeader } from '../components/common/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { ProgressBar } from '../components/common/ProgressBar';
import { BarChart } from '../components/common/BarChart';
import { DonutGauge } from '../components/common/DonutGauge';
import { formatCurrency, formatNumber, formatDate, formatPercentage } from '../utils/formatters';

/**
 * Enterprise Executive Control Tower Dashboard
 * Desktop-First, Real Data Connected Multi-Echelon Overview
 */
export function DashboardPage() {
  const navigate = useNavigate();

  // Load Operational Metrics
  const { data: metricsData, loading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useApiQuery(
    getDashboardMetrics,
    {},
    { immediate: true }
  );

  // Load Analytics Scorecard
  const { data: scorecardData, loading: scoreLoading, refetch: refetchScore } = useApiQuery(
    getSupplyChainScorecard,
    {},
    { immediate: true }
  );

  // Load Warehouse KPIs for throughput chart
  const { data: whKpisData, loading: whLoading, refetch: refetchWh } = useApiQuery(
    getWarehouseKpis,
    {},
    { immediate: true }
  );

  // Load Warehouse Utilization for capacity bars
  const { data: whUtilData, loading: utilLoading, refetch: refetchUtil } = useApiQuery(
    getWarehouseUtilizationKpis,
    {},
    { immediate: true }
  );

  const handleRefreshAll = () => {
    refetchMetrics();
    refetchScore();
    refetchWh();
    refetchUtil();
  };

  const metrics = metricsData?.data || {};
  const scorecard = scorecardData?.data || {};
  const warehouseKpis = whKpisData?.data || [];
  const warehouseUtil = whUtilData?.data || [];

  if (metricsLoading && scoreLoading) {
    return <LoadingState message="Connecting to Supply Chain Control Tower..." fullPage />;
  }

  if (metricsError && !metricsData) {
    return (
      <ErrorState
        title="Failed to Load Control Tower"
        message={metricsError?.message || 'Could not connect to Control Tower backend services.'}
        onRetry={handleRefreshAll}
      />
    );
  }

  // Transform warehouse KPIs for bar chart
  const whChartData = warehouseKpis.map(w => ({
    label: w.warehouse_name || w.warehouse_code,
    value: Number(w.total_inventory_value) || 0
  }));

  return (
    <div className="dashboard-page animate-fade-in">
      {/* Top Header with Real Actions */}
      <PageHeader
        title="Executive Control Tower"
        description="Real-time end-to-end operational visibility, fulfillment velocity, and logistics telemetry."
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={handleRefreshAll}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Boxes}
              onClick={() => navigate('/inventory')}
            >
              View Inventory
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={ShoppingCart}
              onClick={() => navigate('/orders')}
            >
              View Orders
            </Button>
          </div>
        }
      />

      {/* Primary KPI Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)'
        }}
      >
        <KpiCard
          title="Total Stock Valuation"
          value={formatCurrency(scorecard.total_inventory_value || 0)}
          icon={DollarSign}
          status="primary"
          changeLabel="Across All Hubs"
        />

        <KpiCard
          title="Fulfillment Rate"
          value={formatPercentage(scorecard.fulfillment_rate || 95)}
          icon={TrendingUp}
          status="success"
          changeLabel="Target: 95.0%"
        />

        <KpiCard
          title="Low Stock Watchlist"
          value={formatNumber(metrics.lowStockItemsCount || 0)}
          icon={AlertTriangle}
          status={metrics.lowStockItemsCount > 0 ? 'danger' : 'success'}
          changeLabel={metrics.lowStockItemsCount > 0 ? 'Action Required' : 'Optimal Levels'}
        />

        <KpiCard
          title="Shipments In Transit"
          value={formatNumber(metrics.inTransitShipmentsCount || 0)}
          icon={Truck}
          status="info"
          changeLabel="Active Freight"
        />
      </div>

      {/* Secondary Operational Summary Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)'
        }}
      >
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Catalog SKUs
            </span>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {formatNumber(metrics.totalInventoryItems || 0)}
            </div>
          </div>
          <Boxes size={24} style={{ color: 'var(--color-primary)', opacity: 0.8 }} />
        </div>

        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Pending Sales Orders
            </span>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-warning)' }}>
              {formatNumber(metrics.pendingOrdersCount || 0)}
            </div>
          </div>
          <ShoppingCart size={24} style={{ color: 'var(--color-warning)', opacity: 0.8 }} />
        </div>

        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Open Purchase Orders
            </span>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {formatNumber(scorecard.open_purchase_orders || 0)}
            </div>
          </div>
          <FileSpreadsheet size={24} style={{ color: 'var(--color-purple)', opacity: 0.8 }} />
        </div>

        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Active Warehouses
            </span>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {formatNumber(scorecard.active_warehouses || 3)}
            </div>
          </div>
          <Warehouse size={24} style={{ color: 'var(--color-info)', opacity: 0.8 }} />
        </div>
      </div>

      {/* Middle Section: Visual Intelligence Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-6)'
        }}
      >
        {/* Warehouse Valuation Distribution Chart */}
        <Card
          title="Facility Inventory Valuation"
          subtitle="Real-time stock capital distribution across active physical warehouses"
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowRight}
              onClick={() => navigate('/warehouses')}
            >
              Hub Details
            </Button>
          }
        >
          <BarChart
            data={whChartData}
            labelKey="label"
            valueKey="value"
            valueFormatter={formatCurrency}
            orientation="horizontal"
            barColor="var(--color-primary)"
            highlightMax
          />
        </Card>

        {/* Warehouse Utilization Rates */}
        <Card
          title="Warehouse Capacity & Utilization"
          subtitle="Physical cubic and pallet space occupancy by facility"
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowRight}
              onClick={() => navigate('/analytics')}
            >
              Full Analytics
            </Button>
          }
        >
          {warehouseUtil.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {warehouseUtil.map((wh, idx) => (
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
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
              Loading capacity analytics...
            </div>
          )}
        </Card>
      </div>

      {/* Lower Operational Activity Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: 'var(--space-6)'
        }}
      >
        {/* Recent Orders Card */}
        <Card
          title="Recent Sales Orders"
          subtitle="Latest client demands in the fulfillment pipeline"
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowRight}
              onClick={() => navigate('/orders')}
            >
              All Orders
            </Button>
          }
        >
          {metrics.recentOrders && metrics.recentOrders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {metrics.recentOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate('/orders')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'rgba(30, 41, 59, 0.4)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border-subtle)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.4)')}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-primary)' }}>
                      {order.order_number || `Order #${order.id?.slice(0, 8)}`}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {order.customers?.name || order.customer_name || 'Enterprise Account'} • {formatDate(order.created_at || order.order_date)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(order.total_amount || 0)}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
              No recent sales orders recorded.
            </div>
          )}
        </Card>

        {/* Low Stock Watchlist Card */}
        <Card
          title="Stock Alert Watchlist"
          subtitle="Inventory items requiring replenishment"
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowRight}
              onClick={() => navigate('/inventory')}
            >
              Inventory Control
            </Button>
          }
        >
          {metrics.lowStockItems && metrics.lowStockItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {metrics.lowStockItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate('/inventory')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)')}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-primary)' }}>
                      {item.products?.name || item.product_name || `SKU #${item.id?.slice(0, 8)}`}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Warehouse: {item.warehouses?.name || item.warehouse_name || 'Central Facility'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', fontWeight: 700, fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>
                        {item.quantity_available !== undefined ? item.quantity_available : item.quantity_on_hand || 0} left
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                        Min: {item.safety_stock || item.reorder_point || 10}
                      </span>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/purchase-orders');
                      }}
                    >
                      Reorder
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-success)', fontSize: 'var(--font-size-xs)' }}>
              All inventory levels are currently above safe operational thresholds.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;
