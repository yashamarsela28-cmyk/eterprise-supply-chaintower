import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map as MapLibreMap, LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Search, RefreshCw, Truck, Plane, Ship, TrainFront, MapPin, X,
  ArrowRight, Minus, Plus, Maximize2, AlertCircle, Clock, Package,
  FileText, CircleDollarSign, Route, Crosshair, Navigation
} from 'lucide-react';
import * as shipmentService from '../services/shipmentService';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '../utils/formatters';
import { EASE, popIn } from '../utils/motion';

const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const STATUS_COLORS = {
  CREATED: '#8a938f',
  READY: '#d5a354',
  IN_TRANSIT: '#7ea3c4',
  OUT_FOR_DELIVERY: '#7ea3c4',
  DELIVERED: '#57b98a',
  RETURNED: '#a296cb',
  CANCELLED: '#d96b62'
};

function cityCode(city) {
  if (!city) return '—';
  return city.replace(/[^a-zA-Z ]/g, '').slice(0, 3).toUpperCase();
}

function methodIcon(method) {
  const m = (method || '').toUpperCase();
  if (m.includes('SAME') || m.includes('EXPRESS')) return Plane;
  if (m.includes('ECONOMY')) return Ship;
  if (m.includes('STANDARD')) return Truck;
  return TrainFront;
}

/** Approximate remaining journey for display; derived from real ETA only. */
function daysTo(date) {
  if (!date) return null;
  const eta = new Date(date).getTime();
  if (Number.isNaN(eta)) return null;
  return Math.ceil((eta - Date.now()) / 86400000);
}

