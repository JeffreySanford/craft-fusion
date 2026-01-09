import { Controller, Get, Post, Param, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { SecurityService, SecurityEvidence, SecurityFinding, Sbom, OscalProfile, ScaItem, RealtimeCheck } from './security.service';
import { PdfGenerationService } from '../common/pdf-generation.service';
import { SecurityScanGateway } from '../security-scan/security-scan.gateway';
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

  @Get('sca-items')
  getScaItems(): ScaItem[] {
    return this.securityService.getScaItems();
  }

  @Get('realtime-checks')
  getRealtimeChecks(): RealtimeCheck[] {
    return this.securityService.getRealtimeChecks();
  }

  /**
   * Start an OSCAL scan
   */
  @Post('oscal-profiles/:id/scan')
  async startOscalScan(@Param('id') profileId: string): Promise<{ scanId: string }> {
    const scanId = uuidv4();
    
    // Create scan tracker
    this.scanGateway.createScan(scanId, 'oscal');
    
    // Execute scan asynchronously
    this.executeOscalScanWithProgress(scanId, profileId).catch((error) => {
      this.scanGateway.failScan(scanId, error.message);
    });
    
    return { scanId };
  }

  /**
   * Execute real-time check
   */
  @Post('realtime-checks/:id/run')
  async runRealtimeCheck(@Param('id') checkId: string): Promise<{ scanId: string }> {
    const scanId = uuidv4();
    
    // Create scan tracker
    this.scanGateway.createScan(scanId, 'realtime');
    
    // Execute check asynchronously
    this.executeRealtimeCheckWithProgress(scanId, checkId).catch((error) => {
      this.scanGateway.failScan(scanId, error.message);
    });
    
    return { scanId };
  }

  /**
   * Download OSCAL report
   */
  @Get('oscal-profiles/:id/report')
  async downloadOscalReport(
    @Param('id') profileId: string,
    @Query('format') format: 'pdf' | 'json' | 'xml',
    @Res() res: Response,
  ): Promise<void> {
    const data = this.securityService.getOscalReport(profileId);
    
    if (format === 'pdf') {
      const pdfBuffer = await this.pdfService.generateSecurityReport({
        title: `OSCAL Compliance Report - ${data.name}`,
        reportType: 'oscal',
        data,
        classification: 'UNCLASSIFIED',
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="oscal-${profileId}-${Date.now()}.pdf"`);
      res.send(pdfBuffer);
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
  async downloadSbomReport(
    @Param('id') sbomId: string,
    @Query('format') format: 'pdf' | 'json' | 'xml',
    @Res() res: Response,
  ): Promise<void> {
    const data = this.securityService.getSbomReport(sbomId);
    
    if (format === 'pdf') {
      const pdfBuffer = await this.pdfService.generateSecurityReport({
        title: `Software Bill of Materials - ${data.name}`,
        reportType: 'sbom',
        data,
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="sbom-${sbomId}-${Date.now()}.pdf"`);
      res.send(pdfBuffer);
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
  async downloadRealtimeReport(
    @Param('id') checkId: string,
    @Query('format') format: 'pdf' | 'json' | 'xml',
    @Res() res: Response,
  ): Promise<void> {
    const data = this.securityService.getRealtimeReport(checkId);
    
    if (format === 'pdf') {
      const pdfBuffer = await this.pdfService.generateSecurityReport({
        title: `Real-Time Security Check - ${data.name}`,
        reportType: 'realtime',
        data,
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="realtime-${checkId}-${Date.now()}.pdf"`);
      res.send(pdfBuffer);
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
  async exportFindings(
    @Query('format') format: 'pdf' | 'json' | 'xml',
    @Res() res: Response,
  ): Promise<void> {
    const data = this.securityService.getFindingsReport();
    
    if (format === 'pdf') {
      const pdfBuffer = await this.pdfService.generateSecurityReport({
        title: 'Security Findings Report',
        reportType: 'findings',
        data,
        classification: 'UNCLASSIFIED',
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="findings-${Date.now()}.pdf"`);
      res.send(pdfBuffer);
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
  async downloadEvidenceBundle(@Res() res: Response): Promise<void> {
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
  async exportScaReport(
    @Query('format') format: 'pdf' | 'json' | 'xml',
    @Res() res: Response,
  ): Promise<void> {
    const data = this.securityService.getScaReport();
    
    if (format === 'pdf') {
      const pdfBuffer = await this.pdfService.generateSecurityReport({
        title: 'Security Checklist Assessment',
        reportType: 'sca',
        data,
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="sca-${Date.now()}.pdf"`);
      res.send(pdfBuffer);
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

  private async executeOscalScanWithProgress(scanId: string, profileId: string): Promise<void> {
    const result = await this.securityService.executeOscalScan(
      profileId,
      (progress, eta, message) => {
        this.scanGateway.emitProgress({
          scanId,
          type: 'oscal',
          status: 'in-progress',
          progress,
          eta,
          message,
        });
      }
    );
    
    this.scanGateway.completeScan(scanId, result);
  }

  private async executeRealtimeCheckWithProgress(scanId: string, checkId: string): Promise<void> {
    const result = await this.securityService.executeRealtimeCheck(
      checkId,
      (progress, message) => {
        this.scanGateway.emitProgress({
          scanId,
          type: 'realtime',
          status: 'in-progress',
          progress,
          message,
        });
      }
    );
    
    this.scanGateway.completeScan(scanId, result);
  }

  private convertToXml(rootElement: string, data: any): string {
    // Simple XML conversion
    const xmlParts = [`<?xml version="1.0" encoding="UTF-8"?>`, `<${rootElement}>`];
    
    const convertObject = (obj: any, indent = 1): void => {
      const spaces = '  '.repeat(indent);
      for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) continue;
        
        if (Array.isArray(value)) {
          xmlParts.push(`${spaces}<${key}s>`);
          value.forEach((item) => {
            xmlParts.push(`${spaces}  <${key}>`);
            if (typeof item === 'object') {
              convertObject(item, indent + 2);
            } else {
              xmlParts.push(`${spaces}    ${this.escapeXml(String(item))}`);
            }
            xmlParts.push(`${spaces}  </${key}>`);
          });
          xmlParts.push(`${spaces}</${key}s>`);
        } else if (typeof value === 'object') {
          xmlParts.push(`${spaces}<${key}>`);
          convertObject(value, indent + 1);
          xmlParts.push(`${spaces}</${key}>`);
        } else {
          xmlParts.push(`${spaces}<${key}>${this.escapeXml(String(value))}</${key}>`);
        }
      }
    };
    
    convertObject(data);
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
