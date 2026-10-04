const supabase = require("../config/supabase");

const ORDER_SELECT = `
    sales_order_id,
    order_number,
    customer_id,
    warehouse_id,
    order_date,
    status,
    subtotal,
    tax_amount,
    shipping_cost,
    discount_amount,
    total_amount,
    shipping_address,
    notes,
    created_at,
    customers (
        customer_id,
        customer_code,
        customer_name,
        email,
        phone
    ),
    warehouses (
        warehouse_id,
        warehouse_code,
        warehouse_name
    ),
    sales_order_items (
        sales_order_item_id,
        product_id,
        ordered_quantity,
        fulfilled_quantity,
        unit_price,
        subtotal,
        discount_amount,
        products (
            product_id,
            sku,
            product_name
        )
    )
`;

const VALID_ORDER_TRANSITIONS = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["ALLOCATED", "PROCESSING", "CANCELLED"],
    ALLOCATED: ["PROCESSING", "SHIPPED", "CANCELLED"],
    PROCESSING: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: []
};

/**
 * Format a sales order line item row.
 */
function formatOrderItem(item) {
    return {
        sales_order_item_id: item.sales_order_item_id,
        product_id: item.product_id,
        sku: item.products?.sku || null,
        product_name: item.products?.product_name || null,
        ordered_quantity: item.ordered_quantity,
        fulfilled_quantity: item.fulfilled_quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        discount_amount: item.discount_amount || 0
    };
}

/**
 * Format a sales order record with customer, warehouse, and line items.
 */
function formatOrder(row) {
    return {
        sales_order_id: row.sales_order_id,
        order_number: row.order_number,
        customer_id: row.customer_id,
        customer_code: row.customers?.customer_code || null,
        customer_name: row.customers?.customer_name || null,
        customer_email: row.customers?.email || null,
        customer_phone: row.customers?.phone || null,
        warehouse_id: row.warehouse_id,
        warehouse_code: row.warehouses?.warehouse_code || null,
        warehouse_name: row.warehouses?.warehouse_name || null,
        order_date: row.order_date,
        status: row.status,
        subtotal: row.subtotal,
        tax_amount: row.tax_amount,
        shipping_cost: row.shipping_cost,
        discount_amount: row.discount_amount,
        total_amount: row.total_amount,
        shipping_address: row.shipping_address,
        notes: row.notes,
        created_at: row.created_at,
        items: Array.isArray(row.sales_order_items)
            ? row.sales_order_items.map(formatOrderItem)
            : []
    };
}

/**
 * Fetch all sales orders with customer, warehouse, and item details.
 */
async function getOrders(options = {}) {
    const { limit, offset, status, search } = options;

    let query = supabase
        .from("sales_orders")
        .select(ORDER_SELECT, { count: "exact" });

    if (status) {
        query = query.eq("status", status.toUpperCase());
    }

    if (search) {
        query = query.or(`order_number.ilike.%${search}%,shipping_address.ilike.%${search}%`);
    }

    if (limit !== undefined && offset !== undefined) {
        query = query.range(offset, offset + limit - 1);
    }

    query = query.order("sales_order_id", { ascending: true });

    const { data, error, count } = await query;

    if (error) {
        throw new Error(`Orders query failed: ${error.message}`);
    }

    return {
        items: (data || []).map(formatOrder),
        total: count || 0
    };
}

/**
 * Fetch a single sales order by ID.
 */
async function getOrderById(orderId) {
    const { data, error } = await supabase
        .from("sales_orders")
        .select(ORDER_SELECT)
        .eq("sales_order_id", Number(orderId))
        .maybeSingle();

    if (error) {
        throw new Error(`Order query failed: ${error.message}`);
    }

    return data ? formatOrder(data) : null;
}

/**
 * Create a new sales order with line items atomically.
 */
