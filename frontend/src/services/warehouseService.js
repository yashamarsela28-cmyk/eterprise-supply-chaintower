import apiClient from './apiClient';

/**
 * Warehouses API Service
 */
export const getWarehouses = (params) => apiClient.get('/warehouses', params);
export const getWarehouseById = (warehouseId) => apiClient.get(`/warehouses/${warehouseId}`);

export const warehouseService = {
  getWarehouses,
  getWarehouseById
};

export default warehouseService;
