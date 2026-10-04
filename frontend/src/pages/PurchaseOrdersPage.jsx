import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, RefreshCw, Plus, CheckCircle, Send, XCircle, PackageCheck } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as purchaseOrderService from '../services/purchaseOrderService';
import * as supplierService from '../services/supplierService';
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
import { formatCurrency, formatDate } from '../utils/formatters';

export function PurchaseOrdersPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPO, setSelectedPO] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Create PO Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  const [newPO, setNewPO] = useState({
    supplier_id: '',
    warehouse_id: '',
    expected_delivery_date: '',
    items: [{ product_id: '', ordered_quantity: 10, unit_cost: 35.00 }]
  });

  const { page, limit, setPage, setLimit } = usePagination(1, 20);

  const { data, loading, error, refetch } = useApiQuery(
    purchaseOrderService.getPurchaseOrders,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  useEffect(() => {
    if (isCreateOpen) {
      Promise.all([
        supplierService.getSuppliers({ limit: 50 }).catch(() => ({ data: [] })),
        warehouseService.getWarehouses({ limit: 50 }).catch(() => ({ data: [] })),
        productService.getProducts({ limit: 50 }).catch(() => ({ data: [] }))
      ]).then(([supRes, whRes, prodRes]) => {
        const sups = supRes?.data || [];
        const whs = whRes?.data || [];
        const prods = prodRes?.data || [];
        setSuppliers(sups);
        setWarehouses(whs);
        setProducts(prods);

        setNewPO((prev) => ({
          ...prev,
          supplier_id: prev.supplier_id || (sups[0]?.supplier_id || sups[0]?.id || 1),
          warehouse_id: prev.warehouse_id || (whs[0]?.warehouse_id || whs[0]?.id || 1),
          expected_delivery_date: prev.expected_delivery_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          items: prev.items.map((item) => ({
            ...item,
            product_id: item.product_id || (prods[0]?.product_id || prods[0]?.id || 1),
            unit_cost: item.unit_cost || 35.00
          }))
        }));
      });
    }
  }, [isCreateOpen]);

  const orders = data?.data || [];
  const pagination = data?.pagination || { total: orders.length, page, limit, totalPages: Math.ceil(orders.length / limit) || 1 };

  // Status Action Handlers
  const handleAction = async (actionType) => {
    if (!selectedPO) return;
    const poId = selectedPO.po_id || selectedPO.purchase_order_id || selectedPO.id;
    setActionLoading(true);

    try {
      let res;
      if (actionType === 'SUBMIT') {
        res = await purchaseOrderService.submitPurchaseOrder(poId);
        toast.success('Purchase Order submitted for managerial approval');
      } else if (actionType === 'APPROVE') {
        res = await purchaseOrderService.approvePurchaseOrder(poId);
        toast.success('Purchase Order approved for vendor fulfillment');
      } else if (actionType === 'CANCEL') {
        res = await purchaseOrderService.cancelPurchaseOrder(poId);
        toast.success('Purchase Order cancelled');
      }
      setSelectedPO(res?.data || null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newPO.supplier_id || !newPO.items || newPO.items.length === 0) {
      toast.error('Please specify a supplier and at least one item');
      return;
    }

    setCreateSubmitting(true);
    try {
      const payload = {
        supplier_id: Number(newPO.supplier_id),
        warehouse_id: Number(newPO.warehouse_id) || 1,
        expected_delivery_date: newPO.expected_delivery_date || undefined,
        items: newPO.items.map((item) => ({
          product_id: Number(item.product_id),
          ordered_quantity: Number(item.ordered_quantity) || 1,
          unit_cost: Number(item.unit_cost) || 10.00
        }))
      };

      const res = await purchaseOrderService.createPurchaseOrder(payload);
      toast.success(`Purchase Order #${res?.data?.po_number || ''} created successfully`);
      setIsCreateOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create purchase order');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const addItemRow = () => {
    const defaultProd = products[0];
    setNewPO((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: defaultProd?.product_id || defaultProd?.id || 1,
          ordered_quantity: 10,
          unit_cost: 35.00
        }
      ]
    }));
  };

  const removeItemRow = (idx) => {
    setNewPO((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const updateItemRow = (idx, field, value) => {
    setNewPO((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  const columns = [
    {
      key: 'po_number',
      header: 'PO Reference',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {r.po_number || `PO-${r.po_id || r.id}`}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Date: {formatDate(r.created_at || r.order_date)}
          </div>
        </div>
      )
    },
    {
      key: 'supplier',
      header: 'Supplier / Vendor',
      render: (r) => r.suppliers?.name || r.supplier_name || `Supplier #${r.supplier_id}`
    },
    {
      key: 'warehouse',
      header: 'Receiving Hub',
      render: (r) => r.warehouses?.name || r.warehouse_name || 'Central Facility'
    },
    {
      key: 'total_amount',
      header: 'Total Valuation',
      align: 'right',
      render: (r) => (
        <span style={{ fontWeight: 600 }}>
          {formatCurrency(r.total_amount || 0)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} />
    }
  ];

  const currentStatus = (selectedPO?.status || '').toUpperCase();

  return (
    <div className="purchase-orders-page">
      <PageHeader
        title="Purchase Orders & Procurement"
        description="Inbound replenishment orders, supplier contracts, and receiving schedules."
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
              Create PO
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
        searchPlaceholder="Search PO number or supplier..."
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
            { value: 'DRAFT', label: 'Draft' },
            { value: 'SUBMITTED', label: 'Submitted' },
            { value: 'APPROVED', label: 'Approved' },
            { value: 'PARTIALLY_RECEIVED', label: 'Partially Received' },
            { value: 'RECEIVED', label: 'Received' },
            { value: 'CANCELLED', label: 'Cancelled' }
          ]}
        />
      </FilterBar>

      <Table
        columns={columns}
        data={orders}
        loading={loading}
        onRowClick={(po) => setSelectedPO(po)}
        emptyTitle="No Purchase Orders Found"
      />

      <Pagination
        currentPage={page}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.total || orders.length}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      {/* PO Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedPO)}
        onClose={() => setSelectedPO(null)}
        title={selectedPO?.po_number || `Purchase Order #${selectedPO?.po_id || selectedPO?.id}`}
        subtitle={`Supplier: ${selectedPO?.suppliers?.name || selectedPO?.supplier_name || 'Vendor'}`}
      >
        {selectedPO && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Status</span>
                <StatusBadge status={selectedPO.status} />
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                <strong>Total Amount:</strong> {formatCurrency(selectedPO.total_amount || 0)}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                <strong>Receiving Hub:</strong> {selectedPO.warehouses?.name || 'Central Facility'}
              </div>
            </div>

            {/* Operational Actions */}
            <div style={{ padding: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                Procurement Actions
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {currentStatus === 'DRAFT' && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Send}
                      loading={actionLoading}
                      onClick={() => handleAction('SUBMIT')}
                    >
                      Submit for Approval
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={XCircle}
                      loading={actionLoading}
                      onClick={() => handleAction('CANCEL')}
                    >
                      Cancel PO
                    </Button>
                  </>
                )}

                {currentStatus === 'SUBMITTED' && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      icon={CheckCircle}
                      loading={actionLoading}
                      onClick={() => handleAction('APPROVE')}
                    >
                      Approve PO
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={XCircle}
                      loading={actionLoading}
                      onClick={() => handleAction('CANCEL')}
                    >
                      Reject / Cancel
                    </Button>
                  </>
                )}

                {['APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'].includes(currentStatus) && (
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    Status: {currentStatus}. {currentStatus === 'APPROVED' ? 'Ready for warehouse goods receipt.' : 'Terminal procurement state.'}
                  </div>
                )}
              </div>
            </div>

            {/* Line Items */}
            {selectedPO.po_items && selectedPO.po_items.length > 0 && (
              <div>
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>PO Line Items</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedPO.po_items.map((item, idx) => (
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
                          Qty: {item.ordered_quantity || item.quantity} • Unit Cost: {formatCurrency(item.unit_cost || 0)}
                        </div>
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {formatCurrency(item.subtotal || (item.ordered_quantity || item.quantity || 1) * (item.unit_cost || 0))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Create PO Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => !createSubmitting && setIsCreateOpen(false)}
        title="Create Purchase Order"
        subtitle="Issue an inbound inventory replenishment order to vendor."
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
              Create Purchase Order
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Select
              label="Supplier / Vendor"
              required
              value={newPO.supplier_id}
              onChange={(e) => setNewPO({ ...newPO, supplier_id: e.target.value })}
              options={suppliers.map((s) => ({
                value: s.supplier_id || s.id,
                label: `${s.name} (${s.supplier_code || 'Vendor'})`
              }))}
            />

            <Select
              label="Receiving Warehouse"
              required
              value={newPO.warehouse_id}
              onChange={(e) => setNewPO({ ...newPO, warehouse_id: e.target.value })}
              options={warehouses.map((w) => ({
                value: w.warehouse_id || w.id,
                label: `${w.name} (${w.warehouse_code || 'Facility'})`
              }))}
            />
          </div>

          <Input
            label="Expected Delivery Date"
            type="date"
            value={newPO.expected_delivery_date}
            onChange={(e) => setNewPO({ ...newPO, expected_delivery_date: e.target.value })}
          />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Replenishment Items
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
              {newPO.items.map((item, idx) => (
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
                    value={item.ordered_quantity}
                    onChange={(e) => updateItemRow(idx, 'ordered_quantity', Number(e.target.value))}
                    placeholder="Qty"
                  />

                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unit_cost}
                    onChange={(e) => updateItemRow(idx, 'unit_cost', Number(e.target.value))}
                    placeholder="Cost"
                  />

                  {newPO.items.length > 1 && (
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

export default PurchaseOrdersPage;
