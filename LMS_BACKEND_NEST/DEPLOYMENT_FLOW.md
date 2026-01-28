# 🎯 Render Deployment Flow

## Visual Step-by-Step Process

```
┌─────────────────────────────────────────────────────────────────┐
│                    PREPARATION PHASE                             │
└─────────────────────────────────────────────────────────────────┘

    📝 Check Prerequisites
         │
         ├─ GitHub Account ✓
         ├─ Render Account ✓
         ├─ Code Ready ✓
         └─ Email Setup ✓
         │
         ▼
    🔧 Update Configuration Files
         │
         ├─ render.yaml (fixed) ✓
         ├─ schema.prisma (DATABASE_URL) ✓
         └─ .env.example created ✓
         │
         ▼
    📂 Push to GitHub
         │
         └─ git init → add → commit → push
         
         
┌─────────────────────────────────────────────────────────────────┐
│                    RENDER SETUP PHASE                            │
└─────────────────────────────────────────────────────────────────┘

    Step 1: Create Database
         │
         ├─ Login to Render Dashboard
         ├─ New + → PostgreSQL
         ├─ Name: lms-db
         ├─ Plan: Free
         └─ Region: Oregon
         │
         ├─ ✅ Database Created
         └─ 📋 Copy Internal Database URL
         
         ▼
         
    Step 2: Create Web Service
         │
         ├─ New + → Web Service
         ├─ Connect GitHub Repository
         ├─ Configure Service:
         │   ├─ Name: lms-backend
         │   ├─ Region: Oregon
         │   ├─ Branch: main
         │   ├─ Root: LMS_BACKEND_NEST
         │   ├─ Build: npm install && npx prisma generate && npm run build
         │   └─ Start: npm run start:prod
         │
         └─ Add Environment Variables:
             ├─ NODE_ENV=production
             ├─ PORT=8000
             ├─ DATABASE_URL=<from-step-1>
             ├─ JWT_SECRET=<generate>
             ├─ FRONTEND_URL=http://localhost:3000
             ├─ MAIL_HOST=smtp.gmail.com
             ├─ MAIL_PORT=587
             ├─ MAIL_USER=<your-email>
             └─ MAIL_PASS=<app-password>
         
         ▼
         
    🏗️ Render Builds & Deploys
         │
         ├─ Installing dependencies...
         ├─ Generating Prisma Client...
         ├─ Building NestJS app...
         ├─ Starting server...
         └─ Health check: /health
         │
         └─ ✅ Service Running!


┌─────────────────────────────────────────────────────────────────┐
│                    POST-DEPLOYMENT PHASE                         │
└─────────────────────────────────────────────────────────────────┘

    Step 3: Run Migrations
         │
         ├─ Go to Service → Shell
         ├─ Run: npx prisma migrate deploy
         └─ Run: npm run prisma:seed (optional)
         │
         └─ ✅ Database Ready!
         
         ▼
         
    Step 4: Test API
         │
         ├─ Health Check:
         │   └─ https://lms-backend.onrender.com/health
         │
         ├─ Auth Status:
         │   └─ https://lms-backend.onrender.com/api/auth/status
         │
         └─ ✅ Backend is Live!


┌─────────────────────────────────────────────────────────────────┐
│                    INTEGRATION PHASE                             │
└─────────────────────────────────────────────────────────────────┘

    Step 5: Deploy Frontend
         │
         ├─ Deploy to Vercel/Netlify
         ├─ Set NEXT_PUBLIC_API_BASE_URL
         │   └─ https://lms-backend.onrender.com
         │
         └─ ✅ Frontend Connected!
         
         ▼
         
    Step 6: Update Backend CORS
         │
         ├─ Go to Render → Environment
         ├─ Update FRONTEND_URL
         │   └─ https://your-app.vercel.app
         │
         └─ ✅ CORS Configured!
         
         ▼
         
    🎉 DEPLOYMENT COMPLETE!
```

---

## Deployment Timeline

```
┌──────────────┬──────────────────────────────────┬──────────┐
│ Phase        │ Task                              │ Time     │
├──────────────┼──────────────────────────────────┼──────────┤
│ Preparation  │ Push to GitHub                    │ 2 min    │
│ Setup        │ Create Database                   │ 2 min    │
│ Setup        │ Create Web Service                │ 3 min    │
│ Build        │ Render builds & deploys           │ 3-5 min  │
│ Migration    │ Run database migrations           │ 1 min    │
│ Testing      │ Test endpoints                    │ 1 min    │
├──────────────┼──────────────────────────────────┼──────────┤
│ TOTAL        │                                   │ ~12 min  │
└──────────────┴──────────────────────────────────┴──────────┘
```

