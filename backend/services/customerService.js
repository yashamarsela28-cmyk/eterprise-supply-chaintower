const supabase = require("../config/supabase");

const CUSTOMER_LIST_SELECT = `
    customer_id,
    customer_code,
    customer_name,
    email,
    phone,
    address,
    city,
    state,
    country,
    customer_type,
    credit_limit,
    status,
    created_at
`;

const CUSTOMER_DETAIL_SELECT = `
    customer_id,
    customer_code,
    customer_name,
    email,
    phone,
    address,
    city,
    state,
    country,
    customer_type,
    credit_limit,
    status,
    created_at,
    sales_orders (
        sales_order_id,
        order_number,
        order_date,
        status,
        total_amount
    ),
    invoices (
        invoice_id,
        invoice_number,
        invoice_date,
        due_date,
        total_amount,
        paid_amount,
        status
    )
`;

function formatCustomerListItem(row) {
    return {
        customer_id: row.customer_id,
        customer_code: row.customer_code,
        customer_name: row.customer_name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        city: row.city,
        state: row.state,
        country: row.country,
        customer_type: row.customer_type,
        credit_limit: row.credit_limit,
        status: row.status,
        created_at: row.created_at
    };
}

function formatCustomerDetail(row) {
    const salesOrders = Array.isArray(row.sales_orders)
        ? row.sales_orders.map(so => ({
            sales_order_id: so.sales_order_id,
            order_number: so.order_number,
            order_date: so.order_date,
            status: so.status,
            total_amount: so.total_amount
        }))
        : [];

    const invoices = Array.isArray(row.invoices)
        ? row.invoices.map(inv => {
            const total = Number(inv.total_amount) || 0;
            const paid = Number(inv.paid_amount) || 0;
            return {
                invoice_id: inv.invoice_id,
                invoice_number: inv.invoice_number,
                invoice_date: inv.invoice_date,
                due_date: inv.due_date,
                total_amount: total,
                paid_amount: paid,
                outstanding_amount: Math.max(0, total - paid),
                status: inv.status
            };
        })
        : [];

    const totalOrders = salesOrders.length;
    const totalOrderValue = salesOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.outstanding_amount, 0);

    return {
        ...formatCustomerListItem(row),
        summary: {
            total_orders: totalOrders,
            total_order_value: totalOrderValue,
            total_invoiced: totalInvoiced,
            total_paid: totalPaid,
            total_outstanding: totalOutstanding
        },
        sales_orders: salesOrders,
        invoices
    };
}

async function getCustomers(options = {}) {
    const { limit, offset, search } = options;

    let query = supabase
        .from("customers")
        .select(CUSTOMER_LIST_SELECT, { count: "exact" });

    if (search) {
        query = query.or(`customer_name.ilike.%${search}%,customer_code.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (limit !== undefined && offset !== undefined) {
        query = query.range(offset, offset + limit - 1);
    }

    query = query.order("customer_id", { ascending: true });

    const { data, error, count } = await query;

    if (error) {
        throw new Error(`Customers query failed: ${error.message}`);
    }

    return {
        items: data.map(formatCustomerListItem),
        total: count
    };
}

async function getCustomerById(customerId) {
    const { data, error } = await supabase
        .from("customers")
        .select(CUSTOMER_DETAIL_SELECT)
        .eq("customer_id", customerId)
        .maybeSingle();

    if (error) {
        throw new Error(`Customer query failed: ${error.message}`);
    }

    return data ? formatCustomerDetail(data) : null;
}

module.exports = { getCustomers, getCustomerById };
