const supabase = require("../config/supabase");

const SHIPMENT_SELECT = `
    shipment_id,
    shipment_number,
    sales_order_id,
    source_warehouse_id,
    destination_address,
    vehicle_id,
    driver_id,
    tracking_number,
    carrier_name,
    shipping_method,
    shipped_at,
    estimated_delivery_date,
    actual_delivery_date,
    status,
    shipping_cost,
    sales_orders (
        sales_order_id,
        order_number,
        customer_id,
        status,
        customers (
            customer_id,
            customer_code,
            customer_name,
            email,
            phone
        )
    ),
    warehouses:source_warehouse_id (
        warehouse_id,
        warehouse_code,
        warehouse_name
    ),
    vehicles (
        vehicle_id,
        vehicle_number,
        vehicle_type
    ),
    drivers (
        driver_id,
        driver_code,
        phone
    ),
    shipment_tracking (
        tracking_event_id,
        shipment_id,
        status,
        location,
        description,
        event_time,
        recorded_by
    )
`;

const VALID_SHIPMENT_TRANSITIONS = {
    CREATED: ["READY", "IN_TRANSIT", "CANCELLED"],
    READY: ["IN_TRANSIT", "CANCELLED"],
    IN_TRANSIT: ["DELIVERED", "RETURNED", "CANCELLED"],
    DELIVERED: ["RETURNED"],
    RETURNED: [],
    CANCELLED: []
};

/**
 * Format a tracking event row.
 */
function formatTrackingEvent(event) {
    return {
        tracking_event_id: event.tracking_event_id,
        shipment_id: event.shipment_id,
        status: event.status,
        location: event.location,
        description: event.description,
        event_time: event.event_time,
        recorded_by: event.recorded_by
    };
}

/**
 * Format a complete shipment record.
 */
function formatShipment(row) {
    const customer = row.sales_orders?.customers || null;
    const warehouse = row.warehouses || null;
    const vehicle = row.vehicles || null;
    const driver = row.drivers || null;

    return {
        shipment_id: row.shipment_id,
        shipment_number: row.shipment_number,
        sales_order_id: row.sales_order_id,
        order_number: row.sales_orders?.order_number || null,
        order_status: row.sales_orders?.status || null,
        customer_id: customer?.customer_id || row.sales_orders?.customer_id || null,
        customer_name: customer?.customer_name || null,
        customer_code: customer?.customer_code || null,
        customer_email: customer?.email || null,
        customer_phone: customer?.phone || null,
        source_warehouse_id: row.source_warehouse_id,
        warehouse_code: warehouse?.warehouse_code || null,
        warehouse_name: warehouse?.warehouse_name || null,
        destination_address: row.destination_address,
        vehicle_id: row.vehicle_id,
        vehicle_number: vehicle?.vehicle_number || null,
        vehicle_type: vehicle?.vehicle_type || null,
        driver_id: row.driver_id,
        driver_code: driver?.driver_code || null,
        driver_phone: driver?.phone || null,
        tracking_number: row.tracking_number,
        carrier_name: row.carrier_name,
        shipping_method: row.shipping_method,
        shipped_at: row.shipped_at,
        estimated_delivery_date: row.estimated_delivery_date,
        actual_delivery_date: row.actual_delivery_date,
        status: row.status,
        shipping_cost: row.shipping_cost,
        tracking_events: Array.isArray(row.shipment_tracking)
            ? row.shipment_tracking
                .slice()
                .sort((a, b) => new Date(a.event_time) - new Date(b.event_time))
                .map(formatTrackingEvent)
            : []
    };
}

/**
 * Fetch all shipments with related order, warehouse, vehicle, driver, and tracking events.
 */
async function getShipments(options = {}) {
    const { limit, offset, status, search } = options;

    let query = supabase
        .from("shipments")
        .select(SHIPMENT_SELECT, { count: "exact" });

    if (status) {
        query = query.eq("status", status.toUpperCase());
    }

    if (search) {
        query = query.or(`shipment_number.ilike.%${search}%,tracking_number.ilike.%${search}%,carrier_name.ilike.%${search}%`);
    }

    if (limit !== undefined && offset !== undefined) {
        query = query.range(offset, offset + limit - 1);
    }

    query = query.order("shipment_id", { ascending: true });

    const { data, error, count } = await query;

    if (error) {
        throw new Error(`Shipments query failed: ${error.message}`);
    }

    return {
        items: (data || []).map(formatShipment),
        total: count || 0
    };
}

