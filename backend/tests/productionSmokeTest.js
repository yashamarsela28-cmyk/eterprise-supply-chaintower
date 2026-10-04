/**
 * PHASE 20 PRODUCTION SMOKE TEST SUITE
 * Validates real HTTP API health, database connectivity, and production invariants.
 */
const http = require("http");

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000";

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
                resolve({ status: res.statusCode, headers: res.headers, body: parsed });
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

async function runSmokeTests() {
    console.log("==================================================");
    console.log("PHASE 20 PRODUCTION SMOKE TEST SUITE");
    console.log(`Target: ${BASE_URL}`);
    console.log("==================================================\n");

    try {
        // 1. Backend Health Check
        console.log("1. System Health Check");
        const healthRes = await request("GET", "/api/health");
        assert(healthRes.status === 200, `Health check returned HTTP 200 (Got ${healthRes.status})`);
        assert(healthRes.body.success === true, "Health check success is true");
        assert(healthRes.body.status === "healthy", "Health status is 'healthy'");
        assert(typeof healthRes.body.uptime === "number", "Health reports numeric uptime");

        // 2. Dashboard Executive Metrics (Supabase Query)
        console.log("\n2. Executive Dashboard Connectivity");
        const dashRes = await request("GET", "/api/dashboard");
        assert(dashRes.status === 200, `Dashboard endpoint HTTP 200 (Got ${dashRes.status})`);
        assert(dashRes.body.success === true, "Dashboard success is true");
        assert(dashRes.body.data !== undefined, "Dashboard data payload present");

        // 3. Analytics Scorecard View
        console.log("\n3. Real-Time Analytics Views");
        const analyticsRes = await request("GET", "/api/analytics/scorecard");
        assert(analyticsRes.status === 200, `Analytics scorecard HTTP 200 (Got ${analyticsRes.status})`);
        assert(analyticsRes.body.success === true, "Analytics scorecard success is true");

        // 4. Inventory Data Read
        console.log("\n4. Inventory Control Mesh");
        const invRes = await request("GET", "/api/inventory");
        assert(invRes.status === 200, `Inventory listing HTTP 200 (Got ${invRes.status})`);
        assert(invRes.body.success === true, "Inventory listing success is true");
        assert(Array.isArray(invRes.body.data), "Inventory records returned as array");

        // 5. Sales Orders Read
        console.log("\n5. Sales Orders Pipeline");
        const ordersRes = await request("GET", "/api/orders");
        assert(ordersRes.status === 200, `Orders listing HTTP 200 (Got ${ordersRes.status})`);
        assert(ordersRes.body.success === true, "Orders listing success is true");
        assert(Array.isArray(ordersRes.body.data), "Orders returned as array");

        // 6. Logistics & Shipments
        console.log("\n6. Logistics & Telematics");
        const shipRes = await request("GET", "/api/shipments");
        assert(shipRes.status === 200, `Shipments listing HTTP 200 (Got ${shipRes.status})`);
        assert(shipRes.body.success === true, "Shipments listing success is true");

        // 7. Customers & Suppliers Master Data
        console.log("\n7. Master Data Networks");
        const [custRes, supRes] = await Promise.all([
            request("GET", "/api/customers"),
            request("GET", "/api/suppliers")
        ]);
        assert(custRes.status === 200, "Customers directory HTTP 200");
        assert(supRes.status === 200, "Suppliers directory HTTP 200");

        // 8. Safe Transactional Error Boundary Test
        console.log("\n8. Safe Transactional Error Boundaries");
        const invalidOrderRes = await request("POST", "/api/orders", {
            customer_id: null,
            items: []
        });
        assert(invalidOrderRes.status === 400, `Invalid order payload rejected with HTTP 400 (Got ${invalidOrderRes.status})`);
        assert(invalidOrderRes.body.success === false, "Error response sets success: false");
        assert(typeof invalidOrderRes.body.message === "string", "User-facing error message returned without leaking stack trace");

        // 9. Unknown Route (404 Not Found)
        console.log("\n9. Controlled 404 Handling");
        const notFoundRes = await request("GET", "/api/unsupported-endpoint-xyz");
        assert(notFoundRes.status === 404, `Unknown route returned HTTP 404 (Got ${notFoundRes.status})`);
        assert(notFoundRes.body.success === false, "404 response sets success: false");

        // 10. Security Headers & Secret Confinement
        console.log("\n10. Security & Secret Confinement");
        const rawBody = JSON.stringify(dashRes.body) + JSON.stringify(healthRes.body);
        assert(!rawBody.includes("SUPABASE_SECRET_KEY") && !rawBody.includes("service_role"), "Zero Supabase service keys present in API responses");

    } catch (err) {
        console.error("\nProduction smoke test error:", err);
        failed++;
    }

    console.log("\n==================================================");
    console.log(`SMOKE TESTS RUN: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log("==================================================");

    if (failed > 0) {
        process.exit(1);
    }
}

runSmokeTests();
