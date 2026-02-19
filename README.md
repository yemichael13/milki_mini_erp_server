---

# 🧾 README.md

# Mini ERP – Financial Workflow & Customer Credit Management Backend

---

# 🏗 Project Overview

This project is a **production-ready backend system** for a Mini ERP focused strictly on:

* Financial workflow accountability
* Customer credit tracking
* Hierarchical approval system
* Transaction transparency
* Audit traceability

The system is NOT a full ERP.
It only manages financial aspects of:

* Sales
* Production
* Procurement

The system calculates and maintains **dynamic customer credit balances** based on approved transactions and recorded payments.

---

# 🎯 Core System Goals

1. Ensure financial transparency across workflows.
2. Enforce hierarchical approval (Accountant → Manager).
3. Automate customer credit calculation.
4. Maintain strict role-based access control.
5. Store receipt evidence for every transaction.
6. Provide production-level security and scalability.

---

# 🧱 Technology Stack

Backend Framework: Node.js + Express
Database: MySQL (mysql2/promise)
Authentication: JWT
Password Security: bcrypt
Validation: Joi
File Upload: Multer
Security: Helmet, CORS
Logging: Winston
Environment Config: dotenv

---

# 🏛 Architecture Pattern

This backend follows a **Layered Clean Architecture**:

Controller → Service → Repository → Database

Separation of concerns:

* Controllers handle HTTP layer.
* Services handle business logic.
* Repositories handle database queries.
* Middleware handles cross-cutting concerns.
* Utils contain reusable logic.

This design ensures:

* Maintainability
* Testability
* Scalability
* Production readiness

---

# 📂 Folder Structure

```
src/
 ├── config/         # Configuration files (DB, logger, env)
 ├── controllers/    # Request handlers
 ├── services/       # Business logic
 ├── repositories/   # Database queries
 ├── routes/         # Express routes
 ├── middlewares/    # Auth, role, error, upload
 ├── validations/    # Joi schemas
 ├── utils/          # Shared utilities (credit calculator)
 ├── app.js          # Express app setup
 └── server.js       # Entry point

uploads/             # Receipt storage
.env                 # Environment variables
```

---

# 🔐 Authentication & Authorization

The system uses JWT-based authentication.

Flow:

1. User logs in.
2. Server validates credentials.
3. Server issues signed JWT.
4. Client sends JWT in Authorization header.
5. Middleware verifies token.
6. Role middleware restricts access.

Supported roles:

* sales
* production
* procurement
* accountant
* manager
* admin

Role-based restrictions are strictly enforced.

---

# 🧮 Core Business Logic

## Customer Credit Calculation

Customer credit is calculated dynamically using:

Remaining Credit =
SUM(Manager Approved Transactions)
− SUM(All Payments)

Important:

* Only manager-approved transactions affect credit.
* Pending or rejected transactions do NOT affect credit.
* Payments reduce outstanding balance immediately.

Credit calculation logic lives in:

`utils/creditCalculator.js`

---

# 🔁 Workflow Logic

Each transaction belongs to a workflow:

* sales
* production
* procurement

Transaction lifecycle:

1. Created by officer.
2. Receipt uploaded.
3. Status = pending.
4. Accountant approves → status = accountant_approved.
5. Manager approves → status = manager_approved.
6. Transaction becomes final.
7. Credit updates automatically.

Rejected transactions never affect credit.

---

# 🗄 Database Schema

Core tables:

users
customers
transactions
payments

Transactions are unified in one table using a workflow ENUM.

Status ENUM:

* pending
* accountant_approved
* manager_approved
* rejected

Indexes should be added on:

* customer_id
* status
* workflow
* created_at

Foreign key constraints are enforced.

---

# 📡 API Structure

Base URL:

```
/api
```

Modules:

```
/auth
/users
/customers
/sales
/production
/procurement
/payments
/reports
```

All protected routes require:

```
Authorization: Bearer <token>
```

---

# 📊 Reporting Capabilities

Reports supported:

* Customer credit report
* Workflow financial summary
* Date range filtering
* Export-ready data (CSV/PDF ready format)

Reports must aggregate using SQL SUM and GROUP BY.

---

# 📎 File Upload Handling

Receipt files are uploaded using Multer.

Rules:

* Only image/pdf files allowed.
* File size limit enforced.
* Stored in /uploads directory.
* File path saved in database.

---

# 🛡 Security Measures

This system enforces:

* Password hashing with bcrypt
* JWT expiration control
* Role-based middleware
* Input validation (Joi)
* SQL injection prevention (parameterized queries)
* Helmet security headers
* CORS configuration
* Environment variable isolation
* Centralized error handling
* Logging with Winston

---

# ⚙ Environment Variables

Example `.env` file:

```
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=mini_erp

JWT_SECRET=super_secure_secret
JWT_EXPIRES=1d
```

Never commit `.env` to version control.

---

# 🚀 Development Setup

1. Clone repository
2. Install dependencies:

```
npm install
```

3. Create `.env`
4. Create MySQL database
5. Run migrations (manual SQL for now)
6. Start server:

```
npm run dev
```

---

# 🧪 Testing

Run the test suite (requires MySQL with schema applied and `.env` configured):

```bash
npm test
```

Before production deployment, the system must validate:

* Authentication flow
* Role restrictions
* Approval workflow correctness
* Credit calculation accuracy
* Payment updates
* SQL aggregation accuracy
* File upload validation

The suite uses **Jest** and **Supertest** and covers all of the above via integration tests in `test/`.

---

# 📈 Production Deployment Guidelines

* Use managed MySQL service.
* Use HTTPS (SSL certificate).
* Use reverse proxy (NGINX).
* Enable database backups.
* Enable logging monitoring.
* Use PM2 or Docker for process management.
* Set proper environment variables.

---

# 🧠 Engineering Principles Applied

* Clean Architecture
* Single Responsibility Principle
* Separation of Concerns
* Secure by Default
* Immutable transaction history
* Strict role-based control
* Database normalization
* Scalable design

---

# 🧩 Design Decisions

Why unified transactions table?

* Avoid duplicated schema
* Easier reporting
* Easier aggregation
* Better scalability

Why layered architecture?

* Easier debugging
* Easier expansion
* Cleaner AI code generation
* Better maintainability

---

# 🚫 System Limitations (Current Version)

* No inventory module
* No payroll module
* No multi-branch logic
* No automated notifications
* No multi-currency

---

# 🔮 Future Enhancements

* Credit limit enforcement
* Dashboard analytics
* Multi-branch support
* Audit trail UI
* Advanced financial analytics
* Microservice refactor (if scaled)

---

# 🤖 AI Agent Instructions (Important Section)

If you are a code agent extending this system:

1. Maintain layered architecture.
2. Never place business logic inside controllers.
3. Always validate input using Joi.
4. Use parameterized queries only.
5. Never bypass role middleware.
6. Keep approval flow intact.
7. Do not allow direct modification of approved transactions.
8. Ensure credit calculation integrity.
9. Log critical financial actions.
10. Maintain security best practices.

Any new module must follow existing folder conventions.

---

# 📌 Project Philosophy

This is not a demo project.

This backend is designed to simulate a real financial accountability system that could operate in a small-to-medium enterprise environment.

Security, transparency, and data integrity are the highest priorities.

---
