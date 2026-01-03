import { Test, TestingModule } from '@nestjs/testing';
import { OpenSkyController } from './opensky.controller';
import { OpenSkyService } from './opensky.service';
import { HttpService } from '@nestjs/axios';
import { LoggingService } from '../logging/logging.service';
import { of } from 'rxjs';

describe('OpenskyController', () => {
  let controller: OpenSkyController;
  const mockHttpService = {
    get: jest.fn().mockReturnValue(of({ data: { states: [] } })),
  };
  const mockLoggingService = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OpenSkyController],
      providers: [
        OpenSkyService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: LoggingService,
          useValue: mockLoggingService,
        },
      ],
    }).compile();

    controller = module.get<OpenSkyController>(OpenSkyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
