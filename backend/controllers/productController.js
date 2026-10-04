const { getProducts, getProductById } = require("../services/productService");
const { parsePagination, buildPaginationMeta, parseSearch } = require("../utils/queryHelpers");

/**
 * GET /api/products
 * Returns list of products with optional pagination and search.
 */
async function getAllProducts(req, res) {
    try {
        const { page, limit, offset } = parsePagination(req.query);
        const search = parseSearch(req.query);

        // Check if pagination was explicitly requested via query params
        const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

        const options = isPaginated ? { limit, offset, search } : { search };
        const result = await getProducts(options);

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
        console.error("Products endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch products data"
        });
    }
}

/**
 * GET /api/products/:productId
 * Returns product details by ID.
 */
async function getProduct(req, res) {
    const productId = Number(req.params.productId);

    if (!Number.isInteger(productId) || productId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid product ID"
        });
    }

    try {
        const data = await getProductById(productId);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (err) {
        console.error("Product by ID endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch product data"
        });
    }
}

module.exports = { getAllProducts, getProductById: getProduct };
