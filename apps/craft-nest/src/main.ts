import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import * as fs from 'fs';

async function bootstrap() {
  const NODE_ENV = process.env['NODE_ENV'] || 'development';
  const isProduction = NODE_ENV === 'production';
  const HOST = isProduction ? 'jeffreysanford.us' : 'localhost';
  const PORT = 3000;
  const protocol = isProduction ? 'https' : 'http';

  Logger.log(`Starting server in ${NODE_ENV} mode`);
  Logger.log(`Host: ${HOST}, Port: ${PORT}`);

  const httpsOptions = isProduction ? {
    key: fs.readFileSync('/etc/letsencrypt/live/jeffreysanford.us/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/jeffreysanford.us/fullchain.pem'),
  } : undefined;

  const app = await NestFactory.create(AppModule, { 
    httpsOptions
  });

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: ['https://jeffreysanford.us', 'https://www.jeffreysanford.us', 'http://localhost:4200'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 3600
  });

  app.use(helmet());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(PORT, HOST);
  Logger.log(`Server running on ${protocol}://${HOST}:${PORT}`);
}

bootstrap();
