const supabase = require("../config/supabase");

const PURCHASE_ORDER_SELECT = `
    purchase_order_id,
    po_number,
    supplier_id,
    warehouse_id,
    created_by,
    order_date,
    expected_delivery_date,
    status,
    subtotal,
    tax_amount,
    shipping_cost,
    total_amount,
    notes,
    created_at,
    suppliers (
        supplier_id,
        supplier_code,
        supplier_name,
        email,
        phone
    ),
    warehouses (
        warehouse_id,
        warehouse_code,
        warehouse_name
    ),
    purchase_order_items (
        purchase_order_item_id,
        product_id,
        ordered_quantity,
        unit_price,
        received_quantity,
        subtotal,
        products (
            product_id,
            sku,
            product_name
        )
    )
`;

const VALID_PO_TRANSITIONS = {
    DRAFT: ["SUBMITTED", "APPROVED", "CANCELLED"],
    SUBMITTED: ["APPROVED", "CANCELLED"],
    APPROVED: ["PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"],
    PARTIALLY_RECEIVED: ["RECEIVED", "CANCELLED"],
    RECEIVED: [],
    CANCELLED: []
};

function formatPurchaseOrderItem(item) {
    return {
        purchase_order_item_id: item.purchase_order_item_id,
        product_id: item.product_id,
        sku: item.products?.sku || null,
        product_name: item.products?.product_name || null,
        ordered_quantity: item.ordered_quantity,
        received_quantity: item.received_quantity || 0,
        unit_price: item.unit_price,
        subtotal: item.subtotal
    };
}

function formatPurchaseOrder(row) {
    const items = Array.isArray(row.purchase_order_items)
        ? row.purchase_order_items.map(formatPurchaseOrderItem)
        : [];

    return {
        purchase_order_id: row.purchase_order_id,
        po_number: row.po_number,
        supplier_id: row.supplier_id,
        supplier_code: row.suppliers?.supplier_code || null,
        supplier_name: row.suppliers?.supplier_name || null,
        supplier_email: row.suppliers?.email || null,
        supplier_phone: row.suppliers?.phone || null,
        warehouse_id: row.warehouse_id,
        warehouse_code: row.warehouses?.warehouse_code || null,
        warehouse_name: row.warehouses?.warehouse_name || null,
        created_by: row.created_by,
        order_date: row.order_date,
        expected_delivery_date: row.expected_delivery_date,
        status: row.status,
        subtotal: row.subtotal,
        tax_amount: row.tax_amount,
        shipping_cost: row.shipping_cost,
        total_amount: row.total_amount,
        notes: row.notes,
        created_at: row.created_at,
        items
    };
}

