# EduLibrary - Frontend (Next.js)

A modern Library Management System frontend built with Next.js 15, TypeScript, and Tailwind CSS.

## 🚀 Deploy to Vercel (Free)

### Prerequisites
- GitHub/GitLab/Bitbucket account
- Vercel account (sign up at [vercel.com](https://vercel.com))

### Step-by-Step Deployment

#### 1. Prepare Your Repository
```bash
# Ensure your code is committed to git
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

#### 2. Deploy to Vercel

**Option A: Deploy via Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your Git repository
4. Select the `LMS_FRONTEND_NEXT` folder as root directory
5. Configure environment variables (see below)
6. Click **"Deploy"**

**Option B: Deploy via Vercel CLI**
```bash
# Install Vercel CLI globally
npm i -g vercel

# Navigate to frontend directory
cd LMS_FRONTEND_NEXT

# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Deploy to production
vercel --prod
```

#### 3. Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

```env
# Backend API URL (your deployed backend URL)
NEXT_PUBLIC_API_URL=https://your-backend-api.onrender.com

# Optional: Additional configs
NEXT_PUBLIC_APP_NAME=EduLibrary
```

#### 4. Update Backend CORS

Update your backend to allow Vercel domain:
```typescript
// In your NestJS backend main.ts
app.enableCors({
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true,
});
```

## 🎁 Free Vercel Features

### 1. **Vercel Analytics** (Free Tier)
Track real-time page views and performance metrics.

**Setup:**
```bash
npm install @vercel/analytics
```

**Add to your root layout:**
```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**What you get:**
- Real-time visitor tracking
- Page views analytics
- Top pages insights
- Free up to 2,500 events/month

### 2. **Vercel Speed Insights** (Free)
Monitor Core Web Vitals and performance.

**Setup:**
```bash
npm install @vercel/speed-insights
```

**Add to your root layout:**
```tsx
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

**What you get:**
- Core Web Vitals tracking
- Performance score
- Page load metrics
- Device-specific insights

### 3. **Edge Functions** (Free)
Use serverless functions at the edge.

**Usage:**
```typescript
// app/api/hello/route.ts
export const runtime = 'edge';

export async function GET() {
  return new Response('Hello from the edge!');
}
```

### 4. **Automatic Previews** (Free)
Every branch/PR gets its own preview URL automatically.

### 5. **Image Optimization** (Free Tier)
Automatic image optimization via next/image.

**Usage:**
```tsx
import Image from 'next/image';

<Image 
  src="/library.jpg" 
  alt="Library" 
  width={800} 
  height={600}
/>
```

- Free: 1,000 optimized images/month
- Automatic WebP/AVIF conversion

### 6. **Vercel Toolbar** (Free)
Visual development toolbar for previews.

**Enable in vercel.json:**
```json
{
  "devCommand": "npm run dev",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

### 7. **Free SSL Certificates** (Automatic)
HTTPS enabled automatically for all deployments.

### 8. **Free Custom Domains**
- Add custom domain for free
- Automatic SSL
- DNS configuration guide

## 📦 Local Development

### Installation
```bash
# Install dependencies
npm install
# or
pnpm install
# or
yarn install
```

### Environment Setup
Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Run Development Server
```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Build & Production

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm run start
```

## 📊 Vercel Free Tier Limits

| Feature | Free Tier Limit |
|---------|----------------|
| **Bandwidth** | 100 GB/month |
| **Serverless Function Executions** | 100 GB-Hrs |
| **Edge Function Executions** | 500k requests/month |
| **Image Optimizations** | 1,000/month |
| **Build Time** | 6,000 minutes/month |
| **Deployments** | Unlimited |
| **Team Members** | 1 (Hobby plan) |
| **Analytics Events** | 2,500/month |
| **Speed Insights** | Unlimited |

## 🔧 Vercel Configuration

### vercel.json (Optional)
Create `vercel.json` for custom configuration:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "regions": ["iad1"],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend-api.onrender.com/:path*"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## 🌐 Custom Domain Setup

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain name
3. Configure DNS records as shown
4. Wait for DNS propagation (up to 48 hours)

**DNS Configuration Example:**
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## 📈 Monitoring & Performance

### Enable All Free Features
```bash
# Install both analytics packages
npm install @vercel/analytics @vercel/speed-insights
```

### Complete Setup in layout.tsx
```tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

## 🔄 Continuous Deployment

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: For every PR and branch
- **Instant Rollbacks**: Revert to any previous deployment

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify `package.json` scripts

### Environment Variables Not Working
- Must prefix with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding new variables

### CORS Errors
- Update backend CORS to include Vercel domain
- Check API URL in environment variables

### Image Optimization Errors
- Use relative paths for images
- Place images in `public` folder
- Use `next/image` component

## 📚 Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: React Query
- **Authentication**: JWT
- **Deployment**: Vercel

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Analytics Guide](https://vercel.com/docs/analytics)
- [Vercel Speed Insights](https://vercel.com/docs/speed-insights)
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)

## 📝 License

Private - Educational Project

---

**🎉 Your app will be live at**: `https://your-project-name.vercel.app`

For questions or issues, check the [Vercel Status Page](https://www.vercel-status.com/)