---

## System Architecture (Deployed)

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCTION                               │
└─────────────────────────────────────────────────────────────────┘

    User Browser
         │
         │ HTTPS
         ▼
    ┌──────────────────┐
    │   Next.js App    │  (Vercel/Netlify)
    │   Port: 443      │  - Frontend UI
    │   (Frontend)     │  - Server Components
    └──────────────────┘  - API Routes
         │
         │ HTTPS (credentials: include)
         ▼
    ┌──────────────────┐
    │   NestJS API     │  (Render)
    │   Port: 8000     │  - REST API
    │   (Backend)      │  - JWT Auth
    └──────────────────┘  - Business Logic
         │
         │ PostgreSQL Protocol
         ▼
    ┌──────────────────┐
    │   PostgreSQL     │  (Render)
    │   Port: 5432     │  - User Data
    │   (Database)     │  - Books, Loans
    └──────────────────┘  - Transactions
```

---

## Request Flow Example

```
User Login Flow:
────────────────

1. User → Frontend
   │  POST /auth/login
   │  { email, password }
   │
   ▼
2. Frontend → Backend
   │  POST https://lms-backend.onrender.com/api/auth/login
   │  { email, password }
   │  credentials: 'include'
   │
   ▼
3. Backend → Database
   │  SELECT * FROM User WHERE email = ?
   │  Verify password with bcrypt
   │
   ▼
4. Backend → Frontend
   │  200 OK
   │  Set-Cookie: accessToken=...
   │  Set-Cookie: refreshToken=...
   │  { user: { id, name, email, role } }
   │
   ▼
5. Frontend → User
   │  Redirect to /dashboard/{role}
   │  Store user in context/state
   │
   └─ ✅ User Logged In!
```

---

## Error Flow & Recovery

```
Cold Start (First Request):
───────────────────────────

Request → Backend (sleeping)
              │
              ├─ ⏰ Waking up... (30-60s)
              │
              └─ ✅ Response returned


Token Refresh Flow:
──────────────────

Request with expired token
              │
              ├─ 401 Unauthorized
              │
              ├─ Auto refresh token
              │  POST /auth/refresh-token
              │
              ├─ Get new tokens
              │
              └─ Retry original request
```

---

## Monitoring & Maintenance

```
Regular Checks:
───────────────

Weekly:
  ├─ Check Render Dashboard for errors
  ├─ Review logs for unusual activity
  └─ Monitor database size (1GB limit)

Monthly:
  ├─ Check for package updates
  ├─ Review API response times
  └─ Verify email delivery

Every 90 Days:
  └─ Renew PostgreSQL (or upgrade to paid)
```

---

## Scaling Path

```
Current (Free Tier):
├─ Backend: 1 instance
├─ Database: 1GB, free for 90 days
└─ Cost: $0 → $7/month after 90 days


Growth (Paid Tier):
├─ Backend: Multiple instances
├─ Database: Unlimited, with backups
├─ CDN: Add CloudFlare
└─ Cost: ~$25-50/month


Enterprise:
├─ Dedicated servers
├─ Multi-region deployment
├─ Auto-scaling
└─ Cost: $100+/month
```

---

## Quick Reference

### Important URLs

```
Render Dashboard:
└─ https://dashboard.render.com

Your Backend:
└─ https://lms-backend.onrender.com

Database Connection:
└─ Internal: postgresql://...
└─ External: postgresql://...

GitHub Repository:
└─ https://github.com/YOUR_USERNAME/YOUR_REPO
```

### Key Commands

```bash
# Deploy (auto-deploys on push)
git push origin main

# Manual deploy
# Use Render Dashboard → Manual Deploy

# View logs
# Use Render Dashboard → Logs

# Run migrations
# Use Render Dashboard → Shell
npx prisma migrate deploy

# Test health
curl https://lms-backend.onrender.com/health
```

---

**Ready to Deploy?** Follow [QUICK_DEPLOY.md](QUICK_DEPLOY.md) now! 🚀