export function ShipmentsPage() {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  const shipments = payload?.shipments || [];
  const warehouses = payload?.warehouses || [];

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    shipmentService
      .getShipmentMapData()
      .then((res) => {
        if (!alive) return;
        const data = res?.data || res || {};
        setPayload({ shipments: data.shipments || [], warehouses: data.warehouses || [] });
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err?.message || 'Unable to load the shipment network.');
        setLoading(false);
      });
    return () => { alive = false; };
  }, [refreshKey]);

  const counts = useMemo(() => {
    const c = { total: shipments.length };
    shipments.forEach((s) => { c[s.status] = (c[s.status] || 0) + 1; });
    return c;
  }, [shipments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shipments.filter((s) => {
      const matchesStatus = !status || s.status === status;
      const matchesSearch = !q || [
        s.tracking_number, s.shipment_number, s.carrier_name, s.customer_name,
        s.order_number, s.destination?.address, s.origin?.city, s.shipping_method
      ].some((v) => String(v || '').toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [shipments, search, status]);

  const selected = useMemo(
    () => shipments.find((s) => s.shipment_id === selectedId) || null,
    [shipments, selectedId]
  );

  const unmapped = filtered.filter((s) => !s.origin || s.destination?.latitude == null).length;

  /* ------------------------------- map setup ------------------------------- */
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    let map;
    try {
      map = new MapLibreMap({
        container: mapEl.current,
        style: DARK_STYLE,
        center: [78.6, 21.2],
        zoom: 3.4,
        attributionControl: false,
        antialias: true,
        fadeDuration: 200
      });
    } catch (e) {
      setMapError('Map renderer could not initialise.');
      return;
    }
    mapRef.current = map;

    map.on('load', () => {
      map.addSource('routes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'routes-line',
        type: 'line',
        source: 'routes',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['case', ['==', ['get', 'selected'], true], '#e3b873', '#8e9c9a'],
          'line-width': ['case', ['==', ['get', 'selected'], true], 2, 1.1],
          'line-opacity': ['case', ['==', ['get', 'selected'], true], 1, 0.55]
        }
      });
      map.addLayer({
        id: 'routes-glow',
        type: 'line',
        source: 'routes',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        filter: ['==', ['get', 'selected'], true],
        paint: { 'line-color': '#d5a354', 'line-width': 6, 'line-opacity': 0.1, 'line-blur': 6 }
      });

      map.addSource('ports', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'ports-halo',
        type: 'circle',
        source: 'ports',
        paint: {
          'circle-radius': ['case', ['==', ['get', 'selected'], true], 9, 5],
          'circle-color': ['case', ['==', ['get', 'selected'], true], '#d5a354', '#c9d2ce'],
          'circle-opacity': 0.18
        }
      });
      map.addLayer({
        id: 'ports-dot',
        type: 'circle',
        source: 'ports',
        paint: {
          'circle-radius': ['case', ['==', ['get', 'selected'], true], 3.2, 2],
          'circle-color': ['case', ['==', ['get', 'selected'], true], '#f0c780', '#e9efeb'],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#0a0c0d'
        }
      });
      map.addLayer({
        id: 'ports-label',
        type: 'symbol',
        source: 'ports',
        filter: ['==', ['get', 'selected'], true],
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 10,
          'text-offset': [0, 1.6],
          'text-anchor': 'top',
          'text-font': ['Open Sans Regular', 'Noto Sans Regular', 'Arial Unicode MS Regular']
        },
        paint: {
          'text-color': '#e9efeb',
          'text-halo-color': '#08090a',
          'text-halo-width': 1.4
        }
      });

      map.on('click', (e) => {
        const hits = map.queryRenderedFeatures(e.point, { layers: ['ports-dot', 'ports-halo'] });
        if (hits?.[0]?.properties?.shipment_id) {
          setSelectedId(Number(hits[0].properties.shipment_id));
          setTab('overview');
        }
      });
      map.on('mouseenter', 'ports-dot', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'ports-dot', () => { map.getCanvas().style.cursor = ''; });

      setReady(true);
    });

    map.on('error', (e) => {
      if (!map.isStyleLoaded()) setMapError('Basemap unavailable — route geometry remains live.');
      // eslint-disable-next-line no-console
      console.warn('Map error', e?.error?.message);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* --------------------------- update map layers --------------------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const routes = [];
    const ports = [];
    filtered.forEach((s) => {
      const isSel = s.shipment_id === selectedId;
      if (s.route?.coordinates?.length > 1) {
        routes.push({
          type: 'Feature',
          geometry: s.route,
          properties: { shipment_id: s.shipment_id, selected: isSel }
        });
      }
      if (s.origin && s.destination?.latitude != null) {
        ports.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [s.origin.longitude, s.origin.latitude] },
          properties: { shipment_id: s.shipment_id, selected: isSel, label: s.origin.city || 'Origin' }
        });
        ports.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [s.destination.longitude, s.destination.latitude] },
          properties: { shipment_id: s.shipment_id, selected: isSel, label: s.destination.address || 'Destination' }
        });
      }
    });

    map.getSource('routes')?.setData({ type: 'FeatureCollection', features: routes });
    map.getSource('ports')?.setData({ type: 'FeatureCollection', features: ports });

    if (selectedId) {
      const sel = shipments.find((s) => s.shipment_id === selectedId);
      if (sel?.origin && sel.destination?.latitude != null) {
        const bounds = new LngLatBounds(
          [sel.origin.longitude, sel.origin.latitude],
          [sel.origin.longitude, sel.origin.latitude]
        );
        bounds.extend([sel.destination.longitude, sel.destination.latitude]);
        map.fitBounds(bounds, { padding: { top: 90, bottom: 250, left: 60, right: 60 }, maxZoom: 7, duration: 900 });
      }
    }
  }, [filtered, selectedId, ready, shipments]);

  /* fit whole network when filters change with no selection */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || selectedId) return;
    const coords = [];
    filtered.forEach((s) => {
      if (s.origin) coords.push([s.origin.longitude, s.origin.latitude]);
      if (s.destination?.latitude != null) coords.push([s.destination.longitude, s.destination.latitude]);
    });
    if (!coords.length) return;
    const b = coords.reduce(
      (acc, c) => acc.extend(c),
      new LngLatBounds(coords[0], coords[0])
    );
    map.fitBounds(b, { padding: 90, maxZoom: 6.4, duration: 800 });
  }, [ready, filtered, selectedId]);

  const statusTabs = [
    { key: '', label: 'All', count: counts.total || 0 },
    { key: 'IN_TRANSIT', label: 'In transit', count: counts.IN_TRANSIT || 0 },
    { key: 'READY', label: 'Ready', count: counts.READY || 0 },
    { key: 'DELIVERED', label: 'Delivered', count: counts.DELIVERED || 0 },
    { key: 'CREATED', label: 'Pending', count: counts.CREATED || 0 }
  ];

  return (
    <div className="transport">
      {/* ------------------------------ tracking panel ------------------------------ */}
      <aside className="transport-panel">
        <div className="transport-panel-head">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Navigation size={13} style={{ color: 'var(--color-accent)' }} />
              <h2 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '-0.01em' }}>Tracking</h2>
            </div>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setRefreshKey((k) => k + 1)}
              title="Refresh live shipments"
              aria-label="Refresh shipments"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
              Shipment list
            </span>
            <span className="mono" style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>
              {formatNumber(counts.total || 0)} RECORDS
            </span>
          </div>

          <label className="search-field" style={{ width: '100%', marginTop: 10 }}>
            <Search size={12} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, carrier, city, order…"
              aria-label="Search shipments"
            />
            {search && (
              <button onClick={() => setSearch('')} aria-label="Clear search" style={{ display: 'flex', color: 'var(--color-text-muted)' }}>
                <X size={11} />
              </button>
            )}
          </label>

          <div className="chips" style={{ marginTop: 9 }}>
            {statusTabs.map((t) => (
              <button
                key={t.key || 'all'}
                className={`chip${status === t.key ? ' active' : ''}`}
                onClick={() => setStatus(t.key)}
              >
                {t.label}
                <span className="count">{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="transport-list">
          {loading && (
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 86, borderRadius: 5 }} />
              ))}
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: 22, textAlign: 'center' }}>
              <AlertCircle size={18} style={{ color: 'var(--color-danger-text)' }} />
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 8 }}>{error}</div>
              <button className="btn btn-outline" style={{ marginTop: 12 }} onClick={() => setRefreshKey((k) => k + 1)}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: 26, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 11 }}>
              No shipments match this filter.
            </div>
          )}

          {!loading && !error && filtered.map((s, i) => {
            const ModeIcon = methodIcon(s.shipping_method);
            const isSel = s.shipment_id === selectedId;
            return (
              <motion.button
                key={s.shipment_id}
                className={`ship-card${isSel ? ' selected' : ''}`}
                onClick={() => { setSelectedId(s.shipment_id); setTab('overview'); }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: Math.min(i * 0.02, 0.2) }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span className="mono" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
                    {s.tracking_number || s.shipment_number}
                  </span>
                  <StatusBadge status={s.status} size="sm" />
                </div>

                <div className="ship-route">
                  <div className="ship-port">
                    <span className="code">{cityCode(s.origin?.city)}</span>
                    {s.origin?.city || 'Origin unavailable'}
                  </div>
                  <div className="ship-arrow" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span style={{ width: 12, height: 1, background: 'var(--color-border-strong)' }} />
                    <ModeIcon size={9} />
                    <span style={{ width: 12, height: 1, background: 'var(--color-border-strong)' }} />
                  </div>
                  <div className="ship-port dest">
                    <span className="code">{cityCode((s.destination?.address || '').split(',')[0])}</span>
                    {s.destination?.latitude == null ? 'Location unavailable' : (s.destination.address || '—')}
                  </div>
                </div>

                <div className="ship-meta">
                  <span className="carrier truncate">
                    {s.carrier_name || 'Carrier unassigned'} · {s.shipping_method || '—'}
                  </span>
                  <span className="mono" style={{ fontSize: 9, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    ETA {formatDate(s.estimated_delivery_date)}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--color-text-dim)' }}>
          <span>{unmapped > 0 ? `${unmapped} without coordinates` : 'All filtered records geolocated'}</span>
          <span className="mono">{warehouses.length} HUBS</span>
        </div>
      </aside>

      {/* -------------------------------- map stage -------------------------------- */}
      <section className="map-stage">
        <div ref={mapEl} className="map-canvas" />
        <div className="map-vignette" />

        {!ready && !mapError && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, color: 'var(--color-text-muted)' }}>
              <span className="animate-spin" style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid var(--color-border-strong)', borderTopColor: 'var(--color-accent)' }} />
              Calibrating network map…
            </div>
          </div>
        )}

        <div className="map-topbar">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="map-overlay-chip">
              <Crosshair size={10} style={{ color: 'var(--color-accent)' }} />
              LIVE NETWORK · {formatNumber(filtered.length)} SHIPMENTS
            </span>
            <span className="map-overlay-chip">
              <MapPin size={10} />
              {warehouses.length} distribution hubs
            </span>
            {mapError && (
              <span className="map-overlay-chip" style={{ color: 'var(--color-warning-text)' }}>
                <AlertCircle size={10} /> Basemap offline
              </span>
            )}
          </div>

          <div className="map-controls">
            <button onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in"><Plus size={12} /></button>
            <button onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out"><Minus size={12} /></button>
            <button
              onClick={() => {
                setSelectedId(null);
                const map = mapRef.current;
                if (!map) return;
                const coords = [];
                filtered.forEach((s) => {
                  if (s.origin) coords.push([s.origin.longitude, s.origin.latitude]);
                  if (s.destination?.latitude != null) coords.push([s.destination.longitude, s.destination.latitude]);
                });
                if (!coords.length) return;
                const b = coords.reduce((acc, c) => acc.extend(c), new LngLatBounds(coords[0], coords[0]));
                map.fitBounds(b, { padding: 90, maxZoom: 6.4, duration: 700 });
              }}
              aria-label="Fit network"
              title="Fit network"
            >
              <Maximize2 size={11} />
            </button>
          </div>
        </div>

        <div className="map-legend">
          <div className="li"><span className="sw" style={{ background: '#e9efeb' }} /> Port / hub</div>
          <div className="li"><span className="sw" style={{ background: '#d5a354' }} /> Selected lane</div>
          <div className="li" style={{ marginTop: 2, color: 'var(--color-text-dim)' }}>City-level geocoding</div>
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              key={selected.shipment_id}
              className="map-detail"
              variants={popIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div style={{ padding: '11px 14px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{selected.tracking_number}</span>
                    <StatusBadge status={selected.status} size="sm" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 9.5, color: 'var(--color-text-muted)' }}>{selected.shipping_method}</span>
                    <button className="btn btn-ghost btn-icon" onClick={() => setSelectedId(null)} aria-label="Close shipment details">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="map-detail-tabs">
                {[
                  ['overview', 'Overview'],
                  ['timeline', 'Timeline'],
                  ['route', 'Route'],
                  ['cost', 'Cost']
                ].map(([k, label]) => (
                  <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{label}</button>
                ))}
              </div>

              <div style={{ padding: '12px 14px 14px' }}>
                {tab === 'overview' && <OverviewTab s={selected} />}
                {tab === 'timeline' && <TimelineTab s={selected} />}
                {tab === 'route' && <RouteTab s={selected} />}
                {tab === 'cost' && <CostTab s={selected} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

function OverviewTab({ s }) {
  const pct = Number(s.progress) || 0;
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: 'var(--color-text-primary)' }}>
            <Truck size={12} style={{ color: 'var(--color-accent)' }} />
            {s.carrier_name || 'Carrier unassigned'}
            <span style={{ color: 'var(--color-text-muted)', fontSize: 9.5 }}>
              {s.vehicle_number ? `· ${s.vehicle_number}` : ''} {s.vehicle_type ? `· ${s.vehicle_type}` : ''}
            </span>
          </div>
          <div style={{ fontSize: 9.5, color: 'var(--color-text-muted)', marginTop: 2 }}>
            {s.order_number ? `Order ${s.order_number}` : 'No linked sales order'}
            {s.customer_name ? ` · ${s.customer_name}` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="eyebrow">ETA</div>
          <div className="mono" style={{ fontSize: 11, color: daysTo(s.estimated_delivery_date) < 0 && s.status !== 'DELIVERED' ? 'var(--color-danger-text)' : 'var(--color-text-primary)' }}>
            {formatDate(s.estimated_delivery_date)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 3 }}>Origin</div>
          <div style={{ fontSize: 10.5, color: 'var(--color-text-primary)' }}>{s.origin?.warehouse_name || 'Unavailable'}</div>
          <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 1 }}>
            {s.origin?.label || 'No coordinates'}
          </div>
        </div>
        <ArrowRight size={12} style={{ color: 'var(--color-text-dim)' }} />
        <div style={{ textAlign: 'right' }}>
          <div className="eyebrow" style={{ marginBottom: 3 }}>Destination</div>
          <div style={{ fontSize: 10.5, color: 'var(--color-text-primary)' }}>{s.destination?.address || 'Unavailable'}</div>
          <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 1 }}>
            {s.destination?.label || 'No coordinates'}
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 9, color: 'var(--color-text-muted)' }}>
          <span>Journey progress</span>
          <span className="mono">{pct}%</span>
        </div>
        <div className="meter"><span style={{ width: `${pct}%` }} /></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <Mini label="Events" value={formatNumber(s.event_count || 0)} />
        <Mini label="Driver" value={s.driver_code || '—'} />
        <Mini label="Cost" value={formatCurrency(s.shipping_cost || 0)} />
      </div>
    </div>
  );
}

