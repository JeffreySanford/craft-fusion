import * as fs from 'fs';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { Logger } from '@nestjs/common';
import { environment } from './environments/environment';

async function bootstrap() {
  const isProduction = environment.production;
  const host = environment.host;
  const port = environment.port;
  const keyPath = environment.keyPath;
  const certPath = environment.certPath;

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
    credentials: isProduction,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('API description')
    .setVersion('1.0')
    .addBearerAuth() // Optionally add authorization if needed
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(port, host);
  const protocol = isProduction ? 'https' : 'https';
  Logger.log(`Swagger is running on ${protocol}://${host}:${port}/api-docs`);
}

bootstrap().catch(err => {
  Logger.error('Error starting the application', err);
});