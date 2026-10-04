const {
    getReturns,
    getReturnById,
    createReturn,
    updateReturnStatus
} = require("../services/returnService");
const { parsePagination, buildPaginationMeta, parseStatus, parseSearch } = require("../utils/queryHelpers");

/**
 * GET /api/returns
 * Returns list of returns with optional pagination and status filtering.
 */
async function getAllReturns(req, res) {
    try {
        const { page, limit, offset } = parsePagination(req.query);
        const status = parseStatus(req.query);
        const search = parseSearch(req.query);

        const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

        const options = isPaginated ? { limit, offset, status, search } : { status, search };
        const result = await getReturns(options);

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
        console.error("Returns endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch returns data"
        });
    }
}

/**
 * GET /api/returns/:returnId
 * Returns return details by ID.
 */
async function getReturn(req, res) {
    const returnId = Number(req.params.returnId);

    if (!Number.isInteger(returnId) || returnId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid return ID"
        });
    }

    try {
        const data = await getReturnById(returnId);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Return not found"
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (err) {
        console.error("Return by ID endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch return data"
        });
    }
}

/**
 * POST /api/returns
 * Creates a new return / RMA request.
 */
async function createNewReturn(req, res) {
    try {
        const rma = await createReturn(req.body);
        res.status(201).json({
            success: true,
            message: "Return request created successfully",
            data: rma
        });
    } catch (err) {
        console.error("Create return error:", err.message);
        const status = err.statusCode || 500;
        res.status(status).json({
            success: false,
            message: err.message || "Failed to create return request"
        });
    }
}

/**
 * PATCH /api/returns/:returnId/status
 * Updates return status (Approve, Receive, Reject, Complete).
 */
async function changeReturnStatus(req, res) {
    const returnId = Number(req.params.returnId);
    const { status, processed_by, notes, restock } = req.body;

    if (!Number.isInteger(returnId) || returnId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid return ID"
        });
    }

    if (!status) {
        return res.status(400).json({
            success: false,
            message: "status field is required"
        });
    }

    try {
        const updated = await updateReturnStatus(returnId, status, { processed_by, notes, restock });
        res.json({
            success: true,
            message: `Return transitioned to ${status.toUpperCase()}`,
            data: updated
        });
    } catch (err) {
        console.error("Update return status error:", err.message);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: err.message || "Failed to update return status"
        });
    }
}

/**
 * PATCH /api/returns/:returnId/approve
 */
async function approveReturn(req, res) {
    const returnId = Number(req.params.returnId);
    if (!Number.isInteger(returnId) || returnId < 1) {
        return res.status(400).json({ success: false, message: "Invalid return ID" });
    }
    try {
        const updated = await updateReturnStatus(returnId, "APPROVED", req.body);
        res.json({ success: true, message: "Return approved successfully", data: updated });
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
}

/**
 * PATCH /api/returns/:returnId/receive
 */
async function receiveReturn(req, res) {
    const returnId = Number(req.params.returnId);
    if (!Number.isInteger(returnId) || returnId < 1) {
        return res.status(400).json({ success: false, message: "Invalid return ID" });
    }
    try {
        const updated = await updateReturnStatus(returnId, "RECEIVED", { ...req.body, restock: true });
        res.json({ success: true, message: "Return received and inventory restocked", data: updated });
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
}

/**
 * PATCH /api/returns/:returnId/reject
 */
async function rejectReturn(req, res) {
    const returnId = Number(req.params.returnId);
    if (!Number.isInteger(returnId) || returnId < 1) {
        return res.status(400).json({ success: false, message: "Invalid return ID" });
    }
    try {
        const updated = await updateReturnStatus(returnId, "REJECTED", req.body);
        res.json({ success: true, message: "Return rejected", data: updated });
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getAllReturns,
    getReturnById: getReturn,
    createNewReturn,
    changeReturnStatus,
    approveReturn,
    receiveReturn,
    rejectReturn
};
