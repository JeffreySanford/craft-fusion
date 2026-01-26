import { Injectable, Logger } from '@nestjs/common';

const AUDIT_LOGGER = new Logger('AuditingService');

@Injectable()
export class AuditingService {
  recordEvent(event: string) {
    // Keep a minimal, explicit usage so the parameter is intentionally consumed
    AUDIT_LOGGER.debug(typeof event === 'string' ? event : String(event));
  }
}
