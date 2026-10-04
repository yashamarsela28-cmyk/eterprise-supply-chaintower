import apiClient from './apiClient';

/**
 * Invoices API Service
 * Supports fetching, creating, and updating invoice status.
 */
export const getInvoices = (params) => apiClient.get('/invoices', params);
export const getInvoiceById = (invoiceId) => apiClient.get(`/invoices/${invoiceId}`);
export const createInvoice = (invoiceData) => apiClient.post('/invoices', invoiceData);
export const updateInvoiceStatus = (invoiceId, statusData) => apiClient.patch(`/invoices/${invoiceId}/status`, typeof statusData === 'string' ? { status: statusData } : statusData);

export const invoiceService = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoiceStatus
};

export default invoiceService;
