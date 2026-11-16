import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, Bell, Search, X, ArrowUpRight, AlertTriangle,
  ShoppingCart, Truck, Command
} from 'lucide-react';
import { NAVIGATION_SECTIONS } from '../../routes/navigation';
import { healthCheck, getDashboardMetrics } from '../../services/dashboardService';

const ALL_PAGES = NAVIGATION_SECTIONS.flatMap((s) =>
  s.items.map((i) => ({ ...i, section: s.title }))
);

function humanize(path) {
  return path
    .replace(/^\//, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [online, setOnline] = useState(true);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState({ lowStock: 0, pending: 0, transit: 0 });
  const searchRef = useRef(null);
  const alertsRef = useRef(null);

  const current = ALL_PAGES.find((p) => p.path === location.pathname);
  const section = current?.section || 'OPERATIONS';
  const pageTitle = current?.title || humanize(location.pathname);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        await healthCheck();
        if (mounted) setOnline(true);
      } catch {
        if (mounted) setOnline(false);
      }
      try {
        const res = await getDashboardMetrics();
        const d = res?.data || res;
        if (mounted && d) {
          setAlerts({
            lowStock: d.low_stock_locations || d.lowStockItemsCount || 0,
            pending: d.pending_orders || d.pendingOrdersCount || 0,
            transit: d.shipments_in_transit || d.inTransitShipmentsCount || 0
          });
        }
      } catch {
        /* Telemetry is optional; keep the last known values. */
      }
    };
    load();
    const t = setInterval(load, 30000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.querySelector('input')?.focus(), 30);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setAlertsOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (alertsRef.current && !alertsRef.current.contains(e.target)) setAlertsOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const results = ALL_PAGES.filter(
    (p) =>
      !query.trim() ||
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.section.toLowerCase().includes(query.toLowerCase())
  );
  const totalAlerts = alerts.lowStock + alerts.pending + alerts.transit;

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <button
          className="btn btn-ghost btn-icon"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <Menu size={16} />
        </button>

        <button
          onClick={() => navigate('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 9 }}
          aria-label="Control Tower home"
        >
          <span className="brand-mark">CT</span>
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
            <span style={{ fontSize: 12.5, fontWeight: 620, letterSpacing: '-0.02em' }}>Control Tower</span>
            <span style={{ fontSize: 8.5, letterSpacing: '0.13em', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Supply Chain
            </span>
          </span>
        </button>

        <div className="context-crumb" style={{ marginLeft: 6 }}>
          <span className="sep">/</span>
          <span>{section.toLowerCase()}</span>
          <span className="sep">/</span>
          <strong>{pageTitle}</strong>
        </div>
      </div>

      <div ref={searchRef} style={{ position: 'relative' }}>
        <div className="header-search" onClick={() => setSearchOpen(true)}>
          <Search size={13} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Jump to module"
            aria-label="Search modules"
          />
          <kbd>/</kbd>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: 330,
                background: '#101415',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden',
                zIndex: 60
              }}
            >
              <div className="eyebrow" style={{ padding: '9px 11px 5px' }}>
                {query ? 'Matching modules' : 'All modules'}
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto', padding: '0 5px 5px' }}>
                {results.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.path}
                      onClick={() => {
                        navigate(p.path);
                        setSearchOpen(false);
                        setQuery('');
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 9,
                        padding: '7px 8px',
                        borderRadius: 4,
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Icon size={13} style={{ color: 'var(--color-text-muted)' }} />
                      <span style={{ flex: 1, fontSize: 11.5, color: 'var(--color-text-primary)' }}>{p.title}</span>
                      <span style={{ fontSize: 9, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {p.section.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
                {results.length === 0 && (
                  <div style={{ padding: 16, fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                    No module matches “{query}”.
                  </div>
                )}
              </div>
              <div style={{ borderTop: '1px solid var(--color-border-subtle)', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: 'var(--color-text-dim)' }}>
                <Command size={10} /> search &nbsp;·&nbsp; ESC close
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className={`status-beacon${online ? '' : ' offline'}`} title={online ? 'Backend telemetry connected' : 'Backend unreachable'}>
          <span className={`dot${online ? ' animate-pulse' : ''}`} />
          {online ? 'LIVE' : 'OFFLINE'}
        </div>

        <div ref={alertsRef} style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setAlertsOpen((v) => !v)}
            aria-label={`Operational alerts, ${totalAlerts} active`}
            style={{ position: 'relative' }}
          >
            <Bell size={15} />
            {totalAlerts > 0 && (
              <span style={{
                position: 'absolute', top: 3, right: 3, width: 5, height: 5,
                borderRadius: '50%', background: 'var(--color-warning)'
              }} />
            )}
          </button>

          <AnimatePresence>
            {alertsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16 }}
                style={{
                  position: 'absolute', top: 'calc(100% + 7px)', right: 0, width: 326,
                  background: '#101415', border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
                  overflow: 'hidden', zIndex: 60
                }}
              >
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>Operational alerts</span>
                  <span className="mono" style={{ fontSize: 10, color: totalAlerts ? 'var(--color-warning-text)' : 'var(--color-success-text)' }}>
                    {totalAlerts} ACTIVE
                  </span>
                </div>
                <div style={{ padding: 6 }}>
                  <AlertRow
                    icon={AlertTriangle}
                    tone="danger"
                    show={alerts.lowStock > 0}
                    title="Stock below threshold"
                    detail={`${alerts.lowStock} location${alerts.lowStock === 1 ? '' : 's'} need attention`}
                    onClick={() => { navigate('/inventory'); setAlertsOpen(false); }}
                  />
                  <AlertRow
                    icon={ShoppingCart}
                    tone="warning"
                    show={alerts.pending > 0}
                    title="Orders awaiting action"
                    detail={`${alerts.pending} sales order${alerts.pending === 1 ? '' : 's'} in the pipeline`}
                    onClick={() => { navigate('/orders'); setAlertsOpen(false); }}
                  />
                  <AlertRow
                    icon={Truck}
                    tone="info"
                    show={alerts.transit > 0}
                    title="Freight in motion"
                    detail={`${alerts.transit} shipment${alerts.transit === 1 ? '' : 's'} in transit`}
                    onClick={() => { navigate('/shipments'); setAlertsOpen(false); }}
                  />
                  {totalAlerts === 0 && (
                    <div style={{ padding: 18, textAlign: 'center', fontSize: 10.5, color: 'var(--color-text-muted)' }}>
                      All monitored thresholds are nominal.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="profile-capsule">
          <span className="avatar">OP</span>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: 10.5, fontWeight: 600 }}>Operations</span>
            <span style={{ fontSize: 8.5, color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>GLOBAL ADMIN</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function AlertRow({ icon: Icon, tone, show, title, detail, onClick }) {
  if (!show) return null;
  const color = `var(--color-${tone}-text)`;
  const bg = `var(--color-${tone}-bg)`;
  const border = `var(--color-${tone}-border)`;
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 9,
        padding: '8px 9px', marginBottom: 4, textAlign: 'left',
        background: bg, border: `1px solid ${border}`, borderRadius: 4
      }}
    >
      <Icon size={13} style={{ color }} />
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</span>
        <span style={{ display: 'block', fontSize: 9.5, color: 'var(--color-text-muted)' }}>{detail}</span>
      </span>
      <ArrowUpRight size={11} style={{ color: 'var(--color-text-muted)' }} />
    </button>
  );
}

export default Header;
