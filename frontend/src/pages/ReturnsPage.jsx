import React, { useState, useEffect } from 'react';
import { RotateCcw, RefreshCw, Plus, CheckCircle, PackageCheck, XCircle } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as returnService from '../services/returnService';
import * as orderService from '../services/orderService';
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

export function ReturnsPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Create RMA Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  const [newReturn, setNewReturn] = useState({
    sales_order_id: '',
    reason: 'Customer Return - Defective Unit',
    return_type: 'CUSTOMER_RETURN',
    items: [{ product_id: '', requested_quantity: 1, condition: 'PENDING_INSPECTION' }]
  });

  const { page, limit, setPage, setLimit } = usePagination(1, 20);

  const { data, loading, error, refetch } = useApiQuery(
    returnService.getReturns,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  useEffect(() => {
    if (isCreateOpen) {
      Promise.all([
        orderService.getOrders({ limit: 50 }).catch(() => ({ data: [] })),
        productService.getProducts({ limit: 50 }).catch(() => ({ data: [] }))
      ]).then(([ordRes, prodRes]) => {
        const ords = ordRes?.data || [];
        const prods = prodRes?.data || [];
        setOrders(ords);
        setProducts(prods);

        setNewReturn((prev) => ({
          ...prev,
          sales_order_id: prev.sales_order_id || (ords[0]?.sales_order_id || ords[0]?.id || 1),
          items: prev.items.map((item) => ({
            ...item,
            product_id: item.product_id || (prods[0]?.product_id || prods[0]?.id || 1)
          }))
        }));
      });
    }
  }, [isCreateOpen]);

  const returns = data?.data || [];
  const pagination = data?.pagination || { total: returns.length, page, limit, totalPages: Math.ceil(returns.length / limit) || 1 };

  // Status Action Handler
  const handleAction = async (actionType) => {
    if (!selectedReturn) return;
    const returnId = selectedReturn.return_id || selectedReturn.id;
    setActionLoading(true);

    try {
      let res;
      if (actionType === 'APPROVE') {
        res = await returnService.approveReturn(returnId);
        toast.success('RMA approved for customer return receipt');
      } else if (actionType === 'RECEIVE') {
        res = await returnService.receiveReturn(returnId);
        toast.success('Return received and inventory restocked');
      } else if (actionType === 'REJECT') {
        res = await returnService.rejectReturn(returnId);
        toast.success('RMA rejected');
      }
      setSelectedReturn(res?.data || null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newReturn.sales_order_id) {
      toast.error('Please select a sales order');
      return;
    }

    setCreateSubmitting(true);
    try {
      const payload = {
        sales_order_id: Number(newReturn.sales_order_id),
        reason: newReturn.reason || 'Customer Return',
        return_type: newReturn.return_type || 'CUSTOMER_RETURN',
        items: newReturn.items.map((item) => ({
          product_id: Number(item.product_id),
          requested_quantity: Number(item.requested_quantity) || 1,
          condition: item.condition || 'PENDING_INSPECTION'
        }))
      };

      const res = await returnService.createReturn(payload);
      toast.success(`RMA #${res?.data?.return_number || ''} created successfully`);
      setIsCreateOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create return RMA');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const addItemRow = () => {
    const defaultProd = products[0];
    setNewReturn((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: defaultProd?.product_id || defaultProd?.id || 1,
          requested_quantity: 1,
          condition: 'PENDING_INSPECTION'
        }
      ]
    }));
  };

  const removeItemRow = (idx) => {
    setNewReturn((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const updateItemRow = (idx, field, value) => {
    setNewReturn((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  const columns = [
    {
      key: 'return_number',
      header: 'RMA Reference',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {r.return_number || `RMA-${r.return_id || r.id}`}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Date: {formatDate(r.created_at || r.return_date)}
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
      key: 'reason',
      header: 'Return Reason',
      render: (r) => r.reason || 'Customer Return / Damaged'
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status || 'REQUESTED'} />
    }
  ];

  const currentStatus = (selectedReturn?.status || '').toUpperCase();

  return (
    <div className="returns-page">
      <PageHeader
        title="Returns & RMA Quality Management"
        description="Customer return authorizations, disposition inspection, and refund processing."
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
              Create RMA
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
        searchPlaceholder="Search RMA number or reason..."
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
            { value: 'RECEIVED', label: 'Received' },
            { value: 'INSPECTING', label: 'Inspecting' },
            { value: 'REFUNDED', label: 'Refunded' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'REJECTED', label: 'Rejected' }
          ]}
        />
      </FilterBar>

      <Table
        columns={columns}
        data={returns}
        loading={loading}
        onRowClick={(ret) => setSelectedReturn(ret)}
        emptyTitle="No Return Records Found"
      />

      <Pagination
        currentPage={page}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.total || returns.length}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      {/* Return Details Drawer */}
      <Drawer
        isOpen={Boolean(selectedReturn)}
        onClose={() => setSelectedReturn(null)}
        title={selectedReturn?.return_number || `RMA #${selectedReturn?.return_id || selectedReturn?.id}`}
        subtitle={`Sales Order: ${selectedReturn?.sales_orders?.order_number || selectedReturn?.order_number || `Order #${selectedReturn?.sales_order_id}`}`}
      >
        {selectedReturn && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Status</span>
                <StatusBadge status={selectedReturn.status || 'REQUESTED'} />
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                <strong>Reason:</strong> {selectedReturn.reason || 'Customer return'}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                <strong>Return Type:</strong> {selectedReturn.return_type || 'CUSTOMER_RETURN'}
              </div>
            </div>

            {/* Operational Actions */}
            <div style={{ padding: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                RMA Workflow Actions
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
                      Approve RMA
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={XCircle}
                      loading={actionLoading}
                      onClick={() => handleAction('REJECT')}
                    >
                      Reject RMA
                    </Button>
                  </>
                )}

                {currentStatus === 'APPROVED' && (
                  <Button
                    variant="success"
                    size="sm"
                    icon={PackageCheck}
                    loading={actionLoading}
                    onClick={() => handleAction('RECEIVE')}
                  >
                    Receive Return & Restock
                  </Button>
                )}

                {['RECEIVED', 'REFUNDED', 'COMPLETED', 'REJECTED'].includes(currentStatus) && (
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    RMA is in terminal state ({currentStatus}).
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            {(selectedReturn.items || selectedReturn.return_items) && (selectedReturn.items || selectedReturn.return_items).length > 0 && (
              <div>
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Returned Items</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(selectedReturn.items || selectedReturn.return_items).map((item, idx) => (
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
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                          {item.products?.name || item.product_name || `Product #${item.product_id}`}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                          Condition: {item.condition || 'PENDING_INSPECTION'}
                        </div>
                      </div>
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

      {/* Create RMA Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => !createSubmitting && setIsCreateOpen(false)}
        title="Create Return Authorization (RMA)"
        subtitle="Authorize an inbound customer return with inspection workflow."
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
              Issue RMA
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Select
            label="Original Sales Order"
            required
            value={newReturn.sales_order_id}
            onChange={(e) => setNewReturn({ ...newReturn, sales_order_id: e.target.value })}
            options={orders.map((o) => ({
              value: o.sales_order_id || o.id,
              label: `${o.order_number || `ORD-${o.sales_order_id || o.id}`} (${o.customers?.name || 'Customer'})`
            }))}
          />

          <Input
            label="Return Reason"
            required
            value={newReturn.reason}
            onChange={(e) => setNewReturn({ ...newReturn, reason: e.target.value })}
            placeholder="e.g. Defective component / Damaged packaging"
          />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                RMA Items
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
              {newReturn.items.map((item, idx) => (
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
                    value={item.requested_quantity}
                    onChange={(e) => updateItemRow(idx, 'requested_quantity', Number(e.target.value))}
                    placeholder="Qty"
                  />

                  <Select
                    value={item.condition}
                    onChange={(e) => updateItemRow(idx, 'condition', e.target.value)}
                    options={[
                      { value: 'PENDING_INSPECTION', label: 'Pending Inspection' },
                      { value: 'RESTOCKABLE', label: 'Restockable / Good' },
                      { value: 'DAMAGED', label: 'Damaged' },
                      { value: 'SCRAP', label: 'Scrap / Unusable' }
                    ]}
                  />

                  {newReturn.items.length > 1 && (
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

export default ReturnsPage;
