import React, { useState, useEffect, useMemo } from 'react';
import { RotateCcw, RefreshCw, Plus, CheckCircle, PackageCheck, XCircle } from 'lucide-react';
import { useApiQuery } from '../hooks/useApiQuery';
import { usePagination } from '../hooks/usePagination';
import * as returnService from '../services/returnService';
import * as orderService from '../services/orderService';
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

  const { data: rawData, loading, error, refetch } = useApiQuery(
    returnService.getReturns,
    { page, limit, search, status: statusFilter },
    { immediate: true }
  );

  const returns = useMemo(() => normalizeList(rawData), [rawData]);
  const pagination = useMemo(() => normalizePagination(rawData, returns, page, limit), [rawData, returns, page, limit]);

  // Compute live summary stats
  const summaryStats = useMemo(() => {
    let pendingApproval = 0;
    let inspectingRestocked = 0;
    let completedRefunded = 0;

    returns.forEach((r) => {
      const st = (r.status || '').toUpperCase();
      if (st === 'REQUESTED' || st === 'PENDING') pendingApproval += 1;
      if (st === 'APPROVED' || st === 'RECEIVED' || st === 'INSPECTING') inspectingRestocked += 1;
      if (st === 'REFUNDED' || st === 'COMPLETED') completedRefunded += 1;
    });

    return {
      total: pagination.total || returns.length,
      pending: pendingApproval,
      inProcess: inspectingRestocked,
      completed: completedRefunded
    };
  }, [returns, pagination.total]);

  useEffect(() => {
    if (isCreateOpen) {
      Promise.all([
        orderService.getOrders({ limit: 50 }).catch(() => ({ data: [] })),
        productService.getProducts({ limit: 50 }).catch(() => ({ data: [] }))
      ]).then(([ordRes, prodRes]) => {
        const ords = normalizeList(ordRes);
        const prods = normalizeList(prodRes);
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

  // Status Action Handler
  const handleAction = async (actionType) => {
    if (!selectedReturn) return;
    const returnId = selectedReturn.return_id || selectedReturn.id;
    setActionLoading(true);

    try {
      let res;
      if (actionType === 'APPROVE') {
        res = await returnService.approveReturn(returnId);
        toast.success(`RMA #${selectedReturn.return_number || returnId} approved for intake`);
      } else if (actionType === 'RECEIVE') {
        res = await returnService.receiveReturn(returnId);
        toast.success(`RMA #${selectedReturn.return_number || returnId} received and inventory updated`);
      } else if (actionType === 'REJECT') {
        res = await returnService.rejectReturn(returnId);
        toast.success(`RMA #${selectedReturn.return_number || returnId} rejected`);
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
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
            Authorized: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>{formatDate(r.created_at || r.return_date)}</span>
          </div>
        </div>
      )
    },
    {
      key: 'order_number',
      header: 'Original Order Ref',
      render: (r) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          {r.sales_orders?.order_number || r.order_number || `Order #${r.sales_order_id}`}
        </span>
      )
    },
    {
      key: 'reason',
      header: 'Discrepancy / RMA Reason',
      render: (r) => (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          {r.reason || 'Customer Return / Damaged'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Disposition State',
      render: (r) => <StatusBadge status={r.status || 'REQUESTED'} size="sm" />
    }
  ];

  const currentStatus = (selectedReturn?.status || '').toUpperCase();

  return (
    <div className="returns-page animate-fade-in">
      <PageHeader
        eyebrow="QUALITY // REVERSE LOGISTICS"
        title="Returns & RMA Dispositions"
        description="Customer return authorizations, warehouse QA inspection, salvage disposition, and credit reconciliations."
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={refetch}
            >
              Refresh RMAs
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
            Total RMAs Filed
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
            Dock QA / In Inspection
          </span>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-info-text)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(summaryStats.inProcess)}
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
            Resolved & Restocked
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
        searchPlaceholder="Filter by RMA number, reason, order ref..."
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
        emptyMessage="No reverse logistics RMA records matched your filter criteria."
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
            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>RMA State</span>
                <StatusBadge status={selectedReturn.status || 'REQUESTED'} size="sm" />
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Return Type:</span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{selectedReturn.return_type || 'CUSTOMER_RETURN'}</strong>
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '0.4rem', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.4rem' }}>
                <strong style={{ color: 'var(--color-text-muted)' }}>Reason:</strong> {selectedReturn.reason || 'Customer Return'}
              </div>
            </div>

            {/* Operational Actions */}
            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
                  Returned Line Items
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {(selectedReturn.items || selectedReturn.return_items).map((item, idx) => (
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
                          Condition: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>{item.condition || 'PENDING_INSPECTION'}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-danger-text)' }}>
                        -{item.requested_quantity || item.quantity} units
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

export default ReturnsPage;
