import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { Request, Response } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting Craft Fusion NestJS application...');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  
  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  logger.log('CORS enabled for all origins');
  
  // Add global prefix for API endpoints
  app.setGlobalPrefix('api');
  logger.log('Global API prefix set to /api');
  
  // Create a special route for health checks that doesn't use the global prefix
  app.use('/health', (req: Request, res: Response) => {
    logger.log('Direct health check endpoint accessed');
    const healthData = {
      status: 'online',
      timestamp: new Date().toISOString(),
      message: 'Service is healthy',
    };
    res.json(healthData);
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Health check available at: http://localhost:${port}/health`);
  logger.log(`API endpoints available at: http://localhost:${port}/api/*`);
}

bootstrap().catch(err => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', err);
  process.exit(1);
});
