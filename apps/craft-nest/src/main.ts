import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

// Type guard to safely handle errors
function isError(error: unknown): error is Error {
  return error instanceof Error || 
         (typeof error === 'object' && 
          error !== null && 
          'message' in error);
}

async function bootstrap() {
  // Define HTTPS options before creating the app
  let httpsOptions;
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const isProduction = NODE_ENV === 'production';
  
  if (isProduction) {
    const keyPath = process.env.SSL_KEY_PATH;
    const certPath = process.env.SSL_CERT_PATH;
    
    if (keyPath && certPath) {
      try {
        httpsOptions = {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        };
      } catch (error: unknown) {
        Logger.error('Error reading SSL files, running without HTTPS', isError(error) ? error : String(error));
      }
    } else {
      Logger.error('SSL files not found, running without HTTPS');
    }
  }

  // Create app with optimized settings
  const app = await NestFactory.create(AppModule, { 
    httpsOptions,
    bodyParser: true,
    cors: true,
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    bufferLogs: true,
  });
  
  const configService = app.get(ConfigService);
  
  const HOST = isProduction ? 'jeffreysanford.us' : 'localhost';
  let PORT = configService.get<number>('NEST_PORT') || 3000;
  const protocol = isProduction ? 'https' : 'http';
  
  // Configure server timeouts
  const serverTimeout = 120000; // 2 minutes
  app.getHttpAdapter().getInstance().timeout = serverTimeout;
  app.getHttpAdapter().getInstance().keepAliveTimeout = serverTimeout;
  
  Logger.log(`Starting server in ${NODE_ENV} mode with ${serverTimeout}ms timeout`);
  Logger.log(`Host: ${HOST}, Port: ${PORT}`);

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Configure CORS
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = ['http://localhost:4200', 'https://jeffreysanford.us', 'https://www.jeffreysanford.us'];
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        Logger.warn(`CORS blocked request from origin: ${origin}`);
        callback(null, false);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 3600,
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // Configure Helmet
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  
  // Add request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    try {
      // Set socket timeout
      if (req.socket) {
        req.socket.setTimeout(serverTimeout);
      }
      
      // Set response timeout to prevent 504 errors
      res.setTimeout(serverTimeout, () => {
        const duration = Date.now() - startTime;
        Logger.warn(`Request timeout after ${duration}ms for ${req.method} ${req.url}`);
        
        if (!res.headersSent) {
          res.status(504).json({
            statusCode: 504,
            message: 'Gateway Timeout',
            error: 'The server took too long to respond',
          });
        }
      });
      
      // Log slow but completed requests
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const url = req.originalUrl || req.url;
        
        if (duration > 5000) {
          Logger.warn(`Slow request: ${req.method} ${url} completed in ${duration}ms`);
        }
        
        // Special logging for specific endpoints
        if (url === '/api/records/generate' || url.startsWith('/api/records/generate?') || 
            url === '/api/records/time') {
          Logger.log(`Records API request completed in ${duration}ms: ${req.method} ${url}`);
        }

        if (req.originalUrl?.includes('/yahoo/')) {
          Logger.log(`Yahoo API request: ${req.method} ${req.originalUrl}`);
        }
      });
      
      // Special handling for record generation endpoints
      if (req.originalUrl === '/api/records/generate' || 
          req.originalUrl?.startsWith('/api/records/generate?')) {
        // Set a custom timeout just for this endpoint
        const specialTimeout = serverTimeout * 1.5; // Even longer timeout (3 minutes)
        if (req.socket) req.socket.setTimeout(specialTimeout);
        res.setTimeout(specialTimeout);
      }
    } catch (error: unknown) {
      Logger.error(`Middleware error: ${isError(error) ? error.message : String(error)}`, 
                 isError(error) ? error.stack : undefined);
    }
    
    next();
  });

  // Custom route handler for Yahoo historical endpoint
  app.getHttpAdapter().get('/yahoo/historical', (req, res) => {
    Logger.log('Handling Yahoo historical data request');
    
    try {
      app.getHttpAdapter().getInstance()._router.handle(
        { ...req, url: '/api/financial/yahoo/historical' + (req._parsedUrl.search || '') },
        res,
        () => {
          if (!res.headersSent) {
            res.status(404).json({ 
              message: 'Yahoo historical data endpoint not properly configured' 
            });
          }
        }
      );
    } catch (error: unknown) {
      if (!res.headersSent) {
        res.status(500).json({ 
          message: 'Error processing Yahoo historical data request' 
        });
      }
      Logger.error(`Yahoo handler error: ${isError(error) ? error.message : String(error)}`);
    }
  });

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Start server with error handling
  try {
    await app.listen(PORT, '0.0.0.0');
    Logger.log(`Server running on ${protocol}://${HOST}:${PORT}`);
  } catch (error: unknown) {
    if (isError(error) && (error as NodeJS.ErrnoException).code === 'EADDRINUSE') {
      // If port is in use, try a different port
      PORT = PORT + 1;
      Logger.warn(`Port ${PORT-1} is in use, trying port ${PORT} instead`);
      try {
        await app.listen(PORT, '0.0.0.0');
        Logger.log(`Server running on ${protocol}://${HOST}:${PORT}`);
        Logger.warn(`IMPORTANT: Update your proxy configuration to use port ${PORT}`);
      } catch (retryError: unknown) {
        Logger.error(`Failed to start server: ${isError(retryError) ? retryError.message : String(retryError)}`);
        process.exit(1);
      }
    } else {
      Logger.error(`Failed to start server: ${isError(error) ? error.message : String(error)}`);
      process.exit(1);
    }
  }
}

bootstrap().catch((error: unknown) => {
  Logger.error(`Bootstrap error: ${isError(error) ? error.message : String(error)}`);
  process.exit(1);
});
