const { getSuppliers, getSupplierById } = require("../services/supplierService");
const { parsePagination, buildPaginationMeta, parseSearch } = require("../utils/queryHelpers");

/**
 * GET /api/suppliers
 * Returns list of suppliers with optional pagination and search.
 */
async function getAllSuppliers(req, res) {
    try {
        const { page, limit, offset } = parsePagination(req.query);
        const search = parseSearch(req.query);

        const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

        const options = isPaginated ? { limit, offset, search } : { search };
        const result = await getSuppliers(options);

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
        console.error("Suppliers endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch suppliers data"
        });
    }
}

/**
 * GET /api/suppliers/:supplierId
 * Returns supplier details by ID.
 */
async function getSupplier(req, res) {
    const supplierId = Number(req.params.supplierId);

    if (!Number.isInteger(supplierId) || supplierId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid supplier ID"
        });
    }

    try {
        const data = await getSupplierById(supplierId);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found"
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (err) {
        console.error("Supplier by ID endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch supplier data"
        });
    }
}

module.exports = { getAllSuppliers, getSupplierById: getSupplier };
