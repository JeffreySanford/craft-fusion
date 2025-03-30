import { Controller, Get, Query, Logger, Post } from '@nestjs/common';
import { LoggingService, LogEntry } from './logging.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Controller('api/logs')
export class LoggingController {
  private readonly logger = new Logger(LoggingController.name);

  constructor(private readonly loggingService: LoggingService) {
    this.logger.log('LoggingController initialized');
  }

  @Get()
  getLogs(
    @Query('limit') limit: string = '100',
    @Query('level') level?: string,
  ): Observable<LogEntry[]> {
    this.logger.log(`Logs requested with limit: ${limit}, level: ${level || 'all'}`);
    return this.loggingService.getLogs(parseInt(limit, 10), level);
  }

  @Post('clear')
  clearLogs(): Observable<{ success: boolean; message: string }> {
    this.logger.log('Clear logs requested');
    return this.loggingService.clearLogs().pipe(
      map(success => ({
        success,
        message: 'Logs cleared successfully'
      }))
    );
  }
}
