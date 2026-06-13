import { Controller, Get, Param } from '@nestjs/common';
import { FaaService } from './faa.service';

@Controller('faa')
export class FaaController {
  constructor(private readonly faaService: FaaService) {}

  @Get('lookup/:nNumber')
  lookup(@Param('nNumber') nNumber: string): { found: boolean; aircraft?: any } {
    const result = this.faaService.lookupNNumber(nNumber);
    if (!result) {
      return { found: false };
    }
    return { found: true, aircraft: result };
  }
}