async function getPurchaseOrders(options = {}) {
    const { limit, offset, status, search } = options;

    let query = supabase
        .from("purchase_orders")
        .select(PURCHASE_ORDER_SELECT, { count: "exact" });

    if (status) {
        query = query.eq("status", status.toUpperCase());
    }

    if (search) {
        query = query.or(`po_number.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    if (limit !== undefined && offset !== undefined) {
        query = query.range(offset, offset + limit - 1);
    }

    query = query.order("purchase_order_id", { ascending: true });

    const { data, error, count } = await query;

    if (error) {
        throw new Error(`Purchase orders query failed: ${error.message}`);
    }

    return {
        items: (data || []).map(formatPurchaseOrder),
        total: count || 0
    };
}

async function getPurchaseOrderById(purchaseOrderId) {
    const { data, error } = await supabase
        .from("purchase_orders")
        .select(PURCHASE_ORDER_SELECT)
        .eq("purchase_order_id", Number(purchaseOrderId))
        .maybeSingle();

    if (error) {
        throw new Error(`Purchase order query failed: ${error.message}`);
    }

    return data ? formatPurchaseOrder(data) : null;
}

/**
 * Create a new Purchase Order with items atomically.
 */
async function createPurchaseOrder(params) {
    const {
        supplier_id,
        warehouse_id,
        items,
        expected_delivery_date,
        notes = "",
        created_by = 1,
        shipping_cost = 0,
        tax_amount = 0
    } = params;

    if (!supplier_id || isNaN(Number(supplier_id))) {
        const err = new Error("Valid supplier_id is required");
        err.statusCode = 400;
        throw err;
    }
    if (!warehouse_id || isNaN(Number(warehouse_id))) {
        const err = new Error("Valid warehouse_id is required");
        err.statusCode = 400;
        throw err;
    }
    if (!Array.isArray(items) || items.length === 0) {
        const err = new Error("Purchase order must contain at least one line item");
        err.statusCode = 400;
        throw err;
    }

    // Verify supplier and warehouse exist
    const { data: supplier, error: suppErr } = await supabase
        .from("suppliers")
        .select("supplier_id")
        .eq("supplier_id", Number(supplier_id))
        .maybeSingle();

    if (suppErr || !supplier) {
        const err = new Error(`Supplier #${supplier_id} not found`);
        err.statusCode = 404;
        throw err;
    }

    const { data: warehouse, error: whErr } = await supabase
        .from("warehouses")
        .select("warehouse_id")
        .eq("warehouse_id", Number(warehouse_id))
        .maybeSingle();

    if (whErr || !warehouse) {
        const err = new Error(`Warehouse #${warehouse_id} not found`);
        err.statusCode = 404;
        throw err;
    }

    // Validate items and guard against duplicate products
    const productMap = new Map();
    let subtotal = 0;

    for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const productId = Number(item.product_id);
        const qty = Number(item.ordered_quantity);
        const price = Number(item.unit_price);

        if (!productId || isNaN(productId)) {
            const err = new Error(`Item ${idx + 1}: Valid product_id is required`);
            err.statusCode = 400;
            throw err;
        }
        if (!qty || isNaN(qty) || qty <= 0) {
            const err = new Error(`Item ${idx + 1}: ordered_quantity must be greater than 0`);
            err.statusCode = 400;
            throw err;
        }
        if (isNaN(price) || price < 0) {
            const err = new Error(`Item ${idx + 1}: unit_price must be a valid non-negative number`);
            err.statusCode = 400;
            throw err;
        }

        if (productMap.has(productId)) {
            const existing = productMap.get(productId);
            existing.ordered_quantity += qty;
            subtotal += qty * price;
        } else {
            productMap.set(productId, {
                product_id: productId,
                ordered_quantity: qty,
                received_quantity: 0,
                unit_price: price
            });
            subtotal += qty * price;
        }
    }

    // Verify all products exist
    const productIds = Array.from(productMap.keys());
    const { data: existingProducts, error: prodErr } = await supabase
        .from("products")
        .select("product_id")
        .in("product_id", productIds);

    if (prodErr || !existingProducts || existingProducts.length !== productIds.length) {
        const foundIds = new Set((existingProducts || []).map(p => p.product_id));
        const missing = productIds.filter(id => !foundIds.has(id));
        const err = new Error(`Product(s) not found: ${missing.join(", ")}`);
        err.statusCode = 404;
        throw err;
    }

    const shipCost = Number(shipping_cost) || 0;
    const tax = Number(tax_amount) || 0;
    const totalAmount = Math.max(0, subtotal + shipCost + tax);

    const poNumber = `PO-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const userId = Number(created_by) || 1;

    // 1. Insert purchase order
    const { data: poData, error: poErr } = await supabase
        .from("purchase_orders")
        .insert({
            po_number: poNumber,
            supplier_id: Number(supplier_id),
            warehouse_id: Number(warehouse_id),
            created_by: userId,
            order_date: now,
            expected_delivery_date: expected_delivery_date || new Date(Date.now() + 7 * 86400000).toISOString(),
            status: "DRAFT",
            subtotal,
            tax_amount: tax,
            shipping_cost: shipCost,
            total_amount: totalAmount,
            notes: notes || null,
            created_at: now
        })
        .select("purchase_order_id")
        .single();

    if (poErr) {
        throw new Error(`Failed to create purchase order: ${poErr.message}`);
    }

    const poId = poData.purchase_order_id;

    // 2. Insert PO line items (NOTE: subtotal is GENERATED ALWAYS so omit it)
    const lineItemsToInsert = Array.from(productMap.values()).map(item => ({
        purchase_order_id: poId,
        product_id: item.product_id,
        ordered_quantity: item.ordered_quantity,
        received_quantity: 0,
        unit_price: item.unit_price
    }));

    const { error: itemsErr } = await supabase
        .from("purchase_order_items")
        .insert(lineItemsToInsert);

    if (itemsErr) {
        await supabase.from("purchase_orders").delete().eq("purchase_order_id", poId);
        throw new Error(`Failed to create purchase order items: ${itemsErr.message}`);
    }

    return getPurchaseOrderById(poId);
}

/**
 * Update Purchase Order status.
 */
async function updatePurchaseOrderStatus(poId, newStatus) {
    if (!poId || isNaN(Number(poId))) {
        const err = new Error("Valid purchaseOrderId is required");
        err.statusCode = 400;
        throw err;
    }

    const upperStatus = String(newStatus).toUpperCase();
    const current = await getPurchaseOrderById(Number(poId));

    if (!current) {
        const err = new Error(`Purchase order #${poId} not found`);
        err.statusCode = 404;
        throw err;
    }

    const allowed = VALID_PO_TRANSITIONS[current.status] || [];
    if (!allowed.includes(upperStatus)) {
        const err = new Error(`Invalid PO status transition from '${current.status}' to '${upperStatus}'. Allowed: ${allowed.join(", ") || "None"}`);
        err.statusCode = 400;
        throw err;
    }

    const { error: updateErr } = await supabase
        .from("purchase_orders")
        .update({ status: upperStatus })
        .eq("purchase_order_id", Number(poId));

    if (updateErr) {
        throw new Error(`Failed to update purchase order status: ${updateErr.message}`);
    }

    return getPurchaseOrderById(Number(poId));
}

module.exports = {
    getPurchaseOrders,
    getPurchaseOrderById,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    VALID_PO_TRANSITIONS
};
