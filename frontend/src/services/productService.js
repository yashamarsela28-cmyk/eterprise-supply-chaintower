import apiClient from './apiClient';

/**
 * Products API Service
 */
export const getProducts = (params) => apiClient.get('/products', params);
export const getProductById = (productId) => apiClient.get(`/products/${productId}`);

export const productService = {
  getProducts,
  getProductById
};

export default productService;
