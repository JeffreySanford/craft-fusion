import { Module } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { PdfGenerationService } from '../common/pdf-generation.service';
import { SecurityScanGateway } from '../security-scan/security-scan.gateway';

@Module({
  controllers: [SecurityController],
  providers: [SecurityService, PdfGenerationService, SecurityScanGateway],
  exports: [SecurityService],
})
export class SecurityModule {}
