import * as fs from 'fs';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const NODE_ENV = process.env['NODE_ENV'] || 'development';
  const isProduction = NODE_ENV === 'production';
  const HOST = process.env['HOST'] || 'localhost';
  const PORT = 3000; // Change to 3000 since nginx will handle 443

  const keyPath = isProduction
    ? '/etc/letsencrypt/live/jeffreysanford.us/privkey.pem'
    : path.resolve(__dirname, '../cert/server.key');
  const certPath = isProduction
    ? '/etc/letsencrypt/live/jeffreysanford.us/fullchain.pem'
    : path.resolve(__dirname, '../cert/server.crt');

  Logger.log(`Starting server in ${NODE_ENV} mode`);
  Logger.log(`Host: ${HOST}, Port: ${PORT}`);
  Logger.log(`SSL Key Path: ${keyPath}, SSL Cert Path: ${certPath}`);

  try {
    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      throw new Error(`SSL certificates not found at ${keyPath} or ${certPath}`);
    }

    const httpsOptions = {
      key: fs.readFileSync(keyPath, 'utf8'),
      cert: fs.readFileSync(certPath, 'utf8'),
    };

    const app = await NestFactory.create(AppModule, { httpsOptions });

    app.enableCors({
      origin: isProduction
        ? ['https://jeffreysanford.us', 'https://www.jeffreysanford.us']
        : ['http://localhost:4200'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: isProduction,
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
    Logger.log(`Server running on ${isProduction ? 'https' : 'http'}://${HOST}:${PORT}`);
  } catch (error) {
    Logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
