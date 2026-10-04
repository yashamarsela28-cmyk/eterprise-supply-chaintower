const supabase = require("../config/supabase");

const WAREHOUSE_LIST_SELECT = `
    warehouse_id,
    warehouse_code,
    warehouse_name,
    address,
    city,
    state,
    country,
    capacity_units,
    manager_id,
    status,
    created_at
`;

const WAREHOUSE_DETAIL_SELECT = `
    warehouse_id,
    warehouse_code,
    warehouse_name,
    address,
    city,
    state,
    country,
    capacity_units,
    manager_id,
    status,
    created_at,
    warehouse_zones (
        zone_id,
        zone_code,
        zone_name,
        zone_type,
        capacity_units,
        status,
        storage_locations (
            location_id,
            rack_number,
            shelf_number,
            bin_number,
            capacity_units,
            status
        )
    )
`;

function formatWarehouseListItem(row) {
    return {
        warehouse_id: row.warehouse_id,
        warehouse_code: row.warehouse_code,
        warehouse_name: row.warehouse_name,
        address: row.address,
        city: row.city,
        state: row.state,
        country: row.country,
        capacity_units: row.capacity_units,
        manager_id: row.manager_id,
        status: row.status,
        created_at: row.created_at
    };
}

function formatWarehouseDetail(row) {
    const zones = Array.isArray(row.warehouse_zones)
        ? row.warehouse_zones.map(z => {
            const locations = Array.isArray(z.storage_locations)
                ? z.storage_locations.map(loc => ({
                    location_id: loc.location_id,
                    rack_number: loc.rack_number,
                    shelf_number: loc.shelf_number,
                    bin_number: loc.bin_number,
                    capacity_units: loc.capacity_units,
                    status: loc.status
                }))
                : [];

            return {
                zone_id: z.zone_id,
                zone_code: z.zone_code,
                zone_name: z.zone_name,
                zone_type: z.zone_type,
                capacity_units: z.capacity_units,
                status: z.status,
                locations
            };
        })
        : [];

    const totalLocations = zones.reduce((sum, z) => sum + z.locations.length, 0);
    const totalZoneCapacity = zones.reduce((sum, z) => sum + (Number(z.capacity_units) || 0), 0);

    return {
        ...formatWarehouseListItem(row),
        summary: {
            total_zones: zones.length,
            total_locations: totalLocations,
            total_zone_capacity: totalZoneCapacity
        },
        zones
    };
}

async function getWarehouses() {
    const { data, error } = await supabase
        .from("warehouses")
        .select(WAREHOUSE_LIST_SELECT)
        .order("warehouse_id", { ascending: true });

    if (error) {
        throw new Error(`Warehouses query failed: ${error.message}`);
    }

    return data.map(formatWarehouseListItem);
}

async function getWarehouseById(warehouseId) {
    const { data, error } = await supabase
        .from("warehouses")
        .select(WAREHOUSE_DETAIL_SELECT)
        .eq("warehouse_id", warehouseId)
        .maybeSingle();

    if (error) {
        throw new Error(`Warehouse query failed: ${error.message}`);
    }

    return data ? formatWarehouseDetail(data) : null;
}

module.exports = { getWarehouses, getWarehouseById };
