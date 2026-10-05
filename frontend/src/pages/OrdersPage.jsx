import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, RefreshCw, Plus, CheckCircle, Truck, Package, XCircle, Box, ArrowRight } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as orderService from '../services/orderService';
import * as customerService from '../services/customerService';
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
import { formatCurrency, formatDate, formatNumber } from '../utils/formatters';

export function OrdersPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Create Order Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  const [newOrder, setNewOrder] = useState({
    customer_id: '',
    warehouse_id: '',
    shipping_address: '',
    items: [{ product_id: '', ordered_quantity: 1, unit_price: 50.00 }]
  });

  const { page, limit, setPage, setLimit } = usePagination(1, 20);

  const { data: rawData, loading, error, refetch } = useApiQuery(
    orderService.getOrders,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  const orders = useMemo(() => normalizeList(rawData), [rawData]);
  const pagination = useMemo(() => normalizePagination(rawData, orders, page, limit), [rawData, orders, page, limit]);

  // Compute live summary stats
  const summaryStats = useMemo(() => {
    let totalValuation = 0;
    let pendingCount = 0;
    let shippedDeliveredCount = 0;

    orders.forEach((o) => {
      totalValuation += Number(o.total_amount || 0);
      const st = (o.status || '').toUpperCase();
      if (st === 'PENDING' || st === 'CONFIRMED' || st === 'ALLOCATED' || st === 'PROCESSING') {
        pendingCount += 1;
      }
      if (st === 'SHIPPED' || st === 'DELIVERED') {
        shippedDeliveredCount += 1;
      }
    });

    return {
      total: pagination.total || orders.length,
      activePipeline: pendingCount,
      fulfilled: shippedDeliveredCount,
      totalValuation
    };
  }, [orders, pagination.total]);

  // Fetch lookup data for form
  useEffect(() => {
    if (isCreateOpen) {
      Promise.all([
        customerService.getCustomers({ limit: 50 }).catch(() => ({ data: [] })),
        warehouseService.getWarehouses({ limit: 50 }).catch(() => ({ data: [] })),
        productService.getProducts({ limit: 50 }).catch(() => ({ data: [] }))
      ]).then(([custRes, whRes, prodRes]) => {
        const custs = normalizeList(custRes);
        const whs = normalizeList(whRes);
        const prods = normalizeList(prodRes);
        setCustomers(custs);
        setWarehouses(whs);
        setProducts(prods);

        setNewOrder((prev) => ({
          ...prev,
          customer_id: prev.customer_id || (custs[0]?.customer_id || custs[0]?.id || 1),
          warehouse_id: prev.warehouse_id || (whs[0]?.warehouse_id || whs[0]?.id || 1),
          shipping_address: prev.shipping_address || custs[0]?.address || '100 Enterprise Way, Suite 400',
          items: prev.items.map((item) => ({
            ...item,
            product_id: item.product_id || (prods[0]?.product_id || prods[0]?.id || 1),
            unit_price: item.unit_price || (prods[0]?.unit_price || 50.00)
          }))
        }));
      });
    }
  }, [isCreateOpen]);

  // Handle Action / Status Transition
  const handleStatusChange = async (targetStatus) => {
    if (!selectedOrder) return;
    const orderId = selectedOrder.sales_order_id || selectedOrder.id;
    setActionLoading(true);
    try {
      let res;
      if (targetStatus === 'CONFIRMED') {
        res = await orderService.confirmOrder(orderId);
      } else if (targetStatus === 'ALLOCATED') {
        res = await orderService.allocateOrder(orderId);
      } else if (targetStatus === 'CANCELLED') {
        res = await orderService.cancelOrder(orderId);
      } else {
        res = await orderService.updateOrderStatus(orderId, targetStatus);
      }
      toast.success(`Sales Order #${selectedOrder.order_number || orderId} transitioned to ${targetStatus}`);
      setSelectedOrder(res?.data || { ...selectedOrder, status: targetStatus });
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update order status');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Create Order Submission
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newOrder.customer_id || !newOrder.items || newOrder.items.length === 0) {
      toast.error('Please specify a customer and at least one item');
      return;
    }

    setCreateSubmitting(true);
    try {
      const payload = {
        customer_id: Number(newOrder.customer_id),
        warehouse_id: Number(newOrder.warehouse_id) || 1,
        shipping_address: newOrder.shipping_address || '100 Enterprise Way',
        items: newOrder.items.map((item) => ({
          product_id: Number(item.product_id),
          ordered_quantity: Number(item.ordered_quantity) || 1,
          unit_price: Number(item.unit_price) || 50.00
        }))
      };

      const res = await orderService.createOrder(payload);
      toast.success(`Sales Order #${res?.data?.order_number || ''} created successfully`);
      setIsCreateOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create sales order');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const addItemRow = () => {
    const defaultProd = products[0];
    setNewOrder((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: defaultProd?.product_id || defaultProd?.id || 1,
          ordered_quantity: 1,
          unit_price: defaultProd?.unit_price || 50.00
        }
      ]
    }));
  };

  const removeItemRow = (idx) => {
    setNewOrder((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const updateItemRow = (idx, field, value) => {
    setNewOrder((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      if (field === 'product_id') {
        const prod = products.find((p) => String(p.product_id || p.id) === String(value));
        if (prod && prod.unit_price) {
          items[idx].unit_price = prod.unit_price;
        }
      }
      return { ...prev, items };
    });
  };

  const columns = [
    {
      key: 'order_number',
      header: 'Sales Order Ref',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {r.order_number || `ORD-${r.sales_order_id || r.id}`}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
            Date: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>{formatDate(r.created_at || r.order_date)}</span>
          </div>
        </div>
      )
    },
    {
      key: 'customer',
      header: 'Customer Account',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {r.customers?.name || r.customer_name || `Account #${r.customer_id}`}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {r.customers?.code || r.customer_code || 'Standard Terms'}
          </div>
        </div>
      )
    },
    {
      key: 'items_count',
      header: 'Items',
      align: 'center',
      render: (r) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          {r.order_items?.length || r.items?.length || 1} lines
        </span>
      )
    },
    {
      key: 'total_amount',
      header: 'Order Total',
      align: 'right',
      render: (r) => (
        <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
          {formatCurrency(r.total_amount || 0)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Fulfillment State',
      render: (r) => <StatusBadge status={r.status} size="sm" />
    }
  ];

  const currentStatus = (selectedOrder?.status || '').toUpperCase();

  return (
    <div className="orders-page animate-fade-in">
      <PageHeader
        eyebrow="DEMAND // SALES FULFILLMENT"
        title="Sales Orders & Demand Pipeline"
        description="Customer purchase orders, allocation lifecycles, and outbound shipment commitments."
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={refetch}
            >
              Refresh Orders
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsCreateOpen(true)}
            >
              Create Order
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
            Total Sales Orders
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
            Active Demand Pipeline
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-warning-text)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summaryStats.activePipeline)}
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
            Dispatched & Delivered
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-success-text)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summaryStats.fulfilled)}
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
            Pipeline Valuation
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(summaryStats.totalValuation)}
          </div>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Filter by order number, customer, code..."
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
            { value: 'PENDING', label: 'Pending' },
            { value: 'CONFIRMED', label: 'Confirmed' },
            { value: 'ALLOCATED', label: 'Allocated' },
            { value: 'PROCESSING', label: 'Processing' },
            { value: 'SHIPPED', label: 'Shipped' },
            { value: 'DELIVERED', label: 'Delivered' },
            { value: 'CANCELLED', label: 'Cancelled' }
          ]}
        />
      </FilterBar>

      <Table
        columns={columns}
        data={orders}
        loading={loading}
        onRowClick={(ord) => setSelectedOrder(ord)}
        emptyTitle="No Orders Found"
        emptyMessage="No sales orders matched your search or status criteria."
      />

      <Pagination
        currentPage={page}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.total || orders.length}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      {/* Sales Order Drawer with Workflow Actions */}
      <Drawer
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder?.order_number || `Sales Order #${selectedOrder?.sales_order_id || selectedOrder?.id}`}
        subtitle={`Account: ${selectedOrder?.customers?.name || selectedOrder?.customer_name || 'Enterprise Client'}`}
      >
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Lifecycle Status</span>
                <StatusBadge status={selectedOrder.status} size="sm" />
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Order Total:</span>
                <strong style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(selectedOrder.total_amount || 0)}</strong>
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '0.4rem', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.4rem' }}>
                <strong style={{ color: 'var(--color-text-muted)' }}>Destination:</strong> {selectedOrder.shipping_address || 'Standard Delivery Address'}
              </div>
            </div>

            {/* Workflow Action Buttons */}
            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Fulfillment Controls
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {currentStatus === 'PENDING' && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={CheckCircle}
                      loading={actionLoading}
                      onClick={() => handleStatusChange('CONFIRMED')}
                    >
                      Confirm Order
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={XCircle}
                      loading={actionLoading}
                      onClick={() => handleStatusChange('CANCELLED')}
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {currentStatus === 'CONFIRMED' && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Box}
                      loading={actionLoading}
                      onClick={() => handleStatusChange('ALLOCATED')}
                    >
                      Allocate Inventory
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={XCircle}
                      loading={actionLoading}
                      onClick={() => handleStatusChange('CANCELLED')}
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {currentStatus === 'ALLOCATED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Package}
                    loading={actionLoading}
                    onClick={() => handleStatusChange('PROCESSING')}
                  >
                    Start Processing
                  </Button>
                )}

                {currentStatus === 'PROCESSING' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Truck}
                    loading={actionLoading}
                    onClick={() => handleStatusChange('SHIPPED')}
                  >
                    Mark Shipped
                  </Button>
                )}

                {currentStatus === 'SHIPPED' && (
                  <Button
                    variant="success"
                    size="sm"
                    icon={CheckCircle}
                    loading={actionLoading}
                    onClick={() => handleStatusChange('DELIVERED')}
                  >
                    Mark Delivered
                  </Button>
                )}

                {['DELIVERED', 'CANCELLED'].includes(currentStatus) && (
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    Order state is terminal ({currentStatus}). No further transitions allowed.
                  </div>
                )}
              </div>
            </div>

            {/* Line Items */}
            {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
              <div>
                <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
                  Line Items ({selectedOrder.order_items.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {selectedOrder.order_items.map((item, idx) => (
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
                          Qty: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>{item.ordered_quantity || item.quantity}</span> • Unit: {formatCurrency(item.unit_price || 0)}
                        </div>
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
                        {formatCurrency(item.subtotal || (item.ordered_quantity || item.quantity || 1) * (item.unit_price || 0))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Create Order Modal Dialog */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => !createSubmitting && setIsCreateOpen(false)}
        title="Create Sales Order"
        subtitle="Initiate customer demand order with automatic stock allocation."
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
              Submit Sales Order
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Select
              label="Customer Account"
              required
              value={newOrder.customer_id}
              onChange={(e) => setNewOrder({ ...newOrder, customer_id: e.target.value })}
              options={customers.map((c) => ({
                value: c.customer_id || c.id,
                label: `${c.name} (${c.company_name || c.customer_code || 'Account'})`
              }))}
            />

            <Select
              label="Fulfillment Warehouse"
              required
              value={newOrder.warehouse_id}
              onChange={(e) => setNewOrder({ ...newOrder, warehouse_id: e.target.value })}
              options={warehouses.map((w) => ({
                value: w.warehouse_id || w.id,
                label: `${w.name} (${w.warehouse_code || w.code || 'Facility'})`
              }))}
            />
          </div>

          <Input
            label="Shipping Destination Address"
            required
            value={newOrder.shipping_address}
            onChange={(e) => setNewOrder({ ...newOrder, shipping_address: e.target.value })}
            placeholder="e.g. 100 Enterprise Way, Industrial Park"
          />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Order Line Items
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
              {newOrder.items.map((item, idx) => (
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
                    value={item.ordered_quantity}
                    onChange={(e) => updateItemRow(idx, 'ordered_quantity', Number(e.target.value))}
                    placeholder="Qty"
                  />

                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unit_price}
                    onChange={(e) => updateItemRow(idx, 'unit_price', Number(e.target.value))}
                    placeholder="Price"
                  />

                  {newOrder.items.length > 1 && (
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

export default OrdersPage;
