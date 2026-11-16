const {
    getShipments,
    getShipmentById,
    getShipmentTracking,
    createShipment,
    updateShipmentStatus,
    addTrackingEvent
} = require("../services/shipmentService");
const { parsePagination, buildPaginationMeta, parseStatus, parseSearch } = require("../utils/queryHelpers");
const { getWarehouseCoordinates, getDestinationCoordinates, buildRouteGeometry } = require("../services/geocodingService");

/**
 * GET /api/shipments
 * Returns all shipments with optional pagination, status filtering, and search.
 */
async function getAllShipments(req, res) {
    try {
        const { page, limit, offset } = parsePagination(req.query);
        const status = parseStatus(req.query);
        const search = parseSearch(req.query);

        const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

        const options = isPaginated ? { limit, offset, status, search } : { status, search };
        const result = await getShipments(options);

        if (isPaginated) {
            res.json({
                success: true,
                pagination: buildPaginationMeta(result.total, page, limit),
                data: result.items
            });
        } else {
            res.json({
                success: true,
                count: result.items.length,
                data: result.items
            });
        }
    } catch (err) {
        console.error("Shipments endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch shipments data"
        });
    }
}

/**
 * GET /api/shipments/:shipmentId
 * Returns a single shipment with its tracking history.
 */
async function getShipment(req, res) {
    const shipmentId = Number(req.params.shipmentId);

    if (!Number.isInteger(shipmentId) || shipmentId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid shipment ID"
        });
    }

    try {
        const data = await getShipmentById(shipmentId);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Shipment not found"
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (err) {
        console.error("Shipment by ID endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch shipment data"
        });
    }
}

/**
 * GET /api/shipments/:shipmentId/tracking
 * Returns tracking events for a specific shipment.
 */
async function getTracking(req, res) {
    const shipmentId = Number(req.params.shipmentId);

    if (!Number.isInteger(shipmentId) || shipmentId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid shipment ID"
        });
    }

    try {
        const data = await getShipmentTracking(shipmentId);

        if (data === null) {
            return res.status(404).json({
                success: false,
                message: "Shipment not found"
            });
        }

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (err) {
        console.error("Shipment tracking endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch tracking data"
        });
    }
}

/**
 * POST /api/shipments
 * Creates a new shipment.
 */
async function createNewShipment(req, res) {
    try {
        const shipment = await createShipment(req.body);
        res.status(201).json({
            success: true,
            message: "Shipment created successfully",
            data: shipment
        });
    } catch (err) {
        console.error("Create shipment error:", err.message);
        const status = err.statusCode || 500;
        res.status(status).json({
            success: false,
            message: err.message || "Failed to create shipment"
        });
    }
}

/**
 * PATCH /api/shipments/:shipmentId/status
 * Updates status and adds tracking event.
 */
async function changeShipmentStatus(req, res) {
    const shipmentId = Number(req.params.shipmentId);
    const { status, location, description } = req.body;

    if (!Number.isInteger(shipmentId) || shipmentId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid shipment ID"
        });
    }

    if (!status) {
        return res.status(400).json({
            success: false,
            message: "status field is required"
        });
    }

    try {
        const updated = await updateShipmentStatus(shipmentId, status, { location, description });
        res.json({
            success: true,
            message: `Shipment transitioned to ${status.toUpperCase()}`,
            data: updated
        });
    } catch (err) {
        console.error("Update shipment status error:", err.message);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: err.message || "Failed to update shipment status"
        });
    }
}

/**
 * POST /api/shipments/:shipmentId/tracking
 * Adds a manual waypoint event.
 */
async function addTracking(req, res) {
    const shipmentId = Number(req.params.shipmentId);
    const { status, location, description } = req.body;

    if (!Number.isInteger(shipmentId) || shipmentId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid shipment ID"
        });
    }

    try {
        const event = await addTrackingEvent(shipmentId, { status, location, description });
        res.status(201).json({
            success: true,
            message: "Tracking event recorded",
            data: event
        });
    } catch (err) {
        console.error("Add tracking event error:", err.message);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: err.message || "Failed to record tracking event"
        });
    }
}

/**
 * GET /api/shipments/map-data
 * Returns every shipment with geospatial context. Records whose origin or
 * destination cannot be resolved are returned with a null coordinate rather
 * than being dropped or placed at an invented location.
 */
