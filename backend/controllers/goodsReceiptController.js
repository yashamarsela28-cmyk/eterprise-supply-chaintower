const { getGoodsReceipts, getGoodsReceiptById, createGoodsReceipt } = require("../services/goodsReceiptService");

/**
 * GET /api/goods-receipts
 * Returns list of goods receipts.
 */
async function getAllGoodsReceipts(req, res) {
    try {
        const data = await getGoodsReceipts();

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (err) {
        console.error("Goods receipts endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch goods receipts data"
        });
    }
}

/**
 * GET /api/goods-receipts/:receiptId
 * Returns goods receipt details by ID.
 */
async function getGoodsReceipt(req, res) {
    const receiptId = Number(req.params.receiptId);

    if (!Number.isInteger(receiptId) || receiptId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid goods receipt ID"
        });
    }

    try {
        const data = await getGoodsReceiptById(receiptId);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Goods receipt not found"
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (err) {
        console.error("Goods receipt by ID endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch goods receipt data"
        });
    }
}

/**
 * POST /api/goods-receipts
 * Creates a goods receipt against a PO, updating inventory and PO status.
 */
async function createReceipt(req, res) {
    try {
        const receipt = await createGoodsReceipt(req.body);
        res.status(201).json({
            success: true,
            message: "Goods receipt processed successfully",
            data: receipt
        });
    } catch (err) {
        console.error("Create goods receipt error:", err.message);
        const status = err.statusCode || 500;
        res.status(status).json({
            success: false,
            message: err.message || "Failed to process goods receipt"
        });
    }
}

module.exports = {
    getAllGoodsReceipts,
    getGoodsReceiptById: getGoodsReceipt,
    createReceipt
};
