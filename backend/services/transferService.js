const supabase = require("../config/supabase");

const TRANSFER_SELECT = `
    transfer_id,
    transfer_number,
    source_warehouse_id,
    destination_warehouse_id,
    requested_by,
    approved_by,
    requested_at,
    approved_at,
    status,
    notes,
    source_warehouse:source_warehouse_id (
        warehouse_id,
        warehouse_code,
        warehouse_name
    ),
    destination_warehouse:destination_warehouse_id (
        warehouse_id,
        warehouse_code,
        warehouse_name
    ),
    stock_transfer_items (
        transfer_item_id,
        product_id,
        source_location_id,
        destination_location_id,
        requested_quantity,
        shipped_quantity,
        received_quantity,
        products (
            product_id,
            sku,
            product_name
        ),
        source_location:source_location_id (
            location_id,
            rack_number,
            shelf_number,
            bin_number
        ),
        destination_location:destination_location_id (
            location_id,
            rack_number,
            shelf_number,
            bin_number
        )
    )
`;

const VALID_TRANSFER_TRANSITIONS = {
    REQUESTED: ["APPROVED", "CANCELLED", "REJECTED"],
    APPROVED: ["IN_TRANSIT", "CANCELLED"],
    IN_TRANSIT: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
    REJECTED: []
};

function formatTransferItem(item) {
    const src = item.source_location || {};
    const dst = item.destination_location || {};

    return {
        transfer_item_id: item.transfer_item_id,
        product_id: item.product_id,
        sku: item.products?.sku || null,
        product_name: item.products?.product_name || null,
        source_location_id: item.source_location_id,
        source_location: src.rack_number ? `${src.rack_number}-${src.shelf_number}-${src.bin_number}` : null,
        destination_location_id: item.destination_location_id,
        destination_location: dst.rack_number ? `${dst.rack_number}-${dst.shelf_number}-${dst.bin_number}` : null,
        requested_quantity: item.requested_quantity,
        shipped_quantity: item.shipped_quantity,
        received_quantity: item.received_quantity
    };
}

function formatTransfer(row) {
    const items = Array.isArray(row.stock_transfer_items)
        ? row.stock_transfer_items.map(formatTransferItem)
        : [];

    return {
        transfer_id: row.transfer_id,
        transfer_number: row.transfer_number,
        source_warehouse_id: row.source_warehouse_id,
        source_warehouse_code: row.source_warehouse?.warehouse_code || null,
        source_warehouse_name: row.source_warehouse?.warehouse_name || null,
        destination_warehouse_id: row.destination_warehouse_id,
        destination_warehouse_code: row.destination_warehouse?.warehouse_code || null,
        destination_warehouse_name: row.destination_warehouse?.warehouse_name || null,
        requested_by: row.requested_by,
        approved_by: row.approved_by,
        requested_at: row.requested_at,
        approved_at: row.approved_at,
        status: row.status,
        notes: row.notes,
        items
    };
}

