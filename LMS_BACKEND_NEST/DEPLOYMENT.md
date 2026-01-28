# Deploying NestJS Backend to Render (Free Tier)

This guide will walk you through deploying your Library Management System backend to Render using GitHub.

## Prerequisites

- GitHub account
- Render account (sign up at https://render.com)
- Your code pushed to a GitHub repository

## Step-by-Step Deployment Guide

### Step 1: Prepare Your GitHub Repository

1. **Create a GitHub Repository** (if you haven't already)
   ```bash
   # Initialize git in your project root (edulibrary folder)
   git init
   
   # Add all files
   git add .
   
   # Commit
   git commit -m "Initial commit: LMS Backend and Frontend"
   
   # Add remote repository (replace with your GitHub repo URL)
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   
   # Push to GitHub
   git push -u origin main
   ```

2. **Ensure Your .gitignore is Correct**
   - Make sure `.env` files are in `.gitignore`
   - `node_modules/` should be ignored
   - `dist/` folder should be ignored

### Step 2: Sign Up / Login to Render

1. Go to https://render.com
2. Sign up or log in (you can use your GitHub account)
3. Connect your GitHub account to Render

### Step 3: Create PostgreSQL Database (Free Tier)

1. From Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Fill in the details:
   - **Name**: `lms-db` (or any name you prefer)
   - **Database**: `lms_database`
   - **User**: (auto-generated)
   - **Region**: `Oregon (US West)` (or closest to you)
   - **PostgreSQL Version**: Latest (15 or 16)
   - **Plan**: **Free** (90 days, then expires)
   
3. Click **"Create Database"**
4. **IMPORTANT**: After creation, copy the **"Internal Database URL"** or **"External Database URL"**
   - Internal URL is faster and free for connecting services within Render
   - Format: `postgresql://username:password@hostname:port/database`

### Step 4: Deploy Web Service

#### Option A: Manual Setup (Recommended for learning)

1. From Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository:
   - Click **"Connect a repository"**
   - Select your repository from the list
   
3. Fill in the service configuration:
   - **Name**: `lms-backend`
   - **Region**: `Oregon (US West)` (same as database)
   - **Branch**: `main`
   - **Root Directory**: `LMS_BACKEND_NEST`
   - **Runtime**: `Node`
   - **Build Command**: 
     ```bash
     npm install && npx prisma generate && npm run build
     ```
   - **Start Command**: 
     ```bash
     npm run start:prod
     ```
   - **Plan**: **Free**

4. Click **"Advanced"** to add Environment Variables:

   Add these environment variables:
   
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `8000` |
   | `DATABASE_URL` | Paste the PostgreSQL connection string from Step 3 |
   | `JWT_SECRET` | Generate a secure random string (e.g., use: `openssl rand -base64 32`) |
   | `FRONTEND_URL` | Your frontend URL (add later after deploying frontend) |
   | `MAIL_HOST` | Your email service host (e.g., `smtp.gmail.com`) |
   | `MAIL_PORT` | Email port (e.g., `587` for Gmail) |
   | `MAIL_USER` | Your email address |
   | `MAIL_PASS` | Your email app password |

5. **Health Check Path** (in Advanced settings):
   - Path: `/health`

6. Click **"Create Web Service"**

#### Option B: Using render.yaml (Blueprint)

If you want to use the `render.yaml` file that's already in your project:

1. From Render Dashboard, click **"New +"** → **"Blueprint"**
2. Connect your GitHub repository
3. Render will automatically detect the `render.yaml` file
4. Review the services that will be created
5. You'll still need to add the environment variables manually in the Render dashboard

### Step 5: Run Database Migrations

After your service is deployed successfully:

1. Go to your web service in Render Dashboard
2. Click on **"Shell"** tab (in the left sidebar)
3. Run the following commands:

   ```bash
   # Run Prisma migrations
   npx prisma migrate deploy
   
   # Optional: Seed the database with initial data
   npm run prisma:seed
   ```

### Step 6: Test Your Deployment

1. Get your service URL from Render (something like `https://lms-backend.onrender.com`)
2. Test the health endpoint:
   ```
   https://lms-backend.onrender.com/health
   ```
3. Test the API:
   ```
   https://lms-backend.onrender.com/api/auth/status
   ```

## Important Notes

### Free Tier Limitations

- **Web Service**: 
  - 750 hours/month (enough for one service)
  - Spins down after 15 minutes of inactivity
  - Cold start takes 30-60 seconds when service wakes up
  
- **PostgreSQL Database**:
  - Free for 90 days
  - 1GB storage
  - After 90 days, you'll need to upgrade to a paid plan or migrate to another database

### Environment Variables for Production

Generate secure values:

```bash
# Generate JWT_SECRET (32 bytes)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Email Configuration

For Gmail:
1. Enable 2-Factor Authentication
2. Generate an "App Password" from Google Account settings
3. Use the app password (not your regular password) for `MAIL_PASS`

### Monitoring and Logs

- Access logs from Render Dashboard → Your Service → "Logs" tab
- Monitor service health and uptime
- Set up alerts for service failures (in Service Settings)

## Updating Your Deployment

When you push changes to GitHub:

1. Commit your changes:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. Render will automatically detect the push and redeploy (if auto-deploy is enabled)
3. Monitor the deployment in the Render Dashboard

## Troubleshooting

### Service Won't Start

- Check the logs in Render Dashboard
- Verify all environment variables are set correctly
- Ensure DATABASE_URL is correct
- Check that build command completed successfully

### Database Connection Issues

- Verify DATABASE_URL format: `postgresql://user:password@host:port/database`
- Use Internal Database URL for better performance
- Check that database is running in Render Dashboard

### Prisma Migration Errors

- Run migrations manually using Shell in Render Dashboard
- Check that Prisma schema matches your migrations
- Verify PostgreSQL version compatibility

### Cold Start Issues

- Free tier services sleep after 15 minutes of inactivity
- First request after sleep will be slow (30-60s)
- Consider using a paid plan for always-on service
- Or use a cron job service (like cron-job.org) to ping your service every 10 minutes

## Next Steps

1. Deploy your Next.js frontend (LMS_FRONTEND_NEXT) to Vercel or Render
2. Update the `FRONTEND_URL` environment variable in your backend
3. Update the API URL in your frontend to point to your Render backend
4. Test the full application end-to-end

## Useful Commands

```bash
# View logs
# (Use Render Dashboard → Logs tab)

# Run shell commands on deployed service
# (Use Render Dashboard → Shell tab)

# Restart service
# (Use Render Dashboard → Manual Deploy → "Clear build cache & deploy")
```

## Security Checklist

- [ ] All sensitive data is in environment variables (not in code)
- [ ] `.env` files are in `.gitignore`
- [ ] JWT_SECRET is a strong random string
- [ ] Database credentials are secure
- [ ] CORS is configured correctly for your frontend URL
- [ ] Email credentials use app-specific passwords

## Cost Estimate

- **Backend Web Service**: Free (750 hours/month)
- **PostgreSQL Database**: Free for 90 days, then $7/month
- **Total First 90 Days**: $0
- **After 90 Days**: $7/month (just for database)

---

## Alternative: Using Render's Blueprint Feature

If you prefer automated setup, you can use the `render.yaml` file:

1. Move `render.yaml` to the root of your repository (not inside LMS_BACKEND_NEST)
2. Update the file if needed
3. Push to GitHub
4. In Render Dashboard, create a new "Blueprint"
5. Select your repository
6. Render will create all services automatically

However, you'll still need to manually:
- Add environment variables
- Run database migrations
- Configure email settings
