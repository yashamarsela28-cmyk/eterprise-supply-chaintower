import React, { useState, useEffect } from 'react';
import { Truck, RefreshCw, MapPin, Plus, CheckCircle, Navigation, Clock } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as shipmentService from '../services/shipmentService';
import * as orderService from '../services/orderService';
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
import { formatDate } from '../utils/formatters';

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

  const { data, loading, error, refetch } = useApiQuery(
    shipmentService.getShipments,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  useEffect(() => {
    if (isCreateOpen) {
      orderService.getOrders({ limit: 50 }).then((res) => {
        const ords = res?.data || [];
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
        .then((res) => setTrackingPoints(res?.data || []))
        .catch(() => setTrackingPoints([]))
        .finally(() => setLoadingTracking(false));
    }
  }, [selectedShipment]);

  const shipments = data?.data || [];
  const pagination = data?.pagination || { total: shipments.length, page, limit, totalPages: Math.ceil(shipments.length / limit) || 1 };

  // Status Change
  const handleStatusChange = async (targetStatus) => {
    if (!selectedShipment) return;
    const shipId = selectedShipment.shipment_id || selectedShipment.id;
    setActionLoading(true);

    try {
      const res = await shipmentService.updateShipmentStatus(shipId, targetStatus);
      toast.success(`Shipment updated to ${targetStatus}`);
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
      toast.success('Waypoint logged to tracking ledger');
      setIsWaypointModalOpen(false);

      // Refresh tracking & shipment
      const [trackRes, shipRes] = await Promise.all([
        shipmentService.getShipmentTracking(shipId),
        shipmentService.getShipmentById(shipId)
      ]);
      setTrackingPoints(trackRes?.data || []);
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
      header: 'Tracking Number',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {r.tracking_number || `TRK-${r.shipment_id || r.id}`}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Carrier: {r.carrier || 'Express Logistics'} • {r.shipping_method || 'STANDARD'}
          </div>
        </div>
      )
    },
    {
      key: 'order_number',
      header: 'Sales Order Ref',
      render: (r) => r.sales_orders?.order_number || r.order_number || `Order #${r.sales_order_id}`
    },
    {
      key: 'destination',
      header: 'Destination',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: 'var(--font-size-xs)' }}>
          <MapPin size={12} style={{ color: 'var(--color-text-muted)' }} />
          <span>{r.destination_address || 'Delivery Address'}</span>
        </div>
      )
    },
    {
      key: 'estimated_delivery',
      header: 'Est. Delivery',
      render: (r) => formatDate(r.estimated_delivery_date || r.estimated_delivery)
    },
    {
      key: 'status',
      header: 'Logistics Status',
      render: (r) => <StatusBadge status={r.status} />
    }
  ];

  const currentStatus = (selectedShipment?.status || '').toUpperCase();

  return (
    <div className="shipments-page">
      <PageHeader
        title="Shipments & Real-Time Logistics"
        description="Outbound carrier dispatches, route telematics, and final delivery milestones."
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={refetch}
            >
              Refresh
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

      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search tracking number or carrier..."
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
            <div style={{ padding: '1rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Current Status</span>
                <StatusBadge status={selectedShipment.status} />
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                <strong>Method:</strong> {selectedShipment.shipping_method || 'STANDARD'}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                <strong>Destination:</strong> {selectedShipment.destination_address || 'Delivery Address on file'}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                <strong>Estimated Arrival:</strong> {formatDate(selectedShipment.estimated_delivery_date || selectedShipment.estimated_delivery)}
              </div>
            </div>

            {/* Operational Actions */}
            <div style={{ padding: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                Logistics Actions
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
                    Dispatch (In Transit)
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
                  variant="secondary"
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
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                Carrier Telematics & Waypoints ({trackingPoints.length})
              </h4>
              {loadingTracking ? (
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Loading waypoints...</div>
              ) : trackingPoints.length === 0 ? (
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No waypoint events logged yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {trackingPoints.map((pt, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'rgba(30, 41, 59, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: '3px solid var(--color-primary)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {pt.location || pt.checkpoint_name || 'Transit Hub'}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
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
