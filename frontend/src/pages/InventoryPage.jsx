import React, { useState, useMemo } from 'react';
import { Boxes, RefreshCw, PlusCircle, BookmarkPlus, AlertCircle, ShieldAlert } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as inventoryService from '../services/inventoryService';
import { useToast } from '../context/ToastContext';
import { normalizeList, normalizePagination } from '../utils/responseNormalizer';
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
import { formatNumber, formatDate } from '../utils/formatters';

export function InventoryPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // Stock Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    quantity_change: 10,
    transaction_type: 'ADJUSTMENT_IN',
    reason: 'Manual Inventory Cycle Count'
  });

  // Stock Reservation Modal
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [reserveSubmitting, setReserveSubmitting] = useState(false);
  const [reserveForm, setReserveForm] = useState({
    quantity_to_reserve: 5,
    reason: 'Allocated for Urgent Dispatch'
  });

  const { page, limit, setPage, setLimit } = usePagination(1, 20);

  // Fetch Inventory List with filters
  const { data: rawData, loading, error, refetch } = useApiQuery(
    inventoryService.getInventory,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  // Defensive Normalization
  const items = useMemo(() => normalizeList(rawData), [rawData]);
  const pagination = useMemo(() => normalizePagination(rawData, items, page, limit), [rawData, items, page, limit]);

  // Compute live summary stats from items
  const summaryStats = useMemo(() => {
    let totalUnits = 0;
    let totalReserved = 0;
    let totalAvailable = 0;
    let lowStockCount = 0;

    items.forEach((item) => {
      const onHand = Number(item.quantity_on_hand !== undefined ? item.quantity_on_hand : item.quantity || 0);
      const reserved = Number(item.quantity_reserved || 0);
      const available = item.quantity_available !== undefined ? Number(item.quantity_available) : onHand - reserved;
      const safety = Number(item.safety_stock || item.reorder_point || 10);

      totalUnits += onHand;
      totalReserved += reserved;
      totalAvailable += available;
      if (available <= safety) lowStockCount += 1;
    });

    return { totalUnits, totalReserved, totalAvailable, lowStockCount, count: pagination.total || items.length };
  }, [items, pagination.total]);

  const handleRowClick = (item) => {
    setSelectedItem(item);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    const invId = selectedItem.inventory_id || selectedItem.id;

    setAdjustSubmitting(true);
    try {
      const payload = {
        quantity_change: Number(adjustForm.quantity_change),
        transaction_type: adjustForm.transaction_type,
        reason: adjustForm.reason || 'Inventory Adjustment'
      };

      const res = await inventoryService.adjustStock(invId, payload);
      toast.success('Inventory stock level adjusted successfully');
      setIsAdjustModalOpen(false);
      setSelectedItem(res?.data || res || null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to adjust stock');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const handleReserveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    const invId = selectedItem.inventory_id || selectedItem.id;

    setReserveSubmitting(true);
    try {
      const payload = {
        quantity_to_reserve: Number(reserveForm.quantity_to_reserve),
        reason: reserveForm.reason || 'Stock Reservation'
      };

      const res = await inventoryService.reserveStock(invId, payload);
      toast.success('Inventory stock reserved successfully');
      setIsReserveModalOpen(false);
      setSelectedItem(res?.data || res || null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to reserve stock');
    } finally {
      setReserveSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'product',
      header: 'Product / SKU',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {r.products?.name || r.product_name || `Product #${r.product_id}`}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
              {r.products?.sku || r.sku || 'N/A'}
            </span>
            {' • '}
            <span>{r.products?.category || 'General'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'warehouse',
      header: 'Warehouse Hub',
      render: (r) => (
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {r.warehouses?.name || r.warehouse_name || 'Central Hub'}
        </span>
      )
    },
    {
      key: 'quantity_on_hand',
      header: 'On Hand',
      align: 'right',
      render: (r) => (
        <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
          {formatNumber(r.quantity_on_hand !== undefined ? r.quantity_on_hand : r.quantity || 0)}
        </span>
      )
    },
    {
      key: 'quantity_reserved',
      header: 'Reserved',
      align: 'right',
      render: (r) => (
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
          {formatNumber(r.quantity_reserved || 0)}
        </span>
      )
    },
    {
      key: 'quantity_available',
      header: 'Available (ATP)',
      align: 'right',
      render: (r) => {
        const available = r.quantity_available !== undefined ? r.quantity_available : (r.quantity_on_hand || 0) - (r.quantity_reserved || 0);
        const isLow = available <= (r.safety_stock || r.reorder_point || 10);
        return (
          <span
            style={{
              color: isLow ? 'var(--color-danger-text)' : 'var(--color-success-text)',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)'
            }}
          >
            {formatNumber(available)}
          </span>
        );
      }
    },
    {
      key: 'reorder_point',
      header: 'Safety Threshold',
      align: 'right',
      render: (r) => (
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
          {formatNumber(r.safety_stock || r.reorder_point || 10)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const available = r.quantity_available !== undefined ? r.quantity_available : (r.quantity_on_hand || 0) - (r.quantity_reserved || 0);
        const isLow = available <= (r.safety_stock || r.reorder_point || 10);
        const isOut = available <= 0;
        return (
          <StatusBadge
            status={isOut ? 'out_of_stock' : isLow ? 'low_stock' : 'in_stock'}
            size="sm"
          />
        );
      }
    }
  ];

  const availableQty = selectedItem
    ? selectedItem.quantity_available !== undefined
      ? selectedItem.quantity_available
      : (selectedItem.quantity_on_hand || 0) - (selectedItem.quantity_reserved || 0)
    : 0;

  return (
    <div className="inventory-page animate-fade-in">
      <PageHeader
        eyebrow="INVENTORY // MULTI-ECHELON"
        title="Inventory Control & Stock Levels"
        description="Monitor multi-echelon stock levels, available to promise (ATP), and safety stock thresholds across physical facilities."
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={refetch}
          >
            Refresh Data
          </Button>
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
            Total SKUs Tracked
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summaryStats.count)}
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
            Total Units On Hand
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summaryStats.totalUnits)}
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
            Reserved Stock
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summaryStats.totalReserved)}
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
            Low Stock Alerts
          </span>
          <div
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 700,
              color: summaryStats.lowStockCount > 0 ? 'var(--color-warning-text)' : 'var(--color-success-text)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {formatNumber(summaryStats.lowStockCount)}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Filter by product name, SKU or warehouse..."
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
            { value: '', label: 'All Stock Statuses' },
            { value: 'in_stock', label: 'In Stock' },
            { value: 'low_stock', label: 'Low Stock' },
            { value: 'out_of_stock', label: 'Out of Stock' }
          ]}
        />
      </FilterBar>

      {/* Main Table */}
      <Table
        columns={columns}
        data={items}
        loading={loading}
        onRowClick={handleRowClick}
        emptyTitle="No Inventory Records"
        emptyMessage="No stock items matched your search criteria."
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.total || items.length}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      {/* Stock Item Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.products?.name || selectedItem?.product_name || `Inventory #${selectedItem?.inventory_id || selectedItem?.id}`}
        subtitle={`SKU: ${selectedItem?.products?.sku || selectedItem?.sku || 'N/A'}`}
      >
        {selectedItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Warehouse Facility</div>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-base)', color: 'var(--color-text-primary)', marginTop: '0.2rem' }}>
                {selectedItem.warehouses?.name || selectedItem.warehouse_name || 'Central Facility'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Quantity On Hand</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                  {formatNumber(selectedItem.quantity_on_hand || selectedItem.quantity || 0)}
                </div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Available (ATP)</div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-success-text)', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                  {formatNumber(availableQty)}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Reserved Units</div>
                <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-warning-text)', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                  {formatNumber(selectedItem.quantity_reserved || 0)}
                </div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Safety Stock</div>
                <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                  {formatNumber(selectedItem.safety_stock || selectedItem.reorder_point || 10)}
                </div>
              </div>
            </div>

            {/* Operational Actions */}
            <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-default)' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Stock Ledger Actions
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={PlusCircle}
                  onClick={() => setIsAdjustModalOpen(true)}
                >
                  Adjust Stock
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={BookmarkPlus}
                  onClick={() => setIsReserveModalOpen(true)}
                >
                  Reserve Stock
                </Button>
              </div>
            </div>

            {selectedItem.last_counted_at && (
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                Last cycle count: {formatDate(selectedItem.last_counted_at)}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => !adjustSubmitting && setIsAdjustModalOpen(false)}
        title="Adjust Inventory Stock"
        subtitle={`Product: ${selectedItem?.products?.name || selectedItem?.product_name || 'Item'}`}
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              disabled={adjustSubmitting}
              onClick={() => setIsAdjustModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={adjustSubmitting}
              onClick={handleAdjustSubmit}
            >
              Confirm Adjustment
            </Button>
          </>
        }
      >
        <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Select
            label="Transaction Type"
            required
            value={adjustForm.transaction_type}
            onChange={(e) => setAdjustForm({ ...adjustForm, transaction_type: e.target.value })}
            options={[
              { value: 'ADJUSTMENT_IN', label: 'Adjustment In (Add Stock)' },
              { value: 'ADJUSTMENT_OUT', label: 'Adjustment Out (Remove Stock)' },
              { value: 'DAMAGE', label: 'Damaged Stock (Write-Off)' },
              { value: 'RECEIPT', label: 'Direct Receipt' },
              { value: 'SALE', label: 'Direct Sale Deduction' }
            ]}
          />

          <Input
            label="Quantity Delta"
            type="number"
            required
            value={adjustForm.quantity_change}
            onChange={(e) => setAdjustForm({ ...adjustForm, quantity_change: e.target.value })}
            helperText="Enter positive number (subtracted automatically for OUT/DAMAGE types)"
          />

          <Input
            label="Audit Reason / Note"
            required
            value={adjustForm.reason}
            onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
            placeholder="e.g. Physical inventory reconciliation"
          />
        </form>
      </Modal>

      {/* Reserve Stock Modal */}
      <Modal
        isOpen={isReserveModalOpen}
        onClose={() => !reserveSubmitting && setIsReserveModalOpen(false)}
        title="Reserve Inventory Stock"
        subtitle={`Available to Reserve: ${availableQty} units`}
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              disabled={reserveSubmitting}
              onClick={() => setIsReserveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={reserveSubmitting}
              onClick={handleReserveSubmit}
            >
              Reserve Stock
            </Button>
          </>
        }
      >
        <form onSubmit={handleReserveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input
            label="Quantity to Reserve"
            type="number"
            min="1"
            max={availableQty}
            required
            value={reserveForm.quantity_to_reserve}
            onChange={(e) => setReserveForm({ ...reserveForm, quantity_to_reserve: e.target.value })}
            helperText={`Maximum available to reserve: ${availableQty}`}
          />

          <Input
            label="Reservation Reason"
            required
            value={reserveForm.reason}
            onChange={(e) => setReserveForm({ ...reserveForm, reason: e.target.value })}
            placeholder="e.g. Sales order allocation hold"
          />
        </form>
      </Modal>
    </div>
  );
}

export default InventoryPage;
