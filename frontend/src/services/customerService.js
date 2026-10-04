import apiClient from './apiClient';

/**
 * Customers API Service
 */
export const getCustomers = (params) => apiClient.get('/customers', params);
export const getCustomerById = (customerId) => apiClient.get(`/customers/${customerId}`);

export const customerService = {
  getCustomers,
  getCustomerById
};

export default customerService;
