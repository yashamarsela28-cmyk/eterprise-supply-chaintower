import apiClient from './apiClient';

/**
 * Sales Orders API Service
 * Supports fetching, creating, confirming, allocating, cancelling, and updating order status.
 */
export const getOrders = (params) => apiClient.get('/orders', params);
export const getOrderById = (orderId) => apiClient.get(`/orders/${orderId}`);
export const createOrder = (orderData) => apiClient.post('/orders', orderData);
export const updateOrderStatus = (orderId, status) => apiClient.patch(`/orders/${orderId}/status`, { status });
export const confirmOrder = (orderId) => apiClient.patch(`/orders/${orderId}/confirm`);
export const allocateOrder = (orderId) => apiClient.patch(`/orders/${orderId}/status`, { status: 'ALLOCATED' });
export const cancelOrder = (orderId) => apiClient.patch(`/orders/${orderId}/cancel`);

export const orderService = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  confirmOrder,
  allocateOrder,
  cancelOrder
};

export default orderService;
