const {
    getPurchaseOrders,
    getPurchaseOrderById,
    createPurchaseOrder,
    updatePurchaseOrderStatus
} = require("../services/purchaseOrderService");
const { parsePagination, buildPaginationMeta, parseStatus, parseSearch } = require("../utils/queryHelpers");

/**
 * GET /api/purchase-orders
 */
async function getAllPurchaseOrders(req, res) {
    try {
        const { page, limit, offset } = parsePagination(req.query);
        const status = parseStatus(req.query);
        const search = parseSearch(req.query);

        const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

        const options = isPaginated ? { limit, offset, status, search } : { status, search };
        const result = await getPurchaseOrders(options);

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
        console.error("Purchase orders endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch purchase orders data"
        });
    }
}

/**
 * GET /api/purchase-orders/:purchaseOrderId
 */
async function getPO(req, res) {
    const poId = Number(req.params.purchaseOrderId);

    if (!Number.isInteger(poId) || poId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid purchase order ID"
        });
    }

    try {
        const data = await getPurchaseOrderById(poId);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Purchase order not found"
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (err) {
        console.error("PO by ID endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch purchase order data"
        });
    }
}

/**
 * POST /api/purchase-orders
 */
async function createPO(req, res) {
    try {
        const { supplier_id, warehouse_id, items, expected_delivery_date, notes, created_by, shipping_cost, tax_amount } = req.body;
        const newPO = await createPurchaseOrder({
            supplier_id,
            warehouse_id,
            items,
            expected_delivery_date,
            notes,
            created_by,
            shipping_cost,
            tax_amount
        });

        res.status(201).json({
            success: true,
            message: "Purchase order created successfully",
            data: newPO
        });
    } catch (err) {
        console.error("Create PO endpoint error:", err.message);
        const status = err.statusCode || 500;
        res.status(status).json({
            success: false,
            message: err.message || "Failed to create purchase order"
        });
    }
}

/**
 * PATCH /api/purchase-orders/:purchaseOrderId/status
 */
async function changePOStatus(req, res) {
    const poId = Number(req.params.purchaseOrderId);
    const { status } = req.body;

    if (!Number.isInteger(poId) || poId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid purchase order ID"
        });
    }

    if (!status) {
        return res.status(400).json({
            success: false,
            message: "status field is required"
        });
    }

    try {
        const updated = await updatePurchaseOrderStatus(poId, status);
        res.json({
            success: true,
            message: `Purchase order status transitioned to ${status.toUpperCase()}`,
            data: updated
        });
    } catch (err) {
        console.error("Update PO status endpoint error:", err.message);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: err.message || "Failed to update purchase order status"
        });
    }
}

/**
 * PATCH /api/purchase-orders/:purchaseOrderId/submit
 */
async function submitPO(req, res) {
    const poId = Number(req.params.purchaseOrderId);
    if (!Number.isInteger(poId) || poId < 1) {
        return res.status(400).json({ success: false, message: "Invalid purchase order ID" });
    }
    try {
        const updated = await updatePurchaseOrderStatus(poId, "SUBMITTED");
        res.json({ success: true, message: "Purchase order submitted successfully", data: updated });
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
}

/**
 * PATCH /api/purchase-orders/:purchaseOrderId/approve
 */
async function approvePO(req, res) {
    const poId = Number(req.params.purchaseOrderId);
    if (!Number.isInteger(poId) || poId < 1) {
        return res.status(400).json({ success: false, message: "Invalid purchase order ID" });
    }
    try {
        const updated = await updatePurchaseOrderStatus(poId, "APPROVED");
        res.json({ success: true, message: "Purchase order approved successfully", data: updated });
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
}

/**
 * PATCH /api/purchase-orders/:purchaseOrderId/cancel
 */
async function cancelPO(req, res) {
    const poId = Number(req.params.purchaseOrderId);
    if (!Number.isInteger(poId) || poId < 1) {
        return res.status(400).json({ success: false, message: "Invalid purchase order ID" });
    }
    try {
        const updated = await updatePurchaseOrderStatus(poId, "CANCELLED");
        res.json({ success: true, message: "Purchase order cancelled successfully", data: updated });
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getAllPurchaseOrders,
    getPurchaseOrderById: getPO,
    createPO,
    changePOStatus,
    submitPO,
    approvePO,
    cancelPO
};
