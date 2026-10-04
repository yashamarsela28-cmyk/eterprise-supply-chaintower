/**
 * PHASE 18 COMPREHENSIVE TRANSACTIONAL MUTATION TEST SUITE
 * Tests real PostgreSQL / Supabase write operations across all business domains.
 */
const http = require("http");

const BASE_URL = "http://localhost:5000";

function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {
                "Content-Type": "application/json"
            }
        };

        const req = http.request(options, (res) => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => {
                let parsed;
                try {
                    parsed = JSON.parse(data);
                } catch {
                    parsed = data;
                }
                resolve({ status: res.statusCode, body: parsed });
            });
        });

        req.on("error", reject);
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✓ ${message}`);
        passed++;
    } else {
        console.error(`  ✗ FAIL: ${message}`);
        failed++;
    }
}

async function runMutationTests() {
    console.log("==================================================");
    console.log("PHASE 18 TRANSACTIONAL WORKFLOWS TEST SUITE");
    console.log("==================================================\n");

    try {
        // --- 1. SALES ORDER LIFECYCLE ---
        console.log("1. Sales Order Workflow");
        const createOrderRes = await request("POST", "/api/orders", {
            customer_id: 1,
            shipping_address: "123 Test Boulevard, Suite 400, Mumbai",
            billing_address: "123 Test Boulevard, Suite 400, Mumbai",
            payment_terms: "NET_30",
            notes: "Automated regression test order",
            items: [
                { product_id: 1, ordered_quantity: 3, unit_price: 1500 },
                { product_id: 2, ordered_quantity: 2, unit_price: 2200 }
            ]
        });

        assert(createOrderRes.status === 201, `Create Sales Order HTTP 201 (Got ${createOrderRes.status})`);
        assert(createOrderRes.body.success === true, "Create Sales Order response success: true");
        const createdOrder = createOrderRes.body.data;
        assert(createdOrder && createdOrder.sales_order_id, `Sales Order created with ID: ${createdOrder?.sales_order_id}`);
        assert(createdOrder.status === "PENDING", `Sales Order initial status is PENDING (Got ${createdOrder?.status})`);
        assert(createdOrder.items && createdOrder.items.length === 2, `Sales Order contains 2 line items`);
        assert(createdOrder.total_amount > 0, `Sales Order calculated total amount: ${createdOrder?.total_amount}`);

        // Confirm Order
        const confirmOrderRes = await request("PATCH", `/api/orders/${createdOrder.sales_order_id}/confirm`);
        assert(confirmOrderRes.status === 200, "Confirm Sales Order HTTP 200");
        assert(confirmOrderRes.body.data.status === "CONFIRMED", "Sales Order status changed to CONFIRMED");

        // Invalid Transition
        const invalidOrderRes = await request("PATCH", `/api/orders/${createdOrder.sales_order_id}/status`, { status: "PENDING" });
        assert(invalidOrderRes.status === 400, `Invalid reverse status transition rejected with HTTP 400 (Got ${invalidOrderRes.status})`);

        // --- 2. INVENTORY ADJUSTMENT & RESERVATION ---
        console.log("\n2. Inventory Stock Adjustment & Reservation Workflow");
        const getInvRes = await request("GET", "/api/inventory");
        const testItem = getInvRes.body.data ? getInvRes.body.data[0] : null;
        assert(testItem !== null, "Found inventory record for mutation test");

        if (testItem) {
            const initialOnHand = testItem.quantity_on_hand;
            const adjustRes = await request("POST", `/api/inventory/${testItem.inventory_id}/adjust`, {
                quantity_change: 5,
                reason: "Automated Cycle Count Adjustment",
                transaction_type: "ADJUSTMENT_IN"
            });
            assert(adjustRes.status === 200, "Adjust Stock HTTP 200");
            assert(adjustRes.body.data.quantity_on_hand === initialOnHand + 5, `Inventory quantity_on_hand updated accurately (${initialOnHand} -> ${adjustRes.body.data.quantity_on_hand})`);

            // Negative stock over-draw validation
            const invalidAdjust = await request("POST", `/api/inventory/${testItem.inventory_id}/adjust`, {
                quantity_change: -999999,
                reason: "Illegal overdraw"
            });
            assert(invalidAdjust.status === 400, "Excessive negative adjustment rejected with HTTP 400");

            // Stock Reservation
            const reserveRes = await request("POST", `/api/inventory/${testItem.inventory_id}/reserve`, {
                quantity: 2
            });
            assert(reserveRes.status === 200, "Stock reservation HTTP 200");
            const resInv = reserveRes.body.data?.inventory || reserveRes.body.data;
            assert(resInv && resInv.quantity_reserved >= 2, "quantity_reserved updated");

            // Revert adjustment to keep data clean
            await request("POST", `/api/inventory/${testItem.inventory_id}/adjust`, {
                quantity_change: -5,
                reason: "Revert test cycle count",
                transaction_type: "ADJUSTMENT_OUT"
            });
        }

        // --- 3. PURCHASE ORDER & GOODS RECEIPT ---
        console.log("\n3. Purchase Order & Goods Receipt Workflow");
        const createPoRes = await request("POST", "/api/purchase-orders", {
            supplier_id: 1,
            warehouse_id: 1,
            notes: "Test replenishment order",
            items: [
                { product_id: 1, ordered_quantity: 10, unit_price: 1200 },
                { product_id: 2, ordered_quantity: 5, unit_price: 1800 }
            ]
        });
        assert(createPoRes.status === 201, `Create Purchase Order HTTP 201 (Got ${createPoRes.status})`);
        const createdPO = createPoRes.body.data;
        assert(createdPO && createdPO.purchase_order_id, `PO created with ID: ${createdPO?.purchase_order_id}`);
        assert(createdPO.status === "DRAFT", "PO initial status is DRAFT");

        // Submit PO
        const submitPoRes = await request("PATCH", `/api/purchase-orders/${createdPO.purchase_order_id}/submit`);
        assert(submitPoRes.status === 200, "Submit PO HTTP 200");
        assert(submitPoRes.body.data.status === "SUBMITTED", "PO status changed to SUBMITTED");

        // Approve PO
        const approvePoRes = await request("PATCH", `/api/purchase-orders/${createdPO.purchase_order_id}/approve`);
        assert(approvePoRes.status === 200, "Approve PO HTTP 200");
        assert(approvePoRes.body.data.status === "APPROVED", "PO status changed to APPROVED");

        // Create Goods Receipt against PO
        const createGrnRes = await request("POST", "/api/goods-receipts", {
            purchase_order_id: createdPO.purchase_order_id,
            warehouse_id: 1,
            notes: "Test shipment received at dock",
            items: [
                { product_id: 1, ordered_quantity: 10, received_quantity: 10, accepted_quantity: 10, damaged_quantity: 0 },
                { product_id: 2, ordered_quantity: 5, received_quantity: 5, accepted_quantity: 5, damaged_quantity: 0 }
            ]
        });
        assert(createGrnRes.status === 201, `Create Goods Receipt HTTP 201 (Got ${createGrnRes.status})`);
        const createdGRN = createGrnRes.body.data;
        assert(createdGRN && createdGRN.goods_receipt_id, `GRN created with ID: ${createdGRN?.goods_receipt_id}`);
        assert(createdGRN.status === "ACCEPTED", "GRN status is ACCEPTED");

        // Verify PO received status updated
        const verifyPoRes = await request("GET", `/api/purchase-orders/${createdPO.purchase_order_id}`);
        assert(verifyPoRes.body.data.status === "RECEIVED", `PO status updated to RECEIVED (Got ${verifyPoRes.body.data.status})`);

        // --- 4. SHIPMENT WORKFLOW ---
        console.log("\n4. Shipment & Waypoint Tracking Workflow");
        const createShpRes = await request("POST", "/api/shipments", {
            sales_order_id: createdOrder.sales_order_id,
            source_warehouse_id: 1,
            destination_address: "123 Test Boulevard, Mumbai",
            carrier_name: "BlueDart Express",
            shipping_method: "Express Air",
            shipping_cost: 450
        });
        assert(createShpRes.status === 201, `Create Shipment HTTP 201 (Got ${createShpRes.status})`);
        const createdShipment = createShpRes.body.data;
        assert(createdShipment && createdShipment.shipment_id, `Shipment created with ID: ${createdShipment?.shipment_id}`);
        assert(createdShipment.status === "CREATED", "Shipment initial status is CREATED");

        // Add Waypoint Tracking
        const addTrkRes = await request("POST", `/api/shipments/${createdShipment.shipment_id}/tracking`, {
            location: "Mumbai Airport Hub",
            description: "Scanned into sortation facility"
        });
        assert(addTrkRes.status === 201, "Add Waypoint Tracking HTTP 201");

        // Transition Shipment to IN_TRANSIT
        const inTransitRes = await request("PATCH", `/api/shipments/${createdShipment.shipment_id}/status`, {
            status: "IN_TRANSIT",
            location: "Out for delivery route 4B"
        });
        assert(inTransitRes.status === 200, "Shipment transitioned to IN_TRANSIT");

        // Transition Shipment to DELIVERED
        const deliverRes = await request("PATCH", `/api/shipments/${createdShipment.shipment_id}/status`, {
            status: "DELIVERED",
            location: "Consignee Doorstep",
            description: "Delivered and signed by recipient"
        });
        assert(deliverRes.status === 200, "Shipment transitioned to DELIVERED");

        // Verify sales order was automatically updated to DELIVERED
        const verifyOrderShp = await request("GET", `/api/orders/${createdOrder.sales_order_id}`);
        assert(verifyOrderShp.body.data.status === "DELIVERED", `Sales Order status synchronized to DELIVERED (Got ${verifyOrderShp.body.data.status})`);

        // --- 5. STOCK TRANSFER WORKFLOW ---
        console.log("\n5. Stock Transfer Workflow");
        const createTrfRes = await request("POST", "/api/transfers", {
            source_warehouse_id: 1,
            destination_warehouse_id: 2,
            notes: "Inter-facility balancing",
            items: [
                { product_id: 1, requested_quantity: 2 }
            ]
        });
        assert(createTrfRes.status === 201, `Create Stock Transfer HTTP 201 (Got ${createTrfRes.status})`);
        const createdTransfer = createTrfRes.body.data;
        assert(createdTransfer && createdTransfer.transfer_id, `Transfer created with ID: ${createdTransfer?.transfer_id}`);
        assert(createdTransfer.status === "REQUESTED", "Transfer status is REQUESTED");

        // Approve Transfer
        const approveTrfRes = await request("PATCH", `/api/transfers/${createdTransfer.transfer_id}/approve`);
        assert(approveTrfRes.status === 200, "Approve Transfer HTTP 200");
        assert(approveTrfRes.body.data.status === "APPROVED", "Transfer status changed to APPROVED");

        // Dispatch Transfer (IN_TRANSIT)
        const dispatchTrfRes = await request("PATCH", `/api/transfers/${createdTransfer.transfer_id}/dispatch`);
        assert(dispatchTrfRes.status === 200, "Dispatch Transfer HTTP 200");
        assert(dispatchTrfRes.body.data.status === "IN_TRANSIT", "Transfer status changed to IN_TRANSIT");

        // Complete Transfer (COMPLETED)
        const completeTrfRes = await request("PATCH", `/api/transfers/${createdTransfer.transfer_id}/receive`);
        assert(completeTrfRes.status === 200, "Complete Transfer HTTP 200");
        assert(completeTrfRes.body.data.status === "COMPLETED", "Transfer status changed to COMPLETED");

        // --- 6. RETURN / RMA WORKFLOW ---
        console.log("\n6. Return / RMA Workflow");
        const createRetRes = await request("POST", "/api/returns", {
            sales_order_id: createdOrder.sales_order_id,
            customer_id: 1,
            warehouse_id: 1,
            reason: "DEFECTIVE",
            notes: "Packaging damaged during transit",
            items: [
                { product_id: 1, requested_quantity: 1, condition: "DAMAGED" }
            ]
        });
        assert(createRetRes.status === 201, `Create Return HTTP 201 (Got ${createRetRes.status})`);
        const createdReturn = createRetRes.body.data;
        assert(createdReturn && createdReturn.return_id, `Return created with ID: ${createdReturn?.return_id}`);
        assert(createdReturn.status === "REQUESTED", "Return status is REQUESTED");

        // Approve Return
        const approveRetRes = await request("PATCH", `/api/returns/${createdReturn.return_id}/approve`);
        assert(approveRetRes.status === 200, "Approve Return HTTP 200");
        assert(approveRetRes.body.data.status === "APPROVED", "Return status changed to APPROVED");

        // Receive Return
        const recvRetRes = await request("PATCH", `/api/returns/${createdReturn.return_id}/receive`);
        assert(recvRetRes.status === 200, "Receive Return HTTP 200");
        assert(recvRetRes.body.data.status === "RECEIVED", "Return status changed to RECEIVED");

        // --- 7. INVOICE & PAYMENT WORKFLOW ---
        console.log("\n7. Invoice & Payment Workflow");
        const createInvRes = await request("POST", "/api/invoices", {
            sales_order_id: createdOrder.sales_order_id
        });
        assert(createInvRes.status === 201, `Generate Invoice HTTP 201 (Got ${createInvRes.status})`);
        const createdInvoice = createInvRes.body.data;
        assert(createdInvoice && createdInvoice.invoice_id, `Invoice created with ID: ${createdInvoice?.invoice_id}`);
        assert(createdInvoice.status === "ISSUED", "Invoice status is ISSUED");

        // Record Payment against Invoice
        const recordPayRes = await request("POST", "/api/payments", {
            invoice_id: createdInvoice.invoice_id,
            amount: createdInvoice.total_amount,
            payment_method: "BANK_TRANSFER",
            notes: "Full settlement"
        });
        assert(recordPayRes.status === 201, `Record Payment HTTP 201 (Got ${recordPayRes.status})`);
        const createdPayment = recordPayRes.body.data;
        assert(createdPayment && createdPayment.payment_id, `Payment recorded with ID: ${createdPayment?.payment_id}`);

        // Verify Invoice is now PAID
        const verifyInvRes = await request("GET", `/api/invoices/${createdInvoice.invoice_id}`);
        assert(verifyInvRes.body.data.status === "PAID", `Invoice status updated to PAID (Got ${verifyInvRes.body.data.status})`);
        assert(verifyInvRes.body.data.outstanding_amount === 0, `Invoice outstanding amount is 0`);

    } catch (err) {
        console.error("Test execution error:", err);
        failed++;
    }

    console.log("\n==================================================");
    console.log(`MUTATION TESTS RUN: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log("==================================================");

    if (failed > 0) {
        process.exit(1);
    }
}

runMutationTests();
