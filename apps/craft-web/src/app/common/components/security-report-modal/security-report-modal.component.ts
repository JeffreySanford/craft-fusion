import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';

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
    FormsModule
  ],
  templateUrl: './security-report-modal.component.html',
  styleUrls: ['./security-report-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SecurityReportModalComponent {
  selectedFormat: 'pdf' | 'json' | 'xml' = 'pdf';
  showRawJson = false;

  constructor(
    public dialogRef: MatDialogRef<SecurityReportModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SecurityReportData
  ) {}

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
    return `OSCAL Compliance Scan Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Profile: ${d.name || 'Unknown'}
Status: ${d.status || 'Unknown'}
Last Run: ${d.lastRun || 'Not run'}

Results:
  ✓ Pass: ${d.pass || 0}
  ✗ Fail: ${d.fail || 0}
  Duration: ${d.duration || 'N/A'}

Control Families Assessed: ${d.controlFamilies || 'N/A'}
Compliance Level: ${d.complianceLevel || 'N/A'}
`;
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
    return `Real-Time Security Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test: ${d.name || 'Unknown'}
Status: ${d.status || 'Unknown'}
Duration: ${d.duration || 'N/A'}

Endpoint: ${d.endpoint || 'N/A'}
Response Code: ${d.responseCode || 'N/A'}
Timestamp: ${d.timestamp || new Date().toISOString()}
`;
  }

  private formatScaPreview(): string {
    const items = Array.isArray(this.data.data) ? this.data.data : [this.data.data];
    let preview = `Security Checklist Assessment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Items: ${items.length}

`;
    items.forEach((item, i) => {
      preview += `${i + 1}. ${item.label || 'Unknown'}
   Status: ${item.status || 'Unknown'}

`;
    });
    return preview;
  }

  toggleRawJson(): void {
    this.showRawJson = !this.showRawJson;
  }

  download(): void {
    this.dialogRef.close({ action: 'download', format: this.selectedFormat });
  }

  close(): void {
    this.dialogRef.close();
  }
}
