# 🌾 AgriConnect — E-Governance Platform

**Government of Andhra Pradesh | Department of Agriculture**

A production-grade e-governance platform for direct farmer-to-government crop procurement, eliminating middlemen and digitizing the complete agricultural procurement and service-request workflow.

---

## 📋 Prerequisites

* **Node.js** v18+
* **Neon PostgreSQL** account and database
* **VS Code**
* **Git** (optional)
* **Live Server Extension** (VS Code) — for serving the frontend

---

# 🚀 Quick Setup

## Step 1 — Clone / Extract Project

The project structure is:

```text
agri_full/

├── backend/       ← Node.js + Express API
├── frontend/      ← HTML/CSS/JavaScript Portal
└── database/      ← PostgreSQL schema and database scripts
```

---

# Step 2 — Setup Neon PostgreSQL Database

AgriConnect uses **Neon PostgreSQL** as its production database.

1. Create a Neon account.
2. Create a new PostgreSQL project.
3. Create/select the database.
4. Copy the PostgreSQL connection string provided by Neon.

The connection string will look similar to:

```text
postgresql://username:password@host/database?sslmode=require
```

Do **not** publish your actual Neon connection string in GitHub or documentation.

---

# Step 3 — Configure Backend

Open the backend directory:

```bash
cd agri_full/backend
```

Create a `.env` file.

Example:

```env
PORT=5000
NODE_ENV=development

# Neon PostgreSQL
DATABASE_URL=postgresql://username:password@your-neon-host/database?sslmode=require

# JWT
JWT_SECRET=agriconnect_super_secret_jwt_key_2024
JWT_EXPIRES_IN=24h

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Frontend URL
FRONTEND_URL=http://127.0.0.1:5500
```

### Important

Do not upload `.env` to GitHub.

Add it to `.gitignore`:

```text
.env
node_modules/
uploads/
```

---

# Step 4 — Install Backend Dependencies

Open a terminal:

```bash
cd agri_full/backend
```

Install dependencies:

```bash
npm install
```

For PostgreSQL, the backend should use the `pg` package:

```bash
npm install pg
```

If the old MySQL driver is no longer required:

```bash
npm uninstall mysql2
```

---

# Step 5 — Setup Database Schema

The database schema should be written for **PostgreSQL**, not MySQL.

If the project contains:

```text
database/schema.sql
```

execute the PostgreSQL-compatible schema using a PostgreSQL client such as:

* Neon SQL Editor
* pgAdmin
* `psql`

The Neon SQL Editor is the easiest option.

Open the Neon project, select the SQL Editor, paste the PostgreSQL schema and execute it.

The schema creates tables such as:

```text
users
crops
sell_requests
procurement
service_requests
```

---

# Step 6 — Start Backend

Run:

```bash
cd agri_full/backend
npm start
```

Expected output:

```text
🔥 AGRICONNECT API SERVER STARTED

Database: Neon PostgreSQL
Environment: development
Port: 5000

✅ Database connected successfully
```

The backend will be available at:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

---

# Step 7 — Open Frontend

In VS Code:

1. Open the `frontend` folder.
2. Open `index.html`.
3. Right-click `index.html`.
4. Select **Open with Live Server**.

The frontend will normally open at:

```text
http://127.0.0.1:5500
```

The frontend communicates with the Node.js backend through the configured API URL.

Example:

```javascript
const API_BASE = "http://localhost:5000/api";
```

---

# 🔐 Demo Login Credentials

| Role     | Phone      | Password  | Portal Access          |
| -------- | ---------- | --------- | ---------------------- |
| Admin    | 9000000001 | Admin@123 | Full system control    |
| Employee | 9000000002 | Admin@123 | Verification + Service |
| Farmer   | 9000000003 | Admin@123 | Submit + Track         |
| Farmer 2 | 9000000004 | Admin@123 | Submit + Track         |
| Farmer 3 | 9000000005 | Admin@123 | Submit + Track         |

> These are development/demo credentials. Passwords are stored as bcrypt hashes in the database.

---

# 📂 Project Structure

