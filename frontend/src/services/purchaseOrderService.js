import apiClient from './apiClient';

/**
 * Purchase Orders API Service
 * Supports fetching, creating, submitting, approving, and updating PO status.
 */
export const getPurchaseOrders = (params) => apiClient.get('/purchase-orders', params);
export const getPurchaseOrderById = (poId) => apiClient.get(`/purchase-orders/${poId}`);
export const createPurchaseOrder = (poData) => apiClient.post('/purchase-orders', poData);
export const updatePurchaseOrderStatus = (poId, status) => apiClient.patch(`/purchase-orders/${poId}/status`, { status });
export const submitPurchaseOrder = (poId) => apiClient.patch(`/purchase-orders/${poId}/submit`);
export const approvePurchaseOrder = (poId) => apiClient.patch(`/purchase-orders/${poId}/approve`);
export const cancelPurchaseOrder = (poId) => apiClient.patch(`/purchase-orders/${poId}/cancel`);

export const purchaseOrderService = {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  submitPurchaseOrder,
  approvePurchaseOrder,
  cancelPurchaseOrder
};

export default purchaseOrderService;
