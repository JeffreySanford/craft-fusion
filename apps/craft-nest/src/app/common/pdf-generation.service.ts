import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

export interface PdfReportOptions {
  title: string;
  reportType: 'oscal' | 'sbom' | 'findings' | 'evidence' | 'realtime' | 'sca';
  data: any;
  generatedBy?: string;
  classification?: string;
}

@Injectable()
export class PdfGenerationService {
  /**
   * Generate a FedRAMP/NIST-compliant security report PDF
   */
  async generateSecurityReport(options: PdfReportOptions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: options.title,
          Author: options.generatedBy || 'Security Dashboard',
          Subject: `${options.reportType.toUpperCase()} Security Report`,
          Keywords: 'security, fedramp, nist, compliance'
        }
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      this.addHeader(doc, options);

      // Classification banner
      if (options.classification) {
        this.addClassificationBanner(doc, options.classification);
      }

      // Report content based on type
      switch (options.reportType) {
        case 'oscal':
          this.addOscalContent(doc, options.data);
          break;
        case 'sbom':
          this.addSbomContent(doc, options.data);
          break;
        case 'findings':
          this.addFindingsContent(doc, options.data);
          break;
        case 'evidence':
          this.addEvidenceContent(doc, options.data);
          break;
        case 'realtime':
          this.addRealtimeContent(doc, options.data);
          break;
        case 'sca':
          this.addScaContent(doc, options.data);
          break;
      }

      // Footer
      this.addFooter(doc);

