import apiClient from './apiClient';

/**
 * Suppliers API Service
 */
export const getSuppliers = (params) => apiClient.get('/suppliers', params);
export const getSupplierById = (supplierId) => apiClient.get(`/suppliers/${supplierId}`);

export const supplierService = {
  getSuppliers,
  getSupplierById
};

export default supplierService;