async function getMapData(req, res) {
    try {
        const { status, search } = req.query;
        const options = {};
        if (status) options.status = status;
        if (search) options.search = search;

        const result = await getShipments(options);
        const shipments = result.items || [];

        const warehouseCache = new Map();
        const resolveWarehouse = async (warehouse) => {
            if (!warehouse || !warehouse.warehouse_code) return null;
            if (warehouseCache.has(warehouse.warehouse_code)) return warehouseCache.get(warehouse.warehouse_code);
            const coords = await getWarehouseCoordinates({
                address: '',
                city: warehouse.warehouse_name
                    ? warehouse.warehouse_name.split(' ')[0]
                    : '',
                country: 'India'
            });
            const resolved = coords
                ? {
                    warehouse_id: warehouse.warehouse_id,
                    warehouse_code: warehouse.warehouse_code,
                    warehouse_name: warehouse.warehouse_name,
                    city: warehouse.warehouse_name ? warehouse.warehouse_name.split(' ')[0] : null,
                    country: 'India',
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    precision: coords.precision,
                    label: coords.label
                }
                : null;
            warehouseCache.set(warehouse.warehouse_code, resolved);
            return resolved;
        };

        const mapShipments = await Promise.all(
            shipments.map(async (shipment) => {
                const warehouseRef = {
                    warehouse_id: shipment.source_warehouse_id,
                    warehouse_code: shipment.warehouse_code,
                    warehouse_name: shipment.warehouse_name
                };

                const destCoords = await getDestinationCoordinates(
                    shipment.destination_address,
                    '',
                    'India'
                );

                // Origin city is embedded in the warehouse name (e.g. "Mumbai Central...").
                const origin = await resolveWarehouse(warehouseRef);

                const destination = destCoords
                    ? {
                        address: shipment.destination_address,
                        label: destCoords.label,
                        latitude: destCoords.latitude,
                        longitude: destCoords.longitude,
                        precision: destCoords.precision
                    }
                    : {
                        address: shipment.destination_address,
                        label: null,
                        latitude: null,
                        longitude: null,
                        precision: 'unavailable'
                    };

                const route =
                    origin && destination.latitude !== null
                        ? buildRouteGeometry(
                            origin.latitude,
                            origin.longitude,
                            destination.latitude,
                            destination.longitude
                        )
                        : null;

                const events = shipment.tracking_events || [];
                const shippedAt = shipment.shipped_at ? new Date(shipment.shipped_at).getTime() : null;
                const eta = shipment.estimated_delivery_date ? new Date(shipment.estimated_delivery_date).getTime() : null;
                const now = Date.now();
                const progress =
                    shipment.status === 'DELIVERED'
                        ? 100
                        : shippedAt && eta && eta > shippedAt
                            ? Math.max(0, Math.min(99, Math.round(((now - shippedAt) / (eta - shippedAt)) * 100)))
                            : shipment.status === 'IN_TRANSIT'
                                ? 55
                                : 0;

                return {
                    shipment_id: shipment.shipment_id,
                    shipment_number: shipment.shipment_number,
                    tracking_number: shipment.tracking_number,
                    status: shipment.status,
                    carrier_name: shipment.carrier_name,
                    shipping_method: shipment.shipping_method,
                    shipping_cost: shipment.shipping_cost,
                    customer_name: shipment.customer_name,
                    order_number: shipment.order_number,
                    vehicle_number: shipment.vehicle_number,
                    vehicle_type: shipment.vehicle_type,
                    driver_code: shipment.driver_code,
                    shipped_at: shipment.shipped_at,
                    estimated_delivery_date: shipment.estimated_delivery_date,
                    actual_delivery_date: shipment.actual_delivery_date,
                    origin,
                    destination,
                    route,
                    progress,
                    event_count: events.length,
                    tracking_events: events
                };
            })
        );

        const warehouseSet = new Map();
        mapShipments.forEach((s) => {
            if (s.origin) warehouseSet.set(s.origin.warehouse_id, s.origin);
        });

        res.json({
            success: true,
            count: mapShipments.length,
            data: {
                shipments: mapShipments,
                warehouses: Array.from(warehouseSet.values())
            }
        });
    } catch (err) {
        console.error("Map data endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch map data"
        });
    }
}

module.exports = {
    getAllShipments,
    getShipmentById: getShipment,
    getShipmentTracking: getTracking,
    createNewShipment,
    changeShipmentStatus,
    addTracking,
    getMapData

};
