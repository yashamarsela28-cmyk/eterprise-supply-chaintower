const express = require("express");
const {
    getAllPurchaseOrders,
    getPurchaseOrderById,
    createPO,
    changePOStatus,
    submitPO,
    approvePO,
    cancelPO
} = require("../controllers/purchaseOrderController");

const router = express.Router();

// GET /  (mounted at /api/purchase-orders in server.js)
router.get("/", getAllPurchaseOrders);

// POST /
router.post("/", createPO);

// GET /:purchaseOrderId
router.get("/:purchaseOrderId", getPurchaseOrderById);

// PATCH /:purchaseOrderId/status
router.patch("/:purchaseOrderId/status", changePOStatus);

// PATCH /:purchaseOrderId/submit
router.patch("/:purchaseOrderId/submit", submitPO);

// PATCH /:purchaseOrderId/approve
router.patch("/:purchaseOrderId/approve", approvePO);

// PATCH /:purchaseOrderId/cancel
router.patch("/:purchaseOrderId/cancel", cancelPO);

module.exports = router;
