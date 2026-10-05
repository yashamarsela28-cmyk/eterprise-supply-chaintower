import React, { useState, useEffect, useMemo } from 'react';
import { PackageCheck, RefreshCw, Plus, CheckCircle, Eye } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as goodsReceiptService from '../services/goodsReceiptService';
import * as purchaseOrderService from '../services/purchaseOrderService';
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

  const { data: rawData, loading, error, refetch } = useApiQuery(
    goodsReceiptService.getGoodsReceipts,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  const receipts = useMemo(() => normalizeList(rawData), [rawData]);
  const pagination = useMemo(() => normalizePagination(rawData, receipts, page, limit), [rawData, receipts, page, limit]);

  // Compute live summary stats
  const summaryStats = useMemo(() => {
    let acceptedCount = 0;
    let totalUnits = 0;

    receipts.forEach((grn) => {
      const st = (grn.status || 'ACCEPTED').toUpperCase();
      if (st === 'ACCEPTED' || st === 'COMPLETED') acceptedCount += 1;
      const items = grn.items || grn.receipt_items || [];
      items.forEach((it) => {
        totalUnits += Number(it.quantity_received || it.quantity || 0);
      });
    });

    return {
      total: pagination.total || receipts.length,
      accepted: acceptedCount,
      totalUnits
    };
  }, [receipts, pagination.total]);

  useEffect(() => {
    if (isCreateOpen) {
      Promise.all([
        purchaseOrderService.getPurchaseOrders({ limit: 50 }).catch(() => ({ data: [] })),
        warehouseService.getWarehouses({ limit: 50 }).catch(() => ({ data: [] })),
        productService.getProducts({ limit: 50 }).catch(() => ({ data: [] }))
      ]).then(([poRes, whRes, prodRes]) => {
        const pos = normalizeList(poRes);
        const whs = normalizeList(whRes);
        const prods = normalizeList(prodRes);
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
      header: 'GRN Identifier',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {r.grn_number || `GRN-${r.grn_id || r.id}`}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
            Received: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>{formatDate(r.received_date || r.created_at)}</span>
          </div>
        </div>
      )
    },
    {
      key: 'po_number',
      header: 'Linked PO Ref',
      render: (r) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          {r.purchase_orders?.po_number || r.po_number || `PO #${r.purchase_order_id}`}
        </span>
      )
    },
    {
      key: 'warehouse',
      header: 'Receiving Dock Hub',
      render: (r) => (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          {r.warehouses?.name || r.warehouse_name || 'Central Facility'}
        </span>
      )
    },
    {
      key: 'received_by',
      header: 'Dock Officer',
      render: (r) => (
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
          Staff #{r.received_by || 1}
        </span>
      )
    },
    {
      key: 'status',
      header: 'QA Disposition',
      render: (r) => <StatusBadge status={r.status || 'ACCEPTED'} size="sm" />
    }
  ];

  return (
    <div className="goods-receipts-page animate-fade-in">
      <PageHeader
        eyebrow="RECEIVING // DOCK INTAKE"
        title="Goods Receipts & Inbound Docks"
        description="Physical dock intake notes, lot / batch verification, QA dispositions, and on-hand inventory absorption."
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={refetch}
            >
              Refresh Docks
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
            Goods Receipts Issued
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
            Accepted Shipments
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-success-text)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summaryStats.accepted)}
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
            Total Ingested Physical Units
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summaryStats.totalUnits)} units
          </div>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Filter by GRN number, PO reference, warehouse..."
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
        emptyMessage="No dock goods receipt records matched your filter criteria."
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
            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>QA Disposition</span>
                <StatusBadge status={selectedGRN.status || 'ACCEPTED'} size="sm" />
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Receiving Facility:</span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{selectedGRN.warehouses?.name || 'Central Facility'}</strong>
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '0.4rem', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.4rem' }}>
                <strong style={{ color: 'var(--color-text-muted)' }}>Date Ingested:</strong> {formatDate(selectedGRN.received_date || selectedGRN.created_at)}
              </div>
            </div>

            {selectedGRN.items && selectedGRN.items.length > 0 && (
              <div>
                <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
                  Ingested Items ({selectedGRN.items.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {selectedGRN.items.map((item, idx) => (
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
                          Batch: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>{item.batch_number || 'N/A'}</span> • Condition: {item.condition || 'GOOD'}
                        </div>
                      </div>
                      <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success-text)' }}>
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
              label="Receiving Warehouse Facility"
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

export default GoodsReceiptsPage;
