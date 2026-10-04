import apiClient from './apiClient';

/**
 * Goods Receipts API Service
 * Supports fetching GRNs and receiving shipments against purchase orders with stock updates.
 */
export const getGoodsReceipts = (params) => apiClient.get('/goods-receipts', params);
export const getGoodsReceiptById = (grnId) => apiClient.get(`/goods-receipts/${grnId}`);
export const createGoodsReceipt = (grnData) => apiClient.post('/goods-receipts', grnData);

export const goodsReceiptService = {
  getGoodsReceipts,
  getGoodsReceiptById,
  createGoodsReceipt
};

export default goodsReceiptService;
