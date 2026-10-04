const supabase = require("../config/supabase");

/**
 * Analytics Service
 * Provides read-only access to Supabase PostgreSQL analytical views.
 */

/**
 * Fetch control tower dashboard summary (Single-row view).
 */
async function getControlTowerDashboard() {
    const { data, error } = await supabase
        .from("vw_control_tower_dashboard")
        .select("*")
        .maybeSingle();

    if (error) {
        throw new Error(`Control Tower Dashboard query failed: ${error.message}`);
    }

    return data || {};
}

/**
 * Fetch warehouse KPIs (Multi-row view).
 */
async function getWarehouseKpis() {
    const { data, error } = await supabase
        .from("vw_warehouse_kpis")
        .select("*");

    if (error) {
        throw new Error(`Warehouse KPIs query failed: ${error.message}`);
    }

    return data || [];
}

/**
 * Fetch supplier KPIs (Multi-row view).
 */
async function getSupplierKpis() {
    const { data, error } = await supabase
        .from("vw_supplier_kpis")
        .select("*");

    if (error) {
        throw new Error(`Supplier KPIs query failed: ${error.message}`);
    }

    return data || [];
}

/**
 * Fetch customer receivables KPIs (Multi-row view).
 */
async function getCustomerReceivablesKpis() {
    const { data, error } = await supabase
        .from("vw_customer_receivables_kpis")
        .select("*");

    if (error) {
        throw new Error(`Customer receivables KPIs query failed: ${error.message}`);
    }

    return data || [];
}

/**
 * Fetch shipment KPIs (Multi-row view).
 */
async function getShipmentKpis() {
    const { data, error } = await supabase
        .from("vw_shipment_kpis")
        .select("*");

    if (error) {
        throw new Error(`Shipment KPIs query failed: ${error.message}`);
    }

    return data || [];
}

/**
 * Fetch supply chain risk KPIs (Multi-row view).
 */
async function getSupplyChainRiskKpis() {
    const { data, error } = await supabase
        .from("vw_supply_chain_risk_kpis")
        .select("*");

    if (error) {
        throw new Error(`Supply chain risk KPIs query failed: ${error.message}`);
    }

    return data || [];
}

/**
 * Fetch inventory aging KPIs (Multi-row view).
 */
async function getInventoryAgingKpis() {
    const { data, error } = await supabase
        .from("vw_inventory_aging_kpis")
        .select("*");

    if (error) {
        throw new Error(`Inventory aging KPIs query failed: ${error.message}`);
    }

    return data || [];
}

/**
 * Fetch warehouse utilization KPIs (Multi-row view).
 */
async function getWarehouseUtilizationKpis() {
    const { data, error } = await supabase
        .from("vw_warehouse_utilization_kpis")
        .select("*");

    if (error) {
        throw new Error(`Warehouse utilization KPIs query failed: ${error.message}`);
    }

    return data || [];
}

/**
 * Fetch purchase order performance (Multi-row view).
 */
async function getPurchaseOrderPerformance() {
    const { data, error } = await supabase
        .from("vw_purchase_order_performance")
        .select("*");

    if (error) {
        throw new Error(`Purchase order performance query failed: ${error.message}`);
    }

    return data || [];
}

/**
 * Fetch returns quality KPIs (Multi-row view).
 */
async function getReturnsQualityKpis() {
    const { data, error } = await supabase
        .from("vw_returns_quality_kpis")
        .select("*");

    if (error) {
        throw new Error(`Returns quality KPIs query failed: ${error.message}`);
    }

    return data || [];
}

/**
 * Fetch supply chain scorecard (Single-row view).
 */
async function getSupplyChainScorecard() {
    const { data, error } = await supabase
        .from("vw_supply_chain_scorecard")
        .select("*")
        .maybeSingle();

    if (error) {
        throw new Error(`Supply chain scorecard query failed: ${error.message}`);
    }

    return data || {};
}

module.exports = {
    getControlTowerDashboard,
    getWarehouseKpis,
    getSupplierKpis,
    getCustomerReceivablesKpis,
    getShipmentKpis,
    getSupplyChainRiskKpis,
    getInventoryAgingKpis,
    getWarehouseUtilizationKpis,
    getPurchaseOrderPerformance,
    getReturnsQualityKpis,
    getSupplyChainScorecard
};
