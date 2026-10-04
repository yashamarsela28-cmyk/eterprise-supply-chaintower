const express = require("express");
const { getDashboard } = require("../controllers/dashboardController");

const router = express.Router();

// GET /  (mounted at /api/dashboard in server.js)
router.get("/", getDashboard);

module.exports = router;
