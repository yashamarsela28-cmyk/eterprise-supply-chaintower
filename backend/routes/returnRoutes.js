const express = require("express");
const {
    getAllReturns,
    getReturnById,
    createNewReturn,
    changeReturnStatus,
    approveReturn,
    receiveReturn,
    rejectReturn
} = require("../controllers/returnController");

const router = express.Router();

// GET /  (mounted at /api/returns in server.js)
router.get("/", getAllReturns);

// POST /
router.post("/", createNewReturn);

// GET /:returnId
router.get("/:returnId", getReturnById);

// PATCH /:returnId/status
router.patch("/:returnId/status", changeReturnStatus);

// PATCH /:returnId/approve
router.patch("/:returnId/approve", approveReturn);

// PATCH /:returnId/receive
router.patch("/:returnId/receive", receiveReturn);

// PATCH /:returnId/reject
router.patch("/:returnId/reject", rejectReturn);

module.exports = router;
