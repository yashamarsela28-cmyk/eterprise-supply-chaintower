import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  X,
  ArrowRight,
  AlertTriangle,
  ShoppingCart,
  Truck,
  Layers,
  Activity,
  Boxes
} from 'lucide-react';
import { IconButton } from '../common/IconButton';
import { Badge } from '../common/Badge';
import { healthCheck, getDashboardMetrics } from '../../services/dashboardService';

/**
 * Enterprise Application Top Navigation Header
 * Editorial, high-density, real telemetry beacon, instant jump search
 */
export function Header({ onToggleSidebar, isSidebarOpen }) {
  const navigate = useNavigate();
  const [apiOnline, setApiOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [alertsData, setAlertsData] = useState({ lowStock: 0, pendingOrders: 0, inTransit: 0 });

  const alertsRef = useRef(null);
  const searchRef = useRef(null);

  // Searchable navigation modules
  const NAV_PAGES = [
    { title: 'Control Tower Dashboard', path: '/dashboard', category: 'Overview' },
    { title: 'Supply Chain Analytics', path: '/analytics', category: 'Overview' },
    { title: 'Inventory Control', path: '/inventory', category: 'Inventory' },
    { title: 'Sales Orders', path: '/orders', category: 'Operations' },
    { title: 'Shipments & Tracking', path: '/shipments', category: 'Operations' },
    { title: 'Stock Transfers', path: '/transfers', category: 'Operations' },
    { title: 'Suppliers Directory', path: '/suppliers', category: 'Procurement' },
    { title: 'Purchase Orders', path: '/purchase-orders', category: 'Procurement' },
    { title: 'Goods Receipts', path: '/goods-receipts', category: 'Procurement' },
    { title: 'Products & SKUs', path: '/products', category: 'Master Data' },
    { title: 'Customers Directory', path: '/customers', category: 'Master Data' },
    { title: 'Warehouses & Hubs', path: '/warehouses', category: 'Master Data' },
    { title: 'Invoices & Billing', path: '/invoices', category: 'Finance' },
    { title: 'Payment Journal', path: '/payments', category: 'Finance' },
    { title: 'Returns & RMA', path: '/returns', category: 'Quality & Returns' }
  ];

  const filteredNav = searchQuery.trim()
    ? NAV_PAGES.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : NAV_PAGES;

  // Real Health & Alert Telemetry
  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        await healthCheck();
        if (isMounted) setApiOnline(true);
      } catch {
        if (isMounted) setApiOnline(false);
      }

      try {
        const metricsRes = await getDashboardMetrics();
        const data = metricsRes?.data || metricsRes;
        if (isMounted && data) {
          setAlertsData({
            lowStock: data.lowStockItemsCount || (Array.isArray(data.lowStockItems) ? data.lowStockItems.length : 0),
            pendingOrders: data.pendingOrdersCount || 0,
            inTransit: data.inTransitShipmentsCount || 0
          });
        }
      } catch {
        // Fallback silently if metrics fail
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Keyboard shortcut '/' to open search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && !isSearchOpen && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (alertsRef.current && !alertsRef.current.contains(e.target)) {
        setIsAlertsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalAlertCount = alertsData.lowStock + alertsData.pendingOrders + alertsData.inTransit;

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--color-bg-secondary)',
        borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-5)',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-header)',
        backdropFilter: 'blur(12px)'
      }}
    >
      {/* Left: Brand Identity & Sidebar Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            padding: '0.4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-md)',
            transition: 'background var(--transition-fast), color var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
          title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          <Menu size={18} />
        </button>

        <div
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-bg-primary)',
              fontWeight: 800,
              fontSize: '13px',
              letterSpacing: '-0.03em'
            }}
          >
            CT
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontWeight: 600,
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1
              }}
            >
              Control Tower
            </span>
            <span
              style={{
                fontSize: '10px',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600
              }}
            >
              Enterprise Supply Chain
            </span>
          </div>
        </div>
      </div>

      {/* Center: Global Module Jump Search */}
      <div ref={searchRef} style={{ position: 'relative', width: '380px', maxWidth: '100%' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--color-bg-input)',
            border: `1px solid ${isSearchOpen ? 'var(--color-border-strong)' : 'var(--color-border-default)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '0.35rem 0.65rem',
            gap: '0.5rem',
            transition: 'border-color var(--transition-fast)'
          }}
        >
          <Search size={14} style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search modules or press '/'..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-xs)',
              width: '100%',
              padding: 0
            }}
          />
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}
            >
              <X size={12} />
            </button>
          ) : (
            <kbd
              style={{
                fontSize: '10px',
                padding: '0.1rem 0.35rem',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-default)',
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              /
            </kbd>
          )}
        </div>

        {/* Quick Jump Search Flyout */}
        {isSearchOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              maxHeight: '320px',
              overflowY: 'auto',
              zIndex: 'var(--z-modal)',
              padding: '0.35rem'
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--color-text-dim)',
                padding: '0.35rem 0.5rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}
            >
              Navigation Jump
            </div>
            {filteredNav.map((page) => (
              <div
                key={page.path}
                onClick={() => {
                  navigate(page.path);
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.45rem 0.65rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-primary)',
                  transition: 'background var(--transition-fast)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontWeight: 500 }}>{page.title}</span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{page.category}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Live Beacon, Alerts Popover, User Capsule */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {/* Real API Status Beacon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.2rem 0.55rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: apiOnline ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
            border: `1px solid ${apiOnline ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
            fontSize: '11px',
            color: apiOnline ? 'var(--color-success-text)' : 'var(--color-danger-text)'
          }}
          title={apiOnline ? 'Live Express Backend Connected' : 'Live Express Backend Offline'}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: apiOnline ? 'var(--color-success)' : 'var(--color-danger)'
            }}
            className={apiOnline ? 'animate-pulse' : ''}
          />
          <span style={{ fontWeight: 600, letterSpacing: '0.04em' }}>{apiOnline ? 'LIVE' : 'OFFLINE'}</span>
        </div>

        {/* Operational Alerts Popover */}
        <div ref={alertsRef} style={{ position: 'relative' }}>
          <IconButton
            icon={Bell}
            size="sm"
            variant={isAlertsOpen ? 'secondary' : 'ghost'}
            title="Operational Alerts"
            badge={totalAlertCount > 0 ? String(totalAlertCount) : undefined}
            onClick={() => setIsAlertsOpen((prev) => !prev)}
          />

          {isAlertsOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '320px',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-strong)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 'var(--z-modal)',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderBottom: '1px solid var(--color-border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--color-bg-tertiary)'
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-primary)' }}>
                  Operational Telemetry Alerts
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: totalAlertCount > 0 ? 'var(--color-warning-text)' : 'var(--color-success-text)'
                  }}
                >
                  {totalAlertCount} Active
                </span>
              </div>

              <div style={{ padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {alertsData.lowStock > 0 && (
                  <div
                    onClick={() => {
                      navigate('/inventory');
                      setIsAlertsOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.55rem 0.65rem',
                      backgroundColor: 'var(--color-danger-bg)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-danger-border)',
                      cursor: 'pointer'
                    }}
                  >
                    <AlertTriangle size={14} style={{ color: 'var(--color-danger-text)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        Low Stock Alert
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                        {alertsData.lowStock} item(s) below reorder threshold
                      </div>
                    </div>
                    <ArrowRight size={12} style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                )}

                {alertsData.pendingOrders > 0 && (
                  <div
                    onClick={() => {
                      navigate('/orders');
                      setIsAlertsOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.55rem 0.65rem',
                      backgroundColor: 'var(--color-warning-bg)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-warning-border)',
                      cursor: 'pointer'
                    }}
                  >
                    <ShoppingCart size={14} style={{ color: 'var(--color-warning-text)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        Pending Fulfillment
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                        {alertsData.pendingOrders} sales orders awaiting action
                      </div>
                    </div>
                    <ArrowRight size={12} style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                )}

                {alertsData.inTransit > 0 && (
                  <div
                    onClick={() => {
                      navigate('/shipments');
                      setIsAlertsOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.55rem 0.65rem',
                      backgroundColor: 'var(--color-info-bg)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-info-border)',
                      cursor: 'pointer'
                    }}
                  >
                    <Truck size={14} style={{ color: 'var(--color-info-text)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        Active Freight
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                        {alertsData.inTransit} carrier shipments in transit
                      </div>
                    </div>
                    <ArrowRight size={12} style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                )}

                {totalAlertCount === 0 && (
                  <div
                    style={{
                      padding: '1rem',
                      textAlign: 'center',
                      color: 'var(--color-text-muted)',
                      fontSize: '11px'
                    }}
                  >
                    All systems nominal. No active operational alerts.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User / Profile Capsule */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.2rem 0.5rem 0.2rem 0.25rem',
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-full)'
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-bg-hover)',
              border: '1px solid var(--color-border-strong)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-primary)',
              fontSize: '10px',
              fontWeight: 700
            }}
          >
            OP
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Operations
          </span>
        </div>
      </div>
    </header>
  );
}

export default Header;
