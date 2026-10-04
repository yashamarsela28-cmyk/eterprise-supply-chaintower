const supabase = require("../config/supabase");

const SUPPLIER_LIST_SELECT = `
    supplier_id,
    supplier_code,
    supplier_name,
    contact_person,
    email,
    phone,
    address,
    city,
    state,
    country,
    supplier_rating,
    status,
    created_at
`;

const SUPPLIER_DETAIL_SELECT = `
    supplier_id,
    supplier_code,
    supplier_name,
    contact_person,
    email,
    phone,
    address,
    city,
    state,
    country,
    supplier_rating,
    status,
    created_at,
    supplier_products (
        supplier_product_id,
        product_id,
        supplier_sku,
        supplier_price,
        minimum_order_quantity,
        lead_time_days,
        is_preferred,
        products (
            product_id,
            sku,
            product_name
        )
    ),
    purchase_orders (
        purchase_order_id,
        po_number,
        order_date,
        expected_delivery_date,
        status,
        total_amount
    )
`;

function formatSupplierListItem(row) {
    return {
        supplier_id: row.supplier_id,
        supplier_code: row.supplier_code,
        supplier_name: row.supplier_name,
        contact_person: row.contact_person,
        email: row.email,
        phone: row.phone,
        address: row.address,
        city: row.city,
        state: row.state,
        country: row.country,
        supplier_rating: row.supplier_rating,
        status: row.status,
        created_at: row.created_at
    };
}

function formatSupplierDetail(row) {
    const products = Array.isArray(row.supplier_products)
        ? row.supplier_products.map(sp => ({
            supplier_product_id: sp.supplier_product_id,
            product_id: sp.product_id,
            sku: sp.products?.sku || null,
            product_name: sp.products?.product_name || null,
            supplier_sku: sp.supplier_sku,
            supplier_price: sp.supplier_price,
            minimum_order_quantity: sp.minimum_order_quantity,
            lead_time_days: sp.lead_time_days,
            is_preferred: sp.is_preferred
        }))
        : [];

    const purchaseOrders = Array.isArray(row.purchase_orders)
        ? row.purchase_orders.map(po => ({
            purchase_order_id: po.purchase_order_id,
            po_number: po.po_number,
            order_date: po.order_date,
            expected_delivery_date: po.expected_delivery_date,
            status: po.status,
            total_amount: po.total_amount
        }))
        : [];

    return {
        ...formatSupplierListItem(row),
        products,
        purchase_orders: purchaseOrders
    };
}

async function getSuppliers(options = {}) {
    const { limit, offset, search } = options;

    let query = supabase
        .from("suppliers")
        .select(SUPPLIER_LIST_SELECT, { count: "exact" });

    if (search) {
        query = query.or(`supplier_name.ilike.%${search}%,supplier_code.ilike.%${search}%,contact_person.ilike.%${search}%`);
    }

    if (limit !== undefined && offset !== undefined) {
        query = query.range(offset, offset + limit - 1);
    }

    query = query.order("supplier_id", { ascending: true });

    const { data, error, count } = await query;

    if (error) {
        throw new Error(`Suppliers query failed: ${error.message}`);
    }

    return {
        items: data.map(formatSupplierListItem),
        total: count
    };
}

async function getSupplierById(supplierId) {
    const { data, error } = await supabase
        .from("suppliers")
        .select(SUPPLIER_DETAIL_SELECT)
        .eq("supplier_id", supplierId)
        .maybeSingle();

    if (error) {
        throw new Error(`Supplier query failed: ${error.message}`);
    }

    return data ? formatSupplierDetail(data) : null;
}

module.exports = { getSuppliers, getSupplierById };
