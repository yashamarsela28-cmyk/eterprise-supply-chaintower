import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, RefreshCw, Plus, CheckCircle, Truck, PackageCheck, XCircle } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as transferService from '../services/transferService';
import * as warehouseService from '../services/warehouseService';
import * as productService from '../services/productService';
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

  const { data, loading, error, refetch } = useApiQuery(
    transferService.getTransfers,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  useEffect(() => {
    if (isCreateOpen) {
      Promise.all([
        warehouseService.getWarehouses({ limit: 50 }).catch(() => ({ data: [] })),
        productService.getProducts({ limit: 50 }).catch(() => ({ data: [] }))
      ]).then(([whRes, prodRes]) => {
        const whs = whRes?.data || [];
        const prods = prodRes?.data || [];
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

  const transfers = data?.data || [];
  const pagination = data?.pagination || { total: transfers.length, page, limit, totalPages: Math.ceil(transfers.length / limit) || 1 };

  // Status Action Handler
  const handleAction = async (actionType) => {
    if (!selectedTransfer) return;
    const transferId = selectedTransfer.transfer_id || selectedTransfer.id;
    setActionLoading(true);

    try {
      let res;
      if (actionType === 'APPROVE') {
        res = await transferService.approveTransfer(transferId);
        toast.success('Stock Transfer approved');
      } else if (actionType === 'DISPATCH') {
        res = await transferService.dispatchTransfer(transferId);
        toast.success('Stock Transfer dispatched. Source inventory decremented.');
      } else if (actionType === 'RECEIVE') {
        res = await transferService.receiveTransfer(transferId);
        toast.success('Stock Transfer received. Destination inventory incremented.');
      } else if (actionType === 'CANCEL') {
        res = await transferService.cancelTransfer(transferId);
        toast.success('Stock Transfer cancelled');
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
    if (newTransfer.source_warehouse_id === newTransfer.destination_warehouse_id) {
      toast.error('Source and Destination warehouses must be different');
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
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Created: {formatDate(r.created_at)}
          </div>
        </div>
      )
    },
    {
      key: 'route',
      header: 'Source → Destination',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 500 }}>{r.source_warehouse?.name || `Warehouse #${r.source_warehouse_id}`}</span>
          <ArrowLeftRight size={14} style={{ color: 'var(--color-text-muted)' }} />
          <span style={{ fontWeight: 500 }}>{r.destination_warehouse?.name || `Warehouse #${r.destination_warehouse_id}`}</span>
        </div>
      )
    },
    {
      key: 'items_count',
      header: 'Items / Units',
      align: 'center',
      render: (r) => `${r.items?.length || r.transfer_items?.length || 1} items`
    },
    {
      key: 'status',
      header: 'Transfer Status',
      render: (r) => <StatusBadge status={r.status} />
    }
  ];

  const currentStatus = (selectedTransfer?.status || '').toUpperCase();

  return (
    <div className="transfers-page">
      <PageHeader
        title="Stock Transfers & Rebalancing"
        description="Inter-warehouse inventory relocation orders, in-transit monitoring, and reconciliation."
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
              Request Transfer
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
        searchPlaceholder="Search transfer number or warehouse..."
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
            <div style={{ padding: '1rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Status</span>
                <StatusBadge status={selectedTransfer.status} />
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                <strong>Source:</strong> {selectedTransfer.source_warehouse?.name || `Warehouse #${selectedTransfer.source_warehouse_id}`}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                <strong>Destination:</strong> {selectedTransfer.destination_warehouse?.name || `Warehouse #${selectedTransfer.destination_warehouse_id}`}
              </div>
            </div>

            {/* Operational Actions */}
            <div style={{ padding: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
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
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Transfer Line Items</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(selectedTransfer.items || selectedTransfer.transfer_items).map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'rgba(30, 41, 59, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                        {item.products?.name || item.product_name || `Product #${item.product_id}`}
                      </span>
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
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
        subtitle="Initiate inter-facility inventory rebalancing."
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
                    padding: '0.5rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    borderRadius: 'var(--radius-md)'
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
                      style={{ color: 'var(--color-danger)' }}
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
