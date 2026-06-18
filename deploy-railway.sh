#!/bin/bash
# Quick Railway Deployment Script

echo "🚀 AgriConnect Railway Deployment Setup"
echo "======================================="
echo ""

# Step 1: Check if git is initialized
if [ ! -d .git ]; then
  echo "❌ Git repository not found. Please initialize git first:"
  echo "   git init"
  echo "   git remote add origin https://github.com/yourusername/agri_full.git"
  exit 1
fi

# Step 2: Commit deployment files
echo "📦 Staging deployment files..."
git add Dockerfile .dockerignore railway.json docker-compose.yml .env.production DEPLOYMENT.md backend/.env.example

echo "📝 Committing changes..."
git commit -m "Add Docker and Railway deployment configuration"

# Step 3: Push to GitHub
echo "🔄 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Deployment files pushed to GitHub!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://railway.app"
echo "2. Click 'New Project' → 'Deploy from GitHub'"
echo "3. Select your agri_full repository"
echo "4. Railway will auto-detect Dockerfile"
echo "5. Set environment variables (see DEPLOYMENT.md)"
echo "6. Connect your database and custom domain"
echo ""
echo "📚 Full guide: https://yourdomain.com/DEPLOYMENT.md"

