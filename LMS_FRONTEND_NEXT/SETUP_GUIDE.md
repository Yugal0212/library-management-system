# Quick Setup Guide - Working with Live Backend

## ✅ Backend Status
Your backend is **LIVE** at: https://library-management-system-1-lwtd.onrender.com

Health Check: https://library-management-system-1-lwtd.onrender.com/health ✅

## Frontend Configuration

The frontend is now configured to work with your live backend:

### Environment Variable Set:
```
NEXT_PUBLIC_API_BASE_URL=https://library-management-system-1-lwtd.onrender.com/api
```

## How to Run

### 1. Development Mode (with live backend)
```bash
cd LMS_FRONTEND_NEXT
npm run dev
```
Your frontend will connect to the live backend automatically.

### 2. Production Build
```bash
cd LMS_FRONTEND_NEXT
npm run build
npm start
```

## Deploying Frontend to Vercel/Netlify

### Vercel Deployment:
1. Push your code to GitHub
2. Connect repository to Vercel
3. Add Environment Variable:
   - Key: `NEXT_PUBLIC_API_BASE_URL`
   - Value: `https://library-management-system-1-lwtd.onrender.com/api`
4. Deploy!

### Netlify Deployment:
1. Push your code to GitHub
2. Connect repository to Netlify
3. Go to Site settings → Environment variables
4. Add:
   - Key: `NEXT_PUBLIC_API_BASE_URL`
   - Value: `https://library-management-system-1-lwtd.onrender.com/api`
5. Deploy!

## Testing the Setup

1. **Test API Connection:**
   ```bash
   curl https://library-management-system-1-lwtd.onrender.com/health
   # Should return: {"status":"ok"}
   ```

2. **Start Frontend:**
   ```bash
   cd LMS_FRONTEND_NEXT
   npm run dev
   ```

3. **Test Login:**
   - Open http://localhost:3000
   - Click "Login"
   - Use your credentials
   - Dashboard should redirect properly based on your role

## CORS Configuration

✅ Backend CORS is already configured to allow:
- All `.onrender.com` domains
- All `.vercel.app` and `.vercel.sh` domains
- All `localhost` connections
- All private network IP addresses

No additional CORS configuration needed!

## Troubleshooting

### Issue: "Network Error" or "Failed to fetch"
**Solution:** 
- Check if backend is awake (Render free tier sleeps after inactivity)
- Visit https://library-management-system-1-lwtd.onrender.com/health to wake it up
- Wait 30-60 seconds for the backend to start

### Issue: "CORS Error"
**Solution:** Backend already allows all `.onrender.com` and `.vercel.app` domains. Clear browser cache.

### Issue: "Dashboard redirect not working"
**Solution:** 
- Clear browser localStorage: `localStorage.clear()`
- Make sure `NEXT_PUBLIC_API_BASE_URL` is set
- Restart the dev server

## Important Notes

🔴 **Render Free Tier:** Your backend will sleep after 15 minutes of inactivity. First request after sleep will take 30-60 seconds to wake up.

🟢 **Database:** Make sure your Render Postgres database is also set up and connected to the backend.

🟢 **Environment Variables on Backend:** Ensure all required env vars are set on Render:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL` (optional, but recommended)
- Email settings (if using email features)
