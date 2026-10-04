const supabase = require("../config/supabase");

/**
 * Fetch dashboard data from vw_control_tower_dashboard.
 * @returns {Promise<Object>} The dashboard row.
 * @throws {Error} If the Supabase query fails.
 */
async function getDashboardData() {
    const { data, error } = await supabase
        .from("vw_control_tower_dashboard")
        .select("*")
        .single();

    if (error) {
        throw new Error(`Dashboard query failed: ${error.message}`);
    }

    return data;
}

module.exports = { getDashboardData };