```text
agri_full/

│
├── backend/
│   │
│   ├── config/
│   │   └── database.js
│   │       ← Neon PostgreSQL connection
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   │   ← Login, registration and profile
│   │   ├── cropController.js
│   │   │   ← Crop and MSP management
│   │   ├── sellRequestController.js
│   │   │   ← Procurement workflow
│   │   ├── serviceRequestController.js
│   │   │   ← Service/grievance workflow
│   │   └── dashboardController.js
│   │       ← Dashboard statistics and notifications
│   │
│   ├── middleware/
│   │   ├── auth.js
│   │   │   ← JWT authentication
│   │   ├── upload.js
│   │   │   ← Multer file upload
│   │   └── errorHandler.js
│   │       ← Global error handling
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── crops.js
│   │   ├── sellRequests.js
│   │   ├── serviceRequests.js
│   │   └── dashboard.js
│   │
│   ├── uploads/
│   │   └── ← Uploaded crop images
│   │
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
│       ← Application entry point
│
├── frontend/
│   │
│   ├── css/
│   │   └── main.css
│   │
│   ├── js/
│   │   └── api.js
│   │
│   ├── pages/
│   │   ├── farmer-dashboard.html
│   │   ├── employee-dashboard.html
│   │   ├── admin-dashboard.html
│   │   └── notifications.html
│   │
│   └── index.html
│       ← Landing and Login page
│
└── database/
    └── schema.sql
        ← PostgreSQL database schema
```

---

# 🔄 Complete Procurement Workflow

```text
Farmer submits sell request
          ↓
Employee verifies request
          ↓
Admin reviews and approves
          ↓
Admin schedules procurement
          ↓
Procurement takes place
          ↓
Admin processes payment
          ↓
Payment status updated
          ↓
Farmer receives notification
```

---

# 🔄 Service Request Workflow

```text
Farmer raises service request
          ↓
Employee accepts request
          ↓
Employee processes request
          ↓
Complex request?
      ↙          ↘
    Yes           No
     ↓             ↓
Escalate to       Resolve
Admin
     ↓
Admin reviews
     ↓
Resolution / Rejection
     ↓
Farmer receives notification
```

---

# 🛠️ API Endpoints

## Authentication

| Method | Route                | Access        |
| ------ | -------------------- | ------------- |
| POST   | `/api/auth/login`    | Public        |
| POST   | `/api/auth/register` | Public        |
| GET    | `/api/auth/profile`  | Authenticated |

## Crops

| Method | Route            | Access |
| ------ | ---------------- | ------ |
| GET    | `/api/crops`     | All    |
| POST   | `/api/crops`     | Admin  |
| PUT    | `/api/crops/:id` | Admin  |

## Sell Requests

| Method | Route                            | Access        |
| ------ | -------------------------------- | ------------- |
| GET    | `/api/sell-requests`             | Role-filtered |
| POST   | `/api/sell-requests`             | Farmer        |
| PUT    | `/api/sell-requests/:id/verify`  | Employee      |
| PUT    | `/api/sell-requests/:id/approve` | Admin         |
| PUT    | `/api/sell-requests/:id/payment` | Admin         |

## Service Requests

| Method | Route                              | Access         |
| ------ | ---------------------------------- | -------------- |
| GET    | `/api/service-requests`            | Role-filtered  |
| POST   | `/api/service-requests`            | Farmer         |
| PUT    | `/api/service-requests/:id/update` | Employee/Admin |

## Dashboard

| Method | Route                           | Access   |
| ------ | ------------------------------- | -------- |
| GET    | `/api/dashboard/admin/stats`    | Admin    |
| GET    | `/api/dashboard/employee/stats` | Employee |
| GET    | `/api/dashboard/farmer/stats`   | Farmer   |
| GET    | `/api/dashboard/notifications`  | All      |
| GET    | `/api/dashboard/announcements`  | All      |
| GET    | `/api/dashboard/users`          | Admin    |

---

# 🗄️ Database

AgriConnect uses **Neon PostgreSQL**.

Main tables include:

### Users

Stores:

* User information
* Phone number
* Email
* Password hash
* Role
* Village
* District
* State
* Account information
* Account status

### Crops

Stores:

* Crop name
* Telugu crop name
* Crop category
* Government/MSP price
* Unit
* Season
* Active status
* Last updated information

### Sell Requests

Stores farmer crop procurement requests including:

* Crop
* Quantity
* Village/location
* Harvest date
* Additional notes
* Crop image
* Request status
* Creation date

### Procurement

Stores procurement and payment information.

### Service Requests

Stores farmer complaints, service requests, processing status and resolutions.

---

# 🔐 Security Features

