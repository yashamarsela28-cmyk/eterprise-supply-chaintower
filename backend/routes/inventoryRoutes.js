const express = require("express");
const { getAllInventory, getProductInventory, adjustStock, reserveStock } = require("../controllers/inventoryController");

const router = express.Router();

// GET /  (mounted at /api/inventory in server.js)
router.get("/", getAllInventory);

// POST /adjust
router.post("/adjust", adjustStock);
router.post("/:inventoryId/adjust", adjustStock);

// POST /reserve
router.post("/reserve", reserveStock);
router.post("/:inventoryId/reserve", reserveStock);

// GET /:productId  (e.g. /api/inventory/1)
router.get("/:productId", getProductInventory);

module.exports = router;
