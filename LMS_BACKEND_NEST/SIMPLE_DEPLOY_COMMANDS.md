# 🚀 Simple Deploy Commands

## First Time Setup

### 1. Push to GitHub
```bash
cd "d:\Study\Adv.React\edulibrary (6)"
git init
git add .
git commit -m "Initial deploy"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 2. Deploy on Render
1. Go to https://dashboard.render.com
2. Click "New +" → "Blueprint"
3. Connect your GitHub repo
4. Click "Apply"
5. Add these environment variables in the web service:
   - `JWT_SECRET=make-this-a-long-random-string-32-chars-min`
   - `FRONTEND_URL=your-frontend-url` (optional)
   - `MAIL_HOST=smtp.gmail.com`
   - `MAIL_PORT=587`
   - `MAIL_USER=your@email.com`
   - `MAIL_PASS=your-gmail-app-password`

**Done! ✅**

---

## Every Time You Want to Deploy

```bash
# 1. Make your changes, then:
git add .

# 2. Commit with a message
git commit -m "Your update message"

# 3. Push (auto-deploys!)
git push
```

**That's it!** Render auto-deploys when you push to `main`.

---

## Check Your Deployment

**Health Check:**
```
https://your-service-name.onrender.com/health
```

**Your API:**
```
https://your-service-name.onrender.com/api
```

---

## Important Notes

✅ **Auto-deploy is ON** - Every push to `main` = automatic deployment
✅ **Migrations run automatically** during build
✅ **No extra commands needed**

⚠️ **Free tier spins down after 15 mins of inactivity**
- First request after spin-down takes ~30-60 seconds
- Use UptimeRobot to keep it alive (ping every 14 mins)

---

## Troubleshooting

**Check logs:**
1. Go to Render dashboard
2. Click your service
3. Click "Logs" tab

**Re-run migrations manually:**
1. Go to your service on Render
2. Click "Shell" tab
3. Run: `npx prisma migrate deploy`

**Restart service:**
1. Go to your service
2. Click "Manual Deploy" → "Clear build cache & deploy"

---

## That's All! 🎉

Three commands to deploy:
```bash
git add .
git commit -m "Update"
git push
```
