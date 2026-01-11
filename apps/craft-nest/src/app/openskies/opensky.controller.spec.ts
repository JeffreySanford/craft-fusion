import { Test, TestingModule } from '@nestjs/testing';
import { OpenSkyController } from './opensky.controller';
import { OpenSkyService } from './opensky.service';
import { HttpModule } from '@nestjs/axios';
class MockHttpService {}

describe('OpenskyController', () => {
  let controller: OpenSkyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [OpenSkyController],
      providers: [
        OpenSkyService,
        {
          provide: MockHttpService,
          useClass: MockHttpService,
        },
      ],
    }).compile();

    controller = module.get<OpenSkyController>(OpenSkyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
