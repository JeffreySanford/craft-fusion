import { Controller, Get, Delete, Query, UseGuards } from '@nestjs/common';
import { LoggingService, LogEntry } from './logging.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminGuard } from '../guards/admin.guard';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@ApiTags('logs')
@Controller('logs')
@UseGuards(AdminGuard)
export class LoggingController {
  constructor(private loggingService: LoggingService) {}

  @Get()
  @ApiOperation({ summary: 'Get application logs' })
  @ApiQuery({ name: 'level', required: false, enum: ['debug', 'info', 'warn', 'error'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getLogs(
    @Query('level') level?: string,
    @Query('limit') limit?: number
  ): Observable<LogEntry[]> {
    return this.loggingService.getLogs(level, limit ? parseInt(limit.toString(), 10) : 100);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear application logs' })
  clearLogs(): Observable<{ message: string }> {
    return this.loggingService.clearLogs().pipe(
      map(() => ({ message: 'Logs cleared successfully' }))
    );
  }
}
