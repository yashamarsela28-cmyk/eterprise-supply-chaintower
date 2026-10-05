import React, { useState, useEffect, useMemo } from 'react';
import { Truck, RefreshCw, MapPin, Plus, CheckCircle, Navigation, Clock } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as shipmentService from '../services/shipmentService';
import * as orderService from '../services/orderService';
import { normalizeList, normalizePagination } from '../utils/responseNormalizer';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import { FilterBar } from '../components/common/FilterBar';
import { Table } from '../components/common/Table';
import { Pagination } from '../components/common/Pagination';
import { Select } from '../components/common/Select';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Drawer } from '../components/common/Drawer';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDate, formatNumber } from '../utils/formatters';

export function ShipmentsPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Tracking Waypoints state for selected shipment
  const [trackingPoints, setTrackingPoints] = useState([]);
  const [loadingTracking, setLoadingTracking] = useState(false);

  // Create Shipment Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [orders, setOrders] = useState([]);

  const [newShipment, setNewShipment] = useState({
    sales_order_id: '',
    carrier: 'FedEx Freight',
    tracking_number: '',
    shipping_method: 'EXPRESS',
    destination_address: '100 Enterprise Way, Suite 400',
    estimated_delivery_date: ''
  });

  // Add Waypoint Modal
  const [isWaypointModalOpen, setIsWaypointModalOpen] = useState(false);
  const [waypointSubmitting, setWaypointSubmitting] = useState(false);
  const [waypointForm, setWaypointForm] = useState({
    location: 'Distribution Sorting Center, Sector 4',
    status: 'IN_TRANSIT',
    notes: 'Package processed at sort facility'
  });

  const { page, limit, setPage, setLimit } = usePagination(1, 20);

  const { data: rawData, loading, error, refetch } = useApiQuery(
    shipmentService.getShipments,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  const shipments = useMemo(() => normalizeList(rawData), [rawData]);
  const pagination = useMemo(() => normalizePagination(rawData, shipments, page, limit), [rawData, shipments, page, limit]);

  // Compute live summary stats
  const summaryStats = useMemo(() => {
    let inTransit = 0;
    let delivered = 0;
    let outForDelivery = 0;

    shipments.forEach((s) => {
      const st = (s.status || '').toUpperCase();
      if (st === 'IN_TRANSIT') inTransit += 1;
      if (st === 'OUT_FOR_DELIVERY') outForDelivery += 1;
      if (st === 'DELIVERED') delivered += 1;
    });

    return {
      total: pagination.total || shipments.length,
      inTransit,
      outForDelivery,
      delivered
    };
  }, [shipments, pagination.total]);

  useEffect(() => {
    if (isCreateOpen) {
      orderService.getOrders({ limit: 50 }).then((res) => {
        const ords = normalizeList(res);
        setOrders(ords);
        setNewShipment((prev) => ({
          ...prev,
          sales_order_id: prev.sales_order_id || (ords[0]?.sales_order_id || ords[0]?.id || 1),
          tracking_number: prev.tracking_number || `TRK-${Date.now().toString().slice(-6)}`,
          estimated_delivery_date: prev.estimated_delivery_date || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
        }));
      }).catch(() => {});
    }
  }, [isCreateOpen]);

  // Load tracking when a shipment is selected
  useEffect(() => {
    if (selectedShipment) {
      const shipId = selectedShipment.shipment_id || selectedShipment.id;
      setLoadingTracking(true);
      shipmentService.getShipmentTracking(shipId)
        .then((res) => setTrackingPoints(normalizeList(res)))
        .catch(() => setTrackingPoints([]))
        .finally(() => setLoadingTracking(false));
    }
  }, [selectedShipment]);

  // Status Change
  const handleStatusChange = async (targetStatus) => {
    if (!selectedShipment) return;
    const shipId = selectedShipment.shipment_id || selectedShipment.id;
    setActionLoading(true);

    try {
      const res = await shipmentService.updateShipmentStatus(shipId, targetStatus);
      toast.success(`Shipment #${selectedShipment.tracking_number || shipId} updated to ${targetStatus}`);
      setSelectedShipment(res?.data || { ...selectedShipment, status: targetStatus });
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update shipment');
    } finally {
      setActionLoading(false);
    }
  };

  // Add Waypoint
  const handleAddWaypoint = async (e) => {
    e.preventDefault();
    if (!selectedShipment) return;
    const shipId = selectedShipment.shipment_id || selectedShipment.id;

    setWaypointSubmitting(true);
    try {
      const payload = {
        location: waypointForm.location,
        status: waypointForm.status,
        note: waypointForm.notes,
        timestamp: new Date().toISOString()
      };

      await shipmentService.addShipmentTracking(shipId, payload);
      toast.success('Waypoint telemetry logged to tracking ledger');
      setIsWaypointModalOpen(false);

      // Refresh tracking & shipment
      const [trackRes, shipRes] = await Promise.all([
        shipmentService.getShipmentTracking(shipId),
        shipmentService.getShipmentById(shipId)
      ]);
      setTrackingPoints(normalizeList(trackRes));
      if (shipRes?.data) setSelectedShipment(shipRes.data);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add waypoint');
    } finally {
      setWaypointSubmitting(false);
    }
  };

  // Create Shipment
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newShipment.sales_order_id) {
      toast.error('Please select a sales order');
      return;
    }

    setCreateSubmitting(true);
    try {
      const payload = {
        sales_order_id: Number(newShipment.sales_order_id),
        carrier: newShipment.carrier || 'FedEx Freight',
        tracking_number: newShipment.tracking_number || `TRK-${Date.now()}`,
        shipping_method: newShipment.shipping_method || 'STANDARD',
        destination_address: newShipment.destination_address || '100 Enterprise Way',
        estimated_delivery_date: newShipment.estimated_delivery_date || undefined
      };

      const res = await shipmentService.createShipment(payload);
      toast.success(`Shipment #${res?.data?.tracking_number || ''} created successfully`);
      setIsCreateOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create shipment');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'tracking_number',
      header: 'Tracking Reference',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {r.tracking_number || `TRK-${r.shipment_id || r.id}`}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
            Carrier: <span style={{ color: 'var(--color-text-secondary)' }}>{r.carrier || 'Express Logistics'}</span>
            {' • '}
            <span>{r.shipping_method || 'STANDARD'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'order_number',
      header: 'Sales Order Ref',
      render: (r) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          {r.sales_orders?.order_number || r.order_number || `Order #${r.sales_order_id}`}
        </span>
      )
    },
    {
      key: 'destination',
      header: 'Delivery Destination',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          <MapPin size={12} style={{ opacity: 0.7 }} />
          <span>{r.destination_address || 'Delivery Address'}</span>
        </div>
      )
    },
    {
      key: 'estimated_delivery',
      header: 'Est. Delivery Date',
      render: (r) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          {formatDate(r.estimated_delivery_date || r.estimated_delivery)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Logistics State',
      render: (r) => <StatusBadge status={r.status} size="sm" />
    }
  ];

  const currentStatus = (selectedShipment?.status || '').toUpperCase();

  return (
    <div className="shipments-page animate-fade-in">
      <PageHeader
        eyebrow="LOGISTICS // FREIGHT TELEMATICS"
        title="Shipments & Real-Time Logistics"
        description="Outbound carrier dispatches, route telematics, carrier performance, and final delivery milestones."
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={refetch}
            >
              Refresh Freight
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsCreateOpen(true)}
            >
              Create Shipment
            </Button>
          </div>
        }
      />

      {/* KPI Summary Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)'
        }}
      >
        <div
          style={{
            padding: '0.85rem 1.15rem',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Outbound Dispatches
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summaryStats.total)}
          </div>
        </div>

        <div
          style={{
            padding: '0.85rem 1.15rem',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active In Transit
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-info-text)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summaryStats.inTransit)}
          </div>
        </div>

        <div
          style={{
            padding: '0.85rem 1.15rem',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Out for Delivery
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-warning-text)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summaryStats.outForDelivery)}
          </div>
        </div>

        <div
          style={{
            padding: '0.85rem 1.15rem',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Completed Deliveries
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-success-text)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summaryStats.delivered)}
          </div>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Filter by tracking number, carrier, destination..."
        hasActiveFilters={Boolean(search || statusFilter)}
        onReset={() => {
          setSearch('');
          setStatusFilter('');
          setPage(1);
        }}
      >
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'CREATED', label: 'Created' },
            { value: 'IN_TRANSIT', label: 'In Transit' },
            { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
            { value: 'DELIVERED', label: 'Delivered' },
            { value: 'FAILED', label: 'Failed' }
          ]}
        />
      </FilterBar>

      <Table
        columns={columns}
        data={shipments}
        loading={loading}
        onRowClick={(s) => setSelectedShipment(s)}
        emptyTitle="No Shipments Found"
        emptyMessage="No outbound freight shipments matched your filter criteria."
      />

      <Pagination
        currentPage={page}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.total || shipments.length}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      {/* Shipment Details Drawer */}
      <Drawer
        isOpen={Boolean(selectedShipment)}
        onClose={() => setSelectedShipment(null)}
        title={selectedShipment?.tracking_number || `Shipment #${selectedShipment?.shipment_id || selectedShipment?.id}`}
        subtitle={`Carrier: ${selectedShipment?.carrier || 'Express Logistics'}`}
      >
        {selectedShipment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Logistics Status</span>
                <StatusBadge status={selectedShipment.status} size="sm" />
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Method:</span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{selectedShipment.shipping_method || 'STANDARD'}</strong>
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '0.4rem', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.4rem' }}>
                <strong style={{ color: 'var(--color-text-muted)' }}>Destination:</strong> {selectedShipment.destination_address || 'Delivery Address on file'}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '0.3rem' }}>
                <strong style={{ color: 'var(--color-text-muted)' }}>Est. Arrival:</strong> {formatDate(selectedShipment.estimated_delivery_date || selectedShipment.estimated_delivery)}
              </div>
            </div>

            {/* Operational Actions */}
            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Logistics Dispatch Controls
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {['CREATED', 'PENDING', 'READY'].includes(currentStatus) && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Truck}
                    loading={actionLoading}
                    onClick={() => handleStatusChange('IN_TRANSIT')}
                  >
                    Dispatch Freight
                  </Button>
                )}

                {currentStatus === 'IN_TRANSIT' && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Navigation}
                      loading={actionLoading}
                      onClick={() => handleStatusChange('OUT_FOR_DELIVERY')}
                    >
                      Out for Delivery
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      icon={CheckCircle}
                      loading={actionLoading}
                      onClick={() => handleStatusChange('DELIVERED')}
                    >
                      Mark Delivered
                    </Button>
                  </>
                )}

                {currentStatus === 'OUT_FOR_DELIVERY' && (
                  <Button
                    variant="success"
                    size="sm"
                    icon={CheckCircle}
                    loading={actionLoading}
                    onClick={() => handleStatusChange('DELIVERED')}
                  >
                    Confirm Delivery
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={() => setIsWaypointModalOpen(true)}
                >
                  Add Waypoint
                </Button>
              </div>
            </div>

            {/* Tracking History */}
            <div>
              <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
                Carrier Telematics & Waypoints ({trackingPoints.length})
              </h4>
              {loadingTracking ? (
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Loading waypoint telemetry...</div>
              ) : trackingPoints.length === 0 ? (
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                  No waypoint events logged yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {trackingPoints.map((pt, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.65rem 0.85rem',
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border-subtle)',
                        borderLeft: '3px solid var(--color-info-text)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {pt.location || pt.checkpoint_name || 'Transit Hub'}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {formatDate(pt.timestamp || pt.recorded_at || pt.created_at)}
                        </span>
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        {pt.notes || pt.status_message || pt.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Shipment Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => !createSubmitting && setIsCreateOpen(false)}
        title="Create Outbound Shipment"
        subtitle="Dispatch carrier pickup for confirmed sales order."
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              disabled={createSubmitting}
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={createSubmitting}
              onClick={handleCreateSubmit}
            >
              Create Shipment
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Select
            label="Sales Order"
            required
            value={newShipment.sales_order_id}
            onChange={(e) => setNewShipment({ ...newShipment, sales_order_id: e.target.value })}
            options={orders.map((o) => ({
              value: o.sales_order_id || o.id,
              label: `${o.order_number || `ORD-${o.sales_order_id || o.id}`} (${o.status})`
            }))}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Input
              label="Carrier Name"
              required
              value={newShipment.carrier}
              onChange={(e) => setNewShipment({ ...newShipment, carrier: e.target.value })}
              placeholder="e.g. FedEx, DHL, UPS"
            />

            <Select
              label="Shipping Method"
              required
              value={newShipment.shipping_method}
              onChange={(e) => setNewShipment({ ...newShipment, shipping_method: e.target.value })}
              options={[
                { value: 'STANDARD', label: 'Standard Ground' },
                { value: 'EXPRESS', label: 'Express Air' },
                { value: 'SAME_DAY', label: 'Same Day Freight' }
              ]}
            />
          </div>

          <Input
            label="Tracking Number"
            required
            value={newShipment.tracking_number}
            onChange={(e) => setNewShipment({ ...newShipment, tracking_number: e.target.value })}
          />

          <Input
            label="Destination Delivery Address"
            required
            value={newShipment.destination_address}
            onChange={(e) => setNewShipment({ ...newShipment, destination_address: e.target.value })}
          />

          <Input
            label="Estimated Delivery Date"
            type="date"
            value={newShipment.estimated_delivery_date}
            onChange={(e) => setNewShipment({ ...newShipment, estimated_delivery_date: e.target.value })}
          />
        </form>
      </Modal>

      {/* Add Waypoint Modal */}
      <Modal
        isOpen={isWaypointModalOpen}
        onClose={() => !waypointSubmitting && setIsWaypointModalOpen(false)}
        title="Add Telematics Waypoint"
        subtitle={`Shipment: ${selectedShipment?.tracking_number || ''}`}
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              disabled={waypointSubmitting}
              onClick={() => setIsWaypointModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={waypointSubmitting}
              onClick={handleAddWaypoint}
            >
              Record Waypoint
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddWaypoint} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input
            label="Waypoint Location / Checkpoint"
            required
            value={waypointForm.location}
            onChange={(e) => setWaypointForm({ ...waypointForm, location: e.target.value })}
            placeholder="e.g. Chicago Freight Terminal"
          />

          <Select
            label="Shipment Waypoint Status"
            value={waypointForm.status}
            onChange={(e) => setWaypointForm({ ...waypointForm, status: e.target.value })}
            options={[
              { value: 'IN_TRANSIT', label: 'In Transit' },
              { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
              { value: 'DELIVERED', label: 'Delivered' },
              { value: 'EXCEPTION', label: 'Delay Exception' }
            ]}
          />

          <Input
            label="Checkpoint Notes"
            value={waypointForm.notes}
            onChange={(e) => setWaypointForm({ ...waypointForm, notes: e.target.value })}
            placeholder="e.g. Cleared customs gate 3"
          />
        </form>
      </Modal>
    </div>
  );
}

export default ShipmentsPage;
