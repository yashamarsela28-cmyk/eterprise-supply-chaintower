import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  ShoppingCart,
  Truck,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  RefreshCw,
  ArrowRight,
  Warehouse,
  FileSpreadsheet,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { getDashboardMetrics } from '../services/dashboardService';
import {
  getSupplyChainScorecard,
  getWarehouseKpis,
  getWarehouseUtilizationKpis
} from '../services/analyticsService';
import { normalizeObject, normalizeList } from '../utils/responseNormalizer';
import { PageHeader } from '../components/common/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { ProgressBar } from '../components/common/ProgressBar';
import { BarChart } from '../components/common/BarChart';
import { formatCurrency, formatNumber, formatDate, formatPercentage } from '../utils/formatters';

/**
 * Enterprise Executive Control Tower Dashboard
 * High-density editorial command interface with live multi-echelon telemetry
 */
export function DashboardPage() {
  const navigate = useNavigate();

  // Load Operational Metrics
  const { data: metricsRaw, loading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useApiQuery(
    getDashboardMetrics,
    {},
    { immediate: true }
  );

  // Load Analytics Scorecard
  const { data: scorecardRaw, loading: scoreLoading, refetch: refetchScore } = useApiQuery(
    getSupplyChainScorecard,
    {},
    { immediate: true }
  );

  // Load Warehouse KPIs for valuation chart
  const { data: whKpisRaw, loading: whLoading, refetch: refetchWh } = useApiQuery(
    getWarehouseKpis,
    {},
    { immediate: true }
  );

  // Load Warehouse Utilization for capacity telemetry
  const { data: whUtilRaw, loading: utilLoading, refetch: refetchUtil } = useApiQuery(
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

  // Defensive Normalization: Always extracts valid object/array regardless of wrapper depth
  const metrics = normalizeObject(metricsRaw);
  const scorecard = normalizeObject(scorecardRaw);
  const warehouseKpis = normalizeList(whKpisRaw);
  const warehouseUtil = normalizeList(whUtilRaw);

  if (metricsLoading && scoreLoading && !metricsRaw && !scorecardRaw) {
    return <LoadingState message="Connecting to Supply Chain Control Tower..." fullPage />;
  }

  if (metricsError && !metricsRaw) {
    return (
      <ErrorState
        title="Failed to Load Control Tower"
        message={metricsError?.message || 'Could not connect to Control Tower backend services.'}
        onRetry={handleRefreshAll}
      />
    );
  }

  // Transform warehouse KPIs for bar chart
  const whChartData = warehouseKpis.map((w) => ({
    label: w.warehouse_name || w.warehouse_code || 'Facility',
    value: Number(w.total_inventory_value) || 0
  }));

  const recentOrders = Array.isArray(metrics.recentOrders) ? metrics.recentOrders : [];
  const lowStockItems = Array.isArray(metrics.lowStockItems) ? metrics.lowStockItems : [];

  return (
    <div className="dashboard-page animate-fade-in">
      {/* Editorial Page Header */}
      <PageHeader
        eyebrow="CONTROL TOWER // REAL-TIME COMMAND"
        title="Executive Control Tower"
        description="Real-time multi-echelon telemetry across inventory valuation, procurement pipeline, and logistics transit."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={handleRefreshAll}
            >
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Boxes}
              onClick={() => navigate('/inventory')}
            >
              Inventory
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={ShoppingCart}
              onClick={() => navigate('/orders')}
            >
              Sales Orders
            </Button>
          </div>
        }
      />

      {/* Primary KPI Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-5)'
        }}
      >
        <KpiCard
          title="Total Stock Valuation"
          value={formatCurrency(scorecard.total_inventory_value || 0)}
          icon={DollarSign}
          color="primary"
          subtitle="Across all physical hubs"
          badge={{ text: 'Live', variant: 'neutral' }}
        />

        <KpiCard
          title="Fulfillment Rate"
          value={formatPercentage(scorecard.fulfillment_rate || 95)}
          icon={TrendingUp}
          color="success"
          trend={{ value: 'Target: 95.0%', isPositive: true }}
          subtitle="Order dispatch velocity"
        />

        <KpiCard
          title="Low Stock Watchlist"
          value={formatNumber(metrics.lowStockItemsCount || 0)}
          icon={AlertTriangle}
          color={metrics.lowStockItemsCount > 0 ? 'warning' : 'success'}
          subtitle={metrics.lowStockItemsCount > 0 ? 'Requires replenishment' : 'Optimal stock levels'}
          badge={metrics.lowStockItemsCount > 0 ? { text: 'Alert', variant: 'warning' } : { text: 'Nominal', variant: 'success' }}
        />

        <KpiCard
          title="Shipments In Transit"
          value={formatNumber(metrics.inTransitShipmentsCount || 0)}
          icon={Truck}
          color="info"
          subtitle="Active multi-modal freight"
          badge={{ text: 'En Route', variant: 'info' }}
        />
      </div>

      {/* Secondary Operational Summary Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)'
        }}
      >
        <div
          style={{
            padding: '0.875rem 1.15rem',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)'
          }}
        >
          <div>
            <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Catalog SKUs
            </span>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
              {formatNumber(metrics.totalInventoryItems || 0)}
            </div>
          </div>
          <Boxes size={20} style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }} />
        </div>

        <div
          style={{
            padding: '0.875rem 1.15rem',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)'
          }}
        >
          <div>
            <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pending Sales Orders
            </span>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-warning)', fontFamily: 'var(--font-mono)' }}>
              {formatNumber(metrics.pendingOrdersCount || 0)}
            </div>
          </div>
          <ShoppingCart size={20} style={{ color: 'var(--color-warning)', opacity: 0.8 }} />
        </div>

        <div
          style={{
            padding: '0.875rem 1.15rem',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)'
          }}
        >
          <div>
            <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Open Purchase Orders
            </span>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-purple-text)', fontFamily: 'var(--font-mono)' }}>
              {formatNumber(scorecard.open_purchase_orders || 0)}
            </div>
          </div>
          <FileSpreadsheet size={20} style={{ color: 'var(--color-purple-text)', opacity: 0.8 }} />
        </div>

        <div
          style={{
            padding: '0.875rem 1.15rem',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)'
          }}
        >
          <div>
            <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Warehouses
            </span>
            <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
              {formatNumber(scorecard.active_warehouses || 3)}
            </div>
          </div>
          <Warehouse size={20} style={{ color: 'var(--color-info-text)', opacity: 0.8 }} />
        </div>
      </div>

      {/* Middle Section: Visual Intelligence Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: 'var(--space-5)',
          marginBottom: 'var(--space-6)'
        }}
      >
        {/* Warehouse Valuation Distribution Chart */}
        <Card
          title="Facility Inventory Valuation"
          subtitle="Real-time stock capital distribution across active physical warehouses"
          headerBorder
          action={
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowRight}
              iconPosition="right"
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
            barColor="var(--color-border-strong)"
            highlightMax
          />
        </Card>

        {/* Warehouse Utilization Rates */}
        <Card
          title="Warehouse Capacity & Utilization"
          subtitle="Physical cubic and pallet space occupancy by facility"
          headerBorder
          action={
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => navigate('/analytics')}
            >
              Analytics
            </Button>
          }
        >
          {warehouseUtil.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
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
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
              No capacity metrics recorded.
            </div>
          )}
        </Card>
      </div>

      {/* Lower Operational Activity Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: 'var(--space-5)'
        }}
      >
        {/* Recent Orders Card */}
        <Card
          title="Recent Sales Orders"
          subtitle="Latest client demands in the fulfillment pipeline"
          headerBorder
          action={
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => navigate('/orders')}
            >
              All Orders
            </Button>
          }
        >
          {recentOrders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate('/orders')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-subtle)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                    e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                    e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                  }}
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
          headerBorder
          action={
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => navigate('/inventory')}
            >
              Inventory Control
            </Button>
          }
        >
          {lowStockItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {lowStockItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate('/inventory')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-subtle)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                    e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                    e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-primary)' }}>
                      {item.products?.name || item.product_name || `SKU #${item.id?.slice(0, 8)}`}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Hub: {item.warehouses?.name || item.warehouse_name || 'Central Facility'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', fontWeight: 700, fontSize: 'var(--font-size-xs)', color: 'var(--color-danger-text)', fontFamily: 'var(--font-mono)' }}>
                        {item.quantity_available !== undefined ? item.quantity_available : item.quantity_on_hand || 0} units
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                        Safety: {item.safety_stock || item.reorder_point || 10}
                      </span>
                    </div>
                    <Button
                      variant="outline"
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
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-success-text)', fontSize: 'var(--font-size-xs)' }}>
              All inventory items are currently above safe operational thresholds.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;
