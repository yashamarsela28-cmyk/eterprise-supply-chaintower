const express = require("express");
const {
    getAllOrders,
    getOrderById,
    createNewOrder,
    changeOrderStatus,
    confirmOrder,
    cancelOrder
} = require("../controllers/orderController");

const router = express.Router();

// GET /  (mounted at /api/orders in server.js)
router.get("/", getAllOrders);

// POST /
router.post("/", createNewOrder);

// GET /:orderId
router.get("/:orderId", getOrderById);

// PATCH /:orderId/status
router.patch("/:orderId/status", changeOrderStatus);

// PATCH /:orderId/confirm
router.patch("/:orderId/confirm", confirmOrder);

// PATCH /:orderId/cancel
router.patch("/:orderId/cancel", cancelOrder);

module.exports = router;
