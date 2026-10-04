/**
 * Comprehensive API Regression Test Suite for Phase 15.
 * Tests all 14 domain and operational route groups with standard validation scenarios.
 */

const http = require("http");

const BASE_URL = "http://localhost:5000";

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const req = http.get(url, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, rawBody: data });
                }
            });
        });
        req.on("error", reject);
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

async function runTests() {
    console.log("==================================================");
    console.log("PHASE 15 COMPREHENSIVE API REGRESSION TEST SUITE");
    console.log("==================================================\n");

    // 1. Health check
    console.log("1. System Health Check");
    {
        const res = await makeRequest("/api/health");
        assert(res.status === 200, "Health check status 200");
        assert(res.body.success === true, "Health check success: true");
    }

    // 2. Dashboard
    console.log("\n2. Dashboard API");
    {
        const res = await makeRequest("/api/dashboard");
        assert(res.status === 200, "GET /api/dashboard status 200");
        assert(res.body.success === true, "Dashboard success: true");
    }

    // 3. Products
    console.log("\n3. Products API");
    {
        const listRes = await makeRequest("/api/products");
        assert(listRes.status === 200, "GET /api/products status 200");
        assert(listRes.body.success === true, "Products list success: true");
        assert(listRes.body.count > 0, `Products count > 0 (found ${listRes.body.count})`);

        const detailRes = await makeRequest("/api/products/1");
        assert(detailRes.status === 200, "GET /api/products/1 status 200");
        assert(detailRes.body.success === true, "Product detail success: true");
        assert(detailRes.body.data.product_id === 1, "Product ID matches");
        assert(Array.isArray(detailRes.body.data.inventory), "Product inventory is array");

        const badIdRes = await makeRequest("/api/products/abc");
        assert(badIdRes.status === 400, "GET /api/products/abc status 400");

        const notFoundRes = await makeRequest("/api/products/999999");
        assert(notFoundRes.status === 404, "GET /api/products/999999 status 404");

        const pageRes = await makeRequest("/api/products?page=1&limit=5");
        assert(pageRes.status === 200, "GET /api/products?page=1&limit=5 status 200");
        assert(pageRes.body.pagination.limit === 5, "Pagination limit applied");
    }

    // 4. Suppliers
    console.log("\n4. Suppliers API");
    {
        const listRes = await makeRequest("/api/suppliers");
        assert(listRes.status === 200, "GET /api/suppliers status 200");
        assert(listRes.body.success === true, "Suppliers list success: true");

        const detailRes = await makeRequest("/api/suppliers/1");
        assert(detailRes.status === 200, "GET /api/suppliers/1 status 200");
        assert(detailRes.body.data.supplier_id === 1, "Supplier ID matches");
        assert(Array.isArray(detailRes.body.data.products), "Supplier products is array");
        assert(Array.isArray(detailRes.body.data.purchase_orders), "Supplier POs is array");

        const badIdRes = await makeRequest("/api/suppliers/-5");
        assert(badIdRes.status === 400, "GET /api/suppliers/-5 status 400");

        const notFoundRes = await makeRequest("/api/suppliers/999999");
        assert(notFoundRes.status === 404, "GET /api/suppliers/999999 status 404");
    }

    // 5. Customers
    console.log("\n5. Customers API");
    {
        const listRes = await makeRequest("/api/customers");
        assert(listRes.status === 200, "GET /api/customers status 200");
        assert(listRes.body.success === true, "Customers list success: true");

        const detailRes = await makeRequest("/api/customers/1");
        assert(detailRes.status === 200, "GET /api/customers/1 status 200");
        assert(detailRes.body.data.customer_id === 1, "Customer ID matches");
        assert(typeof detailRes.body.data.summary === "object", "Customer summary object exists");
        assert(Array.isArray(detailRes.body.data.sales_orders), "Customer orders is array");
        assert(Array.isArray(detailRes.body.data.invoices), "Customer invoices is array");

        const badIdRes = await makeRequest("/api/customers/0");
        assert(badIdRes.status === 400, "GET /api/customers/0 status 400");

        const notFoundRes = await makeRequest("/api/customers/999999");
        assert(notFoundRes.status === 404, "GET /api/customers/999999 status 404");
    }

    // 6. Warehouses
    console.log("\n6. Warehouses API");
    {
        const listRes = await makeRequest("/api/warehouses");
        assert(listRes.status === 200, "GET /api/warehouses status 200");
        assert(listRes.body.success === true, "Warehouses list success: true");

        const detailRes = await makeRequest("/api/warehouses/1");
        assert(detailRes.status === 200, "GET /api/warehouses/1 status 200");
        assert(detailRes.body.data.warehouse_id === 1, "Warehouse ID matches");
        assert(typeof detailRes.body.data.summary === "object", "Warehouse summary exists");
        assert(Array.isArray(detailRes.body.data.zones), "Warehouse zones is array");

        const badIdRes = await makeRequest("/api/warehouses/invalid");
        assert(badIdRes.status === 400, "GET /api/warehouses/invalid status 400");

        const notFoundRes = await makeRequest("/api/warehouses/999999");
        assert(notFoundRes.status === 404, "GET /api/warehouses/999999 status 404");
    }

    // 7. Purchase Orders
    console.log("\n7. Purchase Orders API");
    {
        const listRes = await makeRequest("/api/purchase-orders");
        assert(listRes.status === 200, "GET /api/purchase-orders status 200");
        assert(listRes.body.success === true, "PO list success: true");

        const detailRes = await makeRequest("/api/purchase-orders/1");
        assert(detailRes.status === 200, "GET /api/purchase-orders/1 status 200");
        assert(detailRes.body.data.purchase_order_id === 1, "PO ID matches");
        assert(Array.isArray(detailRes.body.data.items), "PO items is array");

        const badIdRes = await makeRequest("/api/purchase-orders/xyz");
        assert(badIdRes.status === 400, "GET /api/purchase-orders/xyz status 400");

        const notFoundRes = await makeRequest("/api/purchase-orders/999999");
        assert(notFoundRes.status === 404, "GET /api/purchase-orders/999999 status 404");
    }

    // 8. Goods Receipts
    console.log("\n8. Goods Receipts API");
    {
        const listRes = await makeRequest("/api/goods-receipts");
        assert(listRes.status === 200, "GET /api/goods-receipts status 200");
        assert(listRes.body.success === true, "GRN list success: true");

        const detailRes = await makeRequest("/api/goods-receipts/1");
        assert(detailRes.status === 200, "GET /api/goods-receipts/1 status 200");
        assert(detailRes.body.data.goods_receipt_id === 1, "GRN ID matches");
        assert(Array.isArray(detailRes.body.data.items), "GRN items is array");

        const badIdRes = await makeRequest("/api/goods-receipts/abc");
        assert(badIdRes.status === 400, "GET /api/goods-receipts/abc status 400");

        const notFoundRes = await makeRequest("/api/goods-receipts/999999");
        assert(notFoundRes.status === 404, "GET /api/goods-receipts/999999 status 404");
    }

    // 9. Invoices
    console.log("\n9. Invoices API");
    {
        const listRes = await makeRequest("/api/invoices");
        assert(listRes.status === 200, "GET /api/invoices status 200");
        assert(listRes.body.success === true, "Invoices list success: true");

        const detailRes = await makeRequest("/api/invoices/1");
        assert(detailRes.status === 200, "GET /api/invoices/1 status 200");
        assert(detailRes.body.data.invoice_id === 1, "Invoice ID matches");
        assert(typeof detailRes.body.data.outstanding_amount === "number", "Outstanding amount is numeric");
        assert(Array.isArray(detailRes.body.data.payments), "Invoice payments is array");

        const badIdRes = await makeRequest("/api/invoices/test");
        assert(badIdRes.status === 400, "GET /api/invoices/test status 400");

        const notFoundRes = await makeRequest("/api/invoices/999999");
        assert(notFoundRes.status === 404, "GET /api/invoices/999999 status 404");
    }

    // 10. Payments
    console.log("\n10. Payments API");
    {
        const listRes = await makeRequest("/api/payments");
        assert(listRes.status === 200, "GET /api/payments status 200");
        assert(listRes.body.success === true, "Payments list success: true");

        const detailRes = await makeRequest("/api/payments/1");
        assert(detailRes.status === 200, "GET /api/payments/1 status 200");
        assert(detailRes.body.data.payment_id === 1, "Payment ID matches");

        const badIdRes = await makeRequest("/api/payments/abc");
        assert(badIdRes.status === 400, "GET /api/payments/abc status 400");

        const notFoundRes = await makeRequest("/api/payments/999999");
        assert(notFoundRes.status === 404, "GET /api/payments/999999 status 404");
    }

    // 11. Returns
    console.log("\n11. Returns API");
    {
        const listRes = await makeRequest("/api/returns");
        assert(listRes.status === 200, "GET /api/returns status 200");
        assert(listRes.body.success === true, "Returns list success: true");

        const detailRes = await makeRequest("/api/returns/1");
        assert(detailRes.status === 200, "GET /api/returns/1 status 200");
        assert(detailRes.body.data.return_id === 1, "Return ID matches");
        assert(Array.isArray(detailRes.body.data.items), "Return items is array");

        const badIdRes = await makeRequest("/api/returns/-1");
        assert(badIdRes.status === 400, "GET /api/returns/-1 status 400");

        const notFoundRes = await makeRequest("/api/returns/999999");
        assert(notFoundRes.status === 404, "GET /api/returns/999999 status 404");
    }

    // 12. Stock Transfers
    console.log("\n12. Stock Transfers API");
    {
        const listRes = await makeRequest("/api/transfers");
        assert(listRes.status === 200, "GET /api/transfers status 200");
        assert(listRes.body.success === true, "Transfers list success: true");

        const detailRes = await makeRequest("/api/transfers/1");
        assert(detailRes.status === 200, "GET /api/transfers/1 status 200");
        assert(detailRes.body.data.transfer_id === 1, "Transfer ID matches");
        assert(Array.isArray(detailRes.body.data.items), "Transfer items is array");

        const badIdRes = await makeRequest("/api/transfers/bad");
        assert(badIdRes.status === 400, "GET /api/transfers/bad status 400");

        const notFoundRes = await makeRequest("/api/transfers/999999");
        assert(notFoundRes.status === 404, "GET /api/transfers/999999 status 404");
    }

    // 13. Inventory
    console.log("\n13. Inventory API");
    {
        const res = await makeRequest("/api/inventory");
        assert(res.status === 200, "GET /api/inventory status 200");
        assert(res.body.success === true, "Inventory success: true");
    }

    // 14. Orders
    console.log("\n14. Orders API");
    {
        const res = await makeRequest("/api/orders");
        assert(res.status === 200, "GET /api/orders status 200");
        assert(res.body.success === true, "Orders success: true");
    }

    // 15. Shipments
    console.log("\n15. Shipments API");
    {
        const res = await makeRequest("/api/shipments");
        assert(res.status === 200, "GET /api/shipments status 200");
        assert(res.body.success === true, "Shipments success: true");
    }

    // 16. Error Handling
    console.log("\n16. Global Error Handling");
    {
        const notFoundRoute = await makeRequest("/api/does-not-exist");
        assert(notFoundRoute.status === 404, "Unknown route returns 404");
        assert(notFoundRoute.body.success === false, "Unknown route success: false");
    }

    // 17. Analytics API
    console.log("\n17. Analytics API (Supabase Views)");
    {
        const dashboard = await makeRequest("/api/analytics/dashboard");
        assert(dashboard.status === 200, "GET /api/analytics/dashboard status 200");
        assert(dashboard.body.success === true, "Analytics dashboard success: true");
        assert(typeof dashboard.body.data === "object", "Dashboard data is object");

        const scorecard = await makeRequest("/api/analytics/scorecard");
        assert(scorecard.status === 200, "GET /api/analytics/scorecard status 200");
        assert(scorecard.body.success === true, "Scorecard success: true");
        assert(typeof scorecard.body.data === "object", "Scorecard data is object");

        const whKpis = await makeRequest("/api/analytics/warehouse-kpis");
        assert(whKpis.status === 200, "GET /api/analytics/warehouse-kpis status 200");
        assert(whKpis.body.success === true, "Warehouse KPIs success: true");
        assert(Array.isArray(whKpis.body.data), "Warehouse KPIs is array");

        const supKpis = await makeRequest("/api/analytics/supplier-kpis");
        assert(supKpis.status === 200, "GET /api/analytics/supplier-kpis status 200");
        assert(supKpis.body.success === true, "Supplier KPIs success: true");

        const custRec = await makeRequest("/api/analytics/customer-receivables");
        assert(custRec.status === 200, "GET /api/analytics/customer-receivables status 200");
        assert(custRec.body.success === true, "Customer receivables success: true");

        const shipKpis = await makeRequest("/api/analytics/shipment-kpis");
        assert(shipKpis.status === 200, "GET /api/analytics/shipment-kpis status 200");
        assert(shipKpis.body.success === true, "Shipment KPIs success: true");

        const risk = await makeRequest("/api/analytics/risk");
        assert(risk.status === 200, "GET /api/analytics/risk status 200");
        assert(risk.body.success === true, "Risk KPIs success: true");

        const invAging = await makeRequest("/api/analytics/inventory-aging");
        assert(invAging.status === 200, "GET /api/analytics/inventory-aging status 200");
        assert(invAging.body.success === true, "Inventory aging success: true");

        const whUtil = await makeRequest("/api/analytics/warehouse-utilization");
        assert(whUtil.status === 200, "GET /api/analytics/warehouse-utilization status 200");
        assert(whUtil.body.success === true, "Warehouse utilization success: true");

        const poPerf = await makeRequest("/api/analytics/purchase-orders");
        assert(poPerf.status === 200, "GET /api/analytics/purchase-orders status 200");
        assert(poPerf.body.success === true, "Purchase order performance success: true");

        const retQual = await makeRequest("/api/analytics/returns-quality");
        assert(retQual.status === 200, "GET /api/analytics/returns-quality status 200");
        assert(retQual.body.success === true, "Returns quality success: true");
    }

    console.log("\n==================================================");
    console.log(`TOTAL TESTS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log("==================================================");

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch((err) => {
    console.error("Test suite runtime error:", err);
    process.exit(1);
});
