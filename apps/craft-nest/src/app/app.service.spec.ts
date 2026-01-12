import { Test } from '@nestjs/testing';

import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('getHello', () => {
    it('should return "Welcome to Craft Fusion API!"', () => {
      expect(service.getHello()).toEqual('Welcome to Craft Fusion API!');
    });
  });
});
