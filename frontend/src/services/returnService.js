import apiClient from './apiClient';

/**
 * Returns & RMA API Service
 * Supports fetching, creating, approving, receiving, and rejecting RMAs.
 */
export const getReturns = (params) => apiClient.get('/returns', params);
export const getReturnById = (returnId) => apiClient.get(`/returns/${returnId}`);
export const createReturn = (returnData) => apiClient.post('/returns', returnData);
export const updateReturnStatus = (returnId, statusData) => apiClient.patch(`/returns/${returnId}/status`, typeof statusData === 'string' ? { status: statusData } : statusData);
export const approveReturn = (returnId, options = {}) => apiClient.patch(`/returns/${returnId}/approve`, options);
export const receiveReturn = (returnId, options = {}) => apiClient.patch(`/returns/${returnId}/receive`, options);
export const rejectReturn = (returnId, options = {}) => apiClient.patch(`/returns/${returnId}/reject`, options);

export const returnService = {
  getReturns,
  getReturnById,
  createReturn,
  updateReturnStatus,
  approveReturn,
  receiveReturn,
  rejectReturn
};

export default returnService;
