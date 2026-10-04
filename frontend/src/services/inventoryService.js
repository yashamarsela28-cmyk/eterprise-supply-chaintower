import apiClient from './apiClient';

/**
 * Inventory API Service
 * Supports fetching inventory, adjusting stock levels, and reserving inventory.
 */
export const getInventory = (params) => apiClient.get('/inventory', params);
export const getInventoryById = (inventoryId) => apiClient.get(`/inventory/${inventoryId}`);
export const adjustStock = (inventoryIdOrData, payload) => {
  if (typeof inventoryIdOrData === 'object' && inventoryIdOrData !== null) {
    return apiClient.post('/inventory/adjust', inventoryIdOrData);
  }
  return apiClient.post(`/inventory/${inventoryIdOrData}/adjust`, payload);
};
export const adjustStockById = (inventoryId, adjustmentData) => apiClient.post(`/inventory/${inventoryId}/adjust`, adjustmentData);
export const reserveStock = (inventoryIdOrData, payload) => {
  if (typeof inventoryIdOrData === 'object' && inventoryIdOrData !== null) {
    return apiClient.post('/inventory/reserve', inventoryIdOrData);
  }
  return apiClient.post(`/inventory/${inventoryIdOrData}/reserve`, payload);
};
export const reserveStockById = (inventoryId, reservationData) => apiClient.post(`/inventory/${inventoryId}/reserve`, reservationData);

export const inventoryService = {
  getInventory,
  getInventoryById,
  adjustStock,
  adjustStockById,
  reserveStock,
  reserveStockById
};

export default inventoryService;
