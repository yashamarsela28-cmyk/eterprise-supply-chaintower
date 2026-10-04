import apiClient from './apiClient';

/**
 * Analytics API Service
 * Exposes endpoints matching the 11 Supabase views
 */
export const getControlTowerDashboard = () => apiClient.get('/analytics/dashboard');
export const getSupplyChainScorecard = () => apiClient.get('/analytics/scorecard');
export const getWarehouseKpis = () => apiClient.get('/analytics/warehouse-kpis');
export const getSupplierKpis = () => apiClient.get('/analytics/supplier-kpis');
export const getCustomerReceivablesKpis = () => apiClient.get('/analytics/customer-receivables');
export const getShipmentKpis = () => apiClient.get('/analytics/shipment-kpis');
export const getSupplyChainRiskKpis = () => apiClient.get('/analytics/risk');
export const getInventoryAgingKpis = () => apiClient.get('/analytics/inventory-aging');
export const getWarehouseUtilizationKpis = () => apiClient.get('/analytics/warehouse-utilization');
export const getPurchaseOrderPerformance = () => apiClient.get('/analytics/purchase-orders');
export const getReturnsQualityKpis = () => apiClient.get('/analytics/returns-quality');

export const analyticsService = {
  getDashboard: getControlTowerDashboard,
  getControlTowerDashboard,
  getScorecard: getSupplyChainScorecard,
  getSupplyChainScorecard,
  getWarehouseKpis,
  getSupplierKpis,
  getCustomerReceivables: getCustomerReceivablesKpis,
  getCustomerReceivablesKpis,
  getShipmentKpis,
  getRisk: getSupplyChainRiskKpis,
  getSupplyChainRiskKpis,
  getInventoryAging: getInventoryAgingKpis,
  getInventoryAgingKpis,
  getWarehouseUtilization: getWarehouseUtilizationKpis,
  getWarehouseUtilizationKpis,
  getPurchaseOrders: getPurchaseOrderPerformance,
  getPurchaseOrderPerformance,
  getReturnsQuality: getReturnsQualityKpis,
  getReturnsQualityKpis
};

export default analyticsService;
