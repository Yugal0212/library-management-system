# 🔧 Troubleshooting Guide

Common issues and solutions when deploying to Render.

---

## 🚨 Build & Deployment Issues

### ❌ Build Fails: "Cannot find module '@prisma/client'"

**Problem**: Prisma Client not generated during build.

**Solution**:
```bash
# Ensure build command includes:
npm install && npx prisma generate && npm run build
```

In Render Dashboard:
- Go to your service → Settings
- Update Build Command to include `npx prisma generate`

---

### ❌ Build Fails: "Module not found" or TypeScript errors

**Problem**: Dependencies missing or version mismatch.

**Solution 1 - Clear Cache**:
```bash
# In Render Dashboard → Manual Deploy
Click "Clear build cache & deploy"
```

**Solution 2 - Check package.json**:
```bash
# Locally, verify all dependencies are listed
npm install
npm run build

# If builds locally, commit and push
git add package.json package-lock.json
git commit -m "Fix dependencies"
git push origin main
```

---

### ❌ Service Crashes Immediately After Deploy

**Problem**: Usually environment variables missing or database connection fails.

**Solution**:
```bash
# Check Render logs for exact error
# Common issues:

1. DATABASE_URL not set or invalid
2. JWT_SECRET missing
3. Port binding issue

# Fix in Render Dashboard:
Environment → Verify all required vars:
- DATABASE_URL
- JWT_SECRET
- NODE_ENV
- PORT
```

---

## 🗄️ Database Issues

### ❌ "Error: P1001: Can't reach database server"

**Problem**: Database URL incorrect or database not running.

**Solution**:
```bash
# 1. Check DATABASE_URL format:
postgresql://username:password@hostname:port/database

# 2. Use Internal Database URL (not External)
# In Render Dashboard:
# Database → Connect → Copy "Internal Database URL"

# 3. Update environment variable:
# Service → Environment → DATABASE_URL → Update

# 4. Verify database is running:
# Dashboard → Database → Status should be "Available"
```

---

### ❌ "Error: P3009: Failed to apply migrations"

**Problem**: Migration conflicts or database state mismatch.

**Solution**:
```bash
# Option 1: Check migration status
# In Render Shell:
npx prisma migrate status

# Option 2: Mark migrations as applied (if already applied manually)
npx prisma migrate resolve --applied "migration_name"

# Option 3: Reset database (⚠️ DELETES ALL DATA)
npx prisma migrate reset
# Then:
npx prisma migrate deploy
npm run prisma:seed
```

---

### ❌ Database Connection Slow or Timing Out

**Problem**: Using External URL or database overloaded.

**Solution**:
```bash
# 1. Switch to Internal Database URL
# Better performance, free egress

# 2. Check database plan limits
# Free tier: 1GB storage
# Check usage in Render Dashboard → Database → Metrics

# 3. Optimize queries
# Add indexes in schema.prisma:
@@index([fieldName])
```

---

## 🔐 Authentication Issues

### ❌ "JWT must be provided" or "Unauthorized"

**Problem**: JWT token not being sent or invalid.

**Solution**:
```bash
# 1. Check CORS configuration
# In main.ts, ensure:
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});

# 2. Verify JWT_SECRET is set
# Render Dashboard → Environment → JWT_SECRET

# 3. Check cookie settings
# Frontend must send:
credentials: 'include'

# 4. Verify frontend URL
# Update FRONTEND_URL in Render to match your frontend domain
```

---

### ❌ Cookies Not Being Set

**Problem**: CORS or secure cookie settings.

**Solution**:
```bash
# 1. For development (localhost):
FRONTEND_URL=http://localhost:3000

# 2. For production (HTTPS):
FRONTEND_URL=https://your-app.vercel.app

# 3. Check cookie settings in auth response
# Should include:
httpOnly: true,
secure: process.env.NODE_ENV === 'production',
sameSite: 'lax',
```

---

## 📧 Email Issues

### ❌ "Invalid login: 535 Authentication failed"

**Problem**: Email credentials incorrect.

**Solution for Gmail**:
```bash
# 1. Enable 2-Factor Authentication
# Google Account → Security → 2-Step Verification

# 2. Generate App Password
# Google Account → Security → App Passwords
# Select "Mail" and "Other" → Generate

# 3. Use App Password (NOT your regular password)
# In Render Dashboard → Environment:
MAIL_USER=your-email@gmail.com
MAIL_PASS=<16-character-app-password>

# 4. Verify settings:
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
```

---

### ❌ Emails Not Sending (No Error)

**Problem**: Email service blocking or rate limiting.

**Solution**:
```bash
# 1. Check Render logs for email errors

# 2. Test email configuration:
# Create test-email.ts:
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT),
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Server is ready to send emails');
  }
});

# Run in Render Shell:
node test-email.js

# 3. Check spam folder
# 4. Verify sender reputation
# 5. Check daily sending limits (Gmail: 500/day for free)
```

---

## 🐌 Performance Issues

### ❌ First Request Takes Forever (30-60s)

**Problem**: Cold start - normal for free tier.

**Solution**:
```bash
# This is expected behavior on free tier.
# Service sleeps after 15 minutes of inactivity.

# Workarounds:

# 1. Keep-alive service (ping every 10 minutes):
# Use cron-job.org or similar:
GET https://lms-backend.onrender.com/health
Frequency: Every 10 minutes

# 2. Upgrade to paid plan ($7+/month)
# Service stays always-on

# 3. Show loading state in frontend
# "Waking up server, please wait..."
```

