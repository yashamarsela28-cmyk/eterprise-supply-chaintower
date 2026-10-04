const express = require("express");
const {
    getAllInvoices,
    getInvoiceById,
    createNewInvoice,
    changeInvoiceStatus
} = require("../controllers/invoiceController");

const router = express.Router();

// GET /  (mounted at /api/invoices in server.js)
router.get("/", getAllInvoices);

// POST /
router.post("/", createNewInvoice);

// GET /:invoiceId
router.get("/:invoiceId", getInvoiceById);

// PATCH /:invoiceId/status
router.patch("/:invoiceId/status", changeInvoiceStatus);

module.exports = router;
