import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Search, X, Users, CircleDollarSign, ShieldCheck } from 'lucide-react';
import * as customerService from '../services/customerService';
import * as invoiceService from '../services/invoiceService';
import * as orderService from '../services/orderService';
import { normalizeList } from '../utils/responseNormalizer';
import { PageHeader } from '../components/common/PageHeader';
import { Panel, PanelHead, PanelBody, Stat, StatGrid, Meter } from '../components/common/Panel';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatCurrency, formatNumber, formatPercentage } from '../utils/formatters';
import { pageStagger, riseIn } from '../utils/motion';

export function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true); setError(null);
    Promise.all([
      customerService.getCustomers({ limit: 200 }),
      invoiceService.getInvoices({ limit: 200 }),
      orderService.getOrders({ limit: 200 })
    ])
      .then(([c, inv, ord]) => {
        setCustomers(normalizeList(c));
        setInvoices(normalizeList(inv));
        setOrders(normalizeList(ord));
        setLoading(false);
      })
      .catch((e) => { setError(e?.message || 'Customer service unavailable.'); setLoading(false); });
  };
  useEffect(load, []);

  // Balances are derived from the invoice ledger. The receivables view duplicates
  // invoice totals across payment joins, so it is not used for account money.
  const merged = useMemo(() => {
    const byCustomer = new Map();
    invoices.forEach((inv) => {
      if (inv.status === 'CANCELLED') return;
      const cur = byCustomer.get(inv.customer_id) || { invoiced: 0, paid: 0, outstanding: 0, overdue: 0, invoices: 0 };
      cur.invoiced += Number(inv.total_amount || 0);
      cur.paid += Number(inv.paid_amount || 0);
      cur.outstanding += Number(inv.outstanding_amount || 0);
      cur.invoices += 1;
      if (inv.status === 'OVERDUE') cur.overdue += 1;
      byCustomer.set(inv.customer_id, cur);
    });

    const orderCounts = new Map();
    orders.forEach((o) => orderCounts.set(o.customer_id, (orderCounts.get(o.customer_id) || 0) + 1));

    return customers.map((c) => {
      const inv = byCustomer.get(c.customer_id) || { invoiced: 0, paid: 0, outstanding: 0, overdue: 0, invoices: 0 };
      return {
        ...c,
        total_orders: orderCounts.get(c.customer_id) || 0,
        total_invoiced: inv.invoiced,
        total_paid: inv.paid,
        outstanding_amount: inv.outstanding,
        overdue_invoices: inv.overdue,
        invoice_count: inv.invoices,
        credit_status: inv.overdue > 0 ? 'OVERDUE' : inv.outstanding > 0 ? 'OUTSTANDING' : 'CLEAR'
      };
    });
  }, [customers, invoices, orders]);

  const filtered = useMemo(() => merged.filter((c) => {
    const q = search.trim().toLowerCase();
    const match = !q || [c.customer_name, c.customer_code, c.city, c.email].some((v) => String(v || '').toLowerCase().includes(q));
    return match && (!type || c.customer_type === type);
  }), [merged, search, type]);

  const stats = useMemo(() => filtered.reduce((a, c) => {
    a.credit += Number(c.credit_limit || 0);
    a.outstanding += Number(c.outstanding_amount || 0);
    a.invoiced += Number(c.total_invoiced || 0);
    if (c.overdue_invoices > 0) a.overdue += 1;
    return a;
  }, { credit: 0, outstanding: 0, invoiced: 0, overdue: 0 }), [filtered]);

  const largest = useMemo(() => [...filtered].sort((a, b) => Number(b.outstanding_amount || 0) - Number(a.outstanding_amount || 0)).slice(0, 5), [filtered]);

  return (
    <motion.div className="page" variants={pageStagger} initial="hidden" animate="visible">
      <motion.div variants={riseIn}>
        <PageHeader
          eyebrow="COMMERCIAL / ACCOUNTS"
          title="Customers"
          description="B2B accounts, credit exposure and collection status across the revenue base."
          actions={<button className="btn btn-outline" onClick={load}><RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh</button>}
        />
      </motion.div>

      <motion.div variants={riseIn}>
        <StatGrid cols={4}>
          <Stat label="Accounts" value={formatNumber(filtered.length)} meta={`${formatNumber(customers.length)} on record`} icon={Users} />
          <Stat label="Credit extended" value={formatCurrency(stats.credit)} meta="Approved limits" icon={ShieldCheck} />
          <Stat label="Outstanding" value={formatCurrency(stats.outstanding)} meta={`${formatCurrency(stats.invoiced)} invoiced`} tone="warn" icon={CircleDollarSign} />
          <Stat label="With overdue" value={formatNumber(stats.overdue)} meta="Accounts past due" tone={stats.overdue ? 'bad' : ''} />
        </StatGrid>
      </motion.div>

      <div className="split split-aside">
        <motion.div variants={riseIn} style={{ minWidth: 0 }}>
          <Panel>
            <div className="toolbar">
              <div className="toolbar-group">
                <label className="search-field">
                  <Search size={12} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Account, code, city or email…" />
                  {search && <button onClick={() => setSearch('')}><X size={11} /></button>}
                </label>
                <select value={type} onChange={(e) => setType(e.target.value)} style={{ height: 30, fontSize: 11 }}>
                  <option value="">All account types</option>
                  {Array.from(new Set(customers.map((c) => c.customer_type))).map((t) => <option key={t} value={t}>{t?.replace('_', ' ')}</option>)}
                </select>
              </div>
              <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{filtered.length} ACCOUNTS</span>
            </div>

            {error ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--color-danger-text)', fontSize: 11 }}>{error}</div>
            ) : (
              <div className="table-scroll tall">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Type</th>
                      <th>Location</th>
                      <th style={{ textAlign: 'right' }}>Orders</th>
                      <th style={{ textAlign: 'right' }}>Invoiced</th>
                      <th style={{ textAlign: 'right' }}>Outstanding</th>
                      <th style={{ width: 110 }}>Credit used</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 8 }).map((__, j) => <td key={j}><div className="skeleton" style={{ height: 9 }} /></td>)}</tr>
                    ))}
                    {!loading && filtered.map((c) => {
                      const used = Number(c.credit_limit) ? (Number(c.outstanding_amount || 0) / Number(c.credit_limit)) * 100 : 0;
                      return (
                        <tr key={c.customer_id} className="clickable" onClick={() => setSelected(c)}>
                          <td>
                            <div className="cell-strong">{c.customer_name}</div>
                            <div className="cell-sub mono">{c.customer_code}</div>
                          </td>
                          <td style={{ fontSize: 10 }}>{c.customer_type?.replace('_', ' ')}</td>
                          <td>{c.city}</td>
                          <td className="mono" style={{ textAlign: 'right' }}>{formatNumber(c.total_orders)}</td>
                          <td className="num" style={{ textAlign: 'right' }}>{formatCurrency(c.total_invoiced)}</td>
                          <td className="num" style={{ textAlign: 'right', color: Number(c.outstanding_amount) > 0 ? 'var(--color-warning-text)' : 'var(--color-text-muted)' }}>
                            {formatCurrency(c.outstanding_amount)}
                          </td>
                          <td>
                            <Meter value={used} tone={used > 80 ? 'bad' : used > 50 ? 'warn' : 'good'} />
                            <div className="mono" style={{ fontSize: 8, color: 'var(--color-text-muted)', marginTop: 3 }}>{formatPercentage(used)}</div>
                          </td>
                          <td><StatusBadge status={c.credit_status} size="sm" /></td>
                        </tr>
                      );
                    })}
                    {!loading && filtered.length === 0 && (
                      <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>No accounts match this filter.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </motion.div>

        <motion.div variants={riseIn} style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <Panel>
            <PanelHead title="Largest exposures" subtitle="Outstanding balance by account" />
            <PanelBody style={{ display: 'grid', gap: 11 }}>
              {largest.filter((c) => Number(c.outstanding_amount) > 0).map((c) => (
                <button key={c.customer_id} onClick={() => setSelected(c)} style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <span className="truncate" style={{ fontSize: 10.5, color: 'var(--color-text-secondary)' }}>{c.customer_name}</span>
                    <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{formatCurrency(c.outstanding_amount)}</span>
                  </div>
                  <Meter value={stats.outstanding ? (Number(c.outstanding_amount) / stats.outstanding) * 100 : 0} tone="warn" />
                </button>
              ))}
              {!loading && !largest.some((c) => Number(c.outstanding_amount) > 0) && <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)' }}>No open receivables.</div>}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead title="Account record" subtitle={selected ? selected.customer_name : 'Select an account'} />
            <PanelBody>
              {!selected ? (
                <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>Select an account to review contact details, credit limit and invoice history.</div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  <Row label="Code" value={selected.customer_code} />
                  <Row label="Type" value={selected.customer_type} />
                  <Row label="Email" value={selected.email} />
                  <Row label="Phone" value={selected.phone} />
                  <Row label="Address" value={`${selected.address || ''}${selected.city ? `, ${selected.city}` : ''}`} />
                  <Row label="Credit limit" value={formatCurrency(selected.credit_limit)} />
                  <Row label="Invoices" value={formatNumber(selected.invoice_count)} />
                  <Row label="Invoiced" value={formatCurrency(selected.total_invoiced)} />
                  <Row label="Paid" value={formatCurrency(selected.total_paid)} />
                  <Row label="Outstanding" value={formatCurrency(selected.outstanding_amount)} />
                  <Row label="Overdue invoices" value={formatNumber(selected.overdue_invoices)} />
                </div>
              )}
            </PanelBody>
          </Panel>
        </motion.div>
      </div>
    </motion.div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, paddingBottom: 6, borderBottom: '1px solid var(--color-border-subtle)' }}>
      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ fontSize: 10.5, textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );
}

export default CustomersPage;
