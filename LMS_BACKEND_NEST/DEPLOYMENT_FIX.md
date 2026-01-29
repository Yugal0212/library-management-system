# 🔧 Render Deployment Fix

## Problem
The deployment was failing with:
```
Error: Cannot find module '/opt/render/project/src/LMS_BACKEND_NEST/dist/main'
```

## Root Cause
The `start:prod` script in package.json was using `node dist/main` but Render expected `node dist/main.js` (with .js extension).

## Solution Applied

### 1. Updated package.json
Changed the start:prod script from:
```json
"start:prod": "node dist/main"
```
to:
```json
"start:prod": "node dist/main.js"
```

### 2. Updated render.yaml files
Changed the startCommand from:
```yaml
startCommand: npm run start:prod
```
to:
```yaml
startCommand: node dist/main.js
```

This ensures the correct file is executed directly.

## How to Deploy

### Option 1: Push to Git and Auto-Deploy
```bash
cd "d:\Study\Adv.React\edulibrary (6)"
git add .
git commit -m "Fix deployment path issue"
git push origin main
```

Render will automatically detect the push and redeploy.

### Option 2: Manual Redeploy on Render Dashboard
1. Go to https://dashboard.render.com
2. Select your `lms-backend` service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**

## Verification

After deployment succeeds, verify:
1. Service status shows "Live" (green)
2. Health check passes at: `https://your-service.onrender.com/health`
3. No module errors in the logs

## Environment Variables Checklist

Make sure these are set in Render Dashboard:
- ✅ `DATABASE_URL` (from your Render PostgreSQL)
- ✅ `JWT_ACCESS_SECRET`
- ✅ `JWT_REFRESH_SECRET`
- ✅ `JWT_ACCESS_EXPIRES_IN=15m`
- ✅ `JWT_REFRESH_EXPIRES_IN=7d`
- ✅ `EMAIL_HOST=smtp.gmail.com`
- ✅ `EMAIL_PORT=587`
- ✅ `EMAIL_USER` (your Gmail)
- ✅ `EMAIL_PASS` (Gmail app password)
- ✅ `PORT=8000`
- ✅ `NODE_ENV=production`
- ✅ `FRONTEND_URL` (your frontend URL)

## Build Process

The build command runs:
```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

This:
1. Installs dependencies
2. Generates Prisma Client
3. Runs database migrations
4. Builds the NestJS application to `dist/` folder

The output structure should be:
```
LMS_BACKEND_NEST/
  dist/
    main.js      ← This is what we execute
    [other compiled files]
```

## Troubleshooting

If deployment still fails:

1. **Check Build Logs**: Look for TypeScript compilation errors
2. **Verify dist/ folder**: Build command should create `dist/main.js`
3. **Check working directory**: Render should be in `LMS_BACKEND_NEST/` due to `rootDir` setting
4. **Environment variables**: Ensure all required variables are set

## Additional Notes

- Render Free Tier spins down after inactivity (first request may be slow)
- Database connection string should use SSL mode (`?sslmode=require`)
- Prisma migrations run automatically during build
