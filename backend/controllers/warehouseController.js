const { getWarehouses, getWarehouseById } = require("../services/warehouseService");

/**
 * GET /api/warehouses
 * Returns list of warehouses.
 */
async function getAllWarehouses(req, res) {
    try {
        const data = await getWarehouses();

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (err) {
        console.error("Warehouses endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch warehouses data"
        });
    }
}

/**
 * GET /api/warehouses/:warehouseId
 * Returns warehouse details by ID.
 */
async function getWarehouse(req, res) {
    const warehouseId = Number(req.params.warehouseId);

    if (!Number.isInteger(warehouseId) || warehouseId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid warehouse ID"
        });
    }

    try {
        const data = await getWarehouseById(warehouseId);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Warehouse not found"
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (err) {
        console.error("Warehouse by ID endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch warehouse data"
        });
    }
}

module.exports = { getAllWarehouses, getWarehouseById: getWarehouse };
