const supabase = require("../config/supabase");

const PRODUCT_LIST_SELECT = `
    product_id,
    sku,
    product_name,
    category_id,
    brand_id,
    description,
    unit_price,
    weight_kg,
    reorder_level,
    status,
    created_at,
    categories (
        category_id,
        category_name
    ),
    brands (
        brand_id,
        brand_name
    )
`;

const PRODUCT_DETAIL_SELECT = `
    product_id,
    sku,
    product_name,
    category_id,
    brand_id,
    description,
    unit_price,
    weight_kg,
    reorder_level,
    status,
    created_at,
    categories (
        category_id,
        category_name,
        description
    ),
    brands (
        brand_id,
        brand_name,
        description
    ),
    supplier_products (
        supplier_product_id,
        supplier_id,
        supplier_sku,
        supplier_price,
        minimum_order_quantity,
        lead_time_days,
        is_preferred,
        suppliers (
            supplier_id,
            supplier_code,
            supplier_name,
            supplier_rating
        )
    ),
    inventory (
        inventory_id,
        location_id,
        quantity_on_hand,
        quantity_reserved,
        quantity_available,
        reorder_level,
        storage_locations (
            location_id,
            rack_number,
            shelf_number,
            bin_number,
            warehouse_zones (
                zone_id,
                zone_code,
                zone_name,
                warehouses (
                    warehouse_id,
                    warehouse_code,
                    warehouse_name
                )
            )
        )
    )
`;

function formatProductListItem(row) {
    return {
        product_id: row.product_id,
        sku: row.sku,
        product_name: row.product_name,
        category_id: row.category_id,
        category_name: row.categories?.category_name || null,
        brand_id: row.brand_id,
        brand_name: row.brands?.brand_name || null,
        description: row.description,
        unit_price: row.unit_price,
        weight_kg: row.weight_kg,
        reorder_level: row.reorder_level,
        status: row.status,
        created_at: row.created_at
    };
}

function formatProductDetail(row) {
    const suppliers = Array.isArray(row.supplier_products)
        ? row.supplier_products.map(sp => ({
            supplier_product_id: sp.supplier_product_id,
            supplier_id: sp.supplier_id,
            supplier_code: sp.suppliers?.supplier_code || null,
            supplier_name: sp.suppliers?.supplier_name || null,
            supplier_rating: sp.suppliers?.supplier_rating ?? null,
            supplier_sku: sp.supplier_sku,
            supplier_price: sp.supplier_price,
            minimum_order_quantity: sp.minimum_order_quantity,
            lead_time_days: sp.lead_time_days,
            is_preferred: sp.is_preferred
        }))
        : [];

    const inventory = Array.isArray(row.inventory)
        ? row.inventory.map(inv => {
            const loc = inv.storage_locations || {};
            const zone = loc.warehouse_zones || {};
            const wh = zone.warehouses || {};
            return {
                inventory_id: inv.inventory_id,
                location_id: inv.location_id,
                warehouse_id: wh.warehouse_id || null,
                warehouse_code: wh.warehouse_code || null,
                warehouse_name: wh.warehouse_name || null,
                zone_id: zone.zone_id || null,
                zone_code: zone.zone_code || null,
                zone_name: zone.zone_name || null,
                rack_number: loc.rack_number || null,
                shelf_number: loc.shelf_number || null,
                bin_number: loc.bin_number || null,
                quantity_on_hand: inv.quantity_on_hand,
                quantity_reserved: inv.quantity_reserved,
                quantity_available: inv.quantity_available,
                reorder_level: inv.reorder_level
            };
        })
        : [];

    return {
        product_id: row.product_id,
        sku: row.sku,
        product_name: row.product_name,
        category_id: row.category_id,
        category_name: row.categories?.category_name || null,
        brand_id: row.brand_id,
        brand_name: row.brands?.brand_name || null,
        description: row.description,
        unit_price: row.unit_price,
        weight_kg: row.weight_kg,
        reorder_level: row.reorder_level,
        status: row.status,
        created_at: row.created_at,
        category: row.categories || null,
        brand: row.brands || null,
        suppliers,
        inventory
    };
}

async function getProducts(options = {}) {
    const { limit, offset, search } = options;

    let query = supabase
        .from("products")
        .select(PRODUCT_LIST_SELECT, { count: "exact" });

    // Apply search filter if provided
    if (search) {
        query = query.or(`product_name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    // Apply pagination if provided
    if (limit !== undefined && offset !== undefined) {
        query = query.range(offset, offset + limit - 1);
    }

    query = query.order("product_id", { ascending: true });

    const { data, error, count } = await query;

    if (error) {
        throw new Error(`Products query failed: ${error.message}`);
    }

    return {
        items: data.map(formatProductListItem),
        total: count
    };
}

async function getProductById(productId) {
    const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_DETAIL_SELECT)
        .eq("product_id", productId)
        .maybeSingle();

    if (error) {
        throw new Error(`Product query failed: ${error.message}`);
    }

    return data ? formatProductDetail(data) : null;
}

module.exports = { getProducts, getProductById };
