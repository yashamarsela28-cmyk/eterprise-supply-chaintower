# Enterprise Supply Chain Control Tower

A production-grade, multi-echelon enterprise supply chain management and visibility platform. The system provides end-to-end operational workflows, inventory control, procurement lifecycle, warehouse telemetry, logistics tracking, automated financials, and real-time executive analytics powered by PostgreSQL / Supabase and React.

---

## Architecture Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                      React 18 / Vite Frontend                     │
│    (Desktop-First, Operational Dashboards, Real-Time Toasts)      │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │ HTTP REST (/api)
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                     Node.js / Express Backend                     │
│  (Controllers, Business State Machines, Atomic Error Rollbacks)   │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │ Supabase Service SDK (Backend Only)
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database & Analytics                  │
│    (11 Real-Time Analytics Views, Constraints, Generated Columns) │
└───────────────────────────────────────────────────────────────────┘
```

### Key Technical Pillars
- **Zero Mock / Zero Fake Data**: Every UI action, modal form, and status transition commits real transactional mutations to PostgreSQL.
- **Relational Integrity & Atomicity**: Multi-table parent/child operations (Orders, POs, Transfers, Receipts, Returns) roll back parent headers if item validations fail.
- **PostgreSQL Constraint Compliance**: Adheres strictly to database domain checks (`chk_shipment_method`, `chk_grn_status`, `chk_return_status`, `chk_inventory_transaction_type`, `chk_invoice_status`) and generated columns (`quantity_available`, `subtotal`).
- **Backend Key Isolation**: The Supabase service role secret is strictly backend-only. The frontend interacts exclusively via standard Express REST endpoints.

---

## Directory Structure

```
├── backend/
│   ├── config/             # Supabase client & environment configuration
│   ├── controllers/        # Request handling & HTTP validation
│   ├── middleware/         # Error handling & 404 middleware
│   ├── routes/             # Express route definitions (15 route modules)
│   ├── services/           # Database transaction workflows & business logic
│   ├── tests/              # Regression (115) & Mutation (56) test suites
│   ├── package.json
│   └── server.js           # Server entry point
├── frontend/
│   ├── src/
│   │   ├── components/     # UI components (Common atoms, Page Layouts)
│   │   ├── context/        # Global Toast & Notification context
│   │   ├── hooks/          # useApiQuery, usePagination, custom hooks
│   │   ├── pages/          # 16 domain pages (Dashboard, Orders, Inventory, etc.)
│   │   ├── routes/         # Navigation hierarchy & React Router config
│   │   ├── services/       # Frontend API client & service abstractions
│   │   ├── utils/          # Formatters (currency, dates, numbers)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Environment Configuration

### Backend (`backend/.env`)
```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-supabase-service-role-key
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Development & Startup Commands

### 1. Install Dependencies
```bash
# Backend dependencies
cd backend && npm install

# Frontend dependencies
cd ../frontend && npm install
```

### 2. Run in Development Mode
```bash
# Terminal 1: Start Backend API (Port 5000)
cd backend && npm run dev

# Terminal 2: Start Frontend Dev Server (Port 5173)
cd frontend && npm run dev
```

### 3. Build for Production
```bash
# Compile optimized React production bundle
cd frontend && npm run build
```

---

## Automated Test Suites

The platform includes **196 automated backend tests** verifying read APIs, complex transactional state machines, and production smoke connectivity:

```bash
# Run all tests (Regression + Mutation + Smoke)
cd backend && npm test

# Run read regression suite (115 tests)
cd backend && npm run test:regression

# Run transactional mutation suite (56 tests)
cd backend && npm run test:mutations

# Run production smoke test suite (25 tests)
cd backend && npm run test:smoke
```

### Test Suite Highlights
- **Regression Suite (`regressionSuite.js`)**: 115 tests verifying all GET endpoints, query parameters, pagination headers, entity lookups, 400/404 boundary handling, and 11 analytics SQL views.
- **Mutation Suite (`mutationSuite.js`)**: 56 tests covering full operational lifecycles, stock adjustments, reservation limits, PO goods receipt inventory synchronization, shipment tracking waypoints, inter-warehouse transfers, RMA returns, and invoice payment reconciliations.
- **Production Smoke Suite (`productionSmokeTest.js`)**: 25 tests validating real HTTP API health, database connectivity, and production invariants.

---

## Production Cloud Deployment & CI/CD

### 1. GitHub Actions Continuous Integration
The repository includes a comprehensive CI pipeline in `.github/workflows/ci.yml` that triggers on every push and pull request to `main`:
- **Automated Dependency Installation**: Backend (`npm ci`) & Frontend (`npm ci`)
- **Backend Test Suites**: Runs regression (115), mutation (56), and production smoke (25) tests against backend API.
- **Frontend Compilation**: Verifies Vite production build (`dist/index.html` generation).
- **Docker Container Build**: Validates multi-stage Docker build for backend and frontend images.
- **Security & Secret Audit**: Scans git commit log and file tree to guarantee zero secret leakage.

### 2. Supported Cloud Deployment Targets
- **Render (Blueprint)**: 1-click infrastructure deployment using `render.yaml` (Backend Node Web Service + Frontend Static Site with SPA rewrites).
- **Railway**: Containerized backend deployment via `railway.toml`.
- **Vercel / Netlify**: Static frontend deployment with SPA routing (`frontend/vercel.json`, `frontend/public/_redirects`).
- **Docker & Docker Compose**: Multi-stage OCI containers with Alpine Linux, non-root execution (`USER node`), and Nginx reverse proxy.

For complete cloud deployment runbooks, secret configuration guides, and rollback workflows, see [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md).

---

## Production Docker Deployment

The application provides a containerized multi-stage setup with Nginx serving the frontend and Node.js Alpine executing the backend.

```bash
# 1. Populate environment configuration
cp .env.example .env

