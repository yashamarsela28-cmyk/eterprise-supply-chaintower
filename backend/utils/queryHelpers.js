/**
 * Query helper utilities for pagination, filtering, and search.
 */

/**
 * Parse pagination parameters from request query.
 * @param {Object} query - Express req.query object
 * @returns {Object} { page, limit, offset }
 */
function parsePagination(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
}

/**
 * Build pagination response metadata.
 * @param {number} total - Total count of records
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
function buildPaginationMeta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);

    return {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
    };
}

/**
 * Parse search parameter from query.
 * @param {Object} query - Express req.query object
 * @returns {string|null} Search term or null
 */
function parseSearch(query) {
    const search = query.search || query.q;
    return search ? String(search).trim() : null;
}

/**
 * Parse status filter from query.
 * @param {Object} query - Express req.query object
 * @returns {string|null} Status value or null
 */
function parseStatus(query) {
    return query.status ? String(query.status).trim().toUpperCase() : null;
}

module.exports = {
    parsePagination,
    buildPaginationMeta,
    parseSearch,
    parseStatus
};
