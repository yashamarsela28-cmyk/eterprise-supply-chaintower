const express = require("express");
const { getAllSuppliers, getSupplierById } = require("../controllers/supplierController");

const router = express.Router();

// GET /  (mounted at /api/suppliers in server.js)
router.get("/", getAllSuppliers);

// GET /:supplierId
router.get("/:supplierId", getSupplierById);

module.exports = router;
