import { Test, TestingModule } from '@nestjs/testing';
import { OpenSkyController } from './opensky.controller';
import { OpenSkyService } from './opensky.service';
import { HttpModule } from '@nestjs/axios';
import { LoggingService } from '../logging/logging.service';
import { ConfigService } from '@nestjs/config';
class MockHttpService {}
class MockLoggingService {
  logServiceCall = jest.fn();
}

describe('OpenskyController', () => {
  let controller: OpenSkyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [OpenSkyController],
      providers: [
        OpenSkyService,
        {
          provide: LoggingService,
          useClass: MockLoggingService,
        },
        {
          provide: MockHttpService,
          useClass: MockHttpService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_key: string, defaultValue: string) => defaultValue),
          },
        },
      ],
    }).compile();

    controller = module.get<OpenSkyController>(OpenSkyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
