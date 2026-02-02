import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'], // Only log errors/warnings for speed
    bufferLogs: true,
  });
  
  // ⚡ COMPRESSION - Reduce response size by 70-90%
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
    level: 6, // Balance between speed and compression
    threshold: 1024, // Only compress responses > 1KB
  }));
  
  // Enable CORS with optimized configuration
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      // Define allowed origins
      const allowedOrigins = [
        'localhost',
        '127.0.0.1',
        '.vercel.app',
        '.vercel.sh',
        '.onrender.com',
        'library-management-system-pi-topaz.vercel.app',
        'library-management-system-1-lwtd.onrender.com',
      ];
      
      // Check if origin matches any allowed pattern
      const isAllowed = allowedOrigins.some(allowed => origin.includes(allowed));
      
      // Also check private network ranges for local development
      const privateNetworkRegex = [
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
        /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
        /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
        /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/,
      ];
      
      const isPrivateNetwork = privateNetworkRegex.some(regex => regex.test(origin));
      
      // Allow if matches any pattern or environment variable
      if (isAllowed || isPrivateNetwork || (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL)) {
        return callback(null, true);
      }
      
      // Log rejected origins for debugging
      console.warn(`CORS rejected origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400, // Cache preflight requests for 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  
  app.use(cookieParser());
  
  // Add a simple /health endpoint for Render and other load balancers.
  // This attaches directly to the underlying Express server so it bypasses the
  // global prefix and is available at GET /health.
  try {
    const server = app.getHttpAdapter().getInstance();
    if (server && typeof server.get === 'function') {
      server.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
    }
  } catch (err) {
    // If the underlying adapter isn't express or an error occurs, ignore and continue.
    // The app will still start and API routes will work under the global prefix.
    // eslint-disable-next-line no-console
    console.warn('Health endpoint not registered:', err?.message ?? err);
  }
  
  app.setGlobalPrefix('api');
  
  // ⚡ ULTRA-FAST VALIDATION - Optimized for speed
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false, // Faster: don't throw on unknown props
    transform: true,
    transformOptions: { 
      enableImplicitConversion: true,
      exposeDefaultValues: true,
    },
    stopAtFirstError: true, // Faster: stop on first validation error
    validateCustomDecorators: true,
    dismissDefaultMessages: false,
    validationError: { target: false, value: false }, // Smaller error responses
  }));
  
  const port = process.env.PORT ?? 8000;
  const host = '0.0.0.0';
  
  await app.listen(port, host);
  
  console.log(`Application is running on: http://${host}:${port}`);
  console.log(`Local access: http://localhost:${port}`);
  console.log(`Network access: http://10.65.240.64:${port}`);
  console.log(`API endpoints available at: /api`);
}
bootstrap();
