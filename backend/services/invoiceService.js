const supabase = require("../config/supabase");

const INVOICE_SELECT = `
    invoice_id,
    invoice_number,
    sales_order_id,
    customer_id,
    invoice_date,
    due_date,
    subtotal,
    tax_amount,
    discount_amount,
    total_amount,
    paid_amount,
    status,
    created_at,
    sales_orders (
        sales_order_id,
        order_number,
        order_date
    ),
    customers (
        customer_id,
        customer_code,
        customer_name,
        email,
        phone
    ),
    payments (
        payment_id,
        payment_reference,
        payment_date,
        amount,
        payment_method,
        status
    )
`;

const VALID_INVOICE_TRANSITIONS = {
    DRAFT: ["ISSUED", "CANCELLED"],
    ISSUED: ["PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"],
    PARTIALLY_PAID: ["PAID", "OVERDUE", "CANCELLED"],
    OVERDUE: ["PARTIALLY_PAID", "PAID", "CANCELLED"],
    PAID: [],
    CANCELLED: []
};

function formatInvoice(row) {
    const total = Number(row.total_amount) || 0;
    const paid = Number(row.paid_amount) || 0;
    const outstanding = Math.max(0, total - paid);

    const payments = Array.isArray(row.payments)
        ? row.payments.map(p => ({
            payment_id: p.payment_id,
            payment_reference: p.payment_reference,
            payment_date: p.payment_date,
            amount: p.amount,
            payment_method: p.payment_method,
            status: p.status
        }))
        : [];

    return {
        invoice_id: row.invoice_id,
        invoice_number: row.invoice_number,
        sales_order_id: row.sales_order_id,
        order_number: row.sales_orders?.order_number || null,
        order_date: row.sales_orders?.order_date || null,
        customer_id: row.customer_id,
        customer_code: row.customers?.customer_code || null,
        customer_name: row.customers?.customer_name || null,
        customer_email: row.customers?.email || null,
        customer_phone: row.customers?.phone || null,
        invoice_date: row.invoice_date,
        due_date: row.due_date,
        subtotal: row.subtotal,
        tax_amount: row.tax_amount,
        discount_amount: row.discount_amount,
        total_amount: total,
        paid_amount: paid,
        outstanding_amount: outstanding,
        status: row.status,
        created_at: row.created_at,
        payments
    };
}

async function getInvoices(options = {}) {
    const { limit, offset, status, search } = options;

    let query = supabase
        .from("invoices")
        .select(INVOICE_SELECT, { count: "exact" });

    if (status) {
        query = query.eq("status", status.toUpperCase());
    }

    if (search) {
        query = query.or(`invoice_number.ilike.%${search}%`);
    }

    if (limit !== undefined && offset !== undefined) {
        query = query.range(offset, offset + limit - 1);
    }

    query = query.order("invoice_id", { ascending: true });

    const { data, error, count } = await query;

    if (error) {
        throw new Error(`Invoices query failed: ${error.message}`);
    }

    return {
        items: (data || []).map(formatInvoice),
        total: count || 0
    };
}

async function getInvoiceById(invoiceId) {
    const { data, error } = await supabase
        .from("invoices")
        .select(INVOICE_SELECT)
        .eq("invoice_id", Number(invoiceId))
        .maybeSingle();

    if (error) {
        throw new Error(`Invoice query failed: ${error.message}`);
    }

    return data ? formatInvoice(data) : null;
}

/**
 * Create a new invoice against a sales order.
 */
async function createInvoice(params) {
    const {
        sales_order_id,
        due_date,
        discount_amount = 0
    } = params;

    if (!sales_order_id || isNaN(Number(sales_order_id))) {
        const err = new Error("Valid sales_order_id is required");
        err.statusCode = 400;
        throw err;
    }

    // 1. Fetch sales order
    const { data: order, error: ordErr } = await supabase
        .from("sales_orders")
        .select("sales_order_id, customer_id, subtotal, tax_amount, total_amount")
        .eq("sales_order_id", Number(sales_order_id))
        .maybeSingle();

    if (ordErr || !order) {
        const err = new Error(`Sales order #${sales_order_id} not found`);
        err.statusCode = 404;
        throw err;
    }

    const invNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const today = now.split("T")[0];
    const defaultDue = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

    const subtotal = Number(order.subtotal) || 0;
    const tax = Number(order.tax_amount) || 0;
    const discount = Number(discount_amount) || 0;
    const total = Math.max(0, subtotal + tax - discount);

    const { data: invData, error: invErr } = await supabase
        .from("invoices")
        .insert({
            invoice_number: invNumber,
            sales_order_id: Number(sales_order_id),
            customer_id: order.customer_id,
            invoice_date: today,
            due_date: due_date || defaultDue,
            subtotal,
            tax_amount: tax,
            discount_amount: discount,
            total_amount: total,
            paid_amount: 0,
            status: "ISSUED",
            created_at: now
        })
        .select("invoice_id")
        .single();

    if (invErr) {
        throw new Error(`Failed to create invoice: ${invErr.message}`);
    }

    return getInvoiceById(invData.invoice_id);
}

/**
 * Update invoice status.
 */
async function updateInvoiceStatus(invoiceId, newStatus) {
    if (!invoiceId || isNaN(Number(invoiceId))) {
        const err = new Error("Valid invoiceId is required");
        err.statusCode = 400;
        throw err;
    }

    const upperStatus = String(newStatus).toUpperCase();
    const current = await getInvoiceById(Number(invoiceId));

    if (!current) {
        const err = new Error(`Invoice #${invoiceId} not found`);
        err.statusCode = 404;
        throw err;
    }

    const allowed = VALID_INVOICE_TRANSITIONS[current.status] || [];
    if (!allowed.includes(upperStatus)) {
        const err = new Error(`Invalid invoice transition from '${current.status}' to '${upperStatus}'. Allowed: ${allowed.join(", ") || "None"}`);
        err.statusCode = 400;
        throw err;
    }

    const { error: updateErr } = await supabase
        .from("invoices")
        .update({ status: upperStatus })
        .eq("invoice_id", Number(invoiceId));

    if (updateErr) {
        throw new Error(`Failed to update invoice status: ${updateErr.message}`);
    }

    return getInvoiceById(Number(invoiceId));
}

module.exports = {
    getInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoiceStatus,
    VALID_INVOICE_TRANSITIONS
};
