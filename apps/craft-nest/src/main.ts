import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';
import helmet from 'helmet';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { environment } from './environments/environment';

// Import shared types from craft-library
// import { User } from '@craft-fusion/craft-library';

// Type guard to safely handle errors
function isError(error: unknown): error is Error {
  return error instanceof Error || 
         (typeof error === 'object' && 
          error !== null && 
          'message' in error);
}

async function bootstrap() {
  let httpsOptions;
  const app = await NestFactory.create(AppModule, httpsOptions ? { httpsOptions } : undefined);
  app.setGlobalPrefix('api'); // Add this line to ensure all routes have /api prefix
  // Define HTTPS options before creating the app
  const NODE_ENV = process.env['NODE_ENV'] || 'development';
  const isProduction = NODE_ENV === 'production';
  
  if (isProduction && environment.useHttps) {
    const keyPath = process.env['SSL_KEY_PATH'] || environment.sslKeyPath;
    const certPath = process.env['SSL_CERT_PATH'] || environment.sslCertPath;
    
    if (keyPath && certPath) {
      try {
        // Check if files exist before trying to read them
        if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
          httpsOptions = {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
          };
          Logger.log('SSL certificates loaded successfully');
        } else {
          Logger.warn(`SSL files not found at paths: ${keyPath}, ${certPath}`);
        }
      } catch (error: unknown) {
        Logger.warn('Error reading SSL files, running without HTTPS', isError(error) ? error.stack : String(error));
      }
    } else {
      Logger.warn('SSL file paths not configured, running without HTTPS');
    }
  }

  // Create app with optimized settings
  const configService = app.get(ConfigService);
  
  const HOST = isProduction ? 'jeffreysanford.us' : '0.0.0.0';
  let PORT = configService.get<number>('NEST_PORT') || 3000;
  const protocol = isProduction ? 'https' : 'http';
  
  // Configure server timeouts
  const serverTimeout = 120000; // 2 minutes
  app.getHttpAdapter().getInstance().timeout = serverTimeout;
  app.getHttpAdapter().getInstance().keepAliveTimeout = serverTimeout;
  
  Logger.log(`Starting server in ${NODE_ENV} mode with ${serverTimeout}ms timeout`);
  Logger.log(`Host: ${HOST}, Port: ${PORT}`);

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
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Request-ID', 
      'X-Content-Type-Options', 
      'X-Frame-Options', 
      'X-XSS-Protection'
    ],
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

  // Swagger (OpenAPI) setup
  try {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Craft Fusion API (Nest)')
      .setDescription('NestJS API documentation for Craft Fusion')
      .setVersion('1.0')
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    // Make Swagger UI read-only for reviewers (no "Try it out"), compact view
    const swaggerOptions: SwaggerCustomOptions = {
      swaggerOptions: {
        supportedSubmitMethods: [],
        docExpansion: 'none',
        deepLinking: true,
        displayRequestDuration: true,
      },
      customSiteTitle: 'Craft Fusion API Docs',
    };
    // Expose under /api/swagger to align with the global prefix
    SwaggerModule.setup('api/swagger', app, swaggerDocument, swaggerOptions);
    // Also expose at /api/api-docs for compatibility with previous links
    SwaggerModule.setup('api/api-docs', app, swaggerDocument, swaggerOptions);
    Logger.log('Swagger UI available at /api/swagger and /api/api-docs');
  } catch (e) {
    Logger.warn(`Failed to initialize Swagger: ${isError(e) ? e.message : String(e)}`);
  }

  // Start server with error handling
  try {
    await app.listen(3000, '0.0.0.0');
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
