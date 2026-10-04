# Enterprise Supply Chain Control Tower — Production Deployment & Release Guide

## 1. System Architecture & Container Strategy

```
                          ┌───────────────────────────┐
                          │   Client Web Browser      │
                          └─────────────┬─────────────┘
                                        │ HTTPS:443 / HTTP:80
                                        ▼
                          ┌───────────────────────────┐
                          │  Frontend Application     │
                          │  (Vite / React 18 SPA)    │
                          │  - Static CDN / Nginx     │
                          │  - Gzip / Immutable Cache │
                          │  - Client SPA Routing     │
                          │  - /api Reverse Proxy     │
                          └─────────────┬─────────────┘
                                        │ REST API (HTTPS / HTTP:5000)
                                        ▼
                          ┌───────────────────────────┐
                          │  Backend API Service      │
                          │  (Node.js 20 Express)     │
                          │  - Unprivileged User node │
                          │  - Atomic Rollback Logic  │
                          │  - Healthcheck /api/health│
                          │  - Error Stack Masking    │
                          └─────────────┬─────────────┘
                                        │ HTTPS (Service Role Key)
                                        ▼
                          ┌───────────────────────────┐
                          │  Supabase PostgreSQL DB   │
                          │  - 11 Analytics SQL Views │
                          │  - Domain Check Contraints│
                          │  - Generated Columns      │
                          └───────────────────────────┘
```

---

## 2. Environment Variables & Secret Isolation

### 2.1 Backend Server Environment
| Variable | Required | Description | Production Example |
| :--- | :---: | :--- | :--- |
| `PORT` | Yes | Backend listening port | `5000` (or host assigned e.g. `10000`) |
| `NODE_ENV` | Yes | Runtime environment | `production` |
| `SUPABASE_URL` | Yes | Supabase PostgreSQL REST URL | `https://xyzproject.supabase.co` |
| `SUPABASE_SECRET_KEY` | Yes | Supabase Service Role Key (**Server-Side Only**) | `eyJhbGci...` |
| `CORS_ORIGIN` | Yes | Allowed frontend origin domains | `https://control-tower.onrender.com,https://app.yourdomain.com` |

### 2.2 Frontend Build Environment
| Variable | Required | Description | Production Example |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | Yes | Root API endpoint for frontend client | `https://control-tower-backend.onrender.com/api` or `/api` |

> ⚠️ **Strict Security Invariant**: Never commit `SUPABASE_SECRET_KEY` to GitHub, frontend bundles, Docker images, or client-side code. The secret role key must only be injected via cloud platform secret management or container environment variables at runtime.

---

## 3. GitHub Actions CI/CD Pipeline

The repository provides automated continuous integration in `.github/workflows/ci.yml`:

### Workflow Stages
1. **Automated Testing & Build (`backend-and-frontend-tests`)**:
   - Checks out repository with Node.js 20.
   - Installs clean dependencies via `npm ci`.
   - Executes 115 regression tests (`npm run test:regression`).
   - Executes 56 transactional mutation tests (`npm run test:mutations`).
   - Executes 25 production smoke tests (`npm run test:smoke`).
   - Compiles Vite production bundle (`npm run build`).
2. **Docker Container Verification (`docker-image-verification`)**:
   - Builds multi-stage Node.js backend Docker image.
   - Builds multi-stage Nginx frontend Docker image with `/api` routing.
3. **Security & Secret Scan (`security-and-secret-audit`)**:
   - Verifies zero JWT or Supabase secrets committed to git history or tracked files.
   - Ensures `.env` files are ignored.

---

## 4. Cloud Deployment Runbooks

### 4.1 Deploying to Render (1-Click Blueprint)
The project includes a root `render.yaml` configuration:

1. Push your repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com/), click **New > Blueprint**.
3. Connect your GitHub repository. Render reads `render.yaml` and provisions:
   - **Backend Web Service**: Node 20 runtime, runs `npm ci --omit=dev && node server.js`, health check on `/api/health`.
   - **Frontend Static Site**: Runs `npm ci && npm run build`, serves `dist/` with SPA rewrite rule.
4. Set the secret environment variables under Render Service Settings:
   - `SUPABASE_URL`: Your Supabase URL.
   - `SUPABASE_SECRET_KEY`: Your Supabase service role key.
   - `CORS_ORIGIN`: Your frontend URL (e.g. `https://control-tower-frontend.onrender.com`).
   - In Frontend Static Site: Set `VITE_API_BASE_URL` to `https://control-tower-backend.onrender.com/api`.
5. Trigger initial deployment.

### 4.2 Deploying to Railway
1. In the [Railway Dashboard](https://railway.app/), create a **New Project > Deploy from GitHub Repo**.
2. Railway detects `railway.toml` and builds the Docker container.
3. In the Railway Variables tab, configure:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `SUPABASE_URL`: `https://your-project.supabase.co`
   - `SUPABASE_SECRET_KEY`: `your-service-role-key`
   - `CORS_ORIGIN`: Your frontend domain.

### 4.3 Deploying Frontend to Vercel / Netlify
1. Connect repository to Vercel or Netlify.
2. Set Root Directory to `frontend`.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Environment Variable: `VITE_API_BASE_URL` = `https://your-backend-api.com/api`.
6. SPA rewrites are pre-configured via `frontend/vercel.json` and `frontend/public/_redirects`.

---

## 5. Local Docker Production Verification

```bash
# 1. Copy example configuration
cp .env.example .env

# 2. Add your Supabase credentials to .env, then launch services:
docker compose up --build -d

# 3. Monitor container health
docker compose ps
docker compose logs -f

# 4. Access live services:
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000/api
# Healthcheck: http://localhost:5000/api/health
```

---

## 6. Zero-Downtime Redeployment & Rollback Procedures

### 6.1 Redeploying Updates
```bash
git pull origin main
docker compose build --no-cache
docker compose up -d --remove-orphans
```

### 6.2 Rollback Procedure
```bash
# Check out previous stable release commit or tag
git checkout <PREVIOUS_COMMIT_SHA>

# Rebuild and reload services
docker compose up -d --build
```

---

## 7. Automated Production Test Verification

All 196 automated tests can be executed against any active production or staging instance:

```bash
cd backend

# Run all 196 tests
npm test

# Run individual suites
npm run test:regression   # 115 tests
npm run test:mutations    # 56 tests
npm run test:smoke        # 25 tests
```

---

## 8. Diagnostic & Troubleshooting Matrix

| Symptom | Diagnostic Command | Root Cause & Remediation |
| :--- | :--- | :--- |
| `502 Bad Gateway` on frontend | `docker compose logs frontend` | Backend container starting or unhealthy. Verify backend health endpoint `/api/health`. |
| `Missing SUPABASE_URL` | Check cloud dashboard env vars | `SUPABASE_URL` or `SUPABASE_SECRET_KEY` missing from runtime environment. |
| CORS rejected by browser | Inspect browser network tab | Add exact client origin domain to `CORS_ORIGIN` environment variable. |
| SPA Route 404 on page refresh | Check Nginx / static host config | Ensure `/* -> /index.html` rewrite rule is active (`vercel.json`, `_redirects`, or `nginx.conf`). |
