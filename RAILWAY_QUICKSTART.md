# 🚀 Railway Deployment - Quick Start

Your AgriConnect app is now ready for deployment! Follow these 5 steps:

---

## Step 1️⃣: Push to GitHub

```bash
cd c:\Users\Redaiah\OneDrive\Desktop\agri_full

git add .
git commit -m "Add Docker and Railway deployment configuration"
git push origin main
```

---

## Step 2️⃣: Create Railway Account

- Go to [railway.app](https://railway.app)
- Sign up with GitHub

---

## Step 3️⃣: Deploy to Railway

1. Click **"New Project"**
2. Click **"Deploy from GitHub"**
3. Select `agri_full` repository
4. Click **"Deploy"**

Railway will automatically:
- Detect your Dockerfile ✅
- Build your container
- Deploy the service

---

## Step 4️⃣: Set Up Database

### Quick Option: Use PlanetScale (Free)
1. Go to [planetscale.com](https://planetscale.com)
2. Create database: `agriconnect`
3. Get connection details
4. Import [database/schema.sql](database/schema.sql)

### In Railway:
1. Go to your project **Variables**
2. Add these environment variables:

```
NODE_ENV=production
DB_HOST=your-host.psdb.cloud
DB_PORT=3306
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=agriconnect
JWT_SECRET=change_to_random_string_here
CORS_ORIGIN=https://yourdomain.com
```

---

## Step 5️⃣: Connect Custom Domain (Optional)

1. In Railway: **Settings → Domains**
2. Add your domain
3. Follow DNS setup instructions
4. Update frontend API URL in `frontend/js/api.js`:

```javascript
const API_BASE = 'https://yourdomain.com/api';
```

---

## ✅ Deployment Status

- ✅ Docker configuration ready
- ✅ Database schema provided
- ✅ Environment templates created
- ✅ Railway config file ready
- ✅ Git ignored sensitive files

---

## 📊 Your Deployment Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Container setup |
| `docker-compose.yml` | Local testing with MySQL |
| `railway.json` | Railway configuration |
| `.env.production` | Production variables template |
| `DEPLOYMENT.md` | Full deployment guide |
| `.dockerignore` | Excluded files from build |

---

## 🔗 Useful Links

- [Railway Docs](https://docs.railway.app/)
- [PlanetScale](https://planetscale.com) (Free MySQL)
- [Full Deployment Guide](DEPLOYMENT.md)

---

## 🧪 Test Locally First (Optional)

```bash
# Install Docker: https://docs.docker.com/get-docker/

docker-compose up

# In another terminal:
curl https://agri-full.onrender.com/api/health

# You should see:
# {"success":true,"message":"AgriConnect API is running",...}
```

---

**🎉 Your app is ready to deploy! Start with Step 1.**