---

### ❌ Slow Response Times (After First Request)

**Problem**: Database queries not optimized.

**Solution**:
```bash
# 1. Add database indexes in schema.prisma:
model User {
  id    String @id @default(cuid())
  email String @unique
  name  String
  
  @@index([name])  // Add index on frequently queried fields
}

# 2. Run migration:
npx prisma migrate dev --name add_indexes

# 3. Deploy:
git push origin main

# 4. Use Prisma's query optimization:
// Instead of:
const users = await prisma.user.findMany({
  include: { loans: true }
});

// Use select:
const users = await prisma.user.findMany({
  select: { 
    id: true, 
    name: true,
    loans: { select: { id: true, dueDate: true } }
  }
});
```

---

## 🌐 CORS Issues

### ❌ "CORS policy: No 'Access-Control-Allow-Origin' header"

**Problem**: Frontend origin not allowed.

**Solution**:
```typescript
// In main.ts, update CORS config:

app.enableCors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl)
    if (!origin) return callback(null, true);
    
    // Allow localhost
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow production frontend
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    
    // Reject others
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Then update environment variable:
// Render Dashboard → Environment → FRONTEND_URL
FRONTEND_URL=https://your-frontend.vercel.app
```

---

## 🔄 Update & Redeployment Issues

### ❌ Changes Not Reflected After Push

**Problem**: Render didn't auto-deploy or cache issue.

**Solution**:
```bash
# 1. Verify auto-deploy is enabled:
# Render Dashboard → Settings → Auto-Deploy should be ON

# 2. Check deployment status:
# Dashboard → Events → Should show recent deploy

# 3. Manual deploy:
# Dashboard → Manual Deploy → "Clear build cache & deploy"

# 4. Check branch:
# Ensure you pushed to the correct branch (usually 'main')
git branch  # Check current branch
git push origin main
```

---

### ❌ "This service is suspended"

**Problem**: Free tier limits exceeded or payment issue.

**Solution**:
```bash
# 1. Check usage:
# Dashboard → Service → Metrics
# Free tier: 750 hours/month (one service running 24/7)

# 2. Check database expiry:
# Free database expires after 90 days
# Dashboard → Database → Check expiration date

# 3. Upgrade plan or:
# - Export data
# - Create new free database
# - Import data
```

---

## 🔍 Debugging Tips

### View Detailed Logs

```bash
# In Render Dashboard:
Service → Logs → Filter by:
- Deployment Logs (build process)
- Runtime Logs (application logs)
- Error Logs (only errors)
```

### Run Commands Directly

```bash
# Use Render Shell:
Service → Shell → Interactive terminal

# Useful commands:
env | grep DATABASE  # Check environment vars
node --version       # Check Node version
npm list             # Check installed packages
pwd                  # Current directory
ls -la               # List files
cat .env            # Won't work (env vars set differently)
```

### Test Database Connection

```bash
# In Render Shell:
npx prisma db pull  # If succeeds, connection is OK

# Or test query:
npx prisma studio  # Opens DB viewer (if port forwarding available)
```

---

## 📋 Pre-Deployment Checklist

Before deploying, verify:

```bash
# ✅ Local build works
npm run build

# ✅ Local server runs
npm run start:prod

# ✅ All environment variables documented
# Check .env.example

# ✅ Migrations are ready
npx prisma migrate status

# ✅ Schema is valid
npx prisma validate

# ✅ No hardcoded secrets in code
grep -r "password" src/  # Should not find real passwords

# ✅ .gitignore includes .env
cat .gitignore | grep .env

# ✅ Dependencies are up to date
npm outdated

# ✅ No security vulnerabilities
npm audit
```

---

## 🆘 Still Having Issues?

### Check These Resources:

1. **Render Documentation**: https://render.com/docs
2. **Render Community**: https://community.render.com
3. **Render Status**: https://status.render.com (check for outages)
4. **NestJS Docs**: https://docs.nestjs.com
5. **Prisma Docs**: https://www.prisma.io/docs

### Get Help:

```bash
# 1. Export logs from Render Dashboard
# Service → Logs → Download

# 2. Check exact error message
# Copy full error stack trace

# 3. Search error message
# Google: "render.com [error message]"
# Stack Overflow
# GitHub Issues

# 4. Ask for help (provide):
# - Error message
# - Render logs
# - What you've tried
# - Environment (Node version, etc.)
```

---

## 💡 Best Practices to Avoid Issues

```bash
# 1. Always test locally first
npm run build && npm run start:prod

# 2. Use environment variables for ALL configuration
# Never hardcode URLs, secrets, etc.

# 3. Keep dependencies updated
npm update

# 4. Monitor logs regularly
# Check Render dashboard daily during initial deployment

# 5. Use meaningful commit messages
git commit -m "Fix: Database connection timeout issue"

# 6. Backup database before migrations
# Export data from Render dashboard

# 7. Test with production-like data locally
# Use Docker for local PostgreSQL

# 8. Document everything
# Keep README and DEPLOYMENT.md updated
```

---

**Need more help?** Check other guides:
- [QUICK_DEPLOY.md](QUICK_DEPLOY.md) - Fast deployment
- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete guide
- [COMMANDS.md](COMMANDS.md) - Command reference
