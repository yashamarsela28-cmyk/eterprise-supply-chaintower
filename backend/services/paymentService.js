const supabase = require("../config/supabase");

const PAYMENT_SELECT = `
    payment_id,
    invoice_id,
    payment_reference,
    payment_date,
    amount,
    payment_method,
    status,
    transaction_reference,
    notes,
    invoices (
        invoice_id,
        invoice_number,
        customer_id,
        total_amount,
        customers (
            customer_id,
            customer_code,
            customer_name
        )
    )
`;

function formatPayment(row) {
    const invoice = row.invoices || {};
    const customer = invoice.customers || {};

    return {
        payment_id: row.payment_id,
        payment_reference: row.payment_reference,
        invoice_id: row.invoice_id,
        invoice_number: invoice.invoice_number || null,
        customer_id: invoice.customer_id || null,
        customer_code: customer.customer_code || null,
        customer_name: customer.customer_name || null,
        payment_date: row.payment_date,
        amount: row.amount,
        payment_method: row.payment_method,
        status: row.status,
        transaction_reference: row.transaction_reference,
        notes: row.notes
    };
}

async function getPayments(options = {}) {
    const { limit, offset, status } = options;

    let query = supabase
        .from("payments")
        .select(PAYMENT_SELECT, { count: "exact" });

    if (status) {
        query = query.eq("status", status);
    }

    if (limit !== undefined && offset !== undefined) {
        query = query.range(offset, offset + limit - 1);
    }

    query = query.order("payment_id", { ascending: true });

    const { data, error, count } = await query;

    if (error) {
        throw new Error(`Payments query failed: ${error.message}`);
    }

    return {
        items: data.map(formatPayment),
        total: count
    };
}

async function getPaymentById(paymentId) {
    const { data, error } = await supabase
        .from("payments")
        .select(PAYMENT_SELECT)
        .eq("payment_id", paymentId)
        .maybeSingle();

    if (error) {
        throw new Error(`Payment query failed: ${error.message}`);
    }

    return data ? formatPayment(data) : null;
}

/**
 * Record a payment against an invoice and synchronize invoice status.
 */
async function recordPayment(params) {
    const {
        invoice_id,
        amount,
        payment_method = "BANK_TRANSFER",
        notes = "",
        transaction_reference
    } = params;

    if (!invoice_id || isNaN(Number(invoice_id))) {
        const err = new Error("Valid invoice_id is required");
        err.statusCode = 400;
        throw err;
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
        const err = new Error("amount must be a positive number");
        err.statusCode = 400;
        throw err;
    }

    // 1. Fetch current invoice
    const { data: invoice, error: invErr } = await supabase
        .from("invoices")
        .select("invoice_id, invoice_number, total_amount, paid_amount, status")
        .eq("invoice_id", Number(invoice_id))
        .maybeSingle();

    if (invErr || !invoice) {
        const err = new Error(`Invoice #${invoice_id} not found`);
        err.statusCode = 404;
        throw err;
    }

    const currentPaid = Number(invoice.paid_amount) || 0;
    const totalAmount = Number(invoice.total_amount) || 0;
    const newPaid = currentPaid + payAmount;
    const newStatus = newPaid >= totalAmount ? "PAID" : (newPaid > 0 ? "PARTIALLY_PAID" : invoice.status);

    const paymentRef = `PAY-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const txRef = transaction_reference || `TXN-${Date.now().toString().slice(-8)}`;
    const now = new Date().toISOString();

    // 2. Insert payment record
    const { data: payData, error: payInsertErr } = await supabase
        .from("payments")
        .insert({
            invoice_id: Number(invoice_id),
            payment_reference: paymentRef,
            payment_date: now,
            amount: payAmount,
            payment_method,
            status: "SUCCESS",
            transaction_reference: txRef,
            notes
        })
        .select("payment_id")
        .single();

    if (payInsertErr) {
        throw new Error(`Failed to record payment: ${payInsertErr.message}`);
    }

    // 3. Update invoice paid_amount and status
    const { error: invUpdateErr } = await supabase
        .from("invoices")
        .update({
            paid_amount: newPaid,
            status: newStatus
        })
        .eq("invoice_id", Number(invoice_id));

    if (invUpdateErr) {
        throw new Error(`Failed to update invoice: ${invUpdateErr.message}`);
    }

    return getPaymentById(payData.payment_id);
}

module.exports = {
    getPayments,
    getPaymentById,
    recordPayment
};
