const {
    getControlTowerDashboard,
    getWarehouseKpis,
    getSupplierKpis,
    getCustomerReceivablesKpis,
    getShipmentKpis,
    getSupplyChainRiskKpis,
    getInventoryAgingKpis,
    getWarehouseUtilizationKpis,
    getPurchaseOrderPerformance,
    getReturnsQualityKpis,
    getSupplyChainScorecard
} = require("../services/analyticsService");

/**
 * GET /api/analytics/dashboard
 * Returns control tower dashboard summary (single-row view).
 */
async function getDashboard(req, res) {
    try {
        const data = await getControlTowerDashboard();

        res.json({
            success: true,
            data
        });
    } catch (err) {
        console.error("Analytics dashboard endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard analytics"
        });
    }
}

/**
 * GET /api/analytics/warehouse-kpis
 * Returns warehouse KPIs (multi-row view).
 */
async function getWarehouseKpisEndpoint(req, res) {
    try {
        const data = await getWarehouseKpis();

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (err) {
        console.error("Warehouse KPIs endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch warehouse KPIs"
        });
    }
}

/**
 * GET /api/analytics/supplier-kpis
 * Returns supplier KPIs (multi-row view).
 */
async function getSupplierKpisEndpoint(req, res) {
    try {
        const data = await getSupplierKpis();

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (err) {
        console.error("Supplier KPIs endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch supplier KPIs"
        });
    }
}

/**
 * GET /api/analytics/customer-receivables
 * Returns customer receivables KPIs (multi-row view).
 */
async function getCustomerReceivablesEndpoint(req, res) {
    try {
        const data = await getCustomerReceivablesKpis();

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (err) {
        console.error("Customer receivables KPIs endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch customer receivables KPIs"
        });
    }
}

/**
 * GET /api/analytics/shipment-kpis
 * Returns shipment KPIs (multi-row view).
 */
async function getShipmentKpisEndpoint(req, res) {
    try {
        const data = await getShipmentKpis();

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (err) {
        console.error("Shipment KPIs endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch shipment KPIs"
        });
    }
}

/**
 * GET /api/analytics/risk
 * Returns supply chain risk KPIs (multi-row view).
 */
async function getRiskEndpoint(req, res) {
    try {
        const data = await getSupplyChainRiskKpis();

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (err) {
        console.error("Supply chain risk KPIs endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch supply chain risk KPIs"
        });
    }
}

/**
 * GET /api/analytics/inventory-aging
 * Returns inventory aging KPIs (multi-row view).
 */
async function getInventoryAgingEndpoint(req, res) {
    try {
        const data = await getInventoryAgingKpis();

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (err) {
        console.error("Inventory aging KPIs endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch inventory aging KPIs"
        });
    }
}

/**
 * GET /api/analytics/warehouse-utilization
 * Returns warehouse utilization KPIs (multi-row view).
 */
async function getWarehouseUtilizationEndpoint(req, res) {
    try {
        const data = await getWarehouseUtilizationKpis();

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (err) {
        console.error("Warehouse utilization KPIs endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch warehouse utilization KPIs"
        });
    }
}

/**
 * GET /api/analytics/purchase-orders
 * Returns purchase order performance (multi-row view).
 */
async function getPurchaseOrdersEndpoint(req, res) {
    try {
        const data = await getPurchaseOrderPerformance();

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (err) {
        console.error("Purchase order performance endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch purchase order performance"
        });
    }
}

/**
 * GET /api/analytics/returns-quality
 * Returns returns quality KPIs (multi-row view).
 */
async function getReturnsQualityEndpoint(req, res) {
    try {
        const data = await getReturnsQualityKpis();

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (err) {
        console.error("Returns quality KPIs endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch returns quality KPIs"
        });
    }
}

/**
 * GET /api/analytics/scorecard
 * Returns supply chain scorecard (single-row view).
 */
async function getScorecardEndpoint(req, res) {
    try {
        const data = await getSupplyChainScorecard();

        res.json({
            success: true,
            data
        });
    } catch (err) {
        console.error("Supply chain scorecard endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch supply chain scorecard"
        });
    }
}

module.exports = {
    getDashboard,
    getWarehouseKpisEndpoint,
    getSupplierKpisEndpoint,
    getCustomerReceivablesEndpoint,
    getShipmentKpisEndpoint,
    getRiskEndpoint,
    getInventoryAgingEndpoint,
    getWarehouseUtilizationEndpoint,
    getPurchaseOrdersEndpoint,
    getReturnsQualityEndpoint,
    getScorecardEndpoint
};
