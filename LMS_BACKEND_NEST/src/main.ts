import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

// eslint-disable-next-line @typescript-eslint/no-var-requires
// const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow localhost and 127.0.0.1
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      
      // Allow private network ranges
      const privateNetworkRegex = [
        /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,
        /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:3000$/,
        /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:3000$/,
      ];
      
      const isPrivateNetwork = privateNetworkRegex.some(regex => regex.test(origin));
      if (isPrivateNetwork) {
        return callback(null, true);
      }
      
      // Allow environment variable origin
      if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
        return callback(null, true);
      }
      
      // Allow Render.com domains
      if (origin && origin.includes('.onrender.com')) {
        return callback(null, true);
      }
      
      // Allow Vercel domains
      if (origin && (origin.includes('.vercel.app') || origin.includes('.vercel.sh'))) {
        return callback(null, true);
      }
      
      // Reject all other origins
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
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
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
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
