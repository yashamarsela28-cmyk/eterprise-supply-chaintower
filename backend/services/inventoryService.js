const supabase = require("../config/supabase");

const INVENTORY_SELECT = `
    inventory_id,
    product_id,
    location_id,
    quantity_on_hand,
    quantity_reserved,
    quantity_available,
    reorder_level,
    last_counted_at,
    products (
        product_id,
        sku,
        product_name
    ),
    storage_locations (
        location_id,
        warehouse_zones (
            warehouses (
                warehouse_id,
                warehouse_code,
                warehouse_name
            )
        )
    )
`;

/**
 * Flatten nested Supabase joins into a flat inventory record.
 */
function flattenRow(row) {
    const warehouse = row.storage_locations?.warehouse_zones?.warehouses || {};
    return {
        inventory_id: row.inventory_id,
        product_id: row.product_id,
        sku: row.products?.sku || null,
        product_name: row.products?.product_name || null,
        warehouse_id: warehouse.warehouse_id || null,
        warehouse_code: warehouse.warehouse_code || null,
        warehouse_name: warehouse.warehouse_name || null,
        location_id: row.location_id,
        quantity_on_hand: row.quantity_on_hand,
        quantity_reserved: row.quantity_reserved,
        quantity_available: row.quantity_available,
        reorder_level: row.reorder_level,
        last_counted_at: row.last_counted_at
    };
}

/**
 * Fetch all inventory records with product and warehouse details.
 */
async function getInventory() {
    const { data, error } = await supabase
        .from("inventory")
        .select(INVENTORY_SELECT)
        .order("inventory_id", { ascending: true });

    if (error) {
        throw new Error(`Inventory query failed: ${error.message}`);
    }

    return (data || []).map(flattenRow);
}

/**
 * Fetch inventory records for a specific product.
 */
async function getInventoryByProductId(productId) {
    const { data, error } = await supabase
        .from("inventory")
        .select(INVENTORY_SELECT)
        .eq("product_id", Number(productId));

    if (error) {
        throw new Error(`Inventory query failed: ${error.message}`);
    }

    return (data || []).map(flattenRow);
}

/**
 * Real Stock Adjustment Workflow
 * Adjusts stock levels atomically and logs an inventory transaction.
 */
async function adjustInventory({ inventory_id, adjustment_quantity, reason = "Cycle count reconciliation", notes = "", performed_by = 1 }) {
    if (!inventory_id || isNaN(Number(inventory_id))) {
        const err = new Error("Valid inventory_id is required");
        err.statusCode = 400;
        throw err;
    }
    const qty = Number(adjustment_quantity);
    if (isNaN(qty) || qty === 0) {
        const err = new Error("adjustment_quantity must be a non-zero number");
        err.statusCode = 400;
        throw err;
    }

    // 1. Fetch current inventory state
    const { data: current, error: fetchErr } = await supabase
        .from("inventory")
        .select("*")
        .eq("inventory_id", Number(inventory_id))
        .maybeSingle();

    if (fetchErr) {
        throw new Error(`Failed to fetch inventory item: ${fetchErr.message}`);
    }
    if (!current) {
        const err = new Error(`Inventory record #${inventory_id} not found`);
        err.statusCode = 404;
        throw err;
    }

    const newOnHand = current.quantity_on_hand + qty;
    const reserved = current.quantity_reserved || 0;

    if (newOnHand < 0) {
        const err = new Error(`Adjustment would result in negative on-hand inventory (${newOnHand})`);
        err.statusCode = 400;
        throw err;
    }

    if (newOnHand < reserved) {
        const err = new Error(`Adjustment would reduce on-hand (${newOnHand}) below reserved quantity (${reserved})`);
        err.statusCode = 400;
        throw err;
    }

    const newAvailable = newOnHand - reserved;
    const now = new Date().toISOString();

    // 2. Update inventory table
    const { data: updated, error: updateErr } = await supabase
        .from("inventory")
        .update({
            quantity_on_hand: newOnHand,
            last_counted_at: now,
            updated_at: now
        })
        .eq("inventory_id", Number(inventory_id))
        .select(INVENTORY_SELECT)
        .single();

    if (updateErr) {
        throw new Error(`Failed to update inventory record: ${updateErr.message}`);
    }

    // 3. Insert inventory transaction log
    const txType = qty > 0 ? "ADJUSTMENT_IN" : (reason === "DAMAGE" ? "DAMAGE" : "ADJUSTMENT_IN");
    const userId = Number(performed_by) || 1;

    const { error: txErr } = await supabase
        .from("inventory_transactions")
        .insert({
            product_id: current.product_id,
            location_id: current.location_id,
            transaction_type: txType,
            quantity: Math.abs(qty),
            reference_type: "STOCK_COUNT",
            reference_id: current.inventory_id,
            performed_by: userId,
            transaction_time: now,
            notes: notes || `Manual stock adjustment: ${reason}`
        });

    if (txErr) {
        console.error("Warning: Failed to write inventory transaction:", txErr.message);
    }

    return flattenRow(updated);
}

/**
 * Reserve Stock Workflow
 */
async function reserveInventory({ inventory_id, quantity, reference_type = "SALES_ORDER", reference_id = 1 }) {
    if (!inventory_id || isNaN(Number(inventory_id))) {
        const err = new Error("Valid inventory_id is required");
        err.statusCode = 400;
        throw err;
    }
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
        const err = new Error("quantity must be greater than 0");
        err.statusCode = 400;
        throw err;
    }

    const { data: current, error: fetchErr } = await supabase
        .from("inventory")
        .select("*")
        .eq("inventory_id", Number(inventory_id))
        .maybeSingle();

    if (fetchErr || !current) {
        const err = new Error(`Inventory record #${inventory_id} not found`);
        err.statusCode = 404;
        throw err;
    }

    if (current.quantity_available < qty) {
        const err = new Error(`Insufficient available stock (requested ${qty}, available ${current.quantity_available})`);
        err.statusCode = 400;
        throw err;
    }

    const newReserved = current.quantity_reserved + qty;
    const newAvailable = current.quantity_on_hand - newReserved;
    const now = new Date().toISOString();

    // Update inventory
    const { data: updated, error: updateErr } = await supabase
        .from("inventory")
        .update({
            quantity_reserved: newReserved,
            updated_at: now
        })
        .eq("inventory_id", Number(inventory_id))
        .select(INVENTORY_SELECT)
        .single();

    if (updateErr) {
        throw new Error(`Failed to update inventory reservation: ${updateErr.message}`);
    }

    // Insert reservation
    const { data: resData, error: resErr } = await supabase
        .from("inventory_reservations")
        .insert({
            product_id: current.product_id,
            location_id: current.location_id,
            reserved_quantity: qty,
            reference_type,
            reference_id: Number(reference_id) || 1,
            status: "RESERVED",
            reserved_at: now
        })
        .select()
        .single();

    if (resErr) {
        console.error("Warning: Failed to create reservation record:", resErr.message);
    }

    // Insert transaction
    await supabase
        .from("inventory_transactions")
        .insert({
            product_id: current.product_id,
            location_id: current.location_id,
            transaction_type: "RESERVATION",
            quantity: qty,
            reference_type,
            reference_id: Number(reference_id) || 1,
            performed_by: 1,
            transaction_time: now,
            notes: `Stock reserved (${qty} units)`
        });

    return {
        inventory: flattenRow(updated),
        reservation: resData
    };
}

module.exports = {
    getInventory,
    getInventoryByProductId,
    adjustInventory,
    reserveInventory
};
