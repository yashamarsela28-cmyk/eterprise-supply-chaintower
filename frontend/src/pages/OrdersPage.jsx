import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Search, X, Plus, CheckCircle, Truck, Package, XCircle,
  Box, ArrowRight, ShoppingCart
} from 'lucide-react';
import * as orderService from '../services/orderService';
import * as customerService from '../services/customerService';
import * as warehouseService from '../services/warehouseService';
import * as productService from '../services/productService';
import { normalizeList } from '../utils/responseNormalizer';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import { Panel, PanelHead, PanelBody, Stat, StatGrid } from '../components/common/Panel';
import { StatusBadge } from '../components/common/StatusBadge';
import { Drawer } from '../components/common/Drawer';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { formatCurrency, formatDate, formatNumber } from '../utils/formatters';
import { pageStagger, riseIn } from '../utils/motion';

const STAGES = ['PENDING', 'CONFIRMED', 'ALLOCATED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export function OrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [lookups, setLookups] = useState({ customers: [], warehouses: [], products: [] });
  const [form, setForm] = useState({ customer_id: '', warehouse_id: '', shipping_address: '', items: [] });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    orderService.getOrders({ limit: 200 })
      .then((res) => { setOrders(normalizeList(res)); setLoading(false); })
      .catch((e) => { setError(e?.message || 'Order service unavailable.'); setLoading(false); });
  };
  useEffect(load, []);

  const openCreate = async () => {
    setCreateOpen(true);
    if (!lookups.customers.length) {
      try {
        const [c, w, p] = await Promise.all([
          customerService.getCustomers({ limit: 100 }),
          warehouseService.getWarehouses(),
          productService.getProducts({ limit: 100 })
        ]);
        const next = { customers: normalizeList(c), warehouses: normalizeList(w), products: normalizeList(p) };
        setLookups(next);
        const cust = next.customers[0] || {};
        const prod = next.products[0] || {};
        setForm({
          customer_id: cust.customer_id || '',
          warehouse_id: next.warehouses[0]?.warehouse_id || '',
          shipping_address: cust.address || cust.city || '',
          items: prod.product_id ? [{ product_id: prod.product_id, ordered_quantity: 1, unit_price: prod.unit_price || 0 }] : []
        });
      } catch (e) {
        toast.error(e?.message || 'Could not load order references.');
      }
    }
  };

  const filtered = useMemo(() => orders.filter((o) => {
    const q = search.trim().toLowerCase();
    const match = !q || [o.order_number, o.customer_name, o.warehouse_name, o.shipping_address]
      .some((v) => String(v || '').toLowerCase().includes(q));
    return match && (!status || o.status === status);
  }), [orders, search, status]);

  const stageCounts = useMemo(() => {
    const m = {};
    orders.forEach((o) => { m[o.status] = (m[o.status] || 0) + 1; });
    return m;
  }, [orders]);

  const stats = useMemo(() => filtered.reduce((a, o) => {
    a.value += Number(o.total_amount || 0);
    if (['PENDING', 'CONFIRMED', 'ALLOCATED', 'PROCESSING'].includes(o.status)) a.open += 1;
    if (o.status === 'DELIVERED') a.closed += 1;
    return a;
  }, { value: 0, open: 0, closed: 0 }), [filtered]);

  const transition = async (fn, label) => {
    if (!selected) return;
    setBusy(true);
    try {
      await fn(selected.sales_order_id);
      toast.success(`Order ${selected.order_number} → ${label}`);
      setSelected(null);
      load();
    } catch (e) {
      toast.error(e?.message || 'Order transition failed.');
    } finally {
      setBusy(false);
    }
  };

  const addLine = () => {
    const p = lookups.products[0] || {};
    setForm((f) => ({ ...f, items: [...f.items, { product_id: p.product_id || '', ordered_quantity: 1, unit_price: p.unit_price || 0 }] }));
  };

  const submitOrder = async () => {
    if (!form.customer_id || !form.warehouse_id || !form.items.length) {
      toast.error('Customer, warehouse and at least one line item are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await orderService.createOrder({
        customer_id: Number(form.customer_id),
        warehouse_id: Number(form.warehouse_id),
        shipping_address: form.shipping_address || 'Dispatch address on file',
        items: form.items.map((i) => ({
          product_id: Number(i.product_id),
          ordered_quantity: Number(i.ordered_quantity),
          unit_price: Number(i.unit_price)
        }))
      });
      toast.success(`Order ${res?.data?.order_number || ''} created.`);
      setCreateOpen(false);
      load();
    } catch (e) {
      toast.error(e?.message || 'Order creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const st = selected?.status;

  return (
    <motion.div className="page" variants={pageStagger} initial="hidden" animate="visible">
      <motion.div variants={riseIn}>
        <PageHeader
          eyebrow="DEMAND / SALES FULFILMENT"
          title="Sales orders"
          description="Every customer commitment from intake through allocation, dispatch and delivery."
          actions={
            <>
              <button className="btn btn-outline" onClick={load}><RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh</button>
              <button className="btn btn-primary" onClick={openCreate}><Plus size={11} /> New order</button>
            </>
          }
        />
      </motion.div>

      <motion.div variants={riseIn}>
        <StatGrid cols={4}>
          <Stat label="Orders" value={formatNumber(filtered.length)} meta={`${formatNumber(orders.length)} total records`} icon={ShoppingCart} />
          <Stat label="Open demand" value={formatNumber(stats.open)} meta="Awaiting fulfilment" tone="accent" />
          <Stat label="Delivered" value={formatNumber(stats.closed)} meta="Closed successfully" tone="good" />
          <Stat label="Value in view" value={formatCurrency(stats.value)} meta="Filtered order value" />
        </StatGrid>
      </motion.div>

      <motion.div variants={riseIn}>
        <Panel>
          <PanelHead title="Fulfilment pipeline" subtitle="Live count of orders at each lifecycle stage" />
          <PanelBody style={{ display: 'grid', gridTemplateColumns: `repeat(${STAGES.length}, minmax(0,1fr))`, gap: 1, padding: 0 }}>
            {STAGES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(status === s ? '' : s)}
                style={{
                  padding: '12px 14px',
                  textAlign: 'left',
                  borderRight: '1px solid var(--color-border-subtle)',
                  background: status === s ? 'var(--color-bg-active)' : 'transparent'
                }}
              >
                <div className="eyebrow" style={{ fontSize: 8 }}>{s.replace('_', ' ')}</div>
                <div className="mono" style={{ fontSize: 18, marginTop: 4, color: status === s ? 'var(--color-accent-hover)' : 'var(--color-text-primary)' }}>
                  {formatNumber(stageCounts[s] || 0)}
                </div>
              </button>
            ))}
          </PanelBody>
        </Panel>
      </motion.div>

      <motion.div variants={riseIn}>
        <Panel>
          <div className="toolbar">
            <div className="toolbar-group">
              <label className="search-field">
                <Search size={12} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order, customer or facility…" />
                {search && <button onClick={() => setSearch('')}><X size={11} /></button>}
              </label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ height: 30, fontSize: 11 }}>
                <option value="">All stages</option>
                {STAGES.concat(['CANCELLED']).map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{filtered.length} ORDERS</span>
          </div>

          {error ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--color-danger-text)', fontSize: 11 }}>{error}</div>
          ) : (
            <div className="table-scroll tall">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Fulfilment hub</th>
                    <th>Placed</th>
                    <th>Lines</th>
                    <th style={{ textAlign: 'right' }}>Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 7 }).map((__, j) => <td key={j}><div className="skeleton" style={{ height: 9 }} /></td>)}</tr>
                  ))}
                  {!loading && filtered.map((o) => (
                    <tr key={o.sales_order_id} className="clickable" onClick={() => setSelected(o)}>
                      <td className="mono" style={{ fontSize: 10, color: 'var(--color-text-primary)' }}>{o.order_number}</td>
                      <td>
                        <div className="cell-strong">{o.customer_name}</div>
                        <div className="cell-sub mono">{o.customer_code}</div>
                      </td>
                      <td>{o.warehouse_name || '—'}</td>
                      <td className="mono" style={{ color: 'var(--color-text-muted)' }}>{formatDate(o.order_date)}</td>
                      <td className="mono">{o.items?.length || 0}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{formatCurrency(o.total_amount)}</td>
                      <td><StatusBadge status={o.status} size="sm" /></td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>No orders match this filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </motion.div>

      <Drawer
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.order_number || 'Order'}
        subtitle={selected ? `${selected.customer_name} · ${selected.warehouse_name || 'No hub'}` : ''}
        footer={
          selected && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {st === 'PENDING' && (
                <>
                  <Button variant="primary" loading={busy} icon={CheckCircle} onClick={() => transition(orderService.confirmOrder, 'CONFIRMED')}>Confirm</Button>
                  <Button variant="danger" loading={busy} icon={XCircle} onClick={() => transition(orderService.cancelOrder, 'CANCELLED')}>Cancel</Button>
                </>
              )}
              {st === 'CONFIRMED' && <Button variant="primary" loading={busy} icon={Box} onClick={() => transition(orderService.allocateOrder, 'ALLOCATED')}>Allocate stock</Button>}
              {st === 'ALLOCATED' && <Button variant="primary" loading={busy} icon={Package} onClick={() => transition((id) => orderService.updateOrderStatus(id, 'PROCESSING'), 'PROCESSING')}>Start processing</Button>}
              {st === 'PROCESSING' && <Button variant="primary" loading={busy} icon={Truck} onClick={() => transition((id) => orderService.updateOrderStatus(id, 'SHIPPED'), 'SHIPPED')}>Mark shipped</Button>}
              {st === 'SHIPPED' && <Button variant="success" loading={busy} icon={CheckCircle} onClick={() => transition((id) => orderService.updateOrderStatus(id, 'DELIVERED'), 'DELIVERED')}>Mark delivered</Button>}
              {['DELIVERED', 'CANCELLED'].includes(st) && <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Terminal state — no further transitions.</span>}
            </div>
          )
        }
      >
        {selected && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Fact label="Status" value={<StatusBadge status={selected.status} size="sm" />} />
              <Fact label="Order value" value={formatCurrency(selected.total_amount)} />
              <Fact label="Placed" value={formatDate(selected.order_date)} />
              <Fact label="Destination" value={selected.shipping_address || '—'} />
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 7 }}>Line items · {selected.items?.length || 0}</div>
              <div style={{ display: 'grid', gap: 1 }}>
                {(selected.items || []).map((it) => (
                  <div key={it.sales_order_item_id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <div>
                      <div style={{ fontSize: 11 }}>{it.product_name}</div>
                      <div className="mono" style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{it.sku} · {it.ordered_quantity} / {it.fulfilled_quantity ?? 0} fulfilled</div>
                    </div>
                    <span className="mono" style={{ fontSize: 10 }}>{formatCurrency(it.subtotal)}</span>
                  </div>
                ))}
                {!selected.items?.length && <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)' }}>No line items returned.</div>}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Subtotal · tax · discount</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
                {formatCurrency(selected.subtotal)} · {formatCurrency(selected.tax_amount)} · {formatCurrency(selected.discount_amount)}
              </span>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        isOpen={createOpen}
        onClose={() => !submitting && setCreateOpen(false)}
        title="Create sales order"
        subtitle="Reserve customer demand against a fulfilment hub."
        size="lg"
        footer={
          <>
            <Button variant="ghost" disabled={submitting} onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={submitting} onClick={submitOrder}>Create order</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="form-grid cols-2">
            <Select label="Customer" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
              options={lookups.customers.map((c) => ({ value: c.customer_id, label: `${c.customer_name} (${c.customer_code})` }))} />
            <Select label="Fulfilment hub" value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
              options={lookups.warehouses.map((w) => ({ value: w.warehouse_id, label: w.warehouse_name }))} />
          </div>
          <Input label="Shipping address" value={form.shipping_address} onChange={(e) => setForm({ ...form, shipping_address: e.target.value })} />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span className="eyebrow">Line items</span>
              <button className="btn btn-ghost" onClick={addLine}><Plus size={10} /> Add line</button>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {form.items.map((it, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 6, alignItems: 'end' }}>
                  <Select
                    value={it.product_id}
                    onChange={(e) => {
                      const prod = lookups.products.find((p) => String(p.product_id) === e.target.value);
                      const items = [...form.items];
                      items[idx] = { ...items[idx], product_id: e.target.value, unit_price: prod?.unit_price ?? items[idx].unit_price };
                      setForm({ ...form, items });
                    }}
                    options={lookups.products.map((p) => ({ value: p.product_id, label: `${p.sku} · ${p.product_name}` }))}
                  />
                  <Input type="number" min="1" value={it.ordered_quantity} onChange={(e) => {
                    const items = [...form.items]; items[idx] = { ...items[idx], ordered_quantity: e.target.value }; setForm({ ...form, items });
                  }} label={idx === 0 ? 'Qty' : undefined} />
                  <Input type="number" step="0.01" min="0" value={it.unit_price} onChange={(e) => {
                    const items = [...form.items]; items[idx] = { ...items[idx], unit_price: e.target.value }; setForm({ ...form, items });
                  }} label={idx === 0 ? 'Unit price' : undefined} />
                  <button className="btn btn-ghost btn-icon" disabled={form.items.length === 1} onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })}><X size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

function Fact({ label, value }) {
  return (
    <div style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 4, padding: '7px 9px', minWidth: 0 }}>
      <div className="eyebrow" style={{ fontSize: 8, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 10.5, color: 'var(--color-text-primary)' }}>{value}</div>
    </div>
  );
}

export default OrdersPage;
