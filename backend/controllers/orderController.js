const { getOrders, getOrderById, createOrder, updateOrderStatus } = require("../services/orderService");
const { parsePagination, buildPaginationMeta, parseStatus, parseSearch } = require("../utils/queryHelpers");

/**
 * GET /api/orders
 */
async function getAllOrders(req, res) {
    try {
        const { page, limit, offset } = parsePagination(req.query);
        const status = parseStatus(req.query);
        const search = parseSearch(req.query);

        const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

        const options = isPaginated ? { limit, offset, status, search } : { status, search };
        const result = await getOrders(options);

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
        console.error("Orders endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch orders data"
        });
    }
}

/**
 * GET /api/orders/:orderId
 */
async function getOrder(req, res) {
    const orderId = Number(req.params.orderId);

    if (!Number.isInteger(orderId) || orderId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid order ID"
        });
    }

    try {
        const data = await getOrderById(orderId);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (err) {
        console.error("Order by ID endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch order data"
        });
    }
}

/**
 * POST /api/orders
 */
async function createNewOrder(req, res) {
    try {
        const { customer_id, warehouse_id, items, shipping_cost, tax_amount, discount_amount, shipping_address, notes } = req.body;
        const newOrder = await createOrder({
            customer_id,
            warehouse_id,
            items,
            shipping_cost,
            tax_amount,
            discount_amount,
            shipping_address,
            notes
        });

        res.status(201).json({
            success: true,
            message: "Sales order created successfully",
            data: newOrder
        });
    } catch (err) {
        console.error("Create order endpoint error:", err.message);
        const status = err.statusCode || 500;
        res.status(status).json({
            success: false,
            message: err.message || "Failed to create sales order"
        });
    }
}

/**
 * PATCH /api/orders/:orderId/status
 */
async function changeOrderStatus(req, res) {
    const orderId = Number(req.params.orderId);
    const { status, reason } = req.body;

    if (!Number.isInteger(orderId) || orderId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid order ID"
        });
    }

    if (!status) {
        return res.status(400).json({
            success: false,
            message: "status field is required"
        });
    }

    try {
        const updated = await updateOrderStatus(orderId, status, reason);
        res.json({
            success: true,
            message: `Order status transitioned to ${status.toUpperCase()}`,
            data: updated
        });
    } catch (err) {
        console.error("Update order status endpoint error:", err.message);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: err.message || "Failed to update order status"
        });
    }
}

/**
 * PATCH /api/orders/:orderId/confirm
 */
async function confirmOrder(req, res) {
    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId < 1) {
        return res.status(400).json({ success: false, message: "Invalid order ID" });
    }
    try {
        const updated = await updateOrderStatus(orderId, "CONFIRMED", req.body?.reason);
        res.json({ success: true, message: "Order confirmed successfully", data: updated });
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
}

/**
 * PATCH /api/orders/:orderId/cancel
 */
async function cancelOrder(req, res) {
    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId) || orderId < 1) {
        return res.status(400).json({ success: false, message: "Invalid order ID" });
    }
    try {
        const updated = await updateOrderStatus(orderId, "CANCELLED", req.body?.reason);
        res.json({ success: true, message: "Order cancelled successfully", data: updated });
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getAllOrders,
    getOrderById: getOrder,
    createNewOrder,
    changeOrderStatus,
    confirmOrder,
    cancelOrder
};
