/**
 * Central API Client for Enterprise Supply Chain Control Tower
 * Communicates strictly with backend Express API at VITE_API_BASE_URL.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Standard API Error Class
 */
export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Build URL with serialized query parameters.
 * @param {string} endpoint
 * @param {Object} [params]
 */
function buildUrl(endpoint, params = {}) {
  // Ensure endpoint has leading slash
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(`${API_BASE_URL}${path}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, String(value));
    }
  });

  return url.toString();
}

/**
 * Core request dispatcher.
 * @param {string} endpoint
 * @param {Object} [options]
 */
async function request(endpoint, options = {}) {
  const { params, headers = {}, ...customConfig } = options;

  const url = buildUrl(endpoint, params);

  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers
    },
    ...customConfig
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (!response.ok) {
      const errorMessage = data?.message || `API request failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network / connection error
    throw new ApiError(
      error.message || 'Network error: Failed to connect to server',
      0,
      { originalError: error }
    );
  }
}

/**
 * API Client methods
 */
export const apiClient = {
  get: (endpoint, params, options) => request(endpoint, { ...options, method: 'GET', params }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
  getBaseUrl: () => API_BASE_URL
};

export default apiClient;
