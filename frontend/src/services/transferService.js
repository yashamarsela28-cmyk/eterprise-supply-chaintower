import apiClient from './apiClient';

/**
 * Stock Transfers API Service
 * Supports fetching, requesting, approving, dispatching, and completing transfers.
 */
export const getTransfers = (params) => apiClient.get('/transfers', params);
export const getTransferById = (transferId) => apiClient.get(`/transfers/${transferId}`);
export const createTransfer = (transferData) => apiClient.post('/transfers', transferData);
export const updateTransferStatus = (transferId, statusData) => apiClient.patch(`/transfers/${transferId}/status`, typeof statusData === 'string' ? { status: statusData } : statusData);
export const approveTransfer = (transferId, options = {}) => apiClient.patch(`/transfers/${transferId}/approve`, options);
export const dispatchTransfer = (transferId, options = {}) => apiClient.patch(`/transfers/${transferId}/dispatch`, options);
export const receiveTransfer = (transferId, options = {}) => apiClient.patch(`/transfers/${transferId}/receive`, options);
export const cancelTransfer = (transferId, options = {}) => apiClient.patch(`/transfers/${transferId}/cancel`, options);

export const transferService = {
  getTransfers,
  getTransferById,
  createTransfer,
  updateTransferStatus,
  approveTransfer,
  dispatchTransfer,
  receiveTransfer,
  cancelTransfer
};

export default transferService;
