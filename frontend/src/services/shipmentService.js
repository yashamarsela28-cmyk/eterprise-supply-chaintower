import apiClient from './apiClient';

/**
 * Shipments API Service
 * Supports fetching, creating, updating shipment status, and dispatching waypoints.
 */
export const getShipments = (params) => apiClient.get('/shipments', params);
export const getShipmentById = (shipmentId) => apiClient.get(`/shipments/${shipmentId}`);
export const getShipmentTracking = (shipmentId) => apiClient.get(`/shipments/${shipmentId}/tracking`);
export const createShipment = (shipmentData) => apiClient.post('/shipments', shipmentData);
export const updateShipmentStatus = (shipmentId, statusData) => apiClient.patch(`/shipments/${shipmentId}/status`, typeof statusData === 'string' ? { status: statusData } : statusData);
export const addShipmentTracking = (shipmentId, trackingData) => apiClient.post(`/shipments/${shipmentId}/tracking`, trackingData);

export const shipmentService = {
  getShipments,
  getShipmentById,
  getShipmentTracking,
  createShipment,
  updateShipmentStatus,
  addShipmentTracking
};

export default shipmentService;
