# 🚀 Deploy to Render (Free) - Simple Steps

## Prerequisites
- GitHub account
- Render account (sign up at https://render.com)

---

## Step 1: Push to GitHub (One-Time)

```bash
# Navigate to project root
cd "d:\Study\Adv.React\edulibrary (6)"

# Initialize git if needed
git init
git add .
git commit -m "Initial commit for Render deployment"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy on Render

### Option A: Using render.yaml (Recommended - Automatic Setup)

1. **Go to Render Dashboard**: https://dashboard.render.com

2. **Click "New +" → "Blueprint"**

3. **Connect your GitHub repository**

4. **Render will detect `render.yaml`** and show:
   - Web Service: `lms-backend`
   - PostgreSQL Database: `lms-db`

5. **Click "Apply"**

6. **Set Environment Variables** (in the web service settings):
   ```
   NODE_ENV=production
   PORT=8000
   DATABASE_URL=[auto-filled from database]
   JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars
   FRONTEND_URL=https://your-frontend-url.vercel.app
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USER=your-email@gmail.com
   MAIL_PASS=your-gmail-app-password
   ```

7. **That's it!** Render will:
   - Create the database
   - Deploy the backend
   - Run migrations automatically
   - Set up auto-deploy (pushes to `main` = auto-deploy)

---

### Option B: Manual Setup (If Blueprint Doesn't Work)

#### 2.1 Create Database

1. Click **"New +"** → **"PostgreSQL"**
2. Configure:
   - Name: `lms-db`
   - Region: `Oregon (US West)` or nearest to you
   - Plan: **Free**
3. Click **"Create Database"**
4. **Copy the "Internal Database URL"** (starts with `postgresql://`)

#### 2.2 Create Web Service

1. Click **"New +"** → **"Web Service"**
2. **Connect your GitHub repository**
3. Configure:
   ```
   Name: lms-backend
   Region: Oregon (US West)
   Branch: main
   Root Directory: LMS_BACKEND_NEST
   Runtime: Node
   Build Command: npm install && npx prisma generate && npx prisma migrate deploy && npm run build
   Start Command: npm run start:prod
   Plan: Free
   ```

4. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PORT=8000
   DATABASE_URL=<paste-internal-db-url-from-step-2.1>
   JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars
   FRONTEND_URL=https://your-frontend-url.vercel.app
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USER=your-email@gmail.com
   MAIL_PASS=your-gmail-app-password
   ```

5. Click **"Create Web Service"**

---

## Step 3: Verify Deployment

1. **Wait for deployment** (first time takes 5-10 minutes)

2. **Check Health Endpoint**:
   - Visit: `https://lms-backend-xxxx.onrender.com/health`
   - Should see: `{"status":"ok"}`

3. **Your API is live at**:
   - Base URL: `https://lms-backend-xxxx.onrender.com`
   - API endpoints: `https://lms-backend-xxxx.onrender.com/api/...`

---

## 🔄 Auto-Deploy is Active!

Every time you push to `main` branch on GitHub, Render will automatically:
1. Pull the latest code
2. Run the build command
3. Run migrations
4. Deploy the new version

```bash
# To deploy changes:
git add .
git commit -m "Your changes"
git push
```

**That's it!** No extra commands needed.

---

## 📧 Setting Up Email (Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Create app password for "Mail"
   - Copy the 16-character password
3. **Update MAIL_PASS** environment variable in Render with this password

---

## 🐛 Troubleshooting

### Deployment Failed?
- Check **Logs** in Render dashboard
- Verify all environment variables are set
- Ensure `DATABASE_URL` is correct

### Database Connection Error?
- Use the **Internal Database URL** (not External)
- Make sure the database is in the same region as the web service

### Free Tier Limitations
- **Spins down after 15 minutes of inactivity**
- First request after spin-down takes ~30-60 seconds
- **Solution**: Use a service like UptimeRobot to ping every 14 minutes

---

## 📝 Important Notes

- **Free tier database**: 1GB storage, 90 days retention
- **Free tier web service**: Spins down after inactivity
- **No credit card required** for free tier
- **Auto-deploy**: Enabled by default for `main` branch

---

## 🎯 Quick Commands Reference

```bash
# Deploy changes
git add .
git commit -m "Update"
git push

# View logs (in Render dashboard)
# Go to your service → Logs tab

# Run migrations manually (if needed)
# Go to your service → Shell tab
npx prisma migrate deploy

# Seed database (if needed)
npm run prisma:seed
```

---

## ✅ Success Checklist

- [ ] Code pushed to GitHub
- [ ] Database created on Render
- [ ] Web service created and deployed
- [ ] All environment variables set
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Auto-deploy is working (push triggers deployment)

**Your backend is now live! 🎉**
