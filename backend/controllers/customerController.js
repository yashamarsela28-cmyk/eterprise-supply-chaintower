const { getCustomers, getCustomerById } = require("../services/customerService");
const { parsePagination, buildPaginationMeta, parseSearch } = require("../utils/queryHelpers");

/**
 * GET /api/customers
 * Returns list of customers with optional pagination and search.
 */
async function getAllCustomers(req, res) {
    try {
        const { page, limit, offset } = parsePagination(req.query);
        const search = parseSearch(req.query);

        const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

        const options = isPaginated ? { limit, offset, search } : { search };
        const result = await getCustomers(options);

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
        console.error("Customers endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch customers data"
        });
    }
}

/**
 * GET /api/customers/:customerId
 * Returns customer details by ID.
 */
async function getCustomer(req, res) {
    const customerId = Number(req.params.customerId);

    if (!Number.isInteger(customerId) || customerId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid customer ID"
        });
    }

    try {
        const data = await getCustomerById(customerId);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (err) {
        console.error("Customer by ID endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch customer data"
        });
    }
}

module.exports = { getAllCustomers, getCustomerById: getCustomer };
