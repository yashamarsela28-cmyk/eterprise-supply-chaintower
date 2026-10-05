/**
 * Enterprise API Response Normalization Utility
 * Guarantees safe data extraction whether data is enveloped ({ data: [...] }) or direct array ([...])
 */

/**
 * Extract array collection safely from any response shape.
 * @param {any} response
 * @param {Array} fallback
 * @returns {Array}
 */
export function normalizeList(response, fallback = []) {
  if (!response) return fallback;
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.items)) return response.items;
  return fallback;
}

/**
 * Extract single object record or summary safely from any response shape.
 * @param {any} response
 * @param {Object} fallback
 * @returns {Object}
 */
export function normalizeObject(response, fallback = {}) {
  if (!response) return fallback;
  if (typeof response !== 'object') return fallback;
  if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
    return response.data;
  }
  return response;
}

/**
 * Extract pagination metadata safely.
 * @param {any} response
 * @param {Array} items
 * @param {number} page
 * @param {number} limit
 * @returns {Object}
 */
export function normalizePagination(response, items = [], page = 1, limit = 20) {
  const totalItems = response?.pagination?.total || response?.count || items.length;
  const currentPage = Number(response?.pagination?.page || page || 1);
  const currentLimit = Number(response?.pagination?.limit || limit || 20);
  const totalPages = response?.pagination?.totalPages || Math.ceil(totalItems / currentLimit) || 1;

  return {
    total: totalItems,
    page: currentPage,
    limit: currentLimit,
    totalPages
  };
}
