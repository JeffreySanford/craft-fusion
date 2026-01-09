import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { OscalReportViewComponent } from './oscal-report-view.component';
import { RealtimeReportViewComponent } from './realtime-report-view.component';
import { ScaReportViewComponent } from './sca-report-view.component';

export interface SecurityReportData {
  title: string;
  reportType: 'oscal' | 'sbom' | 'findings' | 'evidence' | 'realtime' | 'sca';
  data: any;
  reportId?: string;
  showProgress?: boolean;
  progress?: number;
  eta?: string;
}

@Component({
  selector: 'app-security-report-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatProgressBarModule,
    FormsModule,
    OscalReportViewComponent,
    RealtimeReportViewComponent,
    ScaReportViewComponent
  ],
  templateUrl: './security-report-modal.component.html',
  styleUrls: ['./security-report-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SecurityReportModalComponent {
  selectedFormat: 'pdf' | 'json' | 'xml' = 'pdf';
  showRawJson = false;
  viewMode: 'summary' | 'detailed' = 'summary';
  expandedControls = new Set<string>();

  constructor(
    public dialogRef: MatDialogRef<SecurityReportModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SecurityReportData
  ) {}

  get hasDetailedData(): boolean {
    const d = this.data?.data;
    return !!(d?.controlResults || d?.checkResults || d?.testResults);
  }

  get formattedPreview(): string {
    if (!this.data?.data) return 'No data available';

    switch (this.data.reportType) {
      case 'oscal':
        return this.formatOscalPreview();
      case 'sbom':
        return this.formatSbomPreview();
      case 'findings':
        return this.formatFindingsPreview();
      case 'evidence':
        return this.formatEvidencePreview();
      case 'realtime':
        return this.formatRealtimePreview();
      case 'sca':
        return this.formatScaPreview();
      default:
        return JSON.stringify(this.data.data, null, 2);
    }
  }

  get rawJson(): string {
    return JSON.stringify(this.data.data, null, 2);
  }

  private formatOscalPreview(): string {
    const d = this.data.data;
    let preview = `OSCAL Compliance Scan Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Profile: ${d.name || 'Unknown'}
Description: ${d.description || 'N/A'}
Status: ${d.status || 'Unknown'}
Last Run: ${d.lastRun || 'Not run'}

Results Summary:
`;

    if (d.total !== undefined) {
      preview += `  Total Controls: ${d.total}\n`;
    }
    preview += `  ✓ Pass: ${d.pass || 0}\n`;
    preview += `  ✗ Fail: ${d.fail || 0}\n`;
    if (d.notapplicable !== undefined && d.notapplicable > 0) {
      preview += `  ⊘ Not Applicable: ${d.notapplicable}\n`;
    }
    preview += `  Duration: ${d.duration || 'N/A'}\n`;

    // Show failed controls if available
    if (d.controlResults && Array.isArray(d.controlResults)) {
      const failedControls = d.controlResults.filter((c: any) => c.status === 'fail');
      
      if (failedControls.length > 0) {
        preview += `
═══════════════════════════
📋 Failed Controls (${failedControls.length}):
═══════════════════════════

`;
        
        const displayCount = this.viewMode === 'detailed' ? failedControls.length : Math.min(10, failedControls.length);
        
        failedControls.slice(0, displayCount).forEach((control: any, index: number) => {
          preview += `${index + 1}. Control ${control.id || 'UNKNOWN'}\n`;
          preview += `   ┌─────────────────────────────────────────\n`;
          preview += `   │ ID:        ${control.id || 'N/A'}\n`;
          preview += `   │ Title:     ${control.title || 'N/A'}\n`;
          
          if (control.severity) {
            const severityBadge = control.severity.toUpperCase();
            preview += `   │ Severity:  ${severityBadge}\n`;
          }
          
          if (control.category) {
            preview += `   │ Category:  ${control.category}\n`;
          }
          
          if (control.description) {
            const desc = this.viewMode === 'detailed' 
              ? control.description
              : (control.description.length > 100 ? control.description.substring(0, 97) + '...' : control.description);
            preview += `   │ Issue:     ${desc}\n`;
          }
          
          if (control.recommendation) {
            const rec = this.viewMode === 'detailed'
              ? control.recommendation
              : (control.recommendation.length > 100 ? control.recommendation.substring(0, 97) + '...' : control.recommendation);
            preview += `   │ Fix:       ${rec}\n`;
          }
          
          if (control.evidence) {
            const ev = this.viewMode === 'detailed'
              ? control.evidence
              : (control.evidence.length > 100 ? control.evidence.substring(0, 97) + '...' : control.evidence);
            preview += `   │ Evidence:  ${ev}\n`;
          }
          
          if (control.reference && this.viewMode === 'detailed') {
            preview += `   │ Reference: ${control.reference}\n`;
          }
          
          preview += `   └─────────────────────────────────────────\n\n`;
        });
        
        if (this.viewMode === 'summary' && failedControls.length > 10) {
          preview += `⚠ ... and ${failedControls.length - 10} more failed controls\nSwitch to Detailed View to see all failures\n\n`;
        }
      }
      
      // Show passed controls summary
      const passedControls = d.controlResults.filter((c: any) => c.status === 'pass');
      if (passedControls.length > 0) {
        preview += `\nPassed Controls (${passedControls.length}):\n`;
        
        const passDisplayCount = this.viewMode === 'detailed' ? Math.min(20, passedControls.length) : Math.min(5, passedControls.length);
        
        passedControls.slice(0, passDisplayCount).forEach((control: any) => {
          let line = `  ✓ ${control.title || control.id || 'Unknown'}`;
          if (this.viewMode === 'detailed' && control.category) {
            line += ` (${control.category})`;
          }
          preview += line + '\n';
        });
        
        if (passedControls.length > passDisplayCount) {
          preview += `  ... and ${passedControls.length - passDisplayCount} more\n`;
        }
      }
      
      // Show not applicable controls in detailed view
      if (this.viewMode === 'detailed') {
        const naControls = d.controlResults.filter((c: any) => c.status === 'notapplicable');
        if (naControls.length > 0) {
          preview += `\nNot Applicable Controls (${naControls.length}):\n`;
          naControls.slice(0, 10).forEach((control: any) => {
            preview += `  ⊘ ${control.title || control.id || 'Unknown'}\n`;
          });
          if (naControls.length > 10) {
            preview += `  ... and ${naControls.length - 10} more\n`;
          }
        }
      }
    } else if (d.fail && d.fail > 0) {
      preview += `\n⚠ Run a new scan to see detailed failure information\n`;
    }

    return preview;
  }

  private formatSbomPreview(): string {
    const d = this.data.data;
    return `Software Bill of Materials
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: ${d.name || 'Unknown'}
Format: ${d.format || 'Unknown'}
Created: ${d.created || 'Unknown'}

Components: ${d.components || 0}
Vulnerabilities: ${d.vulnerabilities || 0}

Delta since last scan: ${d.delta || 'N/A'}
`;
  }

  private formatFindingsPreview(): string {
    const findings = Array.isArray(this.data.data) ? this.data.data : [this.data.data];
    let preview = `Security Findings Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Findings: ${findings.length}

`;
    findings.slice(0, 5).forEach((f, i) => {
      preview += `${i + 1}. ${f.title || 'Untitled'}
   Severity: ${f.severity || 'Unknown'}
   Status: ${f.status || 'Open'}
   Component: ${f.component || 'Unknown'}

`;
    });
    if (findings.length > 5) {
      preview += `... and ${findings.length - 5} more findings\n`;
    }
    return preview;
  }

  private formatEvidencePreview(): string {
    const evidence = Array.isArray(this.data.data) ? this.data.data : [this.data.data];
    let preview = `Evidence Bundle Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Artifacts: ${evidence.length}

`;
    evidence.slice(0, 5).forEach((e, i) => {
      preview += `${i + 1}. ${e.name || 'Unnamed artifact'}
   Type: ${e.type || 'Unknown'}
   Status: ${e.status || 'Pending'}
   Hash: ${e.hash ? e.hash.substring(0, 16) + '...' : 'N/A'}

`;
    });
    if (evidence.length > 5) {
      preview += `... and ${evidence.length - 5} more artifacts\n`;
    }
    return preview;
  }

  private formatRealtimePreview(): string {
    const d = this.data.data;
    
    if (this.viewMode === 'detailed' && d?.testResults) {
      let preview = `Real-Time Security Check - Detailed Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test: ${d.name || 'Unknown'}
Endpoint: ${d.endpoint || 'N/A'}
Status: ${d.status || 'Unknown'}
Duration: ${d.duration || 'N/A'}

Results Summary:
`;

      if (d.total !== undefined) {
        preview += `  Total Tests: ${d.total}\n`;
      }
      if (d.pass !== undefined) {
        preview += `  ✓ Pass: ${d.pass}\n`;
      }
      if (d.fail !== undefined) {
        preview += `  ✗ Fail: ${d.fail}\n`;
      }
      if (d.warning !== undefined) {
        preview += `  ⚠ Warning: ${d.warning}\n`;
      }

      const failedTests = d.testResults.filter((t: any) => t.status === 'fail');
      
      if (failedTests.length > 0) {
        preview += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nFailed Tests (${failedTests.length}):\n\n`;
        
        failedTests.forEach((test: any, index: number) => {
          preview += `${index + 1}. ${test.testName || test.id || 'Unknown'}\n`;
          preview += `   ┌─────────────────────────────────────────\n`;
          
          if (test.severity) {
            preview += `   │ Severity:  ${test.severity.toUpperCase()}\n`;
          }
          if (test.statusCode) {
            preview += `   │ Status:    ${test.statusCode}\n`;
          }
          if (test.responseTime !== undefined) {
            preview += `   │ Response:  ${test.responseTime}ms\n`;
          }
          if (test.message) {
            preview += `   │ Message:   ${test.message}\n`;
          }
          if (test.recommendation) {
            preview += `   │ Fix:       ${test.recommendation}\n`;
          }
          if (test.details) {
            preview += `   │ Details:   ${test.details}\n`;
          }
          
          preview += `   └─────────────────────────────────────────\n\n`;
        });
      }

      const passedTests = d.testResults.filter((t: any) => t.status === 'pass');
      if (passedTests.length > 0) {
        preview += `\nPassed Tests (${passedTests.length}):\n`;
        passedTests.slice(0, 5).forEach((test: any) => {
          preview += `  ✓ ${test.testName || test.id || 'Unknown'} (${test.responseTime || 0}ms)\n`;
        });
        if (passedTests.length > 5) {
          preview += `  ... and ${passedTests.length - 5} more\n`;
        }
      }

      return preview;
    }
    
    // Summary view
    return `Real-Time Security Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test: ${d.name || 'Unknown'}
Status: ${d.status || 'Unknown'}
Duration: ${d.duration || 'N/A'}

Endpoint: ${d.endpoint || 'N/A'}
Last Run: ${d.lastRun || new Date().toISOString()}
${d.total !== undefined ? `\nTests: ${d.pass || 0}/${d.total} passed` : ''}
`;
  }

  private formatScaPreview(): string {
    const d = this.data.data;
    
    if (this.viewMode === 'detailed' && d?.checkResults) {
      let preview = `Security Checklist Assessment - Detailed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Item: ${d.label || 'Unknown'}
Status: ${d.status || 'Unknown'}

Check Results Summary:
`;

      if (d.total !== undefined) {
        preview += `  Total Checks: ${d.total}\n`;
      }
      if (d.pass !== undefined) {
        preview += `  ✓ Pass: ${d.pass}\n`;
      }
      if (d.fail !== undefined) {
        preview += `  ✗ Fail: ${d.fail}\n`;
      }
      if (d.warning !== undefined) {
        preview += `  ⚠ Warning: ${d.warning}\n`;
      }

      const failedChecks = d.checkResults.filter((c: any) => c.status === 'fail');
      
      if (failedChecks.length > 0) {
        preview += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nFailed Checks (${failedChecks.length}):\n\n`;
        
        failedChecks.forEach((check: any, index: number) => {
          preview += `${index + 1}. ${check.title || check.id || 'Unknown'}\n`;
          preview += `   ┌─────────────────────────────────────────\n`;
          
          if (check.severity) {
            preview += `   │ Severity:  ${check.severity.toUpperCase()}\n`;
          }
          if (check.description) {
            preview += `   │ Issue:     ${check.description}\n`;
          }
          if (check.recommendation) {
            preview += `   │ Fix:       ${check.recommendation}\n`;
          }
          if (check.evidence) {
            preview += `   │ Evidence:  ${check.evidence}\n`;
          }
          if (check.reference) {
            preview += `   │ Reference: ${check.reference}\n`;
          }
          
          preview += `   └─────────────────────────────────────────\n\n`;
        });
      }

      const passedChecks = d.checkResults.filter((c: any) => c.status === 'pass');
      if (passedChecks.length > 0) {
        preview += `\nPassed Checks (${passedChecks.length}):\n`;
        passedChecks.slice(0, 10).forEach((check: any) => {
          preview += `  ✓ ${check.title || check.id || 'Unknown'}\n`;
        });
        if (passedChecks.length > 10) {
          preview += `  ... and ${passedChecks.length - 10} more\n`;
        }
      }

      return preview;
    }
    
    // Summary view
    const items = Array.isArray(this.data.data) ? this.data.data : [this.data.data];
    let preview = `Security Checklist Assessment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Items: ${items.length}

`;
    items.forEach((item, i) => {
      preview += `${i + 1}. ${item.label || 'Unknown'}
   Status: ${item.status || 'Unknown'}
`;
      if (item.description) {
        preview += `   ${item.description}\n`;
      }
      preview += `\n`;
    });
    return preview;
  }

  toggleRawJson(): void {
    this.showRawJson = !this.showRawJson;
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'summary' ? 'detailed' : 'summary';
  }

  download(): void {
    this.dialogRef.close({ action: 'download', format: this.selectedFormat });
  }

  close(): void {
    this.dialogRef.close();
  }

  toggleControlExpanded(controlId: string): void {
    if (this.expandedControls.has(controlId)) {
      this.expandedControls.delete(controlId);
    } else {
      this.expandedControls.add(controlId);
    }
  }

  isControlExpanded(controlId: string): boolean {
    return this.expandedControls.has(controlId);
  }
}