# 2. Launch containerized services with healthchecks
docker compose up --build -d

# 3. View status and logs
docker compose ps
docker compose logs -f
```

For complete production runbooks and deployment options, see [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md).

---

## Operational Workflows Supported

| Domain | Workflow Lifecycle | Inventory & Financial Effect |
| :--- | :--- | :--- |
| **Sales Orders** | `PENDING` → `CONFIRMED` → `ALLOCATED` → `PROCESSING` → `SHIPPED` → `DELIVERED` | Validates stock reservation; updates status safely |
| **Inventory Control**| `ADJUSTMENT_IN`, `ADJUSTMENT_OUT`, `DAMAGE`, `RESERVATION` | Atomically updates `quantity_on_hand` and logs `inventory_transactions` |
| **Purchase Orders** | `DRAFT` → `SUBMITTED` → `APPROVED` → `RECEIVED` | Links to Goods Receipts; auto-transitions PO status |
| **Goods Receipts** | Inbound inspection & Dock receipt generation | Increments warehouse `quantity_on_hand` with `RECEIPT` audit |
| **Shipments** | `CREATED` → `IN_TRANSIT` → `OUT_FOR_DELIVERY` → `DELIVERED` | Waypoint logging; synchronizes linked Sales Order to `DELIVERED` |
| **Stock Transfers** | `REQUESTED` → `APPROVED` → `IN_TRANSIT` → `COMPLETED` | Decrements source warehouse on dispatch; increments destination on receive |
| **Customer Returns** | `REQUESTED` → `APPROVED` → `RECEIVED` | Restocks returned goods into available warehouse inventory |
| **Invoicing & Cash** | `DRAFT` → `ISSUED` → `PARTIALLY_PAID` → `PAID` | Recalculates outstanding balances; marks `PAID` on zero balance |

---

## API Reference Summary

### Write Operations (31 Endpoints)
- `POST /api/orders` — Create order + line items
- `PATCH /api/orders/:id/status` — State transition
- `PATCH /api/orders/:id/confirm` — Confirm order
- `PATCH /api/orders/:id/cancel` — Cancel order
- `POST /api/inventory/adjust` — Adjust stock levels
- `POST /api/inventory/reserve` — Reserve inventory
- `POST /api/purchase-orders` — Create PO + items
- `PATCH /api/purchase-orders/:id/submit` — Submit PO for approval
- `PATCH /api/purchase-orders/:id/approve` — Approve PO
- `PATCH /api/purchase-orders/:id/cancel` — Cancel PO
- `POST /api/goods-receipts` — Inbound dock receipt & inventory sync
- `POST /api/shipments` — Create shipment
- `POST /api/shipments/:id/tracking` — Log telematics waypoint
- `PATCH /api/shipments/:id/status` — Transition shipment status
- `POST /api/transfers` — Create transfer request
- `PATCH /api/transfers/:id/approve` — Approve transfer
- `PATCH /api/transfers/:id/dispatch` — Dispatch & decrement source stock
- `PATCH /api/transfers/:id/receive` — Receive & increment destination stock
- `PATCH /api/transfers/:id/cancel` — Cancel transfer
- `POST /api/returns` — Create RMA request
- `PATCH /api/returns/:id/approve` — Approve RMA
- `PATCH /api/returns/:id/receive` — Receive & restock RMA
- `PATCH /api/returns/:id/reject` — Reject RMA
- `POST /api/invoices` — Generate invoice
- `PATCH /api/invoices/:id/status` — Update invoice status
- `POST /api/payments` — Record payment & update balance

### Read Operations (15 Domains & 11 Analytics Views)
- `GET /api/dashboard`
- `GET /api/analytics/dashboard`
- `GET /api/analytics/scorecard`
- `GET /api/analytics/warehouse-kpis`
- `GET /api/analytics/supplier-kpis`
- `GET /api/analytics/customer-receivables`
- `GET /api/analytics/shipment-kpis`
- `GET /api/analytics/risk`
- `GET /api/analytics/inventory-aging`
- `GET /api/analytics/warehouse-utilization`
- `GET /api/analytics/purchase-orders`
- `GET /api/analytics/returns-quality`
- `GET /api/products`, `GET /api/suppliers`, `GET /api/customers`, `GET /api/warehouses`, `GET /api/orders`, `GET /api/inventory`, `GET /api/shipments`, `GET /api/purchase-orders`, `GET /api/goods-receipts`, `GET /api/transfers`, `GET /api/invoices`, `GET /api/payments`, `GET /api/returns`.