function TimelineTab({ s }) {
  const events = [...(s.tracking_events || [])].sort((a, b) => new Date(a.event_time) - new Date(b.event_time));
  if (!events.length) {
    return <EmptyDetail icon={Clock} text="No tracking events have been recorded for this shipment." />;
  }
  return (
    <div style={{ maxHeight: 190, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {events.map((e, i) => (
        <div key={e.tracking_event_id || i} style={{ display: 'grid', gridTemplateColumns: '12px 1fr', gap: 9 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: i === events.length - 1 ? 'var(--color-accent)' : 'var(--color-border-strong)', marginTop: 4 }} />
            {i < events.length - 1 && <span style={{ width: 1, flex: 1, background: 'var(--color-border-subtle)' }} />}
          </div>
          <div style={{ paddingBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 10.5, fontWeight: 560, color: 'var(--color-text-primary)' }}>{e.description || e.status}</span>
              <span className="mono" style={{ fontSize: 8.5, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{formatDateTime(e.event_time)}</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 1 }}>
              {e.location || 'Location not recorded'} · {e.status}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RouteTab({ s }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, color: 'var(--color-text-secondary)' }}>
        <Route size={12} style={{ color: 'var(--color-accent)' }} />
        Shortest great-circle lane between resolved endpoints
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Mini label="Origin precision" value={s.origin?.precision || 'unavailable'} />
        <Mini label="Destination precision" value={s.destination?.precision || 'unavailable'} />
        <Mini label="Origin" value={s.origin ? `${s.origin.latitude.toFixed(3)}, ${s.origin.longitude.toFixed(3)}` : '—'} />
        <Mini label="Destination" value={s.destination?.latitude != null ? `${s.destination.latitude.toFixed(3)}, ${s.destination.longitude.toFixed(3)}` : '—'} />
      </div>
      <p style={{ fontSize: 9.5, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
        Coordinates are resolved from operational addresses. “City” precision means the lane terminates at the
        city centroid because the stored address has no street-level geocode. No location is invented.
      </p>
    </div>
  );
}

function CostTab({ s }) {
  return (
    <div style={{ display: 'grid', gap: 9 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
        <CircleDollarSign size={13} style={{ color: 'var(--color-accent)' }} />
        <span style={{ color: 'var(--color-text-secondary)' }}>Carrier shipping cost</span>
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--color-text-primary)' }}>
          {formatCurrency(s.shipping_cost || 0)}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Mini label="Service" value={s.shipping_method || '—'} />
        <Mini label="Carrier" value={s.carrier_name || '—'} />
        <Mini label="Sales order" value={s.order_number || '—'} />
        <Mini label="Customer" value={s.customer_name || '—'} />
      </div>
      <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', padding: '8px 9px', border: '1px solid var(--color-border-subtle)', borderRadius: 4 }}>
        <FileText size={12} style={{ color: 'var(--color-text-muted)', marginTop: 1 }} />
        <span style={{ fontSize: 9.5, color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
          Commercial documents are not modelled against shipments in this deployment, so none are listed.
        </span>
      </div>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 4, padding: '6px 8px', minWidth: 0 }}>
      <div className="eyebrow" style={{ fontSize: 8, marginBottom: 3 }}>{label}</div>
      <div className="truncate mono" style={{ fontSize: 10, color: 'var(--color-text-primary)' }}>{value}</div>
    </div>
  );
}

function EmptyDetail({ icon: Icon, text }) {
  return (
    <div style={{ padding: '20px 10px', textAlign: 'center' }}>
      <Icon size={17} style={{ color: 'var(--color-text-dim)' }} />
      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 7, lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

export default ShipmentsPage;
