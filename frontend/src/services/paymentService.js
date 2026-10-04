import apiClient from './apiClient';

/**
 * Payments API Service
 * Supports fetching and recording new payments.
 */
export const getPayments = (params) => apiClient.get('/payments', params);
export const getPaymentById = (paymentId) => apiClient.get(`/payments/${paymentId}`);
export const recordPayment = (paymentData) => apiClient.post('/payments', paymentData);
export const createPayment = (paymentData) => apiClient.post('/payments', paymentData);

export const paymentService = {
  getPayments,
  getPaymentById,
  recordPayment,
  createPayment
};

export default paymentService;
