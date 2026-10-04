const { getInventory, getInventoryByProductId, adjustInventory, reserveInventory } = require("../services/inventoryService");

/**
 * GET /api/inventory
 */
async function getAllInventory(req, res) {
    try {
        const items = await getInventory();
        res.json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (err) {
        console.error("Inventory endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch inventory data"
        });
    }
}

/**
 * GET /api/inventory/:productId
 */
async function getProductInventory(req, res) {
    const productId = Number(req.params.productId);

    if (!Number.isInteger(productId) || productId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid product ID"
        });
    }

    try {
        const items = await getInventoryByProductId(productId);

        if (!items || items.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No inventory found for this product"
            });
        }

        res.json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (err) {
        console.error("Product inventory endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch product inventory data"
        });
    }
}

/**
 * POST /api/inventory/adjust or /api/inventory/:inventoryId/adjust
 */
async function adjustStock(req, res) {
    try {
        const inventory_id = req.params.inventoryId || req.body.inventory_id;
        const adjustment_quantity = req.body.adjustment_quantity !== undefined ? req.body.adjustment_quantity : req.body.quantity_change;
        const { reason, notes, performed_by } = req.body;

        const updated = await adjustInventory({
            inventory_id,
            adjustment_quantity,
            reason,
            notes,
            performed_by
        });

        res.json({
            success: true,
            message: "Inventory stock adjusted successfully",
            data: updated
        });
    } catch (err) {
        console.error("Adjust stock endpoint error:", err.message);
        const status = err.statusCode || 500;
        res.status(status).json({
            success: false,
            message: err.message || "Failed to adjust inventory stock"
        });
    }
}

/**
 * POST /api/inventory/reserve or /api/inventory/:inventoryId/reserve
 */
async function reserveStock(req, res) {
    try {
        const inventory_id = req.params.inventoryId || req.body.inventory_id;
        const quantity = req.body.quantity !== undefined ? req.body.quantity : req.body.quantity_to_reserve;
        const { reference_type, reference_id } = req.body;

        const result = await reserveInventory({
            inventory_id,
            quantity,
            reference_type,
            reference_id
        });

        res.json({
            success: true,
            message: "Stock reserved successfully",
            data: result
        });
    } catch (err) {
        console.error("Reserve stock endpoint error:", err.message);
        const status = err.statusCode || 500;
        res.status(status).json({
            success: false,
            message: err.message || "Failed to reserve stock"
        });
    }
}

module.exports = {
    getAllInventory,
    getProductInventory,
    adjustStock,
    reserveStock
};