async function createOrder({ customer_id, warehouse_id, items, shipping_cost = 0, tax_amount = 0, discount_amount = 0, shipping_address = "", notes = "" }) {
    if (!customer_id || isNaN(Number(customer_id))) {
        const err = new Error("Valid customer_id is required");
        err.statusCode = 400;
        throw err;
    }
    const targetWarehouseId = warehouse_id ? Number(warehouse_id) : 1;
    if (isNaN(targetWarehouseId)) {
        const err = new Error("Valid warehouse_id is required");
        err.statusCode = 400;
        throw err;
    }
    if (!Array.isArray(items) || items.length === 0) {
        const err = new Error("Order must contain at least one line item");
        err.statusCode = 400;
        throw err;
    }

    // Verify customer and warehouse exist
    const { data: customer, error: custErr } = await supabase
        .from("customers")
        .select("customer_id, address, city, state, country")
        .eq("customer_id", Number(customer_id))
        .maybeSingle();

    if (custErr || !customer) {
        const err = new Error(`Customer #${customer_id} not found`);
        err.statusCode = 404;
        throw err;
    }

    const { data: warehouse, error: whErr } = await supabase
        .from("warehouses")
        .select("warehouse_id")
        .eq("warehouse_id", targetWarehouseId)
        .maybeSingle();

    if (whErr || !warehouse) {
        const err = new Error(`Warehouse #${warehouse_id} not found`);
        err.statusCode = 404;
        throw err;
    }

    // Validate items and guard against duplicate products in the same order
    const productMap = new Map();
    let subtotal = 0;

    for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const productId = Number(item.product_id);
        const qty = Number(item.ordered_quantity);
        const price = Number(item.unit_price);
        const discount = Number(item.discount_amount) || 0;

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
            // Aggregate quantity if same product passed multiple times
            const existing = productMap.get(productId);
            existing.ordered_quantity += qty;
            existing.discount_amount += discount;
            subtotal += qty * price;
        } else {
            productMap.set(productId, {
                product_id: productId,
                ordered_quantity: qty,
                fulfilled_quantity: 0,
                unit_price: price,
                discount_amount: discount
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
    const discount = Number(discount_amount) || 0;
    const totalAmount = Math.max(0, subtotal + shipCost + tax - discount);

    const orderNumber = `SO-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const resolvedAddress = shipping_address || [customer.address, customer.city, customer.state, customer.country].filter(Boolean).join(", ") || "Standard Delivery Address";

    // 1. Insert sales order
    const { data: orderData, error: orderErr } = await supabase
        .from("sales_orders")
        .insert({
            order_number: orderNumber,
            customer_id: Number(customer_id),
            warehouse_id: targetWarehouseId,
            order_date: now,
            status: "PENDING",
            subtotal,
            shipping_cost: shipCost,
            tax_amount: tax,
            discount_amount: discount,
            total_amount: totalAmount,
            shipping_address: resolvedAddress,
            notes: notes || null,
            created_by: 1
        })
        .select("sales_order_id")
        .single();

    if (orderErr) {
        throw new Error(`Failed to create sales order: ${orderErr.message}`);
    }

    const salesOrderId = orderData.sales_order_id;

    // 2. Insert line items (NOTE: subtotal is GENERATED ALWAYS so omit it)
    const lineItemsToInsert = Array.from(productMap.values()).map(item => ({
        sales_order_id: salesOrderId,
        product_id: item.product_id,
        ordered_quantity: item.ordered_quantity,
        fulfilled_quantity: 0,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount
    }));

    const { error: itemsErr } = await supabase
        .from("sales_order_items")
        .insert(lineItemsToInsert);

    if (itemsErr) {
        // Rollback sales order on line items failure
        await supabase.from("sales_orders").delete().eq("sales_order_id", salesOrderId);
        throw new Error(`Failed to create sales order items: ${itemsErr.message}`);
    }

    return getOrderById(salesOrderId);
}

/**
 * Update the lifecycle status of a sales order with state machine validation.
 */
async function updateOrderStatus(orderId, newStatus, reason) {
    if (!orderId || isNaN(Number(orderId))) {
        const err = new Error("Valid orderId is required");
        err.statusCode = 400;
        throw err;
    }

    const upperStatus = String(newStatus).toUpperCase();
    const currentOrder = await getOrderById(Number(orderId));

    if (!currentOrder) {
        const err = new Error(`Sales order #${orderId} not found`);
        err.statusCode = 404;
        throw err;
    }

    const currentStatus = currentOrder.status;
    const allowed = VALID_ORDER_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(upperStatus)) {
        const err = new Error(`Invalid status transition from '${currentStatus}' to '${upperStatus}'. Allowed transitions: ${allowed.join(", ") || "None"}`);
        err.statusCode = 400;
        throw err;
    }

    const { error: updateErr } = await supabase
        .from("sales_orders")
        .update({
            status: upperStatus
        })
        .eq("sales_order_id", Number(orderId));

    if (updateErr) {
        throw new Error(`Failed to update order status: ${updateErr.message}`);
    }

    return getOrderById(Number(orderId));
}

module.exports = {
    getOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    VALID_ORDER_TRANSITIONS
};
