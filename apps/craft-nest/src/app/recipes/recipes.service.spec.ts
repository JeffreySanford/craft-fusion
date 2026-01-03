import { Test, TestingModule } from '@nestjs/testing';
import { RecipesService } from './recipes.service';
import { LoggingService } from '../logging/logging.service';

describe('RecipesService', () => {
  let service: RecipesService;
  const mockLoggingService = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        {
          provide: LoggingService,
          useValue: mockLoggingService,
        },
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
