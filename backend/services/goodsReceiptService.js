const supabase = require("../config/supabase");

const GOODS_RECEIPT_SELECT = `
    goods_receipt_id,
    grn_number,
    purchase_order_id,
    warehouse_id,
    received_by,
    received_date,
    status,
    notes,
    purchase_orders (
        purchase_order_id,
        po_number,
        supplier_id,
        status,
        suppliers (
            supplier_id,
            supplier_code,
            supplier_name
        )
    ),
    warehouses (
        warehouse_id,
        warehouse_code,
        warehouse_name
    ),
    goods_receipt_items (
        goods_receipt_item_id,
        product_id,
        ordered_quantity,
        received_quantity,
        accepted_quantity,
        damaged_quantity,
        notes,
        products (
            product_id,
            sku,
            product_name
        )
    )
`;

function formatGoodsReceiptItem(item) {
    return {
        goods_receipt_item_id: item.goods_receipt_item_id,
        product_id: item.product_id,
        sku: item.products?.sku || null,
        product_name: item.products?.product_name || null,
        ordered_quantity: item.ordered_quantity,
        received_quantity: item.received_quantity,
        accepted_quantity: item.accepted_quantity,
        damaged_quantity: item.damaged_quantity,
        notes: item.notes
    };
}

function formatGoodsReceipt(row) {
    const items = Array.isArray(row.goods_receipt_items)
        ? row.goods_receipt_items.map(formatGoodsReceiptItem)
        : [];

    return {
        goods_receipt_id: row.goods_receipt_id,
        grn_number: row.grn_number,
        purchase_order_id: row.purchase_order_id,
        po_number: row.purchase_orders?.po_number || null,
        po_status: row.purchase_orders?.status || null,
        supplier_id: row.purchase_orders?.supplier_id || null,
        supplier_code: row.purchase_orders?.suppliers?.supplier_code || null,
        supplier_name: row.purchase_orders?.suppliers?.supplier_name || null,
        warehouse_id: row.warehouse_id,
        warehouse_code: row.warehouses?.warehouse_code || null,
        warehouse_name: row.warehouses?.warehouse_name || null,
        received_by: row.received_by,
        received_date: row.received_date,
        status: row.status,
        notes: row.notes,
        items
    };
}

