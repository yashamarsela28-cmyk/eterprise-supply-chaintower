import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  MapPin, Search, Filter, RefreshCw, ChevronDown, Clock, Truck,
  AlertCircle, CheckCircle, TrendingUp, DollarSign, Navigation
} from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as shipmentService from '../services/shipmentService';
import { normalizeList } from '../utils/responseNormalizer';
import { useToast } from '../context/ToastContext';
import { formatDate, formatNumber, formatCurrency } from '../utils/formatters';
import { StatusBadge } from '../components/common/StatusBadge';

const MAPLIBRE_STYLE = 'https://demotiles.maplibre.org/style.json';

export function ShipmentsPage() {
  const toast = useToast();
  const mapContainer = useRef(null);
  const map = useRef(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  const { page, limit, setPage } = usePagination(1, 100);

  // Fetch shipment data - will render on map with mock coordinates
  const { data: shipmentsRaw, loading, refetch } = useApiQuery(
    () => shipmentService.getShipments({ limit: 100, search, status: statusFilter }),
    { limit, search, status: statusFilter },
    { immediate: true }
  );

  const shipments = useMemo(() => normalizeList(shipmentsRaw), [shipmentsRaw]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const panelVariants = {
    hidden: { x: 400, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.3 } },
    exit: { x: 400, opacity: 0, transition: { duration: 0.2 } }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAPLIBRE_STYLE,
      center: [20, 10],
      zoom: 2,
      attributionControl: true,
      antialias: true
    });

    // Wait for map to load
    map.current.on('load', () => {
      setMapReady(true);

      // Add route layer
      map.current.addSource('routes', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.current.addLayer({
        id: 'routes-layer',
        type: 'line',
        source: 'routes',
        paint: {
          'line-color': '#a3a3a3',
          'line-width': 2,
          'line-opacity': 0.7
        }
      });

      // Add markers source
      map.current.addSource('markers', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.current.addLayer({
        id: 'markers-layer',
        type: 'circle',
        source: 'markers',
        paint: {
          'circle-radius': 6,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.9,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });
    });

    return () => {
      if (map.current) map.current.remove();
    };
  }, []);

  // Update map when shipments change
  useEffect(() => {
    if (!map.current || !mapReady || shipments.length === 0) return;

    const routeFeatures = [];
    const markerFeatures = [];

    shipments.forEach((shipment, idx) => {
      // Extract coordinates from tracking data if available
      // For now, we'll use mock coordinates based on shipment properties
      const originLat = 1.3521 + (idx % 5) * 5;
      const originLng = 103.8198 + (idx % 5) * 10;
      const destLat = 25.2048 + (idx % 5) * -3;
      const destLng = 55.2708 + (idx % 5) * 5;

      // Route line
      routeFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [[originLng, originLat], [destLng, destLat]]
        },
        properties: { shipment_id: shipment.shipment_id }
      });

      // Origin marker
      const originColor = shipment.status === 'DELIVERED' ? '#10b981' : '#3b82f6';
      markerFeatures.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [originLng, originLat] },
        properties: { color: originColor, type: 'origin', shipment_id: shipment.shipment_id }
      });

      // Destination marker
      const destColor =
        shipment.status === 'DELIVERED'
          ? '#10b981'
          : shipment.status === 'IN_TRANSIT'
          ? '#3b82f6'
          : '#f59e0b';
      markerFeatures.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [destLng, destLat] },
        properties: { color: destColor, type: 'destination', shipment_id: shipment.shipment_id }
      });
    });

    // Update sources
    if (map.current.getSource('routes')) {
      map.current.getSource('routes').setData({
        type: 'FeatureCollection',
        features: routeFeatures
      });
    }

    if (map.current.getSource('markers')) {
      map.current.getSource('markers').setData({
        type: 'FeatureCollection',
        features: markerFeatures
      });
    }
  }, [shipments, mapReady]);

  // Compute summary stats
  const summaryStats = useMemo(() => {
    let inTransit = 0,
      delivered = 0,
      pending = 0;
    shipments.forEach((s) => {
      const st = (s.status || '').toUpperCase();
      if (st === 'IN_TRANSIT') inTransit += 1;
      if (st === 'DELIVERED') delivered += 1;
      if (st === 'CREATED' || st === 'READY') pending += 1;
    });
    return { total: shipments.length, inTransit, delivered, pending };
  }, [shipments]);

  return (
    <motion.div
      className="shipments-page"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        minHeight: '100vh'
      }}
    >
      {/* Premium Header */}
      <motion.div variants={itemVariants}>
        <div
          style={{
            background: 'linear-gradient(135deg, var(--color-bg-elevated) 0%, var(--color-bg-card) 100%)',
            borderRadius: 'var(--radius-2xl)',
            padding: 'var(--space-6)',
            border: '1px solid var(--color-border-default)',
            boxShadow: 'var(--shadow-card)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '150px',
              height: '150px',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: 'var(--color-accent-blue)',
                  marginBottom: 'var(--space-2)'
                }}
              >
                GLOBAL LOGISTICS COMMAND
              </div>
              <h1
                style={{
                  fontSize: 'var(--font-size-4xl)',
                  fontWeight: 800,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.02em',
                  marginBottom: 'var(--space-2)'
                }}
              >
                Shipment Tracking & World Map
              </h1>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  maxWidth: '600px'
                }}
              >
                Real-time shipment tracking across global routes, carrier operations, and multi-modal logistics network
              </p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={refetch}
                style={{
                  padding: '0.5rem 1.2rem',
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
                <RefreshCw size={14} />
                Refresh
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Summary */}
      <motion.div
        variants={itemVariants}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)'
        }}
      >
        <div
          style={{
            padding: 'var(--space-4)',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)'
          }}
        >
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-text-muted)'
            }}
          >
            Total Shipments
          </span>
          <div
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 800,
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {formatNumber(summaryStats.total)}
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-4)',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)'
          }}
        >
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-text-muted)'
            }}
          >
            In Transit
          </span>
          <div
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 800,
              color: 'var(--color-info-text)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {formatNumber(summaryStats.inTransit)}
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-4)',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)'
          }}
        >
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-text-muted)'
            }}
          >
            Delivered
          </span>
          <div
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 800,
              color: 'var(--color-success-text)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {formatNumber(summaryStats.delivered)}
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-4)',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)'
          }}
        >
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-text-muted)'
            }}
          >
            Pending
          </span>
          <div
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 800,
              color: 'var(--color-warning-text)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {formatNumber(summaryStats.pending)}
          </div>
        </div>
      </motion.div>

      {/* Main Transport Interface: Sidebar + Map + Detail Panel */}
      <motion.div
        variants={itemVariants}
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: 'var(--space-4)',
          flex: 1,
          minHeight: 0
        }}
      >
        {/* Left Sidebar - Tracking List */}
        <div
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <h3
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--space-2)'
                }}
              >
                Tracking List
              </h3>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)'
                }}
              >
                {formatNumber(summaryStats.total)} Shipments
              </span>
            </div>

            {/* Search */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Search shipments..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: '100%',
                  paddingLeft: '2.2rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              padding: 'var(--space-3) var(--space-4)',
              borderBottom: '1px solid var(--color-border-subtle)',
              overflowX: 'auto'
            }}
          >
            {[
              { value: '', label: 'All' },
              { value: 'CREATED', label: 'Pending' },
              { value: 'IN_TRANSIT', label: 'Transit' },
              { value: 'DELIVERED', label: 'Delivered' }
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setStatusFilter(filter.value);
                  setPage(1);
                }}
                style={{
                  padding: '0.35rem 0.75rem',
                  backgroundColor: statusFilter === filter.value ? 'var(--color-accent-blue)' : 'transparent',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: statusFilter === filter.value ? '#ffffff' : 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  whiteSpace: 'nowrap'
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Shipment List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              padding: 'var(--space-3)'
            }}
          >
            {loading ? (
              <div
                style={{
                  padding: 'var(--space-4)',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-xs)'
                }}
              >
                Loading shipments...
              </div>
            ) : shipments.length === 0 ? (
              <div
                style={{
                  padding: 'var(--space-4)',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-xs)'
                }}
              >
                No shipments found
              </div>
            ) : (
              shipments.map((shipment) => (
                <motion.div
                  key={shipment.shipment_id}
                  whileHover={{ x: 4 }}
                  onClick={() => setSelectedShipment(shipment)}
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor:
                      selectedShipment?.shipment_id === shipment.shipment_id
                        ? 'var(--color-accent-blue-subtle)'
                        : 'var(--color-bg-secondary)',
                    border:
                      selectedShipment?.shipment_id === shipment.shipment_id
                        ? '1px solid var(--color-accent-blue)'
                        : '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ marginBottom: '0.3rem' }}>
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {shipment.tracking_number || `TRK-${shipment.shipment_id}`}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.3rem'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        color: 'var(--color-text-muted)',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {shipment.destination_address || 'Destination'}
                    </span>
                    <StatusBadge status={shipment.status} size="sm" />
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    ETA: {formatDate(shipment.estimated_delivery_date)}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right Area: Map + Detail Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', position: 'relative' }}>
          {/* Map */}
          <div
            ref={mapContainer}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              border: '1px solid var(--color-border-default)',
              background: 'var(--color-bg-primary)'
            }}
          />

          {/* Detail Panel - Overlay */}
          <AnimatePresence>
            {selectedShipment && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={panelVariants}
                style={{
                  position: 'absolute',
                  bottom: 'var(--space-4)',
                  right: 'var(--space-4)',
                  width: '340px',
                  maxHeight: '500px',
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  zIndex: 10
                }}
              >
                {/* Panel Header */}
                <div
                  style={{
                    padding: 'var(--space-4)',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}
                >
                  <div>
                    <h4
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                        marginBottom: '0.25rem'
                      }}
                    >
                      {selectedShipment.tracking_number}
                    </h4>
                    <p
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      {selectedShipment.carrier_name || 'Carrier'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedShipment(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Panel Content */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 'var(--space-4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-3)'
                  }}
                >
                  {/* Status */}
                  <div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--color-text-muted)',
                        display: 'block',
                        marginBottom: '0.5rem'
                      }}
                    >
                      Status
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <StatusBadge status={selectedShipment.status} />
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                        {selectedShipment.shipping_method || 'Standard'}
                      </span>
                    </div>
                  </div>

                  {/* Route */}
                  <div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--color-text-muted)',
                        display: 'block',
                        marginBottom: '0.5rem'
                      }}
                    >
                      Route
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={12} style={{ color: 'var(--color-accent-blue)' }} />
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                        {selectedShipment.destination_address || 'Destination'}
                      </span>
                    </div>
                  </div>

                  {/* ETA */}
                  <div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--color-text-muted)',
                        display: 'block',
                        marginBottom: '0.5rem'
                      }}
                    >
                      Estimated Delivery
                    </span>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {formatDate(selectedShipment.estimated_delivery_date)}
                    </span>
                  </div>

                  {/* Carrier */}
                  <div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--color-text-muted)',
                        display: 'block',
                        marginBottom: '0.5rem'
                      }}
                    >
                      Carrier
                    </span>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      {selectedShipment.carrier_name || 'Express Logistics'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ShipmentsPage;
