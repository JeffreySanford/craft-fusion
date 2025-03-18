import { Controller, Get, Query, Delete } from '@nestjs/common';
import { LoggingService, LogEntry } from './logging.service';

@Controller('/logs')
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  @Get()
  getLogs(
    @Query('level') level?: string,
    @Query('limit') limit?: number
  ): LogEntry[] {
    return this.loggingService.getLogs(level, limit ? Number(limit) : undefined);
  }

  @Delete()
  clearLogs(): { message: string } {
    this.loggingService.clearLogs();
    return { message: 'Logs have been cleared successfully' };
  }
}
