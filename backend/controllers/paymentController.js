const { getPayments, getPaymentById, recordPayment } = require("../services/paymentService");
const { parsePagination, buildPaginationMeta, parseStatus } = require("../utils/queryHelpers");

/**
 * GET /api/payments
 * Returns list of payments with optional pagination and status filtering.
 */
async function getAllPayments(req, res) {
    try {
        const { page, limit, offset } = parsePagination(req.query);
        const status = parseStatus(req.query);

        const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

        const options = isPaginated ? { limit, offset, status } : { status };
        const result = await getPayments(options);

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
        console.error("Payments endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch payments data"
        });
    }
}

/**
 * GET /api/payments/:paymentId
 * Returns payment details by ID.
 */
async function getPayment(req, res) {
    const paymentId = Number(req.params.paymentId);

    if (!Number.isInteger(paymentId) || paymentId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment ID"
        });
    }

    try {
        const data = await getPaymentById(paymentId);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (err) {
        console.error("Payment by ID endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch payment data"
        });
    }
}

/**
 * POST /api/payments
 * Records a payment against an invoice.
 */
async function recordNewPayment(req, res) {
    try {
        const payment = await recordPayment(req.body);
        res.status(201).json({
            success: true,
            message: "Payment recorded successfully",
            data: payment
        });
    } catch (err) {
        console.error("Record payment error:", err.message);
        const status = err.statusCode || 500;
        res.status(status).json({
            success: false,
            message: err.message || "Failed to record payment"
        });
    }
}

module.exports = {
    getAllPayments,
    getPaymentById: getPayment,
    recordNewPayment
};
