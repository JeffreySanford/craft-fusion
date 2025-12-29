import { Controller, Post, Body } from '@nestjs/common';
import { AuditingService } from './auditing.service';

@Controller('audit')
export class AuditingController {
  constructor(private readonly auditingService: AuditingService) {}

  @Post('event')
  auditEvent(@Body() body: { event: string }) {
    this.auditingService.recordEvent(body.event);
    return { status: 'Event recorded' };
  }
}
