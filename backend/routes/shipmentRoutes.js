const express = require("express");
const {
    getAllShipments,
    getShipmentById,
    getShipmentTracking,
    createNewShipment,
    changeShipmentStatus,
    addTracking,
    getMapData
} = require("../controllers/shipmentController");

const router = express.Router();

// GET /map-data (must be before /:shipmentId to avoid route conflict)
router.get("/map-data", (req, res) => {
  console.log("✅ MAP-DATA ROUTE HIT");
  return getMapData(req, res);
});

// GET /  (mounted at /api/shipments in server.js)
router.get("/", getAllShipments);

// POST /
router.post("/", createNewShipment);

// GET /:shipmentId/tracking  (must be defined before /:shipmentId)
router.get("/:shipmentId/tracking", getShipmentTracking);

// POST /:shipmentId/tracking
router.post("/:shipmentId/tracking", addTracking);

// GET /:shipmentId
router.get("/:shipmentId", getShipmentById);

// PATCH /:shipmentId/status
router.patch("/:shipmentId/status", changeShipmentStatus);

module.exports = router;
