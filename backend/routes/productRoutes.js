const express = require("express");
const { getAllProducts, getProductById } = require("../controllers/productController");

const router = express.Router();

// GET /  (mounted at /api/products in server.js)
router.get("/", getAllProducts);

// GET /:productId
router.get("/:productId", getProductById);

module.exports = router;
