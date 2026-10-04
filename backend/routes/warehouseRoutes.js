const express = require("express");
const { getAllWarehouses, getWarehouseById } = require("../controllers/warehouseController");

const router = express.Router();

// GET /  (mounted at /api/warehouses in server.js)
router.get("/", getAllWarehouses);

// GET /:warehouseId
router.get("/:warehouseId", getWarehouseById);

module.exports = router;