      doc.end();
    });
  }

  private addHeader(doc: PDFKit.PDFDocument, options: PdfReportOptions): void {
    const pageWidth = doc.page.width;
    const margin = 50;

    // Title
    doc
      .fontSize(24)
      .fillColor('#1a237e')
      .text(options.title, margin, 50, {
        width: pageWidth - 2 * margin,
        align: 'center'
      });

    // Subtitle
    doc
      .fontSize(12)
      .fillColor('#666')
      .text(`${options.reportType.toUpperCase()} Security Assessment Report`, {
        width: pageWidth - 2 * margin,
        align: 'center'
      });

    // Date
    doc
      .fontSize(10)
      .fillColor('#999')
      .text(`Generated: ${new Date().toLocaleString()}`, {
        width: pageWidth - 2 * margin,
        align: 'center'
      });

    // Line separator
    doc
      .moveTo(margin, doc.y + 20)
      .lineTo(pageWidth - margin, doc.y + 20)
      .stroke('#1a237e');

    doc.moveDown(2);
  }

  private addClassificationBanner(doc: PDFKit.PDFDocument, classification: string): void {
    const pageWidth = doc.page.width;
    
    doc
      .fillColor('#ff0000')
      .fontSize(10)
      .text(`CLASSIFICATION: ${classification.toUpperCase()}`, 50, doc.y, {
        width: pageWidth - 100,
        align: 'center'
      })
      .moveDown();
  }

  private addOscalContent(doc: PDFKit.PDFDocument, data: any): void {
    doc.fontSize(16).fillColor('#000').text('OSCAL Compliance Assessment', { underline: true }).moveDown();

    doc.fontSize(12).fillColor('#333');
    doc.text(`Profile Name: ${data.name || 'N/A'}`);
    doc.text(`Status: ${data.status || 'N/A'}`);
    doc.text(`Last Run: ${data.lastRun || 'Not run'}`);
    doc.text(`Duration: ${data.duration || 'N/A'}`);
    doc.moveDown();

    doc.fontSize(14).fillColor('#1a237e').text('Assessment Results').moveDown(0.5);
    doc.fontSize(12).fillColor('#333');
    doc.text(`✓ Passed Controls: ${data.pass || 0}`);
    doc.text(`✗ Failed Controls: ${data.fail || 0}`);
    
    if (data.complianceLevel) {
      doc.text(`Compliance Level: ${data.complianceLevel}`);
    }
    if (data.controlFamilies) {
      doc.text(`Control Families Assessed: ${data.controlFamilies}`);
    }
    
    doc.moveDown();
    doc.fontSize(10).fillColor('#666');
    doc.text('This report follows NIST RMF Version 2.0 and FedRAMP requirements for continuous monitoring and security assessment.');
  }

  private addSbomContent(doc: PDFKit.PDFDocument, data: any): void {
    doc.fontSize(16).fillColor('#000').text('Software Bill of Materials', { underline: true }).moveDown();

    doc.fontSize(12).fillColor('#333');
    doc.text(`SBOM Name: ${data.name || 'N/A'}`);
    doc.text(`Format: ${data.format || 'N/A'}`);
    doc.text(`Created: ${data.created || 'N/A'}`);
    doc.text(`Total Components: ${data.components || 0}`);
    doc.text(`Identified Vulnerabilities: ${data.vulnerabilities || 0}`);
    doc.moveDown();

    if (data.delta) {
      doc.text(`Change Delta: ${data.delta}`);
      doc.moveDown();
    }

    doc.fontSize(10).fillColor('#666');
    doc.text('This SBOM follows CycloneDX and SPDX standards for software supply chain transparency and vulnerability tracking.');
  }

  private addFindingsContent(doc: PDFKit.PDFDocument, data: any): void {
    const findings = Array.isArray(data) ? data : [data];
    
    doc.fontSize(16).fillColor('#000').text('Security Findings Report', { underline: true }).moveDown();
    doc.fontSize(12).fillColor('#333').text(`Total Findings: ${findings.length}`).moveDown();

    findings.forEach((finding, index) => {
      doc.fontSize(14).fillColor('#1a237e').text(`Finding ${index + 1}: ${finding.title || 'Untitled'}`).moveDown(0.5);
      doc.fontSize(11).fillColor('#333');
      doc.text(`Severity: ${finding.severity || 'Unknown'}`);
      doc.text(`Status: ${finding.status || 'Open'}`);
      doc.text(`Component: ${finding.component || 'Unknown'}`);
      doc.text(`Source: ${finding.source || 'Unknown'}`);
      
      if (finding.createdAt) {
        doc.text(`Observed: ${new Date(finding.createdAt).toLocaleDateString()}`);
      }
      
      doc.moveDown();
    });

    doc.fontSize(10).fillColor('#666');
    doc.text('Findings are categorized according to NIST SP 800-53 controls and FedRAMP security baselines.');
  }

  private addEvidenceContent(doc: PDFKit.PDFDocument, data: any): void {
    const evidence = Array.isArray(data) ? data : [data];
    
    doc.fontSize(16).fillColor('#000').text('Evidence Artifacts Report', { underline: true }).moveDown();
    doc.fontSize(12).fillColor('#333').text(`Total Artifacts: ${evidence.length}`).moveDown();

    evidence.forEach((artifact, index) => {
      doc.fontSize(14).fillColor('#1a237e').text(`Artifact ${index + 1}: ${artifact.name || 'Unnamed'}`).moveDown(0.5);
      doc.fontSize(11).fillColor('#333');
      doc.text(`Type: ${artifact.type || 'Unknown'}`);
      doc.text(`Status: ${artifact.status || 'Pending'}`);
      
      if (artifact.hash) {
        doc.text(`Hash (SHA-256): ${artifact.hash}`);
      }
      if (artifact.createdBy) {
        doc.text(`Created By: ${artifact.createdBy}`);
      }
      if (artifact.createdAt) {
        doc.text(`Created: ${new Date(artifact.createdAt).toLocaleDateString()}`);
      }
      
      doc.moveDown();
    });

    doc.fontSize(10).fillColor('#666');
    doc.text('Evidence collection follows NIST SP 800-171 requirements for assessment object documentation.');
  }

  private addRealtimeContent(doc: PDFKit.PDFDocument, data: any): void {
    doc.fontSize(16).fillColor('#000').text('Real-Time Security Check Report', { underline: true }).moveDown();

    doc.fontSize(12).fillColor('#333');
    doc.text(`Test Name: ${data.name || 'N/A'}`);
    doc.text(`Status: ${data.status || 'Unknown'}`);
    doc.text(`Duration: ${data.duration || 'N/A'}`);
    
    if (data.endpoint) {
      doc.text(`Endpoint: ${data.endpoint}`);
    }
    if (data.responseCode) {
      doc.text(`Response Code: ${data.responseCode}`);
    }
    if (data.timestamp) {
      doc.text(`Timestamp: ${data.timestamp}`);
    }
    
    doc.moveDown();
    doc.fontSize(10).fillColor('#666');
    doc.text('Real-time security checks validate continuous system security posture per FedRAMP continuous monitoring requirements.');
  }

  private addScaContent(doc: PDFKit.PDFDocument, data: any): void {
    const items = Array.isArray(data) ? data : [data];
    
    doc.fontSize(16).fillColor('#000').text('Security Checklist Assessment', { underline: true }).moveDown();
    doc.fontSize(12).fillColor('#333').text(`Total Items: ${items.length}`).moveDown();

    items.forEach((item: any) => {
      const statusIcon = item.status === 'pass' ? '✓' : item.status === 'warn' ? '⚠' : '○';
      doc.fontSize(11).fillColor('#333').text(`${statusIcon} ${item.label || 'Unknown'} - ${item.status || 'Unknown'}`);
    });

    doc.moveDown();
    doc.fontSize(10).fillColor('#666');
    doc.text('Security Checklist Assessment follows OWASP Top 10 and CIS Benchmarks for comprehensive security validation.');
  }

  private addFooter(doc: PDFKit.PDFDocument): void {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 50;
      
      // Footer line
      doc
        .moveTo(margin, pageHeight - 40)
        .lineTo(pageWidth - margin, pageHeight - 40)
        .stroke('#ccc');
      
      // Footer text
      doc
        .fontSize(8)
        .fillColor('#999')
        .text(
          `Page ${i + 1} of ${pageCount} • Generated by Security Dashboard • FedRAMP/NIST Compliant`,
          margin,
          pageHeight - 30,
          {
            width: pageWidth - 2 * margin,
            align: 'center'
          }
        );
    }
  }
}
