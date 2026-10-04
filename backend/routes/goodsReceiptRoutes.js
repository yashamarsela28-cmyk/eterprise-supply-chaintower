const express = require("express");
const { getAllGoodsReceipts, getGoodsReceiptById, createReceipt } = require("../controllers/goodsReceiptController");

const router = express.Router();

// GET /  (mounted at /api/goods-receipts in server.js)
router.get("/", getAllGoodsReceipts);

// POST /
router.post("/", createReceipt);

// GET /:receiptId
router.get("/:receiptId", getGoodsReceiptById);

module.exports = router;
