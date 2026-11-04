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
 * Returns shipment data optimized for map visualization with geocoded coordinates
 */
async function getMapData(req, res) {
    try {
        const { status, search } = req.query;
        const options = { status, search };

        const result = await getShipments(options);
        const shipments = result.items || [];

        // Geocode origins and destinations in parallel
        const mapShipments = await Promise.all(
            shipments.map(async (shipment) => {
                try {
                    // Get warehouse (origin) coordinates
                    const warehouse = shipment.warehouses || {};
                    const originCoords = await getWarehouseCoordinates(warehouse);

                    // Get destination coordinates
                    const destCoords = await getDestinationCoordinates(
                        shipment.destination_address,
                        '',
                        ''
                    );

                    if (originCoords && destCoords) {
                        return {
                            shipment_id: shipment.shipment_id,
                            tracking_number: shipment.tracking_number,
                            status: shipment.status,
                            carrier_name: shipment.carrier_name,
                            shipping_method: shipment.shipping_method,
                            estimated_delivery_date: shipment.estimated_delivery_date,
                            origin: {
                                warehouse_id: warehouse.warehouse_id,
                                warehouse_name: warehouse.warehouse_name,
                                city: warehouse.city,
                                country: warehouse.country,
                                latitude: originCoords.latitude,
                                longitude: originCoords.longitude
                            },
                            destination: {
                                address: shipment.destination_address,
                                latitude: destCoords.latitude,
                                longitude: destCoords.longitude
                            },
                            route: buildRouteGeometry(
                                originCoords.latitude,
                                originCoords.longitude,
                                destCoords.latitude,
                                destCoords.longitude
                            ),
                            tracking_events: shipment.tracking_events || []
                        };
                    }
                    return null;
                } catch (err) {
                    console.error(`Geocoding error for shipment ${shipment.shipment_id}:`, err.message);
                    return null;
                }
            })
        );

        // Filter out failed geocodings
        const validMapShipments = mapShipments.filter(Boolean);

        // Extract unique warehouses
        const warehouseSet = new Map();
        validMapShipments.forEach(s => {
            if (s.origin) {
                const key = s.origin.warehouse_id;
                warehouseSet.set(key, s.origin);
            }
        });

        res.json({
            success: true,
            count: validMapShipments.length,
            data: {
                shipments: validMapShipments,
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
