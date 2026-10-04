import React, { useState, useEffect } from 'react';
import { PackageCheck, RefreshCw, Plus, CheckCircle, Eye } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as goodsReceiptService from '../services/goodsReceiptService';
import * as purchaseOrderService from '../services/purchaseOrderService';
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
import { formatDate, formatNumber } from '../utils/formatters';

export function GoodsReceiptsPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedGRN, setSelectedGRN] = useState(null);

  // Create GRN Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  const [newGRN, setNewGRN] = useState({
    purchase_order_id: '',
    warehouse_id: '',
    items: [{ product_id: '', quantity_received: 10, condition: 'GOOD', batch_number: 'BATCH-2026-A' }]
  });

  const { page, limit, setPage, setLimit } = usePagination(1, 20);

  const { data, loading, error, refetch } = useApiQuery(
    goodsReceiptService.getGoodsReceipts,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  useEffect(() => {
    if (isCreateOpen) {
      Promise.all([
        purchaseOrderService.getPurchaseOrders({ limit: 50 }).catch(() => ({ data: [] })),
        warehouseService.getWarehouses({ limit: 50 }).catch(() => ({ data: [] })),
        productService.getProducts({ limit: 50 }).catch(() => ({ data: [] }))
      ]).then(([poRes, whRes, prodRes]) => {
        const pos = poRes?.data || [];
        const whs = whRes?.data || [];
        const prods = prodRes?.data || [];
        setPurchaseOrders(pos);
        setWarehouses(whs);
        setProducts(prods);

        setNewGRN((prev) => ({
          ...prev,
          purchase_order_id: prev.purchase_order_id || (pos[0]?.po_id || pos[0]?.purchase_order_id || pos[0]?.id || 1),
          warehouse_id: prev.warehouse_id || (whs[0]?.warehouse_id || whs[0]?.id || 1),
          items: prev.items.map((item) => ({
            ...item,
            product_id: item.product_id || (prods[0]?.product_id || prods[0]?.id || 1)
          }))
        }));
      });
    }
  }, [isCreateOpen]);

  const receipts = data?.data || [];
  const pagination = data?.pagination || { total: receipts.length, page, limit, totalPages: Math.ceil(receipts.length / limit) || 1 };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newGRN.purchase_order_id || !newGRN.items || newGRN.items.length === 0) {
      toast.error('Please specify a purchase order and at least one received item');
      return;
    }

    setCreateSubmitting(true);
    try {
      const payload = {
        purchase_order_id: Number(newGRN.purchase_order_id),
        warehouse_id: Number(newGRN.warehouse_id) || 1,
        items: newGRN.items.map((item) => ({
          product_id: Number(item.product_id),
          quantity_received: Number(item.quantity_received) || 1,
          condition: item.condition || 'GOOD',
          batch_number: item.batch_number || `BATCH-${Date.now().toString().slice(-4)}`
        }))
      };

      const res = await goodsReceiptService.createGoodsReceipt(payload);
      toast.success(`Goods Receipt #${res?.data?.grn_number || ''} recorded successfully. Inventory updated.`);
      setIsCreateOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to record goods receipt');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const addItemRow = () => {
    const defaultProd = products[0];
    setNewGRN((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: defaultProd?.product_id || defaultProd?.id || 1,
          quantity_received: 10,
          condition: 'GOOD',
          batch_number: 'BATCH-2026-A'
        }
      ]
    }));
  };

  const removeItemRow = (idx) => {
    setNewGRN((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const updateItemRow = (idx, field, value) => {
    setNewGRN((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  const columns = [
    {
      key: 'grn_number',
      header: 'GRN Number',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {r.grn_number || `GRN-${r.grn_id || r.id}`}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Received: {formatDate(r.received_date || r.created_at)}
          </div>
        </div>
      )
    },
    {
      key: 'po_number',
      header: 'PO Reference',
      render: (r) => r.purchase_orders?.po_number || r.po_number || `PO #${r.purchase_order_id}`
    },
    {
      key: 'warehouse',
      header: 'Receiving Warehouse',
      render: (r) => r.warehouses?.name || r.warehouse_name || 'Central Hub'
    },
    {
      key: 'received_by',
      header: 'Received By Agent',
      render: (r) => `Staff ID #${r.received_by || 1}`
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status || 'ACCEPTED'} />
    }
  ];

  return (
    <div className="goods-receipts-page">
      <PageHeader
        title="Goods Receipts & Inbound Docks"
        description="Dock receiving notes, physical shipment intake, and QA verification logs."
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
              Receive Goods (GRN)
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
        searchPlaceholder="Search GRN, PO or warehouse..."
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
            { value: 'ACCEPTED', label: 'Accepted' },
            { value: 'PARTIAL', label: 'Partial' },
            { value: 'INSPECTING', label: 'Inspecting' }
          ]}
        />
      </FilterBar>

      <Table
        columns={columns}
        data={receipts}
        loading={loading}
        onRowClick={(grn) => setSelectedGRN(grn)}
        emptyTitle="No Goods Receipts Found"
      />

      <Pagination
        currentPage={page}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.total || receipts.length}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      {/* GRN Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedGRN)}
        onClose={() => setSelectedGRN(null)}
        title={selectedGRN?.grn_number || `GRN #${selectedGRN?.grn_id || selectedGRN?.id}`}
        subtitle={`PO Reference: ${selectedGRN?.purchase_orders?.po_number || selectedGRN?.po_number || 'Linked PO'}`}
      >
        {selectedGRN && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Status</span>
                <StatusBadge status={selectedGRN.status || 'ACCEPTED'} />
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                <strong>Warehouse Facility:</strong> {selectedGRN.warehouses?.name || 'Central Facility'}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                Received on {formatDate(selectedGRN.received_date || selectedGRN.created_at)}
              </div>
            </div>

            {selectedGRN.items && selectedGRN.items.length > 0 && (
              <div>
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Received Dock Items</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedGRN.items.map((item, idx) => (
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
                      <div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                          {item.products?.name || item.product_name || `Product #${item.product_id}`}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                          Batch: {item.batch_number || 'N/A'} • Condition: {item.condition || 'GOOD'}
                        </div>
                      </div>
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-success)' }}>
                        +{item.quantity_received} units
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Create GRN Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => !createSubmitting && setIsCreateOpen(false)}
        title="Receive Goods Shipment (GRN)"
        subtitle="Intake vendor delivery at dock and automatically increase on-hand inventory."
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
              Confirm Goods Receipt
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Select
              label="Purchase Order"
              required
              value={newGRN.purchase_order_id}
              onChange={(e) => setNewGRN({ ...newGRN, purchase_order_id: e.target.value })}
              options={purchaseOrders.map((po) => ({
                value: po.po_id || po.purchase_order_id || po.id,
                label: `${po.po_number || `PO-${po.po_id || po.id}`} (${po.status})`
              }))}
            />

            <Select
              label="Receiving Warehouse"
              required
              value={newGRN.warehouse_id}
              onChange={(e) => setNewGRN({ ...newGRN, warehouse_id: e.target.value })}
              options={warehouses.map((w) => ({
                value: w.warehouse_id || w.id,
                label: `${w.name} (${w.warehouse_code || 'Facility'})`
              }))}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Received Line Items
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
              {newGRN.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '3fr 1.5fr 2fr auto',
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
                    value={item.quantity_received}
                    onChange={(e) => updateItemRow(idx, 'quantity_received', Number(e.target.value))}
                    placeholder="Qty"
                  />

                  <Input
                    value={item.batch_number}
                    onChange={(e) => updateItemRow(idx, 'batch_number', e.target.value)}
                    placeholder="Batch #"
                  />

                  {newGRN.items.length > 1 && (
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

export default GoodsReceiptsPage;
