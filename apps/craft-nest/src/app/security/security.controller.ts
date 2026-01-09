import { Controller, Get } from '@nestjs/common';
import { SecurityService, SecurityEvidence, SecurityFinding } from './security.service';

@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('findings')
  getFindings(): SecurityFinding[] {
    return this.securityService.getFindings();
  }

  @Get('evidence')
  getEvidence(): SecurityEvidence[] {
    return this.securityService.getEvidence();
  }
}
