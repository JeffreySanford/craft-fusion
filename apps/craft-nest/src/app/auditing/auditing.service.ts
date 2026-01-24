import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditingService {
  recordEvent(event: string) {
     // console.log('Auditing event:', event);
  }
}
