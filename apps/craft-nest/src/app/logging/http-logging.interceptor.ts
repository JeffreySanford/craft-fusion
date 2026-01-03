import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggingService } from './logging.service';
import { summarizeForLog } from './logging.utils';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const startTime = Date.now();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    const payload = {
      method: request?.method,
      path: request?.originalUrl || request?.url,
      params: summarizeForLog(request?.params ?? {}),
      query: summarizeForLog(request?.query ?? {}),
      body: summarizeForLog(request?.body ?? {}),
    };

    return next.handle().pipe(
      tap({
        next: (result) => {
          this.logger.info('HTTP request completed', {
            ...payload,
            statusCode: response?.statusCode,
            durationMs: Date.now() - startTime,
            result: summarizeForLog(result),
            suppressConsole: true,
          });
        },
        error: (error) => {
          this.logger.error('HTTP request failed', {
            ...payload,
            statusCode: error?.status ?? error?.statusCode ?? response?.statusCode,
            durationMs: Date.now() - startTime,
            error,
          });
        },
      }),
    );
  }
}
