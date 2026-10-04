const express = require("express");
const {
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
} = require("../controllers/analyticsController");

const router = express.Router();

// GET /dashboard  (mounted at /api/analytics in server.js)
router.get("/dashboard", getDashboard);

// GET /warehouse-kpis
router.get("/warehouse-kpis", getWarehouseKpisEndpoint);

// GET /supplier-kpis
router.get("/supplier-kpis", getSupplierKpisEndpoint);

// GET /customer-receivables
router.get("/customer-receivables", getCustomerReceivablesEndpoint);

// GET /shipment-kpis
router.get("/shipment-kpis", getShipmentKpisEndpoint);

// GET /risk
router.get("/risk", getRiskEndpoint);

// GET /inventory-aging
router.get("/inventory-aging", getInventoryAgingEndpoint);

// GET /warehouse-utilization
router.get("/warehouse-utilization", getWarehouseUtilizationEndpoint);

// GET /purchase-orders
router.get("/purchase-orders", getPurchaseOrdersEndpoint);

// GET /returns-quality
router.get("/returns-quality", getReturnsQualityEndpoint);

// GET /scorecard
router.get("/scorecard", getScorecardEndpoint);

module.exports = router;
