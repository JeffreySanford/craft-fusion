import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

// Import your controllers and services here
// import { AppController } from './app.controller';
// import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // Add other modules here
  ],
  controllers: [
    // AppController,
    // Add other controllers here
  ],
  providers: [
    // AppService,
    // Add other services here
  ],
})
export class AppModule {
  constructor() {
    // Ensure storage directories exist
    const storagePath = path.resolve(process.cwd(), 'apps/craft-nest/storage');
    const documentsPath = path.join(storagePath, 'documents', 'book');
    
    // Create directories if they don't exist
    if (!fs.existsSync(documentsPath)) {
      try {
        fs.mkdirSync(documentsPath, { recursive: true });
        console.log('Storage directories created successfully');
      } catch (error) {
        console.error('Failed to create storage directories:', error);
      }
    }
  }
}
