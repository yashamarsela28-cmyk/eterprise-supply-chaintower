const { getDashboardData } = require("../services/dashboardService");

/**
 * GET /api/dashboard
 * Returns the control tower dashboard summary.
 */
async function getDashboard(req, res) {
    try {
        const data = await getDashboardData();

        res.json({
            success: true,
            data
        });
    } catch (err) {
        console.error("Dashboard endpoint error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard data",
            error: err.message
        });
    }
}

module.exports = { getDashboard };