* ✅ JWT-based authentication
* ✅ bcryptjs password hashing
* ✅ Salt rounds: 10
* ✅ Role-based access control
* ✅ Parameterized PostgreSQL queries
* ✅ SQL injection prevention
* ✅ File type validation
* ✅ File size validation
* ✅ CORS configuration
* ✅ Global error handling
* ✅ Environment variable protection
* ✅ Neon PostgreSQL SSL connection

---

# 🧪 Full Workflow Testing

### Step 1 — Farmer

Login:

```text
Phone: 9000000003
Password: Admin@123
```

Submit a sell request:

```text
Crop: Paddy
Quantity: 20 quintals
```

---

### Step 2 — Employee

Login:

```text
Phone: 9000000002
Password: Admin@123
```

Open:

```text
Pending Verification
```

Verify the farmer's request.

---

### Step 3 — Admin

Login:

```text
Phone: 9000000001
Password: Admin@123
```

Open:

```text
Approval Queue
```

Approve the request and schedule the procurement date.

---

### Step 4 — Payment

Admin opens:

```text
Procurement Schedule
```

Process the payment.

---

### Step 5 — Farmer

Login again as the farmer.

The farmer can view:

* Request status
* Procurement status
* Payment status
* Notifications

---

# 🐛 Troubleshooting

| Issue                            | Solution                                                       |
| -------------------------------- | -------------------------------------------------------------- |
| Database connection failed       | Check `DATABASE_URL` in `.env`                                 |
| Neon connection timeout          | Verify Neon project is active and connection string is correct |
| Authentication failed            | Verify phone number and bcrypt password hash                   |
| Network error                    | Ensure backend is running                                      |
| CORS error                       | Verify `FRONTEND_URL` and CORS configuration                   |
| `Cannot POST /api/...`           | Check route and HTTP method                                    |
| PostgreSQL syntax error          | Ensure the query uses PostgreSQL syntax                        |
| File upload fails                | Ensure `backend/uploads/` exists                               |
| Frontend cannot reach backend    | Verify `API_BASE` points to the backend                        |
| `password authentication failed` | Check Neon database credentials                                |
| `relation does not exist`        | Run the PostgreSQL schema in Neon                              |

---

# ⚠️ MySQL → PostgreSQL Migration Notes

The project was originally designed around MySQL. After migration to Neon PostgreSQL, the backend should use PostgreSQL syntax.

### Database driver

Old:

```javascript
const mysql = require('mysql2/promise');
```

New:

```javascript
const { Pool } = require('pg');
```

### Connection

Use:

```javascript
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
```

### Query placeholders

MySQL:

```javascript
connection.query(
    'SELECT * FROM users WHERE phone = ?',
    [phone]
);
```

PostgreSQL:

```javascript
pool.query(
    'SELECT * FROM users WHERE phone = $1',
    [phone]
);
```

Therefore, all backend SQL queries must use PostgreSQL `$1`, `$2`, `$3` style parameters after migration.

---

# 🌐 Deployment

The application can be deployed using:

```text
Frontend
   ↓
Static hosting / Vercel / similar service
   ↓
Node.js + Express Backend
   ↓
Neon PostgreSQL
```

The production backend should use the Neon connection string through an environment variable:

```env
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
```

Never hard-code the Neon password or connection string inside source code.

---

# 📞 Project Support

**Project:** AgriConnect
**Domain:** E-Governance for Farmers
**Technology:** HTML, CSS, JavaScript, Node.js, Express.js, PostgreSQL
**Database:** Neon PostgreSQL

---

# 🌾 Project Objective

AgriConnect aims to provide a digital platform through which farmers can directly interact with the government agriculture procurement system.

The platform reduces dependency on intermediaries, improves transparency, enables digital crop procurement workflows, provides service-request tracking, and gives administrators centralized control over agricultural services.

---

**Built for digital agriculture and transparent farmer services.**
# 📞 Support & Helpline

AgriConnect provides dedicated support information for farmers and users of the platform.

| ☎️ Support Service   | 📱 Helpline Number |
| -------------------- | -----------------: |
| Farmer Helpline      |  **1800-180-1551** |
| Agriculture Helpline |  **1800-425-1551** |
| Emergency Services   |            **112** |

### 📞 Farmer Support

For assistance related to crop procurement, government agricultural services, sell requests, payment status, or service requests, users can contact the appropriate agriculture/farmer helpline.

### 🆘 Emergency

For emergency situations, users can contact:

**112 — National Emergency Number**

> **Note:** Helpline numbers should be verified against the official government department information before production deployment.
