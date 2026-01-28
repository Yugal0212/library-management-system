# Quick Deploy to Render - Checklist

## ✅ Pre-Deployment Checklist

- [ ] Code is working locally
- [ ] All dependencies are in `package.json`
- [ ] `.env` is in `.gitignore`
- [ ] Database schema is finalized
- [ ] You have a GitHub account
- [ ] You have a Render account

## 🚀 5-Minute Deployment Steps

### 1️⃣ Push to GitHub (5 min)

```bash
# In your project root directory
cd "d:\Study\Adv.React\edulibrary (6)"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Deploy: LMS Backend to Render"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push
git push -u origin main
```

### 2️⃣ Create Database on Render (2 min)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Settings:
   - Name: `lms-db`
   - Region: `Oregon (US West)`
   - Plan: **Free**
4. Click **"Create Database"**
5. **📋 COPY** the **Internal Database URL** (you'll need this!)

### 3️⃣ Create Web Service on Render (3 min)

1. Click **"New +"** → **"Web Service"**
2. **"Connect repository"** → Select your GitHub repo
3. Configure:
   - Name: `lms-backend`
   - Region: `Oregon (US West)`
   - Branch: `main`
   - Root Directory: `LMS_BACKEND_NEST`
   - Runtime: `Node`
   - Build Command: 
     ```
     npm install && npx prisma generate && npm run build
     ```
   - Start Command:
     ```
     npm run start:prod
     ```
   - Plan: **Free**

4. **Click "Advanced"** and add environment variables:

```
NODE_ENV=production
PORT=8000
DATABASE_URL=<paste-your-database-url-here>
JWT_SECRET=<generate-random-32-char-string>
FRONTEND_URL=http://localhost:3000
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
```

5. Click **"Create Web Service"**

### 4️⃣ Run Migrations (1 min)

Wait for deployment to complete, then:

1. Go to your service → **"Shell"** tab
2. Run:
```bash
npx prisma migrate deploy
npm run prisma:seed
```

### 5️⃣ Test Your API ✅

Visit: `https://your-service-name.onrender.com/health`

You should see: `{"status":"ok"}`

---

## 🔑 Generate Secure Secrets

```bash
# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 📧 Gmail Setup for Email

1. Go to Google Account → Security
2. Enable **2-Factor Authentication**
3. Generate **App Password**
4. Use that password for `MAIL_PASS`

---

## ⚠️ Important Notes

- **First request will be slow** (30-60s) - this is normal for free tier
- Service **sleeps after 15 min** of inactivity
- Database is **free for 90 days**, then $7/month
- Always use **Internal Database URL** (faster and free)

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check logs in Render Dashboard |
| Can't connect to DB | Verify DATABASE_URL is correct |
| Service crashes | Check environment variables are all set |
| Email not sending | Verify Gmail app password is correct |

---

## 📝 Your Deployment URLs

After deployment, fill these in:

- **Backend URL**: `https://________________.onrender.com`
- **Database**: Connected via Internal URL
- **Health Check**: `https://________________.onrender.com/health`

---

## 🎯 Next: Deploy Frontend

Once backend is live:
1. Deploy Next.js frontend to Vercel (recommended)
2. Update `FRONTEND_URL` in Render backend settings
3. Update API URL in frontend to point to Render backend

---

**Need help?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guide.
