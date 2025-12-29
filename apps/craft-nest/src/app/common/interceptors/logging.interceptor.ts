import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, params, query } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();
    
    // Log the request
    this.logger.log(
      `[REQUEST] ${method} ${url} - UserAgent: ${userAgent}`,
      method !== 'GET' ? { body, params, query } : { params, query }
    );

    // Process the request and log the response
    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - startTime;
          this.logger.log(
            `[RESPONSE] ${method} ${url} - ${responseTime}ms`,
            { responseSize: JSON.stringify(data)?.length || 0 }
          );
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          this.logger.error(
            `[RESPONSE ERROR] ${method} ${url} - ${responseTime}ms`,
            error.stack
          );
        }
      })
    );
  }
}