/**
 * Fetch a single shipment by ID with its tracking history.
 */
async function getShipmentById(shipmentId) {
    const { data, error } = await supabase
        .from("shipments")
        .select(SHIPMENT_SELECT)
        .eq("shipment_id", Number(shipmentId))
        .maybeSingle();

    if (error) {
        throw new Error(`Shipment query failed: ${error.message}`);
    }

    return data ? formatShipment(data) : null;
}

/**
 * Fetch tracking events for a single shipment.
 */
async function getShipmentTracking(shipmentId) {
    const { data: shipment, error: shipmentError } = await supabase
        .from("shipments")
        .select("shipment_id")
        .eq("shipment_id", Number(shipmentId))
        .maybeSingle();

    if (shipmentError) {
        throw new Error(`Shipment verification query failed: ${shipmentError.message}`);
    }

    if (!shipment) {
        return null;
    }

    const { data: events, error: trackingError } = await supabase
        .from("shipment_tracking")
        .select("tracking_event_id, shipment_id, status, location, description, event_time, recorded_by")
        .eq("shipment_id", Number(shipmentId))
        .order("event_time", { ascending: true });

    if (trackingError) {
        throw new Error(`Tracking query failed: ${trackingError.message}`);
    }

    return (events || []).map(formatTrackingEvent);
}

/**
 * Create a new shipment.
 */
