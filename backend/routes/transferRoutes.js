const express = require("express");
const {
    getAllTransfers,
    getTransferById,
    createNewTransfer,
    changeTransferStatus,
    approveTransfer,
    dispatchTransfer,
    receiveTransfer,
    cancelTransfer
} = require("../controllers/transferController");

const router = express.Router();

// GET /  (mounted at /api/transfers in server.js)
router.get("/", getAllTransfers);

// POST /
router.post("/", createNewTransfer);

// GET /:transferId
router.get("/:transferId", getTransferById);

// PATCH /:transferId/status
router.patch("/:transferId/status", changeTransferStatus);

// PATCH /:transferId/approve
router.patch("/:transferId/approve", approveTransfer);

// PATCH /:transferId/dispatch
router.patch("/:transferId/dispatch", dispatchTransfer);

// PATCH /:transferId/receive
router.patch("/:transferId/receive", receiveTransfer);

// PATCH /:transferId/cancel
router.patch("/:transferId/cancel", cancelTransfer);

module.exports = router;
