import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { FileModule } from './documents/file.module';
import { SocketGatewayModule } from './socket/socket.module';
import { AuthModule } from './auth/auth.module';
import { UserStateModule } from './user-state/user-state.module';
import { RecordsModule } from './records/records.module';
import { RecipesModule } from './recipes/recipes.module';
import { AiModule } from './ai/ai.module';
import { TimelineModule } from './timeline/timeline/timeline.module';
import { YahooModule as FinancialYahooModule } from './financial/yahoo/yahoo.module';
import { FirmsModule } from './firms/firms.module';
import { OpenSkyModule } from './openskies/opensky.module';
import { HttpLoggingInterceptor } from './logging/http-logging.interceptor';
import { SecurityModule } from './security/security.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Try multiple paths so running from dist or the repo root finds the .env file
      envFilePath: ['.env', '../.env', '../../.env', '../../../.env'],
    }),
    // Configure Mongoose with a runtime factory. In development, if no
    // MONGODB_URI is provided, spin up mongodb-memory-server and use its URI.
    MongooseModule.forRootAsync({
      imports: [],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const provided = configService.get<string>('MONGODB_URI');
        const NODE_ENV = process.env['NODE_ENV'] || 'development';
        if (provided && provided.length > 0) {
          return {
            uri: provided,
            // Mongoose options kept minimal; library will merge defaults
            connectionFactory: (conn: any) => conn,
          } as any;
        }

        if (NODE_ENV !== 'production') {
          // Dynamically import to avoid requiring this package in production
          // if it's not installed there.
          try {
              // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-call
              console.log('[mongo] Attempting to start mongodb-memory-server');
              const { MongoMemoryServer } = require('mongodb-memory-server');
              // Create an instance and start it
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call
              // Prefer a configured memory-server port to avoid colliding with system mongod.
              const preferredPort = Number(process.env['MONGODB_MEMORY_PORT'] || 27018);
              let mongoServer;
              try {
                // Try to create on the preferred port first
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                mongoServer = await MongoMemoryServer.create({ instance: { port: preferredPort } });
                console.log('[mongo] mongodb-memory-server created on preferred port', preferredPort);
              } catch (createErr) {
                // Fallback to auto-assigned port
                // eslint-disable-next-line no-console
                console.warn('[mongo] preferred port unavailable, falling back to auto-assigned port', createErr && (createErr as any).message ? (createErr as any).message : String(createErr));
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                mongoServer = await MongoMemoryServer.create();
              }
              const uri = mongoServer.getUri();
              // Keep a reference for shutdown handling in main.ts
              (global as any).__MONGO_MEMORY_SERVER__ = mongoServer;
              // Log that the in-memory MongoDB started (helpful for dev tracing)
              // eslint-disable-next-line no-console
              console.log('[mongo] mongodb-memory-server started', { uri });
              return { uri } as any;
          } catch (err) {
              // If mongodb-memory-server isn't available, fall back to localhost
              // and let the developer inspect the error. Log the error details.
              // eslint-disable-next-line no-console
              // Use a safe access for err.stack to satisfy TypeScript
              // eslint-disable-next-line no-console
              console.error('[mongo] Failed to start mongodb-memory-server:', (err as any)?.stack ?? String(err));
              console.warn('mongodb-memory-server not available, falling back to mongodb://localhost:27017/craft-fusion');
              return { uri: 'mongodb://localhost:27017/craft-fusion' } as any;
          }
        }

        // Production fallback (should be explicitly configured via env)
        return { uri: 'mongodb://localhost:27017/craft-fusion' } as any;
      },
    }),
    FileModule,  // Add FileModule import to make FileService available
    UserModule,
    SocketGatewayModule,
    AuthModule,
    UserStateModule,
    RecordsModule,
    RecipesModule, // <-- Register RecipesModule
    AiModule,
    TimelineModule,
    FinancialYahooModule,
    FirmsModule,
    OpenSkyModule,
    SecurityModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
  ],
})
export class AppModule {}
