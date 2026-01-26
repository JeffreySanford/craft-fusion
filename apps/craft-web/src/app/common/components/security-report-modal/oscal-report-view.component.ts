import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-oscal-report-view',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatExpansionModule
  ],
  template: `
    <div class="oscal-report">
      <div class="report-header">
        <h3>{{ reportData.name || 'OSCAL Compliance Scan' }}</h3>
        <p class="report-description">{{ reportData.description }}</p>
      </div>

      <div class="report-summary">
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-label">Status:</span>
            <span class="stat-value" [class]="'status-' + reportData.status">
              {{ reportData.status?.toUpperCase() }}
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Controls:</span>
            <span class="stat-value">{{ reportData.total || 0 }}</span>
          </div>
          <div class="stat-item pass">
            <span class="stat-label">Pass:</span>
            <span class="stat-value">{{ reportData.pass || 0 }}</span>
          </div>
          <div class="stat-item fail">
            <span class="stat-label">Fail:</span>
            <span class="stat-value">{{ reportData.fail || 0 }}</span>
          </div>
          <div class="stat-item" *ngIf="reportData.notapplicable">
            <span class="stat-label">N/A:</span>
            <span class="stat-value">{{ reportData.notapplicable }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Duration:</span>
            <span class="stat-value">{{ reportData.duration }}</span>
          </div>
        </div>
      </div>

      <div class="controls-section" *ngIf="reportData.controlResults">
        <!-- Failed Controls -->
        <div class="controls-group failed" *ngIf="failedControls.length > 0">
          <h4>
            <mat-icon class="group-icon fail">error</mat-icon>
            Failed Controls ({{ failedControls.length }})
          </h4>
          
          <mat-accordion class="controls-accordion">
            <mat-expansion-panel 
              *ngFor="let control of displayedFailedControls; let i = index"
              class="control-panel fail">
              
              <mat-expansion-panel-header>
                <mat-panel-title class="control-title">
                  <span class="control-number">{{ i + 1 }}.</span>
                  <span class="control-id">{{ control.id }}</span>
                  <span class="control-name">{{ control.title }}</span>
                  <span class="severity-badge" [class]="'severity-' + control.severity">
                    {{ control.severity?.toUpperCase() || 'MEDIUM' }}
                  </span>
                </mat-panel-title>
              </mat-expansion-panel-header>

              <div class="control-details">
                <div class="detail-section" *ngIf="control.category">
                  <div class="detail-header">
                    <mat-icon class="detail-icon">category</mat-icon>
                    <strong>Category:</strong>
                  </div>
                  <p class="detail-content">{{ control.category }}</p>
                </div>

                <div class="detail-section" *ngIf="control.description">
                  <div class="detail-header">
                    <mat-icon class="detail-icon">description</mat-icon>
                    <strong>Issue Description:</strong>
                  </div>
                  <p class="detail-content">{{ control.description }}</p>
                </div>

                <div class="detail-section recommendation" *ngIf="control.recommendation">
                  <div class="detail-header">
                    <mat-icon class="detail-icon">build</mat-icon>
                    <strong>Remediation Steps:</strong>
                  </div>
                  <p class="detail-content">{{ control.recommendation }}</p>
                </div>

                <div class="detail-section evidence" *ngIf="control.evidence">
                  <div class="detail-header">
                    <mat-icon class="detail-icon">fact_check</mat-icon>
                    <strong>Evidence:</strong>
                  </div>
                  <p class="detail-content">{{ control.evidence }}</p>
                </div>

                <div class="detail-section reference" *ngIf="control.reference">
                  <div class="detail-header">
                    <mat-icon class="detail-icon">link</mat-icon>
                    <strong>References:</strong>
                  </div>
                  <p class="detail-content">{{ control.reference }}</p>
                </div>
              </div>
            </mat-expansion-panel>
          </mat-accordion>

          <div class="show-more" *ngIf="viewMode === 'summary' && failedControls.length > 10">
            <p class="show-more-text">
              <mat-icon>info</mat-icon>
              {{ failedControls.length - 10 }} more failed controls available in Detailed View
            </p>
          </div>
        </div>

        <!-- Passed Controls -->
        <div class="controls-group passed" *ngIf="passedControls.length > 0">
          <h4>
            <mat-icon class="group-icon pass">check_circle</mat-icon>
            Passed Controls ({{ passedControls.length }})
          </h4>
          
          <div class="control-list">
            <div *ngFor="let control of displayedPassedControls" class="control-item pass">
              <mat-icon class="control-status-icon">check</mat-icon>
              <span class="control-name">{{ control.title || control.id }}</span>
              <span class="control-category" *ngIf="control.category && viewMode === 'detailed'">
                ({{ control.category }})
              </span>
            </div>
          </div>

          <div class="show-more" *ngIf="passedControls.length > displayedPassedControls.length">
            <p class="show-more-text">
              ... and {{ passedControls.length - displayedPassedControls.length }} more
            </p>
          </div>
        </div>

        <!-- Not Applicable Controls (Detailed View Only) -->
        <div class="controls-group na" *ngIf="viewMode === 'detailed' && naControls.length > 0">
          <h4>
            <mat-icon class="group-icon na">block</mat-icon>
            Not Applicable Controls ({{ naControls.length }})
          </h4>
          
          <div class="control-list">
            <div *ngFor="let control of displayedNaControls" class="control-item na">
              <mat-icon class="control-status-icon">do_not_disturb</mat-icon>
              <span class="control-name">{{ control.title || control.id }}</span>
            </div>
          </div>

          <div class="show-more" *ngIf="naControls.length > 10">
            <p class="show-more-text">
              ... and {{ naControls.length - 10 }} more
            </p>
          </div>
        </div>
      </div>

      <div class="no-results" *ngIf="!reportData.controlResults || reportData.controlResults.length === 0">
        <mat-icon>info</mat-icon>
        <p>No control results available. Run a new scan to see detailed information.</p>
      </div>
    </div>
  `,
  styles: [`
    .oscal-report {
      padding: 1rem;
      width: 100%;
      box-sizing: border-box;
    }

    .report-header {
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid rgba(26, 35, 126, 0.2);
    }

    .report-header h3 {
      margin: 0 0 0.5rem 0;
      color: #1a237e;
      font-size: 1.5rem;
    }

    .report-description {
      margin: 0;
      color: #555;
      font-size: 0.95rem;
    }

    .report-summary {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label {
      font-size: 0.85rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a237e;
    }

    .stat-item.pass .stat-value {
      color: #2e7d32;
    }

    .stat-item.fail .stat-value {
      color: #c62828;
    }

    .status-pass { color: #2e7d32; }
    .status-warn { color: #ef6c00; }
    .status-fail { color: #c62828; }
    .status-pending { color: #757575; }

    .controls-section {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .controls-group h4 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 1rem 0;
      color: #1a237e;
      font-size: 1.2rem;
    }

    .group-icon {
      font-size: 1.5rem;
      width: 1.5rem;
      height: 1.5rem;
      flex-shrink: 0;
    }

    .group-icon.fail { color: #c62828; }
    .group-icon.pass { color: #2e7d32; }
    .group-icon.na { color: #757575; }

    .controls-accordion {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    ::ng-deep .control-panel {
      background: #fff !important;
      border: 1px solid #e0e0e0;
      border-radius: 8px !important;
      margin-bottom: 0.5rem !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
    }

    ::ng-deep .control-panel.fail {
      border-left: 4px solid #c62828;
    }

    ::ng-deep .control-panel .mat-expansion-panel-header {
      padding: 0.75rem 1.5rem;
    }

    ::ng-deep .control-panel .mat-expansion-panel-body {
      padding: 0 !important;
    }

    .control-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      width: 100%;
    }

    .control-number {
      color: #999;
      font-weight: 600;
      min-width: 2rem;
    }

    .control-id {
      color: #1a237e;
      font-weight: 600;
      font-family: 'Courier New', monospace;
    }

    .control-name {
      flex: 1;
      color: #333;
    }

    .severity-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .severity-critical {
      background: #b71c1c;
      color: white;
    }

    .severity-high {
      background: #c62828;
      color: white;
    }

    .severity-medium {
      background: #ef6c00;
      color: white;
    }

    .severity-low {
      background: #fbc02d;
      color: rgba(0, 0, 0, 0.87);
    }

    .control-details {
      padding: 1rem;
      background: #fafafa;
      border-top: 1px solid #eee;
    }

    .detail-section {
      margin-bottom: 1rem;
    }

    .detail-section:last-child {
      margin-bottom: 0;
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      color: #1a237e;
    }

    .detail-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }

    .detail-content {
      margin: 0;
      padding-left: 2rem;
      color: #444;
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .detail-section.recommendation {
      background: rgba(33, 150, 243, 0.05);
      padding: 0.75rem;
      border-radius: 4px;
      border-left: 3px solid #1976d2;
    }

    .detail-section.recommendation .detail-content {
      padding-left: 2rem;
    }

    .detail-section.evidence {
      background: rgba(156, 39, 176, 0.05);
      padding: 0.75rem;
      border-radius: 4px;
      border-left: 3px solid #7b1fa2;
    }

    .detail-section.reference {
      background: rgba(96, 125, 139, 0.05);
      padding: 0.75rem;
      border-radius: 4px;
      font-size: 0.9rem;
    }

    .control-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .control-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      background: #fff;
      border: 1px solid #eee;
      border-radius: 4px;
      border-left: 3px solid;
    }

    .control-item.pass {
      border-left-color: #2e7d32;
    }

    .control-item.na {
      border-left-color: #757575;
    }

    .control-status-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
      color: #2e7d32;
    }

    .control-item.na .control-status-icon {
      color: #757575;
    }

    .control-category {
      color: #777;
      font-size: 0.9rem;
    }

    .show-more {
      margin-top: 1rem;
      padding: 0.75rem;
      background: rgba(26, 35, 126, 0.02);
      border: 1px dashed #ced4da;
      border-radius: 4px;
      text-align: center;
    }

    .show-more-text {
      margin: 0;
      color: #666;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .no-results {
      padding: 3rem 1rem;
      text-align: center;
      color: #999;
    }

    .no-results mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      margin-bottom: 1rem;
    }

    .no-results p {
      margin: 0;
      font-size: 1.1rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OscalReportViewComponent {
  @Input() reportData: any;
  @Input() viewMode: 'summary' | 'detailed' = 'summary';
  @Output() expandControl = new EventEmitter<string>();

  get failedControls(): any[] {
    return this.reportData?.controlResults?.filter((c: any) => c.status === 'fail') || [];
  }

  get passedControls(): any[] {
    return this.reportData?.controlResults?.filter((c: any) => c.status === 'pass') || [];
  }

  get naControls(): any[] {
    return this.reportData?.controlResults?.filter((c: any) => c.status === 'notapplicable') || [];
  }

  get displayedFailedControls(): any[] {
    return this.viewMode === 'detailed' 
      ? this.failedControls 
      : this.failedControls.slice(0, 10);
  }

  get displayedPassedControls(): any[] {
    return this.viewMode === 'detailed'
      ? this.passedControls.slice(0, 20)
      : this.passedControls.slice(0, 5);
  }

  get displayedNaControls(): any[] {
    return this.naControls.slice(0, 10);
  }
}
