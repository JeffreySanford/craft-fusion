import { Controller, Post, Body, Param, Get, Res } from '@nestjs/common';
import { SecurityScanService } from './security-scan.service';
import { StartScanDto } from './dtos/start-scan.dto';
import { Response } from 'express';
import * as path from 'path';

@Controller('security')
export class SecurityScanController {
  constructor(private readonly scanService: SecurityScanService) {}

  @Post('scans')
  startScan(@Body() dto: StartScanDto) {
    // In a real app, guard with Admin auth and pass user info
    return this.scanService.enqueue(dto, { username: 'admin-ui' });
  }

  @Get('scans/:jobId')
  getStatus(@Param('jobId') jobId: string) {
    const status = this.scanService.getStatus(jobId);
    return status ? status : { error: 'not found' };
  }

  @Get('latest')
  getLatest() {
    return this.scanService.getLatest();
  }

  @Get('sboms/:id')
  downloadSbom(@Param('id') id: string, @Res() res: Response) {
    const jobDir = path.join(process.cwd(), 'storage', 'security', id);
    const metaPath = path.join(jobDir, 'meta.json');
    if (require('fs').existsSync(metaPath)) {
      res.sendFile(metaPath);
    } else {
      res.status(404).json({ error: 'not found' });
    }
  }
}
