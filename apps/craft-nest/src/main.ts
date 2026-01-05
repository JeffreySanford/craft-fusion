import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as bcrypt from 'bcryptjs';
import { Logger, ValidationPipe } from '@nestjs/common';
// JwtService and randomUUID were used for earlier token generation; not needed now
import { SwaggerModule, DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';
import helmet from 'helmet';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { environment } from './environments/environment';
import * as path from 'path';
import { firstValueFrom } from 'rxjs';
import { TimelineService } from './app/timeline/timeline/timeline.service';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

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
  const connection = app.get<Connection>(getConnectionToken());

  // Enable Nest's shutdown hooks so we can gracefully stop the in-memory DB
  // when the process exits.
  try {
    console.log('[bootstrap] Starting seed process; waiting for mongoose connection...');
    app.enableShutdownHooks();
  } catch (e) {
    // ignore if not available
  }
  
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

  // Enable global validation for incoming requests (whitelist/forbidNonWhitelisted)
  // This ensures DTOs with class-validator decorators are enforced at runtime.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  
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

    // Wait for mongoose connection in development before seeding
    async function waitForMongooseConnected(connection: Connection, timeout = 10000) {
      // If already connected, return immediately
      try {
        if ((connection as any)?.readyState === 1) return true;
      } catch (e) {
        // ignore
      }

      const start = Date.now();
      // Periodic diagnostics interval
      const diagInterval = 1000;

      return await new Promise<boolean>((resolve) => {
        let settled = false;
        let pollTimer: NodeJS.Timeout | undefined;

        const getReady = () => {
          try {
            const connAny = connection as any;
            if (connAny && typeof connAny.readyState !== 'undefined') return connAny.readyState;
          } catch (e) {
            // ignore
          }
          return -1;
        };

        const onConnected = () => {
          if (settled) return;
          settled = true;
          clearInterval(diagnosticTimer);
          if (pollTimer) clearInterval(pollTimer);
          clearTimeout(timeoutTimer);
          // eslint-disable-next-line no-console
          console.log('[bootstrap][diagnostic] mongoose emitted connected');
          resolve(true);
        };

        const diagnosticTimer = setInterval(() => {
          const elapsed = Date.now() - start;
          const ready = getReady();
          const connAny = connection as any;
          const clientUrl = connAny?.client?.s?.url ?? connAny?.client?.s?.cs?.url ?? '<unknown>';
          // eslint-disable-next-line no-console
          console.log(`[bootstrap][diagnostic] mongoose.readyState=${ready}, elapsed=${elapsed}ms, clientUrl=${clientUrl}`);
        }, diagInterval);

        const timeoutTimer = setTimeout(() => {
          if (settled) return;
          settled = true;
          clearInterval(diagnosticTimer);
          if (pollTimer) clearInterval(pollTimer);
          try {
            if (connection && typeof (connection as any).removeListener === 'function') {
              (connection as any).removeListener('connected', onConnected);
            }
          } catch (e) {
            // ignore
          }
          // eslint-disable-next-line no-console
          console.log('[bootstrap][diagnostic] waitForMongooseConnected timed out');
          resolve(false);
        }, timeout);

        // Attach listener for the connected event if possible
        try {
          if (connection && typeof (connection as any).once === 'function') {
            (connection as any).once('connected', onConnected);
          } else {
            throw new Error('connection.once not available');
          }
        } catch (e) {
          // If attaching listener fails, fallback to polling
          // eslint-disable-next-line no-console
          console.log('[bootstrap][diagnostic] failed to attach connected listener, will poll instead');
          pollTimer = setInterval(() => {
            try {
              if (getReady() === 1) {
                if (pollTimer) clearInterval(pollTimer);
                if (!settled) {
                  settled = true;
                  clearInterval(diagnosticTimer);
                  clearTimeout(timeoutTimer);
                  resolve(true);
                }
              }
            } catch (err) {
              // ignore
            }
          }, 200);
        }
      });
    }

    // Start server with error handling
  try {
    const seededCollections = new Set<string>();
    // Seed the in-memory / development mongo server by default (skip in production)
    if (!isProduction) {
      // Ensure mongoose is connected (for MongooseModule.forRootAsync)
      const ok = await waitForMongooseConnected(connection, 15000);
      if (!ok) { 
        Logger.warn('Mongoose did not connect within timeout; continuing without seeding'); 
        console.log('[bootstrap] Mongoose did not connect within timeout; skipping timeline seeding'); 
        // Log environment and memory-server presence for debugging
        console.log('[bootstrap][diagnostic] process.env.MONGODB_URI=', process.env['MONGODB_URI'] || '<none>');
        console.log('[bootstrap][diagnostic] global.__MONGO_MEMORY_SERVER__=', !!(global as any).__MONGO_MEMORY_SERVER__);
      } else {
        console.log('[bootstrap] Mongoose connected — proceeding with timeline seeding');
      }
      
      try {
        const seedPath = path.join(process.cwd(), 'apps', 'craft-nest', 'src', 'app', 'timeline', 'timeline', 'seed-events.json');
        if (fs.existsSync(seedPath)) {
          const raw = fs.readFileSync(seedPath, 'utf8');
          const seeds = JSON.parse(raw) as Array<Record<string, unknown>>;
          if (Array.isArray(seeds) && seeds.length) {
            const timelineService = app.get(TimelineService);
            const existing = await firstValueFrom(timelineService.findAll().pipe());
            for (const s of seeds) {
              try {
                  const title = String((s as any)['title'] || '');
                  const dateStr = String((s as any)['date'] || '');
                const already = Array.isArray(existing) && existing.some(ev => ev.title === title && new Date(ev.date).toISOString() === new Date(dateStr).toISOString());
                if (!already) {
                  await firstValueFrom(timelineService.create(s as any));
                  Logger.log(`Seeded timeline event: ${title}`);
                  console.log(`[seeder] Seeded timeline event: ${title}`);
                  seededCollections.add('timeline');
                } else {
                  Logger.log(`Skipping existing seeded event: ${title}`);
                  console.log(`[seeder] Skipping existing timeline event: ${title}`);
                }
              } catch (e: unknown) {
                Logger.warn(`Failed to seed event: ${String(e)}`);
                console.log(`[seeder] Failed to seed event ${String((s as any)['title'] || '')}: ${String(e)}`);
              }
            }
          }
        }
      } catch (e: unknown) {
        Logger.warn(`Seed loader error: ${isError(e) ? e.message : String(e)}`);
        console.log('[seeder] Seed loader error:', isError(e) ? e.message : String(e));
      }
    }

    // Seed admin credentials into a simple users collection when provided via env
    try {
      const adminUser = process.env['ADMIN_USERNAME'];
      const adminPass = process.env['ADMIN_PASSWORD'];
      if (adminUser && adminPass) {
        try {
          const usersColl = connection.collection('users');
          const existing = await usersColl.findOne({ username: adminUser });
          if (!existing) {
            const passwordHash = await bcrypt.hash(adminPass, 10);
            const now = new Date();
            const doc = {
              username: adminUser,
              passwordHash,
              roles: ['admin'],
              isAdmin: true,
              createdAt: now,
              updatedAt: now,
            };
            await usersColl.insertOne(doc);
            Logger.log(`Seeded admin user into users collection: ${adminUser}`);
            console.log(`[seeder] Seeded admin user into users collection: ${adminUser}`);
            seededCollections.add('users');
          } else {
            Logger.log(`Admin user already present in users collection: ${adminUser}`);
            console.log(`[seeder] Admin user already present in users collection: ${adminUser}`);
          }
        } catch (e) {
          Logger.warn(`Failed to seed admin credentials: ${isError(e) ? e.message : String(e)}`);
          console.log(`[seeder] Failed to seed admin credentials: ${isError(e) ? e.message : String(e)}`);
        }
      }
    } catch (e) {
      Logger.warn(`Failed to seed admin credentials: ${isError(e) ? e.message : String(e)}`);
    }

    // Seed authentication artifacts (users + tokens) from env and seed file.
    // This runs on every startup; it writes to `users` and `api_tokens` so
    // both in-memory and real Mongo backends can validate JWTs consistently.
    try {
      const seedPath = path.join(process.cwd(), 'apps', 'craft-nest', 'src', 'app', 'auth', 'auth-seed.json');
      const usersColl = connection.collection('users');
      const tokensColl = connection.collection('api_tokens');

        // 1) Prefer env-supplied admin token (ADMIN_TOKEN) — store it as-is.
        const adminToken = process.env['ADMIN_TOKEN'] || process.env['ADMIN_JWT'];
        const adminUserEnv = process.env['ADMIN_USERNAME'];
            if (adminToken && adminUserEnv) {
          try {
            const existing = await tokensColl.findOne({ username: adminUserEnv, type: 'admin' });
            const now = new Date();
            if (!existing) {
              await tokensColl.insertOne({
                username: adminUserEnv,
                token: adminToken,
                type: 'admin',
                roles: ['admin'],
                createdAt: now,
                // We don't know expiry from env token — leave expiresAt undefined
              });
              Logger.log(`Stored ADMIN_TOKEN from env into api_tokens for ${adminUserEnv}`);
              console.log(`[seeder] Stored ADMIN_TOKEN from env for ${adminUserEnv}`);
              seededCollections.add('api_tokens');
            } else {
              Logger.log(`ADMIN_TOKEN already exists in api_tokens for ${adminUserEnv}`);
              console.log(`[seeder] ADMIN_TOKEN already exists for ${adminUserEnv}`);
            }
          } catch (e) {
            Logger.warn(`Failed to store ADMIN_TOKEN from env: ${String(e)}`);
            console.log(`[seeder] Failed to store ADMIN_TOKEN from env: ${String(e)}`);
          }
        }

        // 2) If ADMIN_USERNAME/ADMIN_PASSWORD are provided, ensure user record exists
        const adminPass = process.env['ADMIN_PASSWORD'];
        if (adminUserEnv && adminPass) {
          try {
            const existingUser = await usersColl.findOne({ username: adminUserEnv });
            if (!existingUser) {
              const passwordHash = await bcrypt.hash(adminPass, 10);
              const now = new Date();
              await usersColl.insertOne({
                username: adminUserEnv,
                passwordHash,
                roles: ['admin'],
                isAdmin: true,
                createdAt: now,
                updatedAt: now,
              });
              Logger.log(`Seeded admin user into users collection from env: ${adminUserEnv}`);
              console.log(`[seeder] Seeded admin user from env: ${adminUserEnv}`);
              seededCollections.add('users');
            } else {
              Logger.log(`Admin user already present in users collection: ${adminUserEnv}`);
              console.log(`[seeder] Admin user already present: ${adminUserEnv}`);
            }
          } catch (e) {
            Logger.warn(`Failed to seed admin user from env: ${String(e)}`);
            console.log(`[seeder] Failed to seed admin user from env: ${String(e)}`);
          }
        }

        // 3) If an auth-seed.json file exists, seed its users and tokens
        if (fs.existsSync(seedPath)) {
          try {
            const raw = fs.readFileSync(seedPath, 'utf8');
            const seed = JSON.parse(raw) as any;
            if (Array.isArray(seed.users)) {
              for (const u of seed.users) {
                try {
                  if (!u.username) continue;
                  const exist = await usersColl.findOne({ username: u.username });
                  if (!exist) {
                    const hash = u.password ? await bcrypt.hash(String(u.password), 10) : undefined;
                    const now = new Date();
                    const doc: any = { username: u.username, roles: u.roles || ['user'], createdAt: now, updatedAt: now };
                    if (hash) doc.passwordHash = hash;
                    await usersColl.insertOne(doc);
                    Logger.log(`Seeded user from auth-seed.json: ${u.username}`);
                    console.log(`[seeder] Seeded user from auth-seed.json: ${u.username}`);
                    seededCollections.add('users');
                  } else {
                    Logger.log(`Skipping existing auth user from auth-seed.json: ${u.username}`);
                    console.log(`[seeder] Skipping existing auth user from auth-seed.json: ${u.username}`);
                  }
                } catch (e) {
                  Logger.warn(`Failed to seed user ${u.username}: ${String(e)}`);
                  console.log(`[seeder] Failed to seed user ${u.username}: ${String(e)}`);
                }
              }
            }

            if (Array.isArray(seed.tokens)) {
              for (const t of seed.tokens) {
                try {
                  if (!t.username || !t.token) continue;
                  const exist = await tokensColl.findOne({ username: t.username, type: t.type || 'env' });
                  if (!exist) {
                    const doc: any = { username: t.username, token: t.token, type: t.type || 'env', roles: t.roles || ['user'], createdAt: new Date() };
                    await tokensColl.insertOne(doc);
                    Logger.log(`Seeded token for ${t.username} from auth-seed.json`);
                    console.log(`[seeder] Seeded token for ${t.username} from auth-seed.json`);
                    seededCollections.add('api_tokens');
                  } else {
                    Logger.log(`Skipping existing token for ${t.username} from auth-seed.json`);
                    console.log(`[seeder] Skipping existing token for ${t.username} from auth-seed.json`);
                  }
                } catch (e) {
                  Logger.warn(`Failed to seed token for ${t.username}: ${String(e)}`);
                  console.log(`[seeder] Failed to seed token for ${t.username}: ${String(e)}`);
                }
              }
            }
        } catch (e) {
          Logger.warn(`Failed to read auth-seed.json: ${String(e)}`);
        }
      }
    } catch (e) {
      Logger.warn(`Auth seeding error: ${isError(e) ? e.message : String(e)}`);
    }

    // After seeding, if any collections were modified, log them for visibility
    if (typeof seededCollections !== 'undefined' && seededCollections.size > 0) {
      console.log('[seeder] Collections seeded or updated:', Array.from(seededCollections));
      Logger.log(`Collections seeded or updated: ${Array.from(seededCollections).join(', ')}`);
    } else {
      console.log('[seeder] No collections were seeded or modified during startup');
    }

    await app.listen(3000, '0.0.0.0');
    Logger.log(`Server running on ${protocol}://${HOST}:${PORT}`);

    // If we started an in-memory MongoDB instance earlier, ensure we stop it
    // on shutdown signals.
    const mongoServer = (global as any).__MONGO_MEMORY_SERVER__;
    const stopMemoryServer = async () => {
      if (mongoServer && typeof mongoServer.stop === 'function') {
        try {
          await mongoServer.stop();
          Logger.log('mongodb-memory-server stopped');
        } catch (e: unknown) {
          Logger.warn(`Error stopping mongodb-memory-server: ${String(e)}`);
        }
      }
    };

    process.on('SIGINT', async () => {
      await stopMemoryServer();
      process.exit(0);
    });
    process.on('SIGTERM', async () => {
      await stopMemoryServer();
      process.exit(0);
    });
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
