# Frontend Production Deployment Guide

## Environment Variables (CRITICAL for Production)

When deploying to production (Vercel, Netlify, etc.), you **MUST** set the following environment variable:

```
NEXT_PUBLIC_API_BASE_URL=https://library-management-system-1-lwtd.onrender.com/api
```

### For Vercel:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add: `NEXT_PUBLIC_API_BASE_URL` = `https://library-management-system-1-lwtd.onrender.com/api`
4. Make sure it's available for: Production, Preview, and Development
5. Redeploy your application

### For Netlify:
1. Go to Site settings → Build & deploy → Environment
2. Add environment variable: `NEXT_PUBLIC_API_BASE_URL`
3. Value: `https://library-management-system-1-lwtd.onrender.com/api`
4. Save and redeploy

## Dashboard Redirect Fix

The following changes have been made to fix production redirect issues:

1. **Replaced `window.location.href` with `router.push()`**
   - `window.location.href` causes full page reloads and can break in production
   - `router.push()` uses Next.js client-side navigation (faster & more reliable)

2. **Updated config.ts to handle production environment**
   - Now properly checks for `NEXT_PUBLIC_API_BASE_URL` in production
   - Shows clear warning if environment variable is missing
   - Fallbacks are safer and more explicit

3. **Improved AuthGuard navigation**
   - Uses `router.push()` instead of `router.replace()` for better navigation history
   - More reliable redirects in production

## Testing Before Deployment

```bash
# 1. Build locally to test for errors
npm run build

# 2. Run production build locally
npm start

# 3. Test the dashboard redirect after login
```

## Common Issues & Solutions

### Issue: "Dashboard redirects to blank page"
**Solution:** Set `NEXT_PUBLIC_API_BASE_URL` environment variable in your deployment platform

### Issue: "Login works but redirect fails"
**Solution:** Clear browser cache and localStorage, ensure environment variables are set

### Issue: "API calls fail in production"
**Solution:** Check CORS settings on backend, ensure backend URL is correct in env variable

## Backend CORS Configuration

Make sure your backend allows requests from your frontend domain:

```typescript
// In backend main.ts
app.enableCors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true
})
```

## Deployment Checklist

- [ ] Set `NEXT_PUBLIC_API_BASE_URL` environment variable
- [ ] Update backend CORS to allow frontend domain
- [ ] Test login and dashboard redirect
- [ ] Verify API calls work
- [ ] Check all role-based redirects (Admin, Librarian, Patron)
- [ ] Test on multiple browsers
