import { Module } from '@nestjs/common';
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
            const { MongoMemoryServer } = require('mongodb-memory-server');
            // Create an instance and start it
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            const mongoServer = await MongoMemoryServer.create();
            const uri = mongoServer.getUri();
            // Keep a reference for shutdown handling in main.ts
            (global as any).__MONGO_MEMORY_SERVER__ = mongoServer;
            return { uri } as any;
          } catch (err) {
            // If mongodb-memory-server isn't available, fall back to localhost
            // and let the developer install the package.
            // eslint-disable-next-line no-console
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
