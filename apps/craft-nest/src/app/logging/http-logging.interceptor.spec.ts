import { HttpLoggingInterceptor } from './http-logging.interceptor';
import { of, throwError } from 'rxjs';

describe('HttpLoggingInterceptor', () => {
  const logger = { info: jest.fn(), error: jest.fn() };
  const interceptor = new HttpLoggingInterceptor(logger as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createContext = (overrides?: { request?: any; response?: any }) => ({
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        originalUrl: '/test',
        params: {},
        query: {},
        body: {},
        ...(overrides?.request ?? {}),
      }),
      getResponse: () => ({
        statusCode: 200,
        ...(overrides?.response ?? {}),
      }),
    }),
  });

  it('logs completed HTTP requests', (done) => {
    const context = createContext();
    const next = { handle: () => of({ ok: true }) };

    interceptor.intercept(context as any, next as any).subscribe({
      next: () => {
        expect(logger.info).toHaveBeenCalledWith(
          'HTTP request completed',
          expect.objectContaining({
            method: 'GET',
            path: '/test',
            statusCode: 200,
            durationMs: expect.any(Number),
            result: expect.anything(),
          })
        );
        done();
      },
    });
  });

  it('logs failed HTTP requests', (done) => {
    const context = createContext();
    const next = { handle: () => throwError(() => new Error('boom')) };

    interceptor.intercept(context as any, next as any).subscribe({
      error: () => {
        expect(logger.error).toHaveBeenCalledWith(
          'HTTP request failed',
          expect.objectContaining({
            method: 'GET',
            path: '/test',
            statusCode: 200,
            durationMs: expect.any(Number),
            error: expect.anything(),
          })
        );
        done();
      },
    });
  });
});
