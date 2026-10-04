const supabase = require("../config/supabase");

const RETURN_SELECT = `
    return_id,
    return_number,
    sales_order_id,
    customer_id,
    warehouse_id,
    requested_at,
    reason,
    status,
    processed_by,
    processed_at,
    notes,
    sales_orders (
        sales_order_id,
        order_number
    ),
    customers (
        customer_id,
        customer_code,
        customer_name
    ),
    warehouses (
        warehouse_id,
        warehouse_code,
        warehouse_name
    ),
    return_items (
        return_item_id,
        sales_order_item_id,
        product_id,
        requested_quantity,
        approved_quantity,
        received_quantity,
        condition,
        products (
            product_id,
            sku,
            product_name
        )
    )
`;

const VALID_RETURN_TRANSITIONS = {
    REQUESTED: ["APPROVED", "REJECTED", "INSPECTING"],
    APPROVED: ["RECEIVED", "INSPECTING", "REJECTED"],
    INSPECTING: ["RECEIVED", "REJECTED", "REFUNDED", "COMPLETED"],
    RECEIVED: ["COMPLETED", "REFUNDED", "REJECTED"],
    REFUNDED: ["COMPLETED"],
    COMPLETED: [],
    REJECTED: []
};

function formatReturnItem(item) {
    return {
        return_item_id: item.return_item_id,
        sales_order_item_id: item.sales_order_item_id,
        product_id: item.product_id,
        sku: item.products?.sku || null,
        product_name: item.products?.product_name || null,
        requested_quantity: item.requested_quantity,
        approved_quantity: item.approved_quantity,
        received_quantity: item.received_quantity,
        condition: item.condition
    };
}

function formatReturn(row) {
    const items = Array.isArray(row.return_items)
        ? row.return_items.map(formatReturnItem)
        : [];

    return {
        return_id: row.return_id,
        return_number: row.return_number,
        sales_order_id: row.sales_order_id,
        order_number: row.sales_orders?.order_number || null,
        customer_id: row.customer_id,
        customer_code: row.customers?.customer_code || null,
        customer_name: row.customers?.customer_name || null,
        warehouse_id: row.warehouse_id,
        warehouse_code: row.warehouses?.warehouse_code || null,
        warehouse_name: row.warehouses?.warehouse_name || null,
        requested_at: row.requested_at,
        reason: row.reason,
        status: row.status,
        processed_by: row.processed_by,
        processed_at: row.processed_at,
        notes: row.notes,
        items
    };
}

