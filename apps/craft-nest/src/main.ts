import * as fs from 'fs';
import { from, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { Logger } from '@nestjs/common';
import { environment } from './environments/environment';
import { Request, Response, NextFunction } from 'express';

function bootstrap() {
  Logger.log('Environment:', JSON.stringify(environment));
  if (!environment) {
    Logger.error('Environment not found');
  }
  const isProduction = environment.production;
  Logger.log(`Running in ${isProduction ? 'production' : 'development'} mode`);

  const host = environment.host;
  const port = environment.port;

  const keyPath = environment.keyPath;
  const certPath = environment.certPath;

  Logger.log(`Host: ${host}, Port: ${port}, Key Path: ${keyPath}, Cert Path: ${certPath}`);

  let httpsOptions = {};
  if (isProduction) {
    Logger.log('Production mode detected');
    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      throw new Error(`SSL certificate files not found. Key path: ${keyPath}, Cert path: ${certPath}`);
    }

    httpsOptions = {
      key: fs.readFileSync(keyPath, 'utf8'),
      cert: fs.readFileSync(certPath, 'utf8'),
    };
  } else {
    Logger.log('Development mode detected');
  }

  const app$ = from(NestFactory.create(AppModule, { httpsOptions }));

  app$.pipe(
    tap(app => {
      Logger.log('Nest application created');

      // Enable CORS
      app.enableCors({
        origin: ['http://localhost:4200', 'https://jeffreysanford.us', 'https://www.jeffreysanford.us'],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
      });
      Logger.log('CORS enabled');

      // Swagger setup for both development and production
      const swaggerConfig = new DocumentBuilder()
        .setTitle('API Documentation')
        .setDescription('API description')
        .setVersion('1.0')
        .addBearerAuth() // Optionally add authorization if needed
        .build();

      const document = SwaggerModule.createDocument(app, swaggerConfig);
      SwaggerModule.setup('api-docs', app, document);
      Logger.log('Swagger API documentation is available at /api-docs');
    }),
    switchMap(app => from(app.listen(port, host)).pipe(
      tap(() => {
        Logger.log(`Server is running on https://${host}:${port}`);
      })
    )),
    catchError(err => {
      Logger.error('Error starting the application', err);
      return of(err);
    })
  ).subscribe();
}

bootstrap();