async function getTransfers(options = {}) {
    const { limit, offset, status, search } = options;

    let query = supabase
        .from("stock_transfers")
        .select(TRANSFER_SELECT, { count: "exact" });

    if (status) {
        query = query.eq("status", status.toUpperCase());
    }

    if (search) {
        query = query.or(`transfer_number.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    if (limit !== undefined && offset !== undefined) {
        query = query.range(offset, offset + limit - 1);
    }

    query = query.order("transfer_id", { ascending: true });

    const { data, error, count } = await query;

    if (error) {
        throw new Error(`Transfers query failed: ${error.message}`);
    }

    return {
        items: (data || []).map(formatTransfer),
        total: count || 0
    };
}

async function getTransferById(transferId) {
    const { data, error } = await supabase
        .from("stock_transfers")
        .select(TRANSFER_SELECT)
        .eq("transfer_id", Number(transferId))
        .maybeSingle();

    if (error) {
        throw new Error(`Transfer query failed: ${error.message}`);
    }

    return data ? formatTransfer(data) : null;
}

/**
 * Create a new stock transfer request.
 */
async function createTransfer(params) {
    const {
        source_warehouse_id,
        destination_warehouse_id,
        items,
        requested_by = 1,
        notes = ""
    } = params;

    if (!source_warehouse_id || isNaN(Number(source_warehouse_id))) {
        const err = new Error("Valid source_warehouse_id is required");
        err.statusCode = 400;
        throw err;
    }
    if (!destination_warehouse_id || isNaN(Number(destination_warehouse_id))) {
        const err = new Error("Valid destination_warehouse_id is required");
        err.statusCode = 400;
        throw err;
    }
    if (Number(source_warehouse_id) === Number(destination_warehouse_id)) {
        const err = new Error("Source and destination warehouses cannot be identical");
        err.statusCode = 400;
        throw err;
    }
    if (!Array.isArray(items) || items.length === 0) {
        const err = new Error("Transfer must contain at least one item");
        err.statusCode = 400;
        throw err;
    }

    const transferNumber = `TRF-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const userId = Number(requested_by) || 1;

    const { data: trfData, error: trfErr } = await supabase
        .from("stock_transfers")
        .insert({
            transfer_number: transferNumber,
            source_warehouse_id: Number(source_warehouse_id),
            destination_warehouse_id: Number(destination_warehouse_id),
            requested_by: userId,
            requested_at: now,
            status: "REQUESTED",
            notes: notes || null
        })
        .select("transfer_id")
        .single();

    if (trfErr) {
        throw new Error(`Failed to create stock transfer: ${trfErr.message}`);
    }

    const transferId = trfData.transfer_id;

    const itemsToInsert = [];
    for (const item of items) {
        const prodId = Number(item.product_id);
        let srcLoc = item.source_location_id ? Number(item.source_location_id) : null;
        let dstLoc = item.destination_location_id ? Number(item.destination_location_id) : null;

        if (!srcLoc || !dstLoc) {
            const { data: invRecords } = await supabase
                .from("inventory")
                .select("location_id")
                .eq("product_id", prodId);
            if (invRecords && invRecords.length > 0) {
                if (!srcLoc) srcLoc = invRecords[0].location_id;
                if (!dstLoc) dstLoc = (invRecords.length > 1 ? invRecords[1].location_id : invRecords[0].location_id) || 1;
            }
        }

        itemsToInsert.push({
            transfer_id: transferId,
            product_id: prodId,
            source_location_id: srcLoc || 1,
            destination_location_id: dstLoc || 2,
            requested_quantity: Number(item.requested_quantity) || 1,
            shipped_quantity: 0,
            received_quantity: 0
        });
    }

    const { error: itemsErr } = await supabase
        .from("stock_transfer_items")
        .insert(itemsToInsert);

    if (itemsErr) {
        await supabase.from("stock_transfers").delete().eq("transfer_id", transferId);
        throw new Error(`Failed to create stock transfer items: ${itemsErr.message}`);
    }

    return getTransferById(transferId);
}

/**
 * Update stock transfer status with inventory adjustments on ship/complete.
 */
async function updateTransferStatus(transferId, newStatus, options = {}) {
    if (!transferId || isNaN(Number(transferId))) {
        const err = new Error("Valid transferId is required");
        err.statusCode = 400;
        throw err;
    }

    const upperStatus = String(newStatus).toUpperCase();
    const current = await getTransferById(Number(transferId));

    if (!current) {
        const err = new Error(`Stock transfer #${transferId} not found`);
        err.statusCode = 404;
        throw err;
    }

    const allowed = VALID_TRANSFER_TRANSITIONS[current.status] || [];
    if (!allowed.includes(upperStatus)) {
        const err = new Error(`Invalid transfer status transition from '${current.status}' to '${upperStatus}'. Allowed: ${allowed.join(", ") || "None"}`);
        err.statusCode = 400;
        throw err;
    }

    const now = new Date().toISOString();
    const updatePayload = {
        status: upperStatus
    };

    const actorId = Number(options.approved_by || options.performed_by || options.user_id) || 1;

    if (upperStatus === "APPROVED") {
        updatePayload.approved_by = actorId;
        updatePayload.approved_at = now;
    }

    const { error: updateErr } = await supabase
        .from("stock_transfers")
        .update(updatePayload)
        .eq("transfer_id", Number(transferId));

    if (updateErr) {
        throw new Error(`Failed to update transfer status: ${updateErr.message}`);
    }

    // When status changes to IN_TRANSIT, decrement stock at source warehouse
    if (upperStatus === "IN_TRANSIT") {
        for (const item of current.items) {
            const shipQty = item.requested_quantity;
            await supabase
                .from("stock_transfer_items")
                .update({ shipped_quantity: shipQty })
                .eq("transfer_item_id", item.transfer_item_id);

            const { data: invRecords } = await supabase
                .from("inventory")
                .select("inventory_id, quantity_on_hand, quantity_reserved, quantity_available, location_id")
                .eq("product_id", item.product_id);

            if (invRecords && invRecords.length > 0) {
                const inv = invRecords[0];
                const newOnHand = Math.max(0, inv.quantity_on_hand - shipQty);
                const newAvail = Math.max(0, newOnHand - (inv.quantity_reserved || 0));

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
                        transaction_type: "TRANSFER_OUT",
                        quantity: shipQty,
                        reference_type: "TRANSFER",
                        reference_id: current.transfer_id,
                        performed_by: actorId,
                        transaction_time: now,
                        notes: `Stock dispatched for transfer ${current.transfer_number}`
                    });
            }
        }
    }

    // When status changes to COMPLETED, increment stock at destination warehouse
    if (upperStatus === "COMPLETED") {
        for (const item of current.items) {
            const recvQty = item.shipped_quantity || item.requested_quantity;
            await supabase
                .from("stock_transfer_items")
                .update({ received_quantity: recvQty })
                .eq("transfer_item_id", item.transfer_item_id);

            const { data: invRecords } = await supabase
                .from("inventory")
                .select("inventory_id, quantity_on_hand, quantity_reserved, quantity_available, location_id")
                .eq("product_id", item.product_id);

            if (invRecords && invRecords.length > 0) {
                const inv = invRecords[0];
                const newOnHand = inv.quantity_on_hand + recvQty;
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
                        transaction_type: "TRANSFER_IN",
                        quantity: recvQty,
                        reference_type: "TRANSFER",
                        reference_id: current.transfer_id,
                        performed_by: actorId,
                        transaction_time: now,
                        notes: `Stock received from transfer ${current.transfer_number}`
                    });
            }
        }
    }

    return getTransferById(Number(transferId));
}

module.exports = {
    getTransfers,
    getTransferById,
    createTransfer,
    updateTransferStatus,
    VALID_TRANSFER_TRANSITIONS
};
