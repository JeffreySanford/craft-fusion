import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app/app.module';

describe('TimelineController (e2e) - Validation', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();

    // Mirror production validation config used in main.ts
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 400 for malformed timeline event (missing required fields)', async () => {
    // Create a payload missing required fields (title, description, date, type)
    const badPayload = { title: 123, description: null, date: 'not-a-date' };

    return request(app.getHttpServer())
      .post('/api/timeline')
      .send(badPayload)
      .expect(400);
  });

  it('should accept a well-formed timeline event', async () => {
    const goodPayload = {
      title: 'Test Event',
      description: 'This is a test',
      date: new Date().toISOString(),
      type: 'PERSONAL'
    };

    const res = await request(app.getHttpServer())
      .post('/api/timeline')
      .send(goodPayload)
      .expect(201);

    expect(res.body).toBeDefined();
  });
});
