const express = require("express");
const { getAllCustomers, getCustomerById } = require("../controllers/customerController");

const router = express.Router();

// GET /  (mounted at /api/customers in server.js)
router.get("/", getAllCustomers);

// GET /:customerId
router.get("/:customerId", getCustomerById);

module.exports = router;