async function getGoodsReceipts(options = {}) {
    const { limit, offset, status, search } = options;

    let query = supabase
        .from("goods_receipts")
        .select(GOODS_RECEIPT_SELECT, { count: "exact" });

    if (status) {
        query = query.eq("status", status.toUpperCase());
    }

    if (search) {
        query = query.or(`grn_number.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    if (limit !== undefined && offset !== undefined) {
        query = query.range(offset, offset + limit - 1);
    }

    query = query.order("goods_receipt_id", { ascending: true });

    const { data, error, count } = await query;

    if (error) {
        throw new Error(`Goods receipts query failed: ${error.message}`);
    }

    return {
        items: (data || []).map(formatGoodsReceipt),
        total: count || 0
    };
}

async function getGoodsReceiptById(receiptId) {
    const { data, error } = await supabase
        .from("goods_receipts")
        .select(GOODS_RECEIPT_SELECT)
        .eq("goods_receipt_id", Number(receiptId))
        .maybeSingle();

    if (error) {
        throw new Error(`Goods receipt query failed: ${error.message}`);
    }

    return data ? formatGoodsReceipt(data) : null;
}

/**
 * Create a Goods Receipt against a Purchase Order, updating inventory and PO status atomically.
 */
async function createGoodsReceipt(params) {
    const {
        purchase_order_id,
        warehouse_id,
        received_by = 1,
        notes = "",
        items
    } = params;

    if (!purchase_order_id || isNaN(Number(purchase_order_id))) {
        const err = new Error("Valid purchase_order_id is required");
        err.statusCode = 400;
        throw err;
    }
    if (!warehouse_id || isNaN(Number(warehouse_id))) {
        const err = new Error("Valid warehouse_id is required");
        err.statusCode = 400;
        throw err;
    }
    if (!Array.isArray(items) || items.length === 0) {
        const err = new Error("Goods receipt must contain at least one item");
        err.statusCode = 400;
        throw err;
    }

    // 1. Verify PO exists
    const { data: po, error: poErr } = await supabase
        .from("purchase_orders")
        .select("purchase_order_id, po_number, status, warehouse_id, purchase_order_items(*)")
        .eq("purchase_order_id", Number(purchase_order_id))
        .maybeSingle();

    if (poErr || !po) {
        const err = new Error(`Purchase order #${purchase_order_id} not found`);
        err.statusCode = 404;
        throw err;
    }

    if (["RECEIVED", "CANCELLED"].includes(po.status)) {
        const err = new Error(`Cannot receive goods against purchase order with status '${po.status}'`);
        err.statusCode = 400;
        throw err;
    }

    const grnNumber = `GRN-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const userId = Number(received_by) || 1;
    const targetWarehouseId = Number(warehouse_id) || po.warehouse_id || 1;

    // 2. Create Goods Receipt (valid statuses: 'ACCEPTED', 'PARTIAL', 'INSPECTING')
    const { data: grnData, error: grnErr } = await supabase
        .from("goods_receipts")
        .insert({
            grn_number: grnNumber,
            purchase_order_id: Number(purchase_order_id),
            warehouse_id: targetWarehouseId,
            received_by: userId,
            received_date: now,
            status: "ACCEPTED",
            notes: notes || null
        })
        .select("goods_receipt_id")
        .single();

    if (grnErr) {
        throw new Error(`Failed to create goods receipt: ${grnErr.message}`);
    }

    const grnId = grnData.goods_receipt_id;

    // 3. Process each line item
    const grnItemsToInsert = [];

    for (const item of items) {
        const productId = Number(item.product_id);
        const orderedQty = Number(item.ordered_quantity) || 0;
        const receivedQty = Number(item.received_quantity) || 0;
        const acceptedQty = item.accepted_quantity !== undefined ? Number(item.accepted_quantity) : receivedQty;
        const damagedQty = Number(item.damaged_quantity) || 0;

        if (!productId || isNaN(productId)) {
            continue;
        }

        grnItemsToInsert.push({
            goods_receipt_id: grnId,
            product_id: productId,
            ordered_quantity: orderedQty,
            received_quantity: receivedQty,
            accepted_quantity: acceptedQty,
            damaged_quantity: damagedQty,
            notes: item.notes || ""
        });

        // Update PO item received quantity
        const matchingPoItem = (po.purchase_order_items || []).find(pi => pi.product_id === productId);
        if (matchingPoItem) {
            const newPoItemReceived = (matchingPoItem.received_quantity || 0) + receivedQty;
            await supabase
                .from("purchase_order_items")
                .update({ received_quantity: newPoItemReceived })
                .eq("purchase_order_item_id", matchingPoItem.purchase_order_item_id);
        }

        // Increment Inventory for accepted quantity
        if (acceptedQty > 0) {
            const { data: invRecords } = await supabase
                .from("inventory")
                .select("inventory_id, quantity_on_hand, quantity_reserved, quantity_available, location_id")
                .eq("product_id", productId);

            let targetInv = invRecords && invRecords.length > 0 ? invRecords[0] : null;

            if (targetInv) {
                const newOnHand = (targetInv.quantity_on_hand || 0) + acceptedQty;
                const reserved = targetInv.quantity_reserved || 0;
                const newAvail = newOnHand - reserved;

                await supabase
                    .from("inventory")
                    .update({
                        quantity_on_hand: newOnHand,
                        last_counted_at: now,
                        updated_at: now
                    })
                    .eq("inventory_id", targetInv.inventory_id);

                // Insert inventory transaction record
                await supabase
                    .from("inventory_transactions")
                    .insert({
                        product_id: productId,
                        location_id: targetInv.location_id,
                        transaction_type: "RECEIPT",
                        quantity: acceptedQty,
                        reference_type: "PURCHASE_ORDER",
                        reference_id: po.purchase_order_id,
                        performed_by: userId,
                        transaction_time: now,
                        notes: `Goods received against PO ${po.po_number} (GRN: ${grnNumber})`
                    });
            }
        }
    }

    // Insert GRN items
    if (grnItemsToInsert.length > 0) {
        const { error: itemsErr } = await supabase
            .from("goods_receipt_items")
            .insert(grnItemsToInsert);

        if (itemsErr) {
            console.error("Warning: Failed to insert goods receipt items:", itemsErr.message);
        }
    }

    // 4. Update PO status (PARTIALLY_RECEIVED or RECEIVED)
    const { data: updatedPoItems } = await supabase
        .from("purchase_order_items")
        .select("ordered_quantity, received_quantity")
        .eq("purchase_order_id", Number(purchase_order_id));

    let allFullyReceived = true;
    let anyReceived = false;

    if (updatedPoItems && updatedPoItems.length > 0) {
        for (const pi of updatedPoItems) {
            if ((pi.received_quantity || 0) < pi.ordered_quantity) {
                allFullyReceived = false;
            }
            if ((pi.received_quantity || 0) > 0) {
                anyReceived = true;
            }
        }
    }

    const nextPoStatus = allFullyReceived ? "RECEIVED" : (anyReceived ? "PARTIALLY_RECEIVED" : po.status);
    await supabase
        .from("purchase_orders")
        .update({ status: nextPoStatus })
        .eq("purchase_order_id", Number(purchase_order_id));

    return getGoodsReceiptById(grnId);
}

module.exports = {
    getGoodsReceipts,
    getGoodsReceiptById,
    createGoodsReceipt
};
