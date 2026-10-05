import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeftRight, RefreshCw, Plus, CheckCircle, Truck, PackageCheck, XCircle } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as transferService from '../services/transferService';
import * as warehouseService from '../services/warehouseService';
import * as productService from '../services/productService';
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

export function TransfersPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Create Transfer Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  const [newTransfer, setNewTransfer] = useState({
    source_warehouse_id: '',
    destination_warehouse_id: '',
    items: [{ product_id: '', requested_quantity: 10 }]
  });

  const { page, limit, setPage, setLimit } = usePagination(1, 20);

  const { data: rawData, loading, error, refetch } = useApiQuery(
    transferService.getTransfers,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  const transfers = useMemo(() => normalizeList(rawData), [rawData]);
  const pagination = useMemo(() => normalizePagination(rawData, transfers, page, limit), [rawData, transfers, page, limit]);

  // Compute live summary stats
  const summaryStats = useMemo(() => {
    let pendingCount = 0;
    let inTransitCount = 0;
    let completedCount = 0;

    transfers.forEach((t) => {
      const st = (t.status || '').toUpperCase();
      if (st === 'REQUESTED' || st === 'PENDING' || st === 'APPROVED') pendingCount += 1;
      if (st === 'IN_TRANSIT') inTransitCount += 1;
      if (st === 'COMPLETED') completedCount += 1;
    });

    return {
      total: pagination.total || transfers.length,
      pending: pendingCount,
      inTransit: inTransitCount,
      completed: completedCount
    };
  }, [transfers, pagination.total]);

  useEffect(() => {
    if (isCreateOpen) {
      Promise.all([
        warehouseService.getWarehouses({ limit: 50 }).catch(() => ({ data: [] })),
        productService.getProducts({ limit: 50 }).catch(() => ({ data: [] }))
      ]).then(([whRes, prodRes]) => {
        const whs = normalizeList(whRes);
        const prods = normalizeList(prodRes);
        setWarehouses(whs);
        setProducts(prods);

        setNewTransfer((prev) => ({
          ...prev,
          source_warehouse_id: prev.source_warehouse_id || (whs[0]?.warehouse_id || whs[0]?.id || 1),
          destination_warehouse_id: prev.destination_warehouse_id || (whs[1]?.warehouse_id || whs[1]?.id || 2),
          items: prev.items.map((item) => ({
            ...item,
            product_id: item.product_id || (prods[0]?.product_id || prods[0]?.id || 1)
          }))
        }));
      });
    }
  }, [isCreateOpen]);

  // Status Action Handler
  const handleAction = async (actionType) => {
    if (!selectedTransfer) return;
    const transferId = selectedTransfer.transfer_id || selectedTransfer.id;
    setActionLoading(true);

    try {
      let res;
      if (actionType === 'APPROVE') {
        res = await transferService.approveTransfer(transferId);
        toast.success(`Stock Transfer #${selectedTransfer.transfer_number || transferId} approved`);
      } else if (actionType === 'DISPATCH') {
        res = await transferService.dispatchTransfer(transferId);
        toast.success(`Stock Transfer #${selectedTransfer.transfer_number || transferId} dispatched. Source inventory decremented.`);
      } else if (actionType === 'RECEIVE') {
        res = await transferService.receiveTransfer(transferId);
        toast.success(`Stock Transfer #${selectedTransfer.transfer_number || transferId} received. Destination inventory incremented.`);
      } else if (actionType === 'CANCEL') {
        res = await transferService.cancelTransfer(transferId);
        toast.success(`Stock Transfer #${selectedTransfer.transfer_number || transferId} cancelled`);
      }
      setSelectedTransfer(res?.data || null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newTransfer.source_warehouse_id || !newTransfer.destination_warehouse_id) {
      toast.error('Please select both source and destination warehouses');
      return;
    }
    if (String(newTransfer.source_warehouse_id) === String(newTransfer.destination_warehouse_id)) {
      toast.error('Source and Destination warehouses must be different facilities');
      return;
    }

    setCreateSubmitting(true);
    try {
      const payload = {
        source_warehouse_id: Number(newTransfer.source_warehouse_id),
        destination_warehouse_id: Number(newTransfer.destination_warehouse_id),
        items: newTransfer.items.map((item) => ({
          product_id: Number(item.product_id),
          requested_quantity: Number(item.requested_quantity) || 1
        }))
      };

      const res = await transferService.createTransfer(payload);
      toast.success(`Stock Transfer #${res?.data?.transfer_number || ''} requested successfully`);
      setIsCreateOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create stock transfer');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const addItemRow = () => {
    const defaultProd = products[0];
    setNewTransfer((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: defaultProd?.product_id || defaultProd?.id || 1,
          requested_quantity: 10
        }
      ]
    }));
  };

  const removeItemRow = (idx) => {
    setNewTransfer((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const updateItemRow = (idx, field, value) => {
    setNewTransfer((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  const columns = [
    {
      key: 'transfer_number',
      header: 'Transfer Reference',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {r.transfer_number || `TRF-${r.transfer_id || r.id}`}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
            Created: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>{formatDate(r.created_at)}</span>
          </div>
        </div>
      )
    },
    {
      key: 'route',
      header: 'Facility Transit Route',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: 'var(--font-size-xs)' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.source_warehouse?.name || `Warehouse #${r.source_warehouse_id}`}</span>
          <ArrowLeftRight size={12} style={{ color: 'var(--color-text-muted)' }} />
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.destination_warehouse?.name || `Warehouse #${r.destination_warehouse_id}`}</span>
        </div>
      )
    },
    {
      key: 'items_count',
      header: 'Transfer Manifest',
      align: 'center',
      render: (r) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          {r.items?.length || r.transfer_items?.length || 1} line item(s)
        </span>
      )
    },
    {
      key: 'status',
      header: 'Rebalancing State',
      render: (r) => <StatusBadge status={r.status} size="sm" />
    }
  ];

  const currentStatus = (selectedTransfer?.status || '').toUpperCase();

  return (
    <div className="transfers-page animate-fade-in">
      <PageHeader
        eyebrow="INVENTORY // REBALANCING"
        title="Stock Transfers & Hub Relocations"
        description="Inter-warehouse inventory relocation orders, node replenishment, and in-transit reconciliation."
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={refetch}
            >
              Refresh Transfers
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsCreateOpen(true)}
            >
              Request Transfer
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
            Total Relocation Orders
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
            Pending Authorization
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-warning-text)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summaryStats.pending)}
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
            Inter-Hub In Transit
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
            Completed Transfers
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-success-text)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summaryStats.completed)}
          </div>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Filter by transfer number, facility name..."
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
            { value: 'REQUESTED', label: 'Requested' },
            { value: 'APPROVED', label: 'Approved' },
            { value: 'IN_TRANSIT', label: 'In Transit' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'CANCELLED', label: 'Cancelled' }
          ]}
        />
      </FilterBar>

      <Table
        columns={columns}
        data={transfers}
        loading={loading}
        onRowClick={(t) => setSelectedTransfer(t)}
        emptyTitle="No Transfers Found"
        emptyMessage="No stock transfer records matched your filter criteria."
      />

      <Pagination
        currentPage={page}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.total || transfers.length}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      {/* Transfer Details Drawer */}
      <Drawer
        isOpen={Boolean(selectedTransfer)}
        onClose={() => setSelectedTransfer(null)}
        title={selectedTransfer?.transfer_number || `Stock Transfer #${selectedTransfer?.transfer_id || selectedTransfer?.id}`}
        subtitle={`Route: ${selectedTransfer?.source_warehouse?.name || 'Origin'} → ${selectedTransfer?.destination_warehouse?.name || 'Destination'}`}
      >
        {selectedTransfer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Transfer Status</span>
                <StatusBadge status={selectedTransfer.status} size="sm" />
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Source Origin:</span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{selectedTransfer.source_warehouse?.name || `Warehouse #${selectedTransfer.source_warehouse_id}`}</strong>
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                <span>Destination Receiving:</span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{selectedTransfer.destination_warehouse?.name || `Warehouse #${selectedTransfer.destination_warehouse_id}`}</strong>
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '0.4rem', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.4rem' }}>
                <strong style={{ color: 'var(--color-text-muted)' }}>Created At:</strong> {formatDate(selectedTransfer.created_at)}
              </div>
            </div>

            {/* Operational Actions */}
            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Rebalancing Actions
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {['REQUESTED', 'PENDING'].includes(currentStatus) && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={CheckCircle}
                      loading={actionLoading}
                      onClick={() => handleAction('APPROVE')}
                    >
                      Approve Transfer
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={XCircle}
                      loading={actionLoading}
                      onClick={() => handleAction('CANCEL')}
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {currentStatus === 'APPROVED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Truck}
                    loading={actionLoading}
                    onClick={() => handleAction('DISPATCH')}
                  >
                    Dispatch Transfer (In Transit)
                  </Button>
                )}

                {currentStatus === 'IN_TRANSIT' && (
                  <Button
                    variant="success"
                    size="sm"
                    icon={PackageCheck}
                    loading={actionLoading}
                    onClick={() => handleAction('RECEIVE')}
                  >
                    Receive & Restock Destination
                  </Button>
                )}

                {['COMPLETED', 'CANCELLED'].includes(currentStatus) && (
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    Transfer is in terminal state ({currentStatus}).
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            {(selectedTransfer.items || selectedTransfer.transfer_items) && (selectedTransfer.items || selectedTransfer.transfer_items).length > 0 && (
              <div>
                <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
                  Transfer Line Items
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {(selectedTransfer.items || selectedTransfer.transfer_items).map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.65rem 0.85rem',
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                          {item.products?.name || item.product_name || `Product #${item.product_id}`}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          SKU: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>{item.products?.sku || 'SKU'}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
                        {item.requested_quantity || item.quantity} units
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Create Transfer Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => !createSubmitting && setIsCreateOpen(false)}
        title="Request Stock Transfer"
        subtitle="Initiate inter-facility inventory rebalancing order."
        size="lg"
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
              Request Stock Transfer
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Select
              label="Source Origin Warehouse"
              required
              value={newTransfer.source_warehouse_id}
              onChange={(e) => setNewTransfer({ ...newTransfer, source_warehouse_id: e.target.value })}
              options={warehouses.map((w) => ({
                value: w.warehouse_id || w.id,
                label: `${w.name} (${w.warehouse_code || 'Origin'})`
              }))}
            />

            <Select
              label="Destination Receiving Warehouse"
              required
              value={newTransfer.destination_warehouse_id}
              onChange={(e) => setNewTransfer({ ...newTransfer, destination_warehouse_id: e.target.value })}
              options={warehouses.map((w) => ({
                value: w.warehouse_id || w.id,
                label: `${w.name} (${w.warehouse_code || 'Dest'})`
              }))}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Transfer Items
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={Plus}
                onClick={addItemRow}
              >
                Add Item
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {newTransfer.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '3fr 1.5fr auto',
                    gap: 'var(--space-2)',
                    alignItems: 'center',
                    padding: '0.6rem',
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-subtle)'
                  }}
                >
                  <Select
                    value={item.product_id}
                    onChange={(e) => updateItemRow(idx, 'product_id', e.target.value)}
                    options={products.map((p) => ({
                      value: p.product_id || p.id,
                      label: `${p.name} (${p.sku || 'SKU'})`
                    }))}
                  />

                  <Input
                    type="number"
                    min="1"
                    value={item.requested_quantity}
                    onChange={(e) => updateItemRow(idx, 'requested_quantity', Number(e.target.value))}
                    placeholder="Qty"
                  />

                  {newTransfer.items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      style={{ color: 'var(--color-danger-text)' }}
                      onClick={() => removeItemRow(idx)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TransfersPage;
