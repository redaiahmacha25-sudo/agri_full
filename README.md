# 🌾 AgriConnect — E-Governance Platform
### Government of Andhra Pradesh | Department of Agriculture

A production-grade e-governance platform for direct farmer-to-government crop procurement, eliminating middlemen and digitizing the entire workflow.

---

## 📋 Prerequisites

- **Node.js** v18+ → [nodejs.org](https://nodejs.org)
- **MySQL** 8.0+ → [mysql.com](https://dev.mysql.com/downloads/)
- **VS Code** → [code.visualstudio.com](https://code.visualstudio.com)
- **Live Server Extension** (VS Code) — for serving frontend

---

## 🚀 Quick Setup (5 Steps)

### Step 1 — Clone / Extract Project
```
agriconnect/
├── backend/       ← Node.js + Express API
├── frontend/      ← HTML/CSS/JS Portal
└── database/      ← MySQL Schema
```

### Step 2 — Setup MySQL Database

Open MySQL Workbench or terminal and run:
```sql
source /path/to/agriconnect/database/schema.sql
```

This creates the `agriconnect` database with all tables and sample data.

### Step 3 — Configure Backend

```bash
cd agriconnect/backend

# Copy env file and edit it
cp .env.example .env
```

Edit `.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=agriconnect
JWT_SECRET=agriconnect_super_secret_jwt_key_2024
PORT=5000
```

### Step 4 — Install Dependencies & Start Backend

```bash
cd agriconnect/backend
npm install
npm start
```

You should see:
```
✅ Database connected successfully
╔════════════════════════════════════════╗
║   🌾 AGRICONNECT API SERVER STARTED   ║
║   Port: 5000                           ║
╚════════════════════════════════════════╝
```

### Step 5 — Open Frontend

In VS Code:
1. Open the `agriconnect/frontend` folder
2. Right-click `index.html` → **Open with Live Server**
3. Browser opens at `http://127.0.0.1:5500`

Or simply open `frontend/index.html` directly in Chrome.

---

## 🔐 Demo Login Credentials

| Role       | Phone       | Password   | Portal Access |
|------------|-------------|------------|---------------|
| Admin      | 9000000001  | Admin@123  | Full system control |
| Employee   | 9000000002  | Admin@123  | Verification + Service |
| Farmer     | 9000000003  | Admin@123  | Submit + Track |
| Farmer 2   | 9000000004  | Admin@123  | Submit + Track |
| Farmer 3   | 9000000005  | Admin@123  | Submit + Track |

---

## 📂 Project Structure

```
agriconnect/
│
├── backend/
│   ├── config/
│   │   └── database.js          ← MySQL pool connection
│   ├── controllers/
│   │   ├── authController.js    ← Login, register, profile
│   │   ├── cropController.js    ← CRUD for crop MSP
│   │   ├── sellRequestController.js  ← Full procurement workflow
│   │   ├── serviceRequestController.js  ← Grievance workflow
│   │   └── dashboardController.js   ← Stats, notifications
│   ├── middleware/
│   │   ├── auth.js              ← JWT authentication
│   │   ├── upload.js            ← Multer file upload
│   │   └── errorHandler.js      ← Global error handling
│   ├── routes/
│   │   ├── auth.js
│   │   ├── crops.js
│   │   ├── sellRequests.js
│   │   ├── serviceRequests.js
│   │   └── dashboard.js
│   ├── uploads/                 ← File storage (auto-created)
│   ├── .env.example
│   ├── package.json
│   └── server.js               ← Entry point
│
├── frontend/
│   ├── css/
│   │   └── main.css            ← Government portal design system
│   ├── js/
│   │   └── api.js              ← API client + utilities
│   ├── pages/
│   │   ├── farmer-dashboard.html
│   │   ├── employee-dashboard.html
│   │   ├── admin-dashboard.html
│   │   └── notifications.html
│   └── index.html              ← Landing + Login page
│
└── database/
    └── schema.sql              ← Full normalized MySQL schema
```

---

## 🔄 Complete Workflow

### Procurement Workflow
```
Farmer submits sell request
        ↓
Employee verifies (field check)
        ↓
Admin approves + schedules date
        ↓
Procurement happens on schedule
        ↓
Admin marks payment done
        ↓
Farmer receives bank credit notification
```

### Service Request Workflow
```
Farmer raises issue (subsidy/complaint/damage)
        ↓
Employee accepts and processes
        ↓ (if complex)
Employee escalates to Admin
        ↓
Admin resolves / rejects with notes
        ↓
Farmer notified of resolution
```

---

## 🛠️ API Endpoints

### Auth
| Method | Route | Access |
|--------|-------|--------|
| POST | /api/auth/login | Public |
| POST | /api/auth/register | Public |
| GET | /api/auth/profile | Authenticated |

### Crops
| Method | Route | Access |
|--------|-------|--------|
| GET | /api/crops | All |
| POST | /api/crops | Admin |
| PUT | /api/crops/:id | Admin |

### Sell Requests
| Method | Route | Access |
|--------|-------|--------|
| GET | /api/sell-requests | Role-filtered |
| POST | /api/sell-requests | Farmer |
| PUT | /api/sell-requests/:id/verify | Employee |
| PUT | /api/sell-requests/:id/approve | Admin |
| PUT | /api/sell-requests/:id/payment | Admin |

### Service Requests
| Method | Route | Access |
|--------|-------|--------|
| GET | /api/service-requests | Role-filtered |
| POST | /api/service-requests | Farmer |
| PUT | /api/service-requests/:id/update | Employee/Admin |

### Dashboard
| Method | Route | Access |
|--------|-------|--------|
| GET | /api/dashboard/admin/stats | Admin |
| GET | /api/dashboard/employee/stats | Employee |
| GET | /api/dashboard/farmer/stats | Farmer |
| GET | /api/dashboard/notifications | All |
| GET | /api/dashboard/announcements | All |
| GET | /api/dashboard/users | Admin |

---

## 🔐 Security Features

- ✅ JWT Bearer token authentication
- ✅ bcryptjs password hashing (salt rounds: 10)
- ✅ Role-based access control middleware
- ✅ MySQL parameterized queries (SQL injection prevention)
- ✅ File type and size validation (multer)
- ✅ CORS configured for known origins
- ✅ Global error handler (no stack traces in production)

---

## 🧪 Testing the Full Workflow

1. **Login as Farmer (9000000003)** → Submit a sell request for Paddy, 20 quintals
2. **Login as Employee (9000000002)** → Go to Pending Verification → Verify the request
3. **Login as Admin (9000000001)** → Go to Approval Queue → Approve + set procurement date
4. **Admin** → Go to Procurement Schedule → Process Payment
5. **Back to Farmer** → View notification that payment was credited

---

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| "Database connection failed" | Check MySQL is running, verify `.env` credentials |
| "Network error" | Ensure backend is running on port 5000 |
| CORS error | Backend must be running before opening frontend |
| "Cannot POST /api/..." | Check route exists, check method (GET vs POST) |
| File upload fails | Ensure `backend/uploads/` directory exists |

---

## 📞 Support

- Email: tech@agriconnect.ap.gov.in
- Helpline: 1800-425-1551 (Toll Free)
- Portal: agriconnect.ap.gov.in

---

*Built for real citizens. Zero compromise on quality.*