async function getReturns(options = {}) {
    const { limit, offset, status, search } = options;

    let query = supabase
        .from("returns")
        .select(RETURN_SELECT, { count: "exact" });

    if (status) {
        query = query.eq("status", status.toUpperCase());
    }

    if (search) {
        query = query.or(`return_number.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    if (limit !== undefined && offset !== undefined) {
        query = query.range(offset, offset + limit - 1);
    }

    query = query.order("return_id", { ascending: true });

    const { data, error, count } = await query;

    if (error) {
        throw new Error(`Returns query failed: ${error.message}`);
    }

    return {
        items: (data || []).map(formatReturn),
        total: count || 0
    };
}

async function getReturnById(returnId) {
    const { data, error } = await supabase
        .from("returns")
        .select(RETURN_SELECT)
        .eq("return_id", Number(returnId))
        .maybeSingle();

    if (error) {
        throw new Error(`Return query failed: ${error.message}`);
    }

    return data ? formatReturn(data) : null;
}

/**
 * Create a new RMA / Return request.
 */
async function createReturn(params) {
    const {
        sales_order_id,
        customer_id,
        warehouse_id,
        reason = "DEFECTIVE",
        notes = "",
        items
    } = params;

    if (!sales_order_id || isNaN(Number(sales_order_id))) {
        const err = new Error("Valid sales_order_id is required");
        err.statusCode = 400;
        throw err;
    }
    if (!customer_id || isNaN(Number(customer_id))) {
        const err = new Error("Valid customer_id is required");
        err.statusCode = 400;
        throw err;
    }
    if (!warehouse_id || isNaN(Number(warehouse_id))) {
        const err = new Error("Valid warehouse_id is required");
        err.statusCode = 400;
        throw err;
    }
    if (!Array.isArray(items) || items.length === 0) {
        const err = new Error("Return request must contain at least one item");
        err.statusCode = 400;
        throw err;
    }

    const returnNumber = `RMA-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const { data: retData, error: retErr } = await supabase
        .from("returns")
        .insert({
            return_number: returnNumber,
            sales_order_id: Number(sales_order_id),
            customer_id: Number(customer_id),
            warehouse_id: Number(warehouse_id),
            requested_at: now,
            reason: reason.toUpperCase(),
            status: "REQUESTED",
            notes: notes || null
        })
        .select("return_id")
        .single();

    if (retErr) {
        throw new Error(`Failed to create return record: ${retErr.message}`);
    }

    const returnId = retData.return_id;

    // Fetch sales order items to resolve sales_order_item_id
    const { data: orderItems } = await supabase
        .from("sales_order_items")
        .select("sales_order_item_id, product_id")
        .eq("sales_order_id", Number(sales_order_id));

    const soItemMap = new Map((orderItems || []).map(oi => [oi.product_id, oi.sales_order_item_id]));

    const returnItemsToInsert = items.map(item => {
        const prodId = Number(item.product_id);
        const soItemId = item.sales_order_item_id
            ? Number(item.sales_order_item_id)
            : (soItemMap.get(prodId) || orderItems?.[0]?.sales_order_item_id || 1);

        return {
            return_id: returnId,
            sales_order_item_id: soItemId,
            product_id: prodId,
            requested_quantity: Number(item.requested_quantity) || 1,
            approved_quantity: 0,
            received_quantity: 0,
            condition: item.condition || "PENDING_INSPECTION"
        };
    });

    const { error: itemsErr } = await supabase
        .from("return_items")
        .insert(returnItemsToInsert);

    if (itemsErr) {
        await supabase.from("returns").delete().eq("return_id", returnId);
        throw new Error(`Failed to create return items: ${itemsErr.message}`);
    }

    return getReturnById(returnId);
}

/**
 * Update Return Status (Approve, Receive, Reject, Complete).
 */
async function updateReturnStatus(returnId, newStatus, options = {}) {
    if (!returnId || isNaN(Number(returnId))) {
        const err = new Error("Valid returnId is required");
        err.statusCode = 400;
        throw err;
    }

    const upperStatus = String(newStatus).toUpperCase();
    const current = await getReturnById(Number(returnId));

    if (!current) {
        const err = new Error(`Return #${returnId} not found`);
        err.statusCode = 404;
        throw err;
    }

    const allowed = VALID_RETURN_TRANSITIONS[current.status] || [];
    if (!allowed.includes(upperStatus)) {
        const err = new Error(`Invalid return transition from '${current.status}' to '${upperStatus}'. Allowed: ${allowed.join(", ") || "None"}`);
        err.statusCode = 400;
        throw err;
    }

    const now = new Date().toISOString();
    const actorId = Number(options.processed_by || options.user_id) || 1;

    const updatePayload = {
        status: upperStatus,
        processed_at: now,
        processed_by: actorId
    };

    if (options.notes) {
        updatePayload.notes = options.notes;
    }

    const { error: updateErr } = await supabase
        .from("returns")
        .update(updatePayload)
        .eq("return_id", Number(returnId));

    if (updateErr) {
        throw new Error(`Failed to update return status: ${updateErr.message}`);
    }

    // When status changes to APPROVED, update approved_quantity on items
    if (upperStatus === "APPROVED") {
        for (const item of current.items) {
            await supabase
                .from("return_items")
                .update({ approved_quantity: item.requested_quantity })
                .eq("return_item_id", item.return_item_id);
        }
    }

    // When status changes to RECEIVED or COMPLETED, restock if condition is RESTOCK / GOOD or option restock
    if (["RECEIVED", "COMPLETED"].includes(upperStatus) && (options.restock || true)) {
        for (const item of current.items) {
            const restockQty = item.approved_quantity || item.requested_quantity;
            if (restockQty > 0) {
                const { data: invRecords } = await supabase
                    .from("inventory")
                    .select("inventory_id, quantity_on_hand, quantity_reserved, quantity_available, location_id")
                    .eq("product_id", item.product_id);

                if (invRecords && invRecords.length > 0) {
                    const inv = invRecords[0];
                    const newOnHand = inv.quantity_on_hand + restockQty;
                    const newAvail = newOnHand - (inv.quantity_reserved || 0);

                    await supabase
                        .from("inventory")
                        .update({
                            quantity_on_hand: newOnHand,
                            last_counted_at: now
                        })
                        .eq("inventory_id", inv.inventory_id);

                    await supabase
                        .from("inventory_transactions")
                        .insert({
                            product_id: item.product_id,
                            location_id: inv.location_id,
                            transaction_type: "RECEIPT",
                            quantity: restockQty,
                            reference_type: "RETURN",
                            reference_id: current.return_id,
                            performed_by: actorId,
                            transaction_time: now,
                            notes: `RMA ${current.return_number} restock`
                        });
                }
            }
        }
    }

    return getReturnById(Number(returnId));
}

module.exports = {
    getReturns,
    getReturnById,
    createReturn,
    updateReturnStatus,
    VALID_RETURN_TRANSITIONS
};