async function createShipment(params) {
    const {
        sales_order_id,
        source_warehouse_id,
        destination_address,
        carrier_name = "Apex Logistics",
        shipping_method = "Standard Ground",
        vehicle_id,
        driver_id,
        shipping_cost = 0,
        estimated_delivery_date
    } = params;

    if (!sales_order_id || isNaN(Number(sales_order_id))) {
        const err = new Error("Valid sales_order_id is required");
        err.statusCode = 400;
        throw err;
    }
    if (!source_warehouse_id || isNaN(Number(source_warehouse_id))) {
        const err = new Error("Valid source_warehouse_id is required");
        err.statusCode = 400;
        throw err;
    }
    if (!destination_address || typeof destination_address !== "string") {
        const err = new Error("destination_address is required");
        err.statusCode = 400;
        throw err;
    }

    // Verify sales order exists
    const { data: order, error: ordErr } = await supabase
        .from("sales_orders")
        .select("sales_order_id, status")
        .eq("sales_order_id", Number(sales_order_id))
        .maybeSingle();

    if (ordErr || !order) {
        const err = new Error(`Sales order #${sales_order_id} not found`);
        err.statusCode = 404;
        throw err;
    }

    const shipmentNumber = `SHP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const trackingNumber = `TRK-${Date.now().toString().slice(-8)}`;
    const now = new Date().toISOString();
    const normMethod = (shipping_method || "STANDARD").toUpperCase().includes("EXP")
        ? "EXPRESS"
        : ((shipping_method || "STANDARD").toUpperCase().includes("SAME") ? "SAME_DAY" : "STANDARD");

    const { data: shipmentData, error: insertErr } = await supabase
        .from("shipments")
        .insert({
            shipment_number: shipmentNumber,
            sales_order_id: Number(sales_order_id),
            source_warehouse_id: Number(source_warehouse_id),
            destination_address,
            carrier_name,
            shipping_method: normMethod,
            vehicle_id: vehicle_id ? Number(vehicle_id) : null,
            driver_id: driver_id ? Number(driver_id) : null,
            tracking_number: trackingNumber,
            shipping_cost: Number(shipping_cost) || 0,
            estimated_delivery_date: estimated_delivery_date || new Date(Date.now() + 3 * 86400000).toISOString(),
            status: "CREATED"
        })
        .select("shipment_id")
        .single();

    if (insertErr) {
        throw new Error(`Failed to create shipment: ${insertErr.message}`);
    }

    const shipmentId = shipmentData.shipment_id;

    // Initial tracking event
    await supabase
        .from("shipment_tracking")
        .insert({
            shipment_id: shipmentId,
            status: "CREATED",
            location: "Origin Warehouse",
            description: "Shipment record created in system",
            event_time: now,
            recorded_by: 1
        });

    return getShipmentById(shipmentId);
}

/**
 * Update shipment status and create a tracking event.
 */
async function updateShipmentStatus(shipmentId, newStatus, trackingInfo = {}) {
    if (!shipmentId || isNaN(Number(shipmentId))) {
        const err = new Error("Valid shipmentId is required");
        err.statusCode = 400;
        throw err;
    }

    const upperStatus = String(newStatus).toUpperCase();
    const current = await getShipmentById(Number(shipmentId));

    if (!current) {
        const err = new Error(`Shipment #${shipmentId} not found`);
        err.statusCode = 404;
        throw err;
    }

    const allowed = VALID_SHIPMENT_TRANSITIONS[current.status] || [];
    if (!allowed.includes(upperStatus)) {
        const err = new Error(`Invalid shipment status transition from '${current.status}' to '${upperStatus}'. Allowed transitions: ${allowed.join(", ") || "None"}`);
        err.statusCode = 400;
        throw err;
    }

    const now = new Date().toISOString();
    const updatePayload = {
        status: upperStatus
    };

    if (upperStatus === "IN_TRANSIT" && !current.shipped_at) {
        updatePayload.shipped_at = now;
    }
    if (upperStatus === "DELIVERED") {
        updatePayload.actual_delivery_date = now;
    }

    const { error: updateErr } = await supabase
        .from("shipments")
        .update(updatePayload)
        .eq("shipment_id", Number(shipmentId));

    if (updateErr) {
        throw new Error(`Failed to update shipment status: ${updateErr.message}`);
    }

    // Add tracking event
    await supabase
        .from("shipment_tracking")
        .insert({
            shipment_id: Number(shipmentId),
            status: upperStatus,
            location: trackingInfo.location || "Logistics Terminal",
            description: trackingInfo.description || `Shipment status transitioned to ${upperStatus}`,
            event_time: now,
            recorded_by: 1
        });

    // Synchronize sales order status if applicable
    if (current.sales_order_id) {
        if (upperStatus === "IN_TRANSIT") {
            await supabase
                .from("sales_orders")
                .update({ status: "SHIPPED" })
                .eq("sales_order_id", current.sales_order_id)
                .in("status", ["CONFIRMED", "ALLOCATED", "PROCESSING"]);
        } else if (upperStatus === "DELIVERED") {
            await supabase
                .from("sales_orders")
                .update({ status: "DELIVERED" })
                .eq("sales_order_id", current.sales_order_id)
                .in("status", ["SHIPPED", "PROCESSING", "ALLOCATED", "CONFIRMED"]);
        }
    }

    return getShipmentById(Number(shipmentId));
}

/**
 * Add a manual waypoint / tracking event to a shipment.
 */
async function addTrackingEvent(shipmentId, { status, location, description }) {
    if (!shipmentId || isNaN(Number(shipmentId))) {
        const err = new Error("Valid shipmentId is required");
        err.statusCode = 400;
        throw err;
    }

    const current = await getShipmentById(Number(shipmentId));
    if (!current) {
        const err = new Error(`Shipment #${shipmentId} not found`);
        err.statusCode = 404;
        throw err;
    }

    const now = new Date().toISOString();
    const eventStatus = (status || current.status).toUpperCase();

    const { data: event, error: insertErr } = await supabase
        .from("shipment_tracking")
        .insert({
            shipment_id: Number(shipmentId),
            status: eventStatus,
            location: location || "Waypoint Checkpoint",
            description: description || "In-transit telemetry update",
            event_time: now,
            recorded_by: 1
        })
        .select()
        .single();

    if (insertErr) {
        throw new Error(`Failed to add tracking event: ${insertErr.message}`);
    }

    return formatTrackingEvent(event);
}

module.exports = {
    getShipments,
    getShipmentById,
    getShipmentTracking,
    createShipment,
    updateShipmentStatus,
    addTrackingEvent,
    VALID_SHIPMENT_TRANSITIONS
};
