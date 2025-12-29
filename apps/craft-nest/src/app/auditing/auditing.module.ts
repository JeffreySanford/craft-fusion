import { Module } from '@nestjs/common';
import { AuditingService } from './auditing.service';
import { AuditingController } from './auditing.controller';

@Module({
  providers: [AuditingService],
  controllers: [AuditingController],
})
export class AuditingModule {}
