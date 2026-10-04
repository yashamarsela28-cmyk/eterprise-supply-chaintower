import apiClient from './apiClient';

/**
 * Dashboard API Service
 */
export const getDashboardMetrics = () => apiClient.get('/dashboard');
export const getDashboardSummary = () => apiClient.get('/dashboard');
export const healthCheck = () => apiClient.get('/health');

export const dashboardService = {
  getDashboardMetrics,
  getDashboardSummary,
  healthCheck
};

export default dashboardService;
