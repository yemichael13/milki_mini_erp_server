# Mini ERP Server (Node.js + Express + MySQL)

Backend API for the Mini ERP system. This service handles authentication, role-based authorization, transaction workflows (sales/procurement/production), receipt uploads, credit/debt calculations, reporting, and admin operations.

## System Overview

The system is built around a **unified transactions** table and a strict approval workflow.

Core entities:
- Users
- Customers
- Suppliers
- Transactions (sales/procurement/production)

Core rules:
- **Only manager-approved transactions affect credit/debt calculations**
- Transactions follow a structured approval path (pending ? accountant_approved ? manager_approved/rejected)
- Receipts are stored on disk; the database stores file paths only
- Role permissions are enforced at the API layer

## Tech Stack

- Node.js + Express
- MySQL (mysql2/promise)
- JWT auth
- bcrypt password hashing
- Joi validation
- Multer for uploads
- Winston logging
- Helmet + CORS

## Architecture

Layered approach:

```
Routes ? Controllers ? Services ? Repositories ? Database
```

- Controllers: HTTP boundary + validation + role enforcement
- Services: business rules and workflow checks
- Repositories: SQL queries and data access
- Middleware: auth, roles, errors, upload handling

## Startup Behavior

On boot, the server runs:

1. **Default admin creation**
   - If no admin exists, a default admin user is inserted using env defaults
2. **Schema check**
   - Ensures the `transactions` table exists
   - Ensures `status` enum includes `accountant_approved`

## Roles and Permissions

Roles recognized by the API:

- `system_admin` (mapped to `admin` in DB)
- `general_manager`
- `accountant`
- `sales`
- `procurement`
- `production`

Role mapping behavior:
- DB role `admin` is treated as `system_admin` in the app
- Roles ending with `_officer` are normalized to base role

High-level permissions:

- **system_admin**: manage users, settings, logs, backups only
- **general_manager**: view all transactions, approve/reject, view customers/suppliers, view credit/debt, record payments, view reports
- **accountant**: view all transactions, approve/reject pending, view customers/suppliers, view credit/debt, view reports
- **sales**: create sales transactions, add customers, view own sales transactions
- **procurement**: create procurement transactions, add suppliers, view own procurement transactions
- **production**: create production transactions, view own production transactions

System admin is **explicitly forbidden** from financial data endpoints.

## Transaction Workflow

Lifecycle:

1. Officer creates transaction ? `pending`
2. Accountant approves ? `accountant_approved`
3. Manager approves ? `manager_approved`
4. Manager rejects ? `rejected`
5. Accountant can reject **pending** transactions (goes to `rejected`)

Important:
- Only `manager_approved` transactions affect credit/debt
- `pending`, `accountant_approved`, and `rejected` do **not** affect balances

## Manager Record Payment

Managers can directly record a payment against:

- Customer credit (sales)
- Supplier debt (procurement)

These records are created as **paid** transactions and immediately marked **manager_approved**, so they affect balances without additional approvals.

## Credit and Debt Calculation

Customer credit:

```
remaining_credit = SUM(credit) - SUM(paid)
WHERE status = 'manager_approved' AND type = 'sale'
```

Supplier debt:

```
remaining_debt = SUM(debt) - SUM(paid)
WHERE status = 'manager_approved' AND type = 'procurement'
```

If no credit/debt exists, balance returns `0` (no negative balances).

## Receipts and Uploads

- Files are stored in `server/uploads/receipts`
- The database stores **only the file path**
- Files are served via:

```
GET /uploads/receipts/<filename>
```

### Multiple files

Transactions can include multiple receipts:

- Upload field name: `receipt`
- Multiple files are stored as a JSON array string in `receipt_image`
- Single file is stored as a plain string for backward compatibility

Allowed file types: `jpg`, `jpeg`, `png`, `pdf`

## API Endpoints

Base URL: `/api`

### Auth
- `POST /auth/login`
- `GET /auth/me`

### Users (system_admin only)
- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PATCH /users/:id`

### Admin (system_admin only)
- `GET /admin/settings`
- `POST /admin/backups`
- `GET /admin/logs`

### Customers
- `GET /customers` (sales, accountant, general_manager)
  - Query: `search`
- `GET /customers/:id`
- `POST /customers` (sales only)

### Suppliers
- `GET /suppliers` (procurement, accountant, general_manager)
  - Query: `search`
- `GET /suppliers/:id`
- `POST /suppliers` (procurement only)

### Transactions
- `GET /transactions`
  - Query: `status`, `type`, `source_department`, `customer_id`, `supplier_id`, `from_date`, `to_date`
  - Manager default filter: returns `accountant_approved` unless `status=all`
- `GET /transactions/:id`
- `POST /transactions` (sales/procurement/production)
  - Multipart form data (field `receipt`, supports multiple files)
- `POST /transactions/:id/receipt` (officers only; single file)
- `POST /transactions/:id/accountant-approve` (accountant)
- `POST /transactions/:id/approve` (general_manager)
- `POST /transactions/:id/reject` (general_manager, accountant)
- `POST /transactions/record-payment` (general_manager)
  - Use `customer_id` or `supplier_id` + `amount` (+ optional `description`, `receipt` files)

### Reports (accountant, general_manager)
- `GET /reports/customer-credit`
- `GET /reports/supplier-debt`
- `GET /reports/summary`
  - Query: `from_date`, `to_date`, `customer_id`, `supplier_id`, `format=json|csv`

All protected routes require:

```
Authorization: Bearer <token>
```

## Data Model (Unified Schema)

From `migrations/003_unified_schema.sql`:

### users
- email, password_hash, full_name
- role: `admin | general_manager | accountant | sales | procurement | production`

### customers / suppliers
- name, email, phone, address

### transactions
- type: `sale | procurement | production`
- source_department: `sales | procurement | production`
- payment_type: `paid | credit | debt`
- status: `pending | accountant_approved | manager_approved | rejected`
- customer_id or supplier_id (nullable)
- receipt_image (string path or JSON array string)
- description, created_by, manager_approved_by, rejected_by, rejection_reason

Note: The `accountant_approved` status is added at runtime if missing.

## Environment Variables

Server config (see `.env.example`):

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=...
DB_NAME=mini_erp
JWT_SECRET=...
JWT_EXPIRES=1d
CLIENT_URL=http://localhost:5173
LOG_LEVEL=info
LOG_DIR=logs
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_MIMES=image/jpeg,image/png,application/pdf
```

## Running the Server

Install dependencies:

```
npm install
```

Run migration (drops and recreates tables):

```
node migrate.js
```

Start the server:

```
npm run dev
```

## Logging and Errors

- `morgan` logs HTTP requests
- `winston` logs critical events
- Central error middleware formats responses and status codes

## Testing

Tests are available in `server/test/` (Jest + Supertest). Some tests may expect legacy schema; verify before using in CI.

## Notes for Developers

- Keep controllers thin; business logic belongs in services
- Use repositories for all SQL
- Do not bypass role middleware
- Do not change transaction status rules without updating credit/debt logic
