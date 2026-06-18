# 🚀 DEPLOYMENT GUIDE - AgriConnect on Railway

This guide walks you through deploying AgriConnect to Railway with Docker, managed MySQL, and custom domain support.

---

## 📋 Prerequisites

- Railway account (free tier available at [railway.app](https://railway.app))
- GitHub account with your agri_full repository
- Custom domain (optional, but recommended)
- Database credentials from your managed MySQL provider (PlanetScale recommended)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│   Your Domain (HTTPS)               │
│   yourdomain.com                    │
└─────────────────┬───────────────────┘
                  │
                  ▼
        ┌─────────────────┐
        │  Railway        │
        │  Docker Container
        │  • Backend API  │
        │  • Frontend SPA │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ PlanetScale/RDS │
        │ MySQL Database  │
        └─────────────────┘
```

---

## 📝 Step 1: Prepare Your Repository

Make sure your GitHub repository includes these new files (already created):
- `Dockerfile` — Container configuration
- `.dockerignore` — Files to exclude from Docker build
- `railway.json` — Railway deployment config
- `docker-compose.yml` — For local testing
- `.env.production` — Production environment template

Push all changes to GitHub:
```bash
cd c:\Users\Redaiah\OneDrive\Desktop\agri_full
git add .
git commit -m "Add Docker and deployment configuration"
git push origin main
```

---

## 🗄️ Step 2: Set Up Managed MySQL Database

### Option A: PlanetScale (Recommended - Free tier available)
1. Go to [planetscale.com](https://planetscale.com)
2. Sign up and create a new database `agriconnect`
3. Click "Connect" and copy the connection string
4. Note your credentials:
   - Host: `xxx.psdb.cloud`
   - User: `xxxxxxxxx`
   - Password: `pscale_pw_xxxxxxxxx`
   - Database: `agriconnect`

### Option B: AWS RDS
1. Go to [AWS RDS Console](https://console.aws.amazon.com/rds/)
2. Create MySQL database instance
3. Copy the endpoint and credentials

### Run Database Schema
Once you have the connection:
```bash
# Connect to your managed MySQL instance and run:
source database/schema.sql
```

Or use a MySQL GUI tool (MySQL Workbench) to import the schema.

---

## 🚂 Step 3: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign up
2. Click **"New Project"** → **"Deploy from GitHub"**
3. Connect your GitHub account
4. Select `agri_full` repository
5. Railway will auto-detect the Dockerfile ✅

---

## ⚙️ Step 4: Configure Environment Variables in Railway

1. In Railway project, click **"Variables"**
2. Add these variables (from your database provider):

```
NODE_ENV=production
PORT=5000
DB_HOST=your-planetscale-host.psdb.cloud
DB_PORT=3306
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=agriconnect
JWT_SECRET=agriconnect_super_secret_jwt_key_2024_CHANGE_THIS
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

**⚠️ IMPORTANT:** Change `JWT_SECRET` to a strong random string!

---

## 🌐 Step 5: Custom Domain Setup

### In Railway:
1. Go to project **Settings** → **Domains**
2. Add custom domain: `yourdomain.com`
3. Railway provides DNS records to add

### In Your Domain Registrar:
1. Log in to your domain provider (GoDaddy, Namecheap, etc.)
2. Add Railway's DNS records to your domain
3. Wait 5-10 minutes for DNS propagation

---

## 🎨 Step 6: Frontend Deployment

### Option A: Host Frontend on Railway too
The Dockerfile includes the frontend. It's served at the root path.

Update `frontend/js/api.js` to point to your Railway backend:
```javascript
const API_BASE = 'https://yourdomain.com/api';
```

### Option B: Host Frontend separately on Vercel (Optional)
1. Create a new GitHub repository with only the `frontend/` folder
2. Deploy to Vercel: [vercel.com](https://vercel.com)
3. Update API calls to point to Railway backend:
```javascript
const API_BASE = 'https://your-railway-app.up.railway.app/api';
```

---

## 🧪 Step 7: Local Testing with Docker

Test locally before deploying:

```bash
# Navigate to project root
cd c:\Users\Redaiah\OneDrive\Desktop\agri_full

# Start all services (MySQL + API)
docker-compose up

# Test the API
# Open browser: http://localhost:5000/api/health
# You should see: { "success": true, "message": "AgriConnect API is running", ... }

# Stop services
docker-compose down
```

---

## 📊 Deployment Checklist

- [ ] GitHub repository updated with Dockerfile and configs
- [ ] Managed MySQL database created and schema imported
- [ ] Railway project created and connected to GitHub
- [ ] Environment variables configured in Railway
- [ ] Database migration applied (schema.sql)
- [ ] Custom domain DNS records added
- [ ] Frontend API URLs updated
- [ ] Test API health endpoint: `https://yourdomain.com/api/health`
- [ ] Test login with demo credentials
- [ ] Monitor Railway logs for errors

---

## 🔍 Monitoring & Troubleshooting

### View Logs in Railway
1. Click on your project
2. Select **Deployments** tab
3. View real-time logs

### Common Issues

**"Database connection failed"**
- Check DB credentials in Railway variables
- Verify database is accessible from Railway IP
- For PlanetScale: May need to add Railway IP to allowlist

**"CORS errors in frontend"**
- Update `CORS_ORIGIN` environment variable
- Must match frontend domain exactly

**"Static files not loading (404)"**
- Ensure `frontend/` folder is included in Docker build
- Check file paths in HTML (`index.html`)

---

## 🚀 Deployment Complete!

Your AgriConnect platform is now live!

- **API Base URL**: `https://yourdomain.com/api`
- **Health Check**: `https://yourdomain.com/api/health`
- **Frontend**: `https://yourdomain.com`

---

## 🔐 Post-Deployment Security

1. **Change JWT Secret**
   ```
   Generate: require('crypto').randomBytes(32).toString('hex')
   Update in Railway variables
   ```

2. **Update Demo Credentials**
   - Change passwords in database
   - Create production users

3. **Enable HTTPS**
   - Railway auto-enables HTTPS with custom domains ✅

4. **Database Backups**
   - Set up automatic backups in PlanetScale/RDS

5. **Monitor Logs**
   - Check Railway logs daily
   - Set up error alerts

---

## 📚 Reference

- [Railway Docs](https://docs.railway.app/)
- [PlanetScale Docs](https://planetscale.com/docs)
- [Docker Guide](https://docs.docker.com/)
- [Express.js Deployment](https://expressjs.com/en/advanced/best-practice-performance.html)

---

**🎉 Happy deploying!**

