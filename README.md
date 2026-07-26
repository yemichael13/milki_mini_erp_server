# Milki ERP Server

Backend API for the Milki ERP system. This service handles authentication, role-based authorization, transaction workflows, receipts, reporting, inventory operations, and system admin user management.

## What This Server Does

- Authenticates users with JWT
- Enforces role-based access control at the API layer
- Manages customers, suppliers, transactions, payments, reports, and production inventory
- Stores uploaded receipt files on disk and serves them back through static file routes
- Bootstraps a default admin account when configured
- Supports the frontend welcome page, login page, and dashboard workflows without changing the API contract

## Tech Stack

- Node.js
- Express 5
- MySQL with `mysql2/promise`
- JWT authentication
- bcrypt
- Joi validation
- Multer uploads
- Winston logging
- Helmet and CORS

## Architecture

The codebase follows a layered structure:

```text
Routes -> Controllers -> Services -> Repositories -> Database
```

- Routes define the HTTP endpoints
- Controllers handle request/response behavior
- Services hold business rules and workflow checks
- Repositories contain SQL and data access
- Middleware handles auth, roles, uploads, validation, and error formatting

## Prerequisites

- Node.js 18 or newer
- MySQL 8 or compatible
- A reachable frontend URL for CORS

## Environment Setup

Create `server/.env` from `server/.env.example` and update the values for your deployment.

### Required variables

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=mini_erp
JWT_SECRET=change-this-to-a-long-random-secret
CLIENT_URL=http://localhost:5173
```

### Optional variables

```env
JWT_EXPIRES=1d
LOG_LEVEL=info
LOG_DIR=logs
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_MIMES=image/jpeg,image/png,application/pdf
UPLOAD_DIR=uploads
DEFAULT_ADMIN_EMAIL=admin@milki.com
DEFAULT_ADMIN_PASSWORD=change-me
DEFAULT_ADMIN_NAME=System Administrator
```

Notes:

- Do not commit real secrets to version control.
- `CLIENT_URL` must match the deployed frontend origin.
- `UPLOAD_DIR` defaults to `uploads` if omitted.

## Local Development

Install dependencies:

```bash
npm install
```

Run the server in development mode:

```bash
npm run dev
```

The server listens on `PORT` from the environment file, or `5000` by default.

## Production Start

```bash
npm run start
```

Use a process manager such as PM2, systemd, Docker, or your platform’s service manager to keep the process running in production.

## Database Setup

1. Create the MySQL database defined in `DB_NAME`
2. Update the connection credentials in `server/.env`
3. Run the migration script:

```bash
node migrate.js
```

Important:

- `migrate.js` recreates the schema, so use it carefully on existing data.
- Run it on a fresh database or only when you intend to reset the schema.

## Startup Behavior

On boot, the server:

1. Connects to MySQL using the environment configuration
2. Validates or prepares the schema needed by the unified transaction model
3. Creates the default admin account when the configured admin user does not exist

## Roles and Access Control

The API recognizes these normalized roles:

- `system_admin`
- `general_manager`
- `accountant`
- `sales`
- `procurement`
- `production`

Normalization behavior:

- `admin` in the database is treated as `system_admin`
- `manager` is normalized to `general_manager`
- roles ending in `_officer` are normalized to their base role

Key rules:

- `system_admin` can manage users and admin operations
- `system_admin` is explicitly blocked from financial data endpoints
- Workflow and approval checks are enforced server-side
- Client-side UI permissions do not replace API authorization

## Workflow Summary

Transaction flow:

1. Officer creates a transaction as `pending`
2. Accountant approves it to `accountant_approved`
3. General manager approves it to `manager_approved`
4. Either accountant or manager may reject it, depending on the workflow rules

Balance rule:

- Only `manager_approved` transactions affect credit and debt calculations

## Receipt Uploads

- Uploaded receipt files are stored on disk
- The database stores file paths, not the binary file contents
- Files are served through the upload static route
- Multiple receipts can be attached to a single transaction

Allowed file types:

- `jpg`
- `jpeg`
- `png`
- `pdf`

## Core API Routes

Base path: `/api`

### Auth

- `POST /auth/login`
- `GET /auth/me`

### Users

- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PATCH /users/:id`
- `DELETE /users/:id`

### Customers

- `GET /customers`
- `GET /customers/:id`
- `POST /customers`

### Suppliers

- `GET /suppliers`
- `GET /suppliers/:id`
- `POST /suppliers`

### Transactions

- `GET /transactions`
- `GET /transactions/:id`
- `POST /transactions`
- `POST /transactions/:id/receipt`
- `POST /transactions/:id/accountant-approve`
- `POST /transactions/:id/approve`
- `POST /transactions/:id/reject`
- `POST /transactions/record-payment`

### Reports

- `GET /reports/customer-credit`
- `GET /reports/supplier-debt`
- `GET /reports/summary`

### Inventory

- `GET /inventory`
- `GET /inventory/reports`

### Admin

- `GET /admin/settings`
- `POST /admin/backups`
- `GET /admin/logs`

## Production Deployment Checklist

- Set `NODE_ENV=production`
- Point `CLIENT_URL` to the deployed frontend domain
- Use a strong random `JWT_SECRET`
- Ensure the MySQL server is reachable from the backend host
- Create writable directories for `uploads` and, if enabled, `logs`
- Configure the reverse proxy so `/api` reaches the backend and uploaded files are served correctly
- Verify the default admin credentials are changed after first login

## Logging and Operations

- HTTP requests are logged with `morgan`
- Application logs use `winston`
- Production file logging is enabled when `NODE_ENV=production`
- Upload and log directories are controlled by environment variables

## Testing

Run the test suite:

```bash
npm test
```

Run the CI-style version:

```bash
npm run test:ci
```

## Notes for Developers

- Keep controllers thin and place business rules in services
- Do not bypass role middleware
- Do not change the approval workflow without updating balances and report logic
- If you change the API base path or auth behavior, update the frontend `VITE_API_URL` and deployment notes together
