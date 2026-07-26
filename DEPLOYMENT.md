# 🚀 DEPLOYMENT GUIDE - AgriConnect on Render & GitHub

This guide walks you through deploying AgriConnect to Render using PostgreSQL database, PL/pgSQL stored procedures, and GitHub Actions.

---

## 📋 Quick Deployment on Render (1-Click Blueprint)

Render supports Infrastructure-as-Code through the `render.yaml` file included in this repository.

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Migrate to PostgreSQL and add Render deployment configuration"
git push origin main
```

### Step 2: Deploy Blueprint on Render
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **Blueprint**
3. Connect your GitHub repository (`agri_full`)
4. Render will automatically detect `render.yaml`:
   - Creates **PostgreSQL Database** (`agriconnect-db`)
   - Creates **Web Service** (`agriconnect-api`)
5. Click **Apply**. Render will automatically provision both services and connect them!

### Step 3: Run Database Schema (schema.sql)
1. Go to your PostgreSQL database instance in Render dashboard.
2. Copy the **Internal DB URL** or **External DB URL** (or click **Connect** → **PSQL Command**).
3. Execute `database/schema.sql` against the Render PostgreSQL instance:
   ```bash
   psql "postgres://agriconnect_user:PASSWORD@dpg-xxx.oregon-postgres.render.com/agriconnect" -f database/schema.sql
   ```

---

## 🛠️ Manual Deployment Option on Render

If you prefer setting up services manually:

1. **Create PostgreSQL Instance**:
   - Go to Render Dashboard → **New +** → **PostgreSQL**
   - Name: `agriconnect-db`
   - Database: `agriconnect`
   - User: `agriconnect_user`
   - Copy the provided **Internal/External Database URL**.

2. **Create Web Service**:
   - Go to Render Dashboard → **New +** → **Web Service**
   - Connect your GitHub repository.
   - Root Directory: (leave blank)
   - Environment: `Node`
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && node server.js`
   - Add Environment Variables:
     - `NODE_ENV`: `production`
     - `DATABASE_URL`: *(Your Render PostgreSQL Connection String)*
     - `JWT_SECRET`: *(Your random secret string)*
     - `CORS_ORIGIN`: `*`

---

## 🤖 GitHub Actions Workflow

The repository includes `.github/workflows/deploy.yml` which triggers automated syntax checks and deployment hooks whenever code is pushed to `main`.

To enable automatic Render redeployments via GitHub Actions:
1. In Render Dashboard, go to your Web Service → **Settings** → **Deploy Hook**.
2. Copy the Deploy Hook URL.
3. In GitHub Repository → **Settings** → **Secrets and variables** → **Actions**.
4. Add New Secret:
   - Name: `RENDER_DEPLOY_HOOK_URL`
   - Value: *(Your Render Deploy Hook URL)*

---

## 🧪 Local Testing with PostgreSQL Docker

To run the application locally with PostgreSQL:

```bash
# Start PostgreSQL & Backend API via Docker Compose
docker-compose up --build

# Open API health check in browser
# https://agri-full.onrender.com/api/health
```

---

## 📊 Post-Deployment Verification Checklist

- [x] Database updated to PostgreSQL (`pg` package & PL/pgSQL stored procedures)
- [x] `schema.sql` loaded with PostgreSQL types, functions, and seed data
- [x] Backend controllers executing `$1, $2` parameters and stored procedures
- [x] Render blueprint `render.yaml` created
- [x] GitHub Actions workflow `.github/workflows/deploy.yml` configured
- [ ] Render services deployed and verified via `/api/health`
