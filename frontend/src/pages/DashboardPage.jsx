import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.19, 1, 0.22, 1]
      }
    }
  };

  return (
    <motion.div
      className="dashboard-page"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)'
      }}
    >
      {/* Premium Redesigned Header Section */}
      <motion.div variants={itemVariants}>
        <div style={{
          background: 'linear-gradient(135deg, var(--color-bg-elevated) 0%, var(--color-bg-card) 100%)',
          borderRadius: 'var(--radius-2xl)',
          padding: 'var(--space-8)',
          border: '1px solid var(--color-border-default)',
          boxShadow: 'var(--shadow-card)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative accent element */}
          <div style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-accent-blue)', marginBottom: 'var(--space-2)' }}>
                  SUPPLY CHAIN COMMAND CENTER
                </div>
                <h1 style={{ fontSize: 'var(--font-size-5xl)', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 'var(--space-3)' }}>
                  Enterprise Control Tower
                </h1>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, maxWidth: '600px' }}>
                  Real-time operational intelligence across global warehouse network, procurement pipeline, and multi-modal logistics
                </p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefreshAll}
                  style={{
                    padding: '0.65rem 1.5rem',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid var(--color-accent-blue)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--color-accent-blue)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <RefreshCw size={16} />
                  Refresh
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Premium KPI Grid - Enhanced Cards */}
      <motion.div
        variants={itemVariants}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-5)',
          marginBottom: 'var(--space-6)'
        }}
      >
        {/* KPI Card 1: Total Valuation */}
        <motion.div whileHover={{ y: -6, transition: { duration: 0.3 } }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
            border: '1px solid var(--color-accent-blue-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-5)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 0 0 1px var(--color-border-subtle), 0 2px 8px rgba(59, 130, 246, 0.05)'
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)', borderRadius: '50%', transform: 'translate(40px, -40px)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)' }}>Total Valuation</span>
                <DollarSign size={18} style={{ color: 'var(--color-accent-blue)' }} />
              </div>
              <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.01em', marginBottom: 'var(--space-2)' }}>
                {formatCurrency(scorecard.total_inventory_value || 0)}
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Across {formatNumber(scorecard.active_warehouses || 3)} active physical hubs</p>
            </div>
          </div>
        </motion.div>

        {/* KPI Card 2: Fulfillment Rate */}
        <motion.div whileHover={{ y: -6, transition: { duration: 0.3 } }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-5)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 0 0 1px var(--color-border-subtle), 0 2px 8px rgba(16, 185, 129, 0.05)'
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)', borderRadius: '50%', transform: 'translate(40px, -40px)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)' }}>Fulfillment Rate</span>
                <TrendingUp size={18} style={{ color: 'var(--color-success)' }} />
              </div>
              <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-success-text)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.01em', marginBottom: 'var(--space-2)' }}>
                {formatPercentage(scorecard.fulfillment_rate || 95)}
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Order dispatch velocity vs 95% target</p>
            </div>
          </div>
        </motion.div>

        {/* KPI Card 3: Stock Alerts */}
        <motion.div whileHover={{ y: -6, transition: { duration: 0.3 } }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
            border: metrics.lowStockItemsCount > 0 ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-5)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 0 0 1px var(--color-border-subtle), 0 2px 8px rgba(239, 68, 68, 0.05)'
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)', borderRadius: '50%', transform: 'translate(40px, -40px)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)' }}>Stock Alerts</span>
                <AlertTriangle size={18} style={{ color: metrics.lowStockItemsCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }} />
              </div>
              <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: metrics.lowStockItemsCount > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.01em', marginBottom: 'var(--space-2)' }}>
                {formatNumber(metrics.lowStockItemsCount || 0)}
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                {metrics.lowStockItemsCount > 0 ? 'Requires replenishment' : 'All optimal levels'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* KPI Card 4: Shipments In Transit */}
        <motion.div whileHover={{ y: -6, transition: { duration: 0.3 } }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-5)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 0 0 1px var(--color-border-subtle), 0 2px 8px rgba(6, 182, 212, 0.05)'
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)', borderRadius: '50%', transform: 'translate(40px, -40px)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)' }}>In Transit</span>
                <Truck size={18} style={{ color: 'var(--color-info)' }} />
              </div>
              <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-info-text)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.01em', marginBottom: 'var(--space-2)' }}>
                {formatNumber(metrics.inTransitShipmentsCount || 0)}
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Active multi-modal freight</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Operational Metrics Row - Premium Tiles */}
      <motion.div
        variants={itemVariants}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)'
        }}
      >
        {/* Metric Tile 1 */}
        <div style={{
          padding: 'var(--space-4)',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          transition: 'all var(--transition-normal)',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-strong)';
          e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
          e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-default)';
          e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Catalog SKUs
            </span>
            <Boxes size={16} style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }} />
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(metrics.totalInventoryItems || 0)}
          </div>
        </div>

        {/* Metric Tile 2 */}
        <div style={{
          padding: 'var(--space-4)',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          transition: 'all var(--transition-normal)',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-warning)';
          e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
          e.currentTarget.style.boxShadow = '0 0 0 1px var(--color-border-default), 0 0 12px rgba(245, 158, 11, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-default)';
          e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pending Orders
            </span>
            <ShoppingCart size={16} style={{ color: 'var(--color-warning)', opacity: 0.8 }} />
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-warning)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(metrics.pendingOrdersCount || 0)}
          </div>
        </div>

        {/* Metric Tile 3 */}
        <div style={{
          padding: 'var(--space-4)',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          transition: 'all var(--transition-normal)',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-purple)';
          e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
          e.currentTarget.style.boxShadow = '0 0 0 1px var(--color-border-default), 0 0 12px rgba(139, 92, 246, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-default)';
          e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Open POs
            </span>
            <FileSpreadsheet size={16} style={{ color: 'var(--color-purple-text)', opacity: 0.8 }} />
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-purple-text)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(scorecard.open_purchase_orders || 0)}
          </div>
        </div>

        {/* Metric Tile 4 */}
        <div style={{
          padding: 'var(--space-4)',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          transition: 'all var(--transition-normal)',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-accent-blue)';
          e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
          e.currentTarget.style.boxShadow = '0 0 0 1px var(--color-border-default), 0 0 12px rgba(59, 130, 246, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-default)';
          e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Hubs
            </span>
            <Warehouse size={16} style={{ color: 'var(--color-info-text)', opacity: 0.8 }} />
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(scorecard.active_warehouses || 3)}
          </div>
        </div>
      </motion.div>

      {/* Premium Analytics & Intelligence Grid */}
      <motion.div
        variants={itemVariants}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: 'var(--space-5)',
          marginBottom: 'var(--space-6)'
        }}
      >
        {/* Facility Valuation Chart - Premium Card */}
        <div style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-card)',
          transition: 'all var(--transition-normal)',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-strong)';
          e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-default)';
          e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>Facility Inventory Valuation</h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Real-time stock capital distribution across active warehouses</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => navigate('/warehouses')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all var(--transition-fast)'
              }}
            >
              View Details <ArrowRight size={14} />
            </motion.button>
          </div>
          <BarChart
            data={whChartData}
            labelKey="label"
            valueKey="value"
            valueFormatter={formatCurrency}
            orientation="horizontal"
            barColor="var(--color-accent-blue)"
            highlightMax
          />
        </div>

        {/* Warehouse Utilization - Premium Card */}
        <div style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-card)',
          transition: 'all var(--transition-normal)',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-strong)';
          e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-default)';
          e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>Warehouse Capacity & Utilization</h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Physical cubic and pallet space occupancy by facility</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => navigate('/analytics')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all var(--transition-fast)'
              }}
            >
              Full Analytics <ArrowRight size={14} />
            </motion.button>
          </div>
          {warehouseUtil.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {warehouseUtil.map((wh, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {wh.warehouse_name || 'Warehouse'}
                    </span>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {formatNumber(wh.utilized_capacity || 0)} / {formatNumber(wh.total_capacity || 0)}
                    </span>
                  </div>
                  <ProgressBar
                    label=""
                    value={Number(wh.utilization_rate) || 0}
                    max={100}
                    showValue={false}
                    thresholds={{ warning: 75, danger: 90 }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
              No capacity metrics recorded.
            </div>
          )}
        </div>
      </motion.div>

      {/* Operational Activity Section - Premium Cards */}
      <motion.div
        variants={itemVariants}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: 'var(--space-5)'
        }}
      >
        {/* Recent Orders */}
        <div style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-card)',
          transition: 'all var(--transition-normal)',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-strong)';
          e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-default)';
          e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>Recent Sales Orders</h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Latest client demands in the fulfillment pipeline</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => navigate('/orders')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all var(--transition-fast)'
              }}
            >
              All Orders <ArrowRight size={14} />
            </motion.button>
          </div>
          {recentOrders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentOrders.slice(0, 5).map((order) => (
                <motion.div
                  key={order.id}
                  whileHover={{ x: 4 }}
                  onClick={() => navigate('/orders')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-3) var(--space-4)',
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-primary)' }}>
                      {order.order_number || `Order #${order.id?.slice(0, 8)}`}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {order.customers?.name || order.customer_name || 'Enterprise Account'} • {formatDate(order.created_at || order.order_date)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {formatCurrency(order.total_amount || 0)}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
              No recent sales orders recorded.
            </div>
          )}
        </div>

        {/* Low Stock Watchlist */}
        <div style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-card)',
          transition: 'all var(--transition-normal)',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-strong)';
          e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-default)';
          e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>Stock Alert Watchlist</h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Inventory items requiring replenishment</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => navigate('/inventory')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all var(--transition-fast)'
              }}
            >
              Inventory <ArrowRight size={14} />
            </motion.button>
          </div>
          {lowStockItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {lowStockItems.slice(0, 5).map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ x: 4 }}
                  onClick={() => navigate('/inventory')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-3) var(--space-4)',
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border-subtle)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                    e.currentTarget.style.borderColor = 'var(--color-danger-border)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                    e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-primary)' }}>
                      {item.products?.name || item.product_name || `SKU #${item.id?.slice(0, 8)}`}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Hub: {item.warehouses?.name || item.warehouse_name || 'Central Facility'} • {item.quantity_available !== undefined ? item.quantity_available : item.quantity_on_hand || 0} units
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/purchase-orders');
                      }}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-danger-text)',
                        fontSize: '10px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      Reorder
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-success-text)', fontSize: 'var(--font-size-xs)' }}>
              ✓ All inventory items are above safe operational thresholds.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default DashboardPage;
