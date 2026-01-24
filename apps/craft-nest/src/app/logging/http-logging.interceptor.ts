import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggingService } from './logging.service';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const skipHealthLog = method === 'HEAD' && typeof url === 'string' && url.startsWith('/api/health');
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          if (skipHealthLog) {
            return;
          }
          const duration = Date.now() - startTime;
          this.logger.verbose(`HTTP Success: ${method} ${url} (${duration}ms)`);
        },
        error: (err) => {
          if (skipHealthLog) {
            return;
          }
          const duration = Date.now() - startTime;
          this.logger.error(`HTTP Request Failed: ${method} ${url}`, {
            method,
            url,
            duration,
            error: err.message || err,
          });
        },
      }),
    );
  }
}
