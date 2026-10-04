const {
    getInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoiceStatus
} = require("../services/invoiceService");
const { parsePagination, buildPaginationMeta, parseStatus, parseSearch } = require("../utils/queryHelpers");

/**
 * GET /api/invoices
 * Returns list of invoices with optional pagination and status filtering.
 */
async function getAllInvoices(req, res) {
    try {
        const { page, limit, offset } = parsePagination(req.query);
        const status = parseStatus(req.query);
        const search = parseSearch(req.query);

        const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

        const options = isPaginated ? { limit, offset, status, search } : { status, search };
        const result = await getInvoices(options);

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
        console.error("Invoices endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch invoices data"
        });
    }
}

/**
 * GET /api/invoices/:invoiceId
 * Returns invoice details by ID.
 */
async function getInvoice(req, res) {
    const invoiceId = Number(req.params.invoiceId);

    if (!Number.isInteger(invoiceId) || invoiceId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid invoice ID"
        });
    }

    try {
        const data = await getInvoiceById(invoiceId);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (err) {
        console.error("Invoice by ID endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch invoice data"
        });
    }
}

/**
 * POST /api/invoices
 * Generates a new invoice from a sales order.
 */
async function createNewInvoice(req, res) {
    try {
        const invoice = await createInvoice(req.body);
        res.status(201).json({
            success: true,
            message: "Invoice generated successfully",
            data: invoice
        });
    } catch (err) {
        console.error("Create invoice error:", err.message);
        const status = err.statusCode || 500;
        res.status(status).json({
            success: false,
            message: err.message || "Failed to generate invoice"
        });
    }
}

/**
 * PATCH /api/invoices/:invoiceId/status
 * Updates invoice status (e.g. CANCELLED, PAID).
 */
async function changeInvoiceStatus(req, res) {
    const invoiceId = Number(req.params.invoiceId);
    const { status } = req.body;

    if (!Number.isInteger(invoiceId) || invoiceId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid invoice ID"
        });
    }

    if (!status) {
        return res.status(400).json({
            success: false,
            message: "status field is required"
        });
    }

    try {
        const updated = await updateInvoiceStatus(invoiceId, status);
        res.json({
            success: true,
            message: `Invoice transitioned to ${status.toUpperCase()}`,
            data: updated
        });
    } catch (err) {
        console.error("Update invoice status error:", err.message);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: err.message || "Failed to update invoice status"
        });
    }
}

module.exports = {
    getAllInvoices,
    getInvoiceById: getInvoice,
    createNewInvoice,
    changeInvoiceStatus
};
