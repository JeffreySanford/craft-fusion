import * as fs from 'fs';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const isProduction = process.env['NODE_ENV'] === 'production';
  const host = process.env['HOST'] || 'localhost';
  const port = parseInt(process.env['PORT'] || '3000', 10);
  
  // Default paths for development
  let keyPath = './apps/craft-nest/src/cert/server.key';
  let certPath = './apps/craft-nest/src/cert/server.crt';

  // Override with production paths if in production
  if (isProduction) {
    keyPath = '/etc/letsencrypt/live/jeffreysanford.us/privkey.pem';
    certPath = '/etc/letsencrypt/live/jeffreysanford.us/fullchain.pem';
  }

  Logger.log(`Starting server in ${isProduction ? 'production' : 'development'} mode`);
  Logger.log(`Host: ${host}, Port: ${port}`);
  Logger.log(`Using SSL cert from: ${certPath}`);

  try {
    // Verify SSL files exist
    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      throw new Error(`SSL certificates not found at ${keyPath} or ${certPath}`);
    }

    const httpsOptions = {
      key: fs.readFileSync(keyPath, 'utf8'),
      cert: fs.readFileSync(certPath, 'utf8'),
    };

    const app = await NestFactory.create(AppModule, { httpsOptions });

    app.enableCors({
      origin: [
        'http://localhost:4200',
        'https://jeffreysanford.us',
        'https://www.jeffreysanford.us'
      ],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: isProduction
    });

    const swaggerConfig = new DocumentBuilder()
      .setTitle('API Documentation')
      .setDescription('API description')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api-docs', app, document);

    await app.listen(port, host);
    Logger.log(`Server running on ${isProduction ? 'https' : 'http'}://${host}:${port}`);
  } catch (error) {
    Logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap().catch(err => {
  Logger.error('Error starting the application', err);
  process.exit(1);
});