import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Search, X, Package, Layers, Tag, ArrowUpRight } from 'lucide-react';
import * as productService from '../services/productService';
import { normalizeList } from '../utils/responseNormalizer';
import { PageHeader } from '../components/common/PageHeader';
import { Panel, PanelHead, PanelBody, Stat, StatGrid, Meter } from '../components/common/Panel';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { pageStagger, riseIn, popIn } from '../utils/motion';

export function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    productService.getProducts({ limit: 200 })
      .then((res) => { setProducts(normalizeList(res)); setLoading(false); })
      .catch((e) => { setError(e?.message || 'Product catalog unavailable.'); setLoading(false); });
  };
  useEffect(load, []);

  const categories = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const key = p.category_name || 'Uncategorised';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [products]);

  const filtered = useMemo(() => products.filter((p) => {
    const q = search.trim().toLowerCase();
    const match = !q || [p.product_name, p.sku, p.brand_name].some((v) => String(v || '').toLowerCase().includes(q));
    return match && (!category || p.category_name === category);
  }), [products, search, category]);

  const stats = useMemo(() => {
    const active = filtered.filter((p) => p.status === 'ACTIVE').length;
    const avg = filtered.length ? filtered.reduce((s, p) => s + Number(p.unit_price || 0), 0) / filtered.length : 0;
    const top = filtered.reduce((m, p) => (Number(p.unit_price) > Number(m.unit_price) ? p : m), filtered[0] || {});
    return { active, avg, top };
  }, [filtered]);

  return (
    <motion.div className="page" variants={pageStagger} initial="hidden" animate="visible">
      <motion.div variants={riseIn}>
        <PageHeader
          eyebrow="MASTER DATA / CATALOGUE"
          title="Products & SKUs"
          description="The commercial catalogue behind every stock record, order line and purchase order."
          actions={<button className="btn btn-outline" onClick={load}><RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh</button>}
        />
      </motion.div>

      <motion.div variants={riseIn}>
        <StatGrid cols={4}>
          <Stat label="Catalogue" value={formatNumber(products.length)} meta="Distinct SKUs" icon={Package} />
          <Stat label="Active" value={formatNumber(stats.active)} meta="Available for sale" tone="good" />
          <Stat label="Average price" value={formatCurrency(stats.avg)} meta="Across filtered SKUs" />
          <Stat label="Top price" value={formatCurrency(stats.top?.unit_price || 0)} meta={stats.top?.sku || '—'} icon={Tag} />
        </StatGrid>
      </motion.div>

      <div className="split split-aside">
        <motion.div variants={riseIn} style={{ minWidth: 0 }}>
          <Panel>
            <div className="toolbar">
              <div className="toolbar-group">
                <label className="search-field">
                  <Search size={12} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="SKU, product or brand…" />
                  {search && <button onClick={() => setSearch('')}><X size={11} /></button>}
                </label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ height: 30, fontSize: 11 }}>
                  <option value="">All categories</option>
                  {categories.map(([c]) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{filtered.length} SKUS</span>
            </div>

            {error ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--color-danger-text)', fontSize: 11 }}>{error}</div>
            ) : (
              <div className="table-scroll tall">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Brand</th>
                      <th style={{ textAlign: 'right' }}>Unit price</th>
                      <th style={{ textAlign: 'right' }}>Weight</th>
                      <th style={{ textAlign: 'right' }}>Reorder</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 8 }).map((__, j) => <td key={j}><div className="skeleton" style={{ height: 9 }} /></td>)}</tr>
                    ))}
                    {!loading && filtered.map((p) => (
                      <tr key={p.product_id} className="clickable" onClick={() => setSelected(p)}>
                        <td className="mono" style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{p.sku}</td>
                        <td className="cell-strong">{p.product_name}</td>
                        <td>{p.category_name || '—'}</td>
                        <td>{p.brand_name || '—'}</td>
                        <td className="num" style={{ textAlign: 'right' }}>{formatCurrency(p.unit_price)}</td>
                        <td className="mono" style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>{p.weight_kg ? `${p.weight_kg} kg` : '—'}</td>
                        <td className="mono" style={{ textAlign: 'right' }}>{formatNumber(p.reorder_level)}</td>
                        <td><StatusBadge status={p.status || 'ACTIVE'} size="sm" /></td>
                      </tr>
                    ))}
                    {!loading && filtered.length === 0 && (
                      <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>No products match this filter.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </motion.div>

        <motion.div variants={riseIn} style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <Panel>
            <PanelHead title="Catalogue composition" subtitle="SKU count by category" action={<Layers size={12} style={{ color: 'var(--color-text-muted)' }} />} />
            <PanelBody style={{ display: 'grid', gap: 11 }}>
              {categories.map(([name, count]) => (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <button
                      onClick={() => setCategory(name)}
                      style={{ fontSize: 10.5, color: category === name ? 'var(--color-accent-hover)' : 'var(--color-text-secondary)' }}
                    >
                      {name}
                    </button>
                    <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{count}</span>
                  </div>
                  <Meter value={(count / Math.max(1, products.length)) * 100} />
                </div>
              ))}
              {categories.length === 0 && !loading && <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)' }}>No categories returned.</div>}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead title="SKU inspector" subtitle={selected ? selected.sku : 'Select a catalogue row'} />
            <PanelBody>
              {!selected ? (
                <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  Select a SKU to inspect pricing, handling characteristics and replenishment thresholds.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 560 }}>{selected.product_name}</div>
                  <div style={{ fontSize: 9.5, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{selected.description || 'No description recorded.'}</div>
                  <Row label="Category" value={selected.category_name} />
                  <Row label="Brand" value={selected.brand_name} />
                  <Row label="Unit price" value={formatCurrency(selected.unit_price)} />
                  <Row label="Weight" value={selected.weight_kg ? `${selected.weight_kg} kg` : '—'} />
                  <Row label="Reorder level" value={formatNumber(selected.reorder_level)} />
                  <Row label="Status" value={selected.status} />
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
      <span style={{ fontSize: 10.5, color: 'var(--color-text-primary)', textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );
}

export default ProductsPage;
