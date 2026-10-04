const {
    getTransfers,
    getTransferById,
    createTransfer,
    updateTransferStatus
} = require("../services/transferService");
const { parsePagination, buildPaginationMeta, parseStatus, parseSearch } = require("../utils/queryHelpers");

/**
 * GET /api/transfers
 * Returns list of stock transfers with optional pagination and status filtering.
 */
async function getAllTransfers(req, res) {
    try {
        const { page, limit, offset } = parsePagination(req.query);
        const status = parseStatus(req.query);
        const search = parseSearch(req.query);

        const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

        const options = isPaginated ? { limit, offset, status, search } : { status, search };
        const result = await getTransfers(options);

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
        console.error("Transfers endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch transfers data"
        });
    }
}

/**
 * GET /api/transfers/:transferId
 * Returns stock transfer details by ID.
 */
async function getTransfer(req, res) {
    const transferId = Number(req.params.transferId);

    if (!Number.isInteger(transferId) || transferId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid transfer ID"
        });
    }

    try {
        const data = await getTransferById(transferId);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Transfer not found"
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (err) {
        console.error("Transfer by ID endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch transfer data"
        });
    }
}

/**
 * POST /api/transfers
 * Creates a new stock transfer request.
 */
async function createNewTransfer(req, res) {
    try {
        const transfer = await createTransfer(req.body);
        res.status(201).json({
            success: true,
            message: "Stock transfer request created successfully",
            data: transfer
        });
    } catch (err) {
        console.error("Create transfer error:", err.message);
        const status = err.statusCode || 500;
        res.status(status).json({
            success: false,
            message: err.message || "Failed to create transfer request"
        });
    }
}

/**
 * PATCH /api/transfers/:transferId/status
 * Updates transfer status (Approve, Ship, Complete, Cancel).
 */
async function changeTransferStatus(req, res) {
    const transferId = Number(req.params.transferId);
    const { status, approved_by, performed_by } = req.body;

    if (!Number.isInteger(transferId) || transferId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid transfer ID"
        });
    }

    if (!status) {
        return res.status(400).json({
            success: false,
            message: "status field is required"
        });
    }

    try {
        const updated = await updateTransferStatus(transferId, status, { approved_by, performed_by });
        res.json({
            success: true,
            message: `Transfer transitioned to ${status.toUpperCase()}`,
            data: updated
        });
    } catch (err) {
        console.error("Update transfer status error:", err.message);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: err.message || "Failed to update transfer status"
        });
    }
}

/**
 * PATCH /api/transfers/:transferId/approve
 */
async function approveTransfer(req, res) {
    const transferId = Number(req.params.transferId);
    if (!Number.isInteger(transferId) || transferId < 1) {
        return res.status(400).json({ success: false, message: "Invalid transfer ID" });
    }
    try {
        const updated = await updateTransferStatus(transferId, "APPROVED", req.body);
        res.json({ success: true, message: "Transfer approved successfully", data: updated });
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
}

/**
 * PATCH /api/transfers/:transferId/dispatch
 */
async function dispatchTransfer(req, res) {
    const transferId = Number(req.params.transferId);
    if (!Number.isInteger(transferId) || transferId < 1) {
        return res.status(400).json({ success: false, message: "Invalid transfer ID" });
    }
    try {
        const updated = await updateTransferStatus(transferId, "IN_TRANSIT", req.body);
        res.json({ success: true, message: "Transfer dispatched (in transit)", data: updated });
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
}

/**
 * PATCH /api/transfers/:transferId/receive
 */
async function receiveTransfer(req, res) {
    const transferId = Number(req.params.transferId);
    if (!Number.isInteger(transferId) || transferId < 1) {
        return res.status(400).json({ success: false, message: "Invalid transfer ID" });
    }
    try {
        const updated = await updateTransferStatus(transferId, "COMPLETED", req.body);
        res.json({ success: true, message: "Transfer completed and stock received", data: updated });
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
}

/**
 * PATCH /api/transfers/:transferId/cancel
 */
async function cancelTransfer(req, res) {
    const transferId = Number(req.params.transferId);
    if (!Number.isInteger(transferId) || transferId < 1) {
        return res.status(400).json({ success: false, message: "Invalid transfer ID" });
    }
    try {
        const updated = await updateTransferStatus(transferId, "CANCELLED", req.body);
        res.json({ success: true, message: "Transfer cancelled successfully", data: updated });
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getAllTransfers,
    getTransferById: getTransfer,
    createNewTransfer,
    changeTransferStatus,
    approveTransfer,
    dispatchTransfer,
    receiveTransfer,
    cancelTransfer
};
