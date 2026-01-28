# Common Commands Reference

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npm run prisma:seed

# Start development server
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod
```

## 🌐 Render Deployment Commands

### Using Render Shell (Dashboard → Your Service → Shell)

```bash
# Check Node version
node --version

# Check npm version
npm --version

# View environment variables
env | grep DATABASE_URL

# Run migrations
npx prisma migrate deploy

# Seed database
npm run prisma:seed

# View Prisma status
npx prisma migrate status

# Generate Prisma Client
npx prisma generate

# Check if service is running
curl http://localhost:$PORT/health
```

## 📦 GitHub Commands

```bash
# Initialize repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Your message here"

# Add remote
git remote add origin https://github.com/USERNAME/REPO.git

# Push to GitHub
git push -u origin main

# Update after changes
git add .
git commit -m "Update: description of changes"
git push origin main
```

## 🔑 Generate Secrets

```bash
# Generate JWT_SECRET (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate JWT_SECRET (OpenSSL)
openssl rand -base64 32

# Generate random password
openssl rand -hex 16
```

## 🗄️ Database Commands

```bash
# Prisma Studio (Visual DB Editor)
npx prisma studio

# Create new migration
npx prisma migrate dev --name description_of_changes

# Deploy migrations (production)
npx prisma migrate deploy

# Reset database (WARNING: Deletes all data!)
npx prisma migrate reset

# View migration status
npx prisma migrate status

# Seed database
npm run prisma:seed

# Format schema file
npx prisma format
```

## 🧪 Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

## 🔍 Debugging Commands

```bash
# Start with debugging enabled
npm run start:debug

# View logs (local)
# Logs will appear in your terminal

# Check if port is in use (Windows)
netstat -ano | findstr :8000

# Kill process on port (Windows - run as admin)
# Find PID from above command, then:
taskkill /PID <PID> /F
```

## 📊 Render Dashboard Actions

### Via Web Interface:

1. **View Logs**: Dashboard → Service → Logs
2. **Environment Variables**: Dashboard → Service → Environment
3. **Manual Deploy**: Dashboard → Service → Manual Deploy
4. **Shell Access**: Dashboard → Service → Shell
5. **Metrics**: Dashboard → Service → Metrics
6. **Settings**: Dashboard → Service → Settings

### Common Tasks:

- **Redeploy**: Manual Deploy → "Clear build cache & deploy"
- **Add Env Var**: Environment → Add Environment Variable
- **View DB URL**: Database → Connect → Internal Database URL
- **Suspend Service**: Settings → Suspend Service
- **Delete Service**: Settings → Delete Service

## 🔄 Update Workflow

```bash
# 1. Make changes locally
# Edit your files

# 2. Test locally
npm run start:dev

# 3. Build to check for errors
npm run build

# 4. Commit and push
git add .
git commit -m "Description of changes"
git push origin main

# 5. Render auto-deploys (if enabled)
# Check Dashboard → Logs for deployment status

# 6. Run migrations if needed (via Render Shell)
npx prisma migrate deploy
```

## 🚨 Troubleshooting Commands

```bash
# Check Prisma Client is generated
ls node_modules/.prisma/client

# Verify DATABASE_URL format
echo $DATABASE_URL

# Test database connection
npx prisma db pull

# Check for syntax errors
npm run build

# Validate Prisma schema
npx prisma validate

# Reset Prisma Client cache
rm -rf node_modules/.prisma
npx prisma generate
```

## 📧 Email Testing

```bash
# Test email configuration (create a test script)
node test-email.js

# Example test-email.js:
# const nodemailer = require('nodemailer');
# const transporter = nodemailer.createTransport({
#   host: process.env.MAIL_HOST,
#   port: process.env.MAIL_PORT,
#   auth: {
#     user: process.env.MAIL_USER,
#     pass: process.env.MAIL_PASS
#   }
# });
# transporter.verify().then(console.log).catch(console.error);
```

## 🔐 Security Commands

```bash
# Check for security vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Check for outdated packages
npm outdated

# Update packages
npm update
```

## 📝 Useful One-Liners

```bash
# Count lines of code
find src -name "*.ts" | xargs wc -l

# Find TODO comments
grep -r "TODO" src/

# List all routes in NestJS
npm run start:dev # then check terminal output

# Check TypeScript compilation
npx tsc --noEmit

# Format code
npm run format

# Lint code
npm run lint
```

## 🌐 Render CLI (Optional - Advanced)

Install Render CLI:
```bash
npm install -g @render/cli
render login
```

Commands:
```bash
# List services
render services list

# View service logs
render logs <service-id>

# Deploy service
render deploy <service-id>

# List environment variables
render env list <service-id>
```

---

## 💡 Quick Tips

1. **Always test locally before deploying**
2. **Use environment variables for all secrets**
3. **Check logs when something breaks**
4. **Clear build cache if deployment seems stuck**
5. **Keep your dependencies up to date**
6. **Commit .env.example but never .env**
7. **Use meaningful commit messages**
8. **Test migrations on local database first**

---

**Need more help?** Check the main deployment guides:
- [QUICK_DEPLOY.md](QUICK_DEPLOY.md) - Fast deployment
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed guide
- [DEPLOY_SUMMARY.md](DEPLOY_SUMMARY.md) - Overview
