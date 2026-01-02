import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from '../logging/logging.service';

describe('AiService', () => {
  let service: AiService;
  const configService = {
    get: jest.fn((key: string) => (key === 'OPENAI_API_KEY' ? 'test-key' : undefined)),
  };
  const logger = { info: jest.fn(), error: jest.fn() };
  const originalFetch = (global as any).fetch;

  beforeEach(async () => {
    jest.clearAllMocks();
    (global as any).fetch = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: ConfigService, useValue: configService },
        { provide: LoggingService, useValue: logger },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  afterEach(() => {
    (global as any).fetch = originalFetch;
  });

  it('logs AI responses', async () => {
    ((global as any).fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ choices: [{ message: { content: 'Hello' } }] }),
      status: 200,
      ok: true,
    });

    const result = await service.generateFromPrompt('Hello');

    expect(result).toBe('Hello');
    expect(logger.info).toHaveBeenCalledWith(
      'External API request success',
      expect.objectContaining({
        service: 'openai',
        operation: 'generateFromPrompt',
        payload: expect.objectContaining({
          promptPreview: 'Hello',
          promptLength: 5,
        }),
        result: expect.anything(),
        durationMs: expect.any(Number),
      })
    );
  });

  it('logs AI errors', async () => {
    ((global as any).fetch as jest.Mock).mockRejectedValue(new Error('boom'));

    await expect(service.generateFromPrompt('Hello')).rejects.toThrow('boom');

    expect(logger.error).toHaveBeenCalledWith(
      'External API request error',
      expect.objectContaining({
        service: 'openai',
        operation: 'generateFromPrompt',
        payload: expect.objectContaining({
          promptPreview: 'Hello',
          promptLength: 5,
        }),
        error: expect.anything(),
        durationMs: expect.any(Number),
      })
    );
  });
});
