import { Controller, Get, Post, Param, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { SecurityService, SecurityEvidence, SecurityFinding, Sbom, OscalProfile, OscalUpdateStatus, ScaItem, RealtimeCheck } from './security.service';
import { PdfGenerationService } from '../common/pdf-generation.service';
import { SecurityScanGateway, ScanProgress } from '../security-scan/security-scan.gateway';
import { v4 as uuidv4 } from 'uuid';

@Controller('security')
export class SecurityController {
  constructor(
    private readonly securityService: SecurityService,
    private readonly pdfService: PdfGenerationService,
    private readonly scanGateway: SecurityScanGateway,
  ) {}

  @Get('findings')
  getFindings(): SecurityFinding[] {
    return this.securityService.getFindings();
  }

  @Get('evidence')
  getEvidence(): SecurityEvidence[] {
    return this.securityService.getEvidence();
  }

  @Get('sboms')
  getSboms(): Sbom[] {
    return this.securityService.getSboms();
  }

  @Get('oscal-profiles')
  getOscalProfiles(): OscalProfile[] {
    return this.securityService.getOscalProfiles();
  }

  @Get('oscal-updates')
  getOscalUpdates(): OscalUpdateStatus {
    return this.securityService.getOscalUpdateStatus();
  }

  @Get('sca-items')
  getScaItems(): ScaItem[] {
    return this.securityService.getScaItems();
  }

  @Get('realtime-checks')
  getRealtimeChecks(): RealtimeCheck[] {
    return this.securityService.getRealtimeChecks();
  }

  /**
   * Get all security controls from the database
   */
  @Get('controls')
  getSecurityControls() {
    return this.securityService.getControlsDatabase();
  }

  /**
   * Get a specific security control by ID
   */
  @Get('controls/:id')
  getSecurityControl(@Param('id') controlId: string) {
    return this.securityService.getControl(controlId);
  }

  /**
   * Start an OSCAL scan
   */
  @Post('oscal-profiles/:id/scan')
  startOscalScan(@Param('id') profileId: string): { scanId: string } {
    const scanId = uuidv4();
    
    // Create scan tracker
    this.scanGateway.createScan(scanId, 'oscal');
    
    // Execute scan asynchronously
    this.executeOscalScanWithProgress(scanId, profileId);
    
    return { scanId };
  }

  @Post('oscal-updates/refresh')
  refreshOscalUpdates(): Observable<OscalUpdateStatus> {
    return this.securityService.refreshOscalUpdates();
  }

  /**
   * Execute real-time check
   */
  @Post('realtime-checks/:id/run')
  runRealtimeCheck(@Param('id') checkId: string): { scanId: string } {
    const scanId = uuidv4();
    
    // Create scan tracker
    this.scanGateway.createScan(scanId, 'realtime');
    
    // Execute check asynchronously
    this.executeRealtimeCheckWithProgress(scanId, checkId);
    
    return { scanId };
  }

  /**
   * Download OSCAL report
   */
  @Get('oscal-profiles/:id/report')
  downloadOscalReport(
    @Param('id') profileId: string,
    @Query('format') format: 'pdf' | 'json' | 'xml',
    @Res() res: Response,
  ): void {
    const data = this.securityService.getOscalReport(profileId);
    
    if (format === 'pdf') {
       this.pdfService.generateSecurityReport({
        title: `OSCAL Compliance Report - ${data.name}`,
        reportType: 'oscal',
        data,
        classification: 'UNCLASSIFIED',
      }).subscribe({
        next: (pdfBuffer) => {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="oscal-${profileId}-${Date.now()}.pdf"`);
          res.send(pdfBuffer);
        },
        error: (err) => {
          res.status(500).send({ error: 'PDF Generation failed', details: err.message });
        }
      });
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="oscal-${profileId}-${Date.now()}.json"`);
      res.json(data);
    } else if (format === 'xml') {
      const xml = this.convertToXml('oscal-profile', data);
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="oscal-${profileId}-${Date.now()}.xml"`);
      res.send(xml);
    }
  }

  /**
   * Download SBOM report
   */
  @Get('sboms/:id/report')
  downloadSbomReport(
    @Param('id') sbomId: string,
    @Query('format') format: 'pdf' | 'json' | 'xml',
    @Res() res: Response,
  ): void {
    const data = this.securityService.getSbomReport(sbomId);
    
    if (format === 'pdf') {
       this.pdfService.generateSecurityReport({
        title: `Software Bill of Materials - ${data.name}`,
        reportType: 'sbom',
        data,
      }).subscribe({
        next: (pdfBuffer) => {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="sbom-${sbomId}-${Date.now()}.pdf"`);
          res.send(pdfBuffer);
        },
        error: (err) => {
          res.status(500).send({ error: 'PDF Generation failed', details: err.message });
        }
      });
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="sbom-${sbomId}-${Date.now()}.json"`);
      res.json(data);
    } else if (format === 'xml') {
      const xml = this.convertToXml('sbom', data);
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="sbom-${sbomId}-${Date.now()}.xml"`);
      res.send(xml);
    }
  }

  /**
   * Download real-time check report
   */
  @Get('realtime-checks/:id/report')
  downloadRealtimeReport(
    @Param('id') checkId: string,
    @Query('format') format: 'pdf' | 'json' | 'xml',
    @Res() res: Response,
  ): void {
    const data = this.securityService.getRealtimeReport(checkId);
    
    if (format === 'pdf') {
       this.pdfService.generateSecurityReport({
        title: `Real-Time Security Check - ${data.name}`,
        reportType: 'realtime',
        data,
      }).subscribe({
        next: (pdfBuffer) => {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="realtime-${checkId}-${Date.now()}.pdf"`);
          res.send(pdfBuffer);
        },
        error: (err) => {
          res.status(500).send({ error: 'PDF Generation failed', details: err.message });
        }
      });
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="realtime-${checkId}-${Date.now()}.json"`);
      res.json(data);
    } else if (format === 'xml') {
      const xml = this.convertToXml('realtime-check', data);
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="realtime-${checkId}-${Date.now()}.xml"`);
      res.send(xml);
    }
  }

  /**
   * Export all findings
   */
  @Get('findings/export')
  exportFindings(
    @Query('format') format: 'pdf' | 'json' | 'xml',
    @Res() res: Response,
  ): void {
    const data = this.securityService.getFindingsReport();
    
    if (format === 'pdf') {
      this.pdfService.generateSecurityReport({
        title: 'Security Findings Report',
        reportType: 'findings',
        data,
        classification: 'UNCLASSIFIED',
      }).subscribe({
        next: (pdfBuffer) => {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="findings-${Date.now()}.pdf"`);
          res.send(pdfBuffer);
        },
        error: (err) => {
          res.status(500).send({ error: 'PDF Generation failed', details: err.message });
        }
      });
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="findings-${Date.now()}.json"`);
      res.json(data);
    } else if (format === 'xml') {
      const xml = this.convertToXml('findings', data);
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="findings-${Date.now()}.xml"`);
      res.send(xml);
    }
  }

  /**
   * Download evidence bundle (ZIP)
   */
  @Get('evidence/bundle')
  downloadEvidenceBundle(@Res() res: Response): void {
    // For now, return JSON of all evidence
    // TODO: Create actual ZIP bundle with files
    const data = this.securityService.getEvidenceBundle();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="evidence-bundle-${Date.now()}.json"`);
    res.json(data);
  }

  /**
   * Export SCA report
   */
  @Get('sca-items/export')
  exportScaReport(
    @Query('format') format: 'pdf' | 'json' | 'xml',
    @Res() res: Response,
  ): void {
    const data = this.securityService.getScaReport();
    
    if (format === 'pdf') {
       this.pdfService.generateSecurityReport({
        title: 'Security Checklist Assessment',
        reportType: 'sca',
        data,
      }).subscribe({
        next: (pdfBuffer) => {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="sca-${Date.now()}.pdf"`);
          res.send(pdfBuffer);
        },
        error: (err) => {
          res.status(500).send({ error: 'PDF Generation failed', details: err.message });
        }
      });
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="sca-${Date.now()}.json"`);
      res.json(data);
    } else if (format === 'xml') {
      const xml = this.convertToXml('sca-report', data);
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="sca-${Date.now()}.xml"`);
      res.send(xml);
    }
  }

  private executeOscalScanWithProgress(scanId: string, profileId: string): void {
    this.securityService.executeOscalScan(profileId).subscribe({
      next: (progress) => {
        if (progress.result) {
          this.scanGateway.completeScan(scanId, progress.result);
        } else {
          const progressPayload: ScanProgress = {
            scanId,
            type: 'oscal',
            status: 'in-progress',
            progress: progress.progress,
            message: progress.message,
          };
          if (progress.eta !== undefined) {
            progressPayload.eta = progress.eta;
          }
          this.scanGateway.emitProgress(progressPayload);
        }
      },
      error: (error) => {
        this.scanGateway.failScan(scanId, error.message);
      }
    });
  }

  private executeRealtimeCheckWithProgress(scanId: string, checkId: string): void {
    this.securityService.executeRealtimeCheck(checkId).subscribe({
      next: (progress) => {
        if (progress.result) {
          this.scanGateway.completeScan(scanId, progress.result);
        } else {
          this.scanGateway.emitProgress({
            scanId,
            type: 'realtime',
            status: 'in-progress',
            progress: progress.progress,
            message: progress.message,
          });
        }
      },
      error: (error) => {
        this.scanGateway.failScan(scanId, error.message);
      }
    });
  }

  private convertToXml(rootElement: string, data: unknown): string {
    // Simple XML conversion
    const xmlParts = [`<?xml version="1.0" encoding="UTF-8"?>`, `<${rootElement}>`];
    
    const convertObject = (obj: Record<string, unknown> | unknown[], indent = 1): void => {
      const spaces = '  '.repeat(indent);
      
      if (Array.isArray(obj)) {
        obj.forEach((item) => {
          if (typeof item === 'object' && item !== null) {
            convertObject(item as Record<string, unknown>, indent);
          }
        });
        return;
      }

      for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) continue;
        
        if (Array.isArray(value)) {
          xmlParts.push(`${spaces}<${key}s>`);
          value.forEach((item: unknown) => {
            xmlParts.push(`${spaces}  <${key}>`);
            if (typeof item === 'object' && item !== null) {
              convertObject(item as Record<string, unknown>, indent + 2);
            } else {
              xmlParts.push(`${spaces}    ${this.escapeXml(String(item))}`);
            }
            xmlParts.push(`${spaces}  </${key}>`);
          });
          xmlParts.push(`${spaces}</${key}s>`);
        } else if (typeof value === 'object') {
          xmlParts.push(`${spaces}<${key}>`);
          convertObject(value as Record<string, unknown>, indent + 1);
          xmlParts.push(`${spaces}</${key}>`);
        } else {
          xmlParts.push(`${spaces}<${key}>${this.escapeXml(String(value))}</${key}>`);
        }
      }
    };
    
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        data.forEach(item => {
           convertObject(item as Record<string, unknown>);
        });
      } else {
        convertObject(data as Record<string, unknown>);
      }
    }
    
    xmlParts.push(`</${rootElement}>`);
    
    return xmlParts.join('\n');
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
