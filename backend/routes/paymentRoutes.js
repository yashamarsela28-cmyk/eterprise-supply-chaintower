const express = require("express");
const {
    getAllPayments,
    getPaymentById,
    recordNewPayment
} = require("../controllers/paymentController");

const router = express.Router();

// GET /  (mounted at /api/payments in server.js)
router.get("/", getAllPayments);

// POST /
router.post("/", recordNewPayment);

// GET /:paymentId
router.get("/:paymentId", getPaymentById);

module.exports = router;
