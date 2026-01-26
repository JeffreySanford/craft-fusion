import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-realtime-report-view',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatExpansionModule],
  template: `
    <div class="realtime-report">
      <div class="report-header">
        <h3>{{ reportData.name || 'Real-Time Security Check' }}</h3>
        <p class="endpoint">Endpoint: {{ reportData.endpoint || 'N/A' }}</p>
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
            <span class="stat-label">Duration:</span>
            <span class="stat-value">{{ reportData.duration }}</span>
          </div>
          <div class="stat-item pass" *ngIf="reportData.pass !== undefined">
            <span class="stat-label">Pass:</span>
            <span class="stat-value">{{ reportData.pass }}</span>
          </div>
          <div class="stat-item fail" *ngIf="reportData.fail !== undefined">
            <span class="stat-label">Fail:</span>
            <span class="stat-value">{{ reportData.fail }}</span>
          </div>
          <div class="stat-item warn" *ngIf="reportData.warning !== undefined">
            <span class="stat-label">Warnings:</span>
            <span class="stat-value">{{ reportData.warning }}</span>
          </div>
        </div>
      </div>

      <div class="tests-section" *ngIf="reportData.testResults">
        <!-- Failed Tests -->
        <div class="tests-group" *ngIf="failedTests.length > 0">
          <h4>
            <mat-icon class="group-icon fail">error</mat-icon>
            Failed Tests ({{ failedTests.length }})
          </h4>
          
          <mat-accordion class="tests-accordion">
            <mat-expansion-panel *ngFor="let test of failedTests; let i = index" class="test-panel fail">
              <mat-expansion-panel-header>
                <mat-panel-title class="test-title">
                  <span class="test-number">{{ i + 1 }}.</span>
                  <span class="test-name">{{ test.testName || test.id }}</span>
                  <span class="severity-badge" [class]="'severity-' + test.severity">
                    {{ test.severity?.toUpperCase() || 'MEDIUM' }}
                  </span>
                  <span class="response-time" *ngIf="test.responseTime">{{ test.responseTime }}ms</span>
                </mat-panel-title>
              </mat-expansion-panel-header>

              <div class="test-details">
                <div class="detail-row" *ngIf="test.statusCode">
                  <strong>Status Code:</strong>
                  <span>{{ test.statusCode }}</span>
                </div>

                <div class="detail-section" *ngIf="test.message">
                  <div class="detail-header">
                    <mat-icon>message</mat-icon>
                    <strong>Message:</strong>
                  </div>
                  <p>{{ test.message }}</p>
                </div>

                <div class="detail-section recommendation" *ngIf="test.recommendation">
                  <div class="detail-header">
                    <mat-icon>build</mat-icon>
                    <strong>Remediation:</strong>
                  </div>
                  <p>{{ test.recommendation }}</p>
                </div>

                <div class="detail-section" *ngIf="test.details">
                  <div class="detail-header">
                    <mat-icon>info</mat-icon>
                    <strong>Details:</strong>
                  </div>
                  <p>{{ test.details }}</p>
                </div>
              </div>
            </mat-expansion-panel>
          </mat-accordion>
        </div>

        <!-- Passed Tests -->
        <div class="tests-group" *ngIf="passedTests.length > 0">
          <h4>
            <mat-icon class="group-icon pass">check_circle</mat-icon>
            Passed Tests ({{ passedTests.length }})
          </h4>
          
          <div class="test-list">
            <div *ngFor="let test of displayedPassedTests" class="test-item pass">
              <mat-icon>check</mat-icon>
              <span class="test-name">{{ test.testName || test.id }}</span>
              <span class="response-time" *ngIf="test.responseTime">({{ test.responseTime }}ms)</span>
            </div>
          </div>

          <div class="show-more" *ngIf="passedTests.length > 5">
            <p>... and {{ passedTests.length - 5 }} more</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .realtime-report {
      padding: 1rem;
      width: 100%;
      box-sizing: border-box;
    }

    .report-header {
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #1a237e;
    }

    .report-header h3 {
      margin: 0 0 0.5rem 0;
      color: #1a237e;
      font-weight: 600;
    }

    .endpoint {
      margin: 0;
      color: #666;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }

    .report-summary {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
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
      font-weight: 500;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a237e;
    }

    .stat-item.pass .stat-value { color: #2e7d32; }
    .stat-item.fail .stat-value { color: #c62828; }
    .stat-item.warn .stat-value { color: #ef6c00; }

    .status-pass { color: #2e7d32; font-weight: 600; }
    .status-warn { color: #ef6c00; font-weight: 600; }
    .status-fail { color: #c62828; font-weight: 600; }

    .tests-section {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .tests-group h4 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 1rem 0;
      color: #1a237e;
      font-weight: 600;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 0.5rem;
    }

    .group-icon {
      font-size: 1.5rem;
    }

    .group-icon.fail { color: #c62828; }
    .group-icon.pass { color: #2e7d32; }

    ::ng-deep .test-panel {
      background: #fff !important;
      border: 1px solid #e0e0e0 !important;
      border-radius: 8px !important;
      margin-bottom: 0.5rem !important;
      box-shadow: none !important;
    }

    ::ng-deep .test-panel.fail {
      border-left: 4px solid #c62828 !important;
    }

    .test-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
    }

    .test-number {
      color: #888;
      font-weight: 600;
    }

    .test-name {
      flex: 1;
      color: #333;
      font-weight: 500;
    }

    .severity-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .severity-critical { background: #b71c1c; color: white; }
    .severity-high { background: #c62828; color: white; }
    .severity-medium { background: #ef6c00; color: white; }
    .severity-low { background: #f9a825; color: black; }

    .response-time {
      color: #888;
      font-size: 0.9rem;
    }

    .test-details {
      padding: 1rem;
      background: #fafafa;
      border-top: 1px solid #eee;
    }

    .detail-row {
      margin-bottom: 0.75rem;
      color: #444;
    }

    .detail-row strong {
      color: #1a237e;
      margin-right: 0.5rem;
    }

    .detail-section {
      margin-bottom: 1rem;
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      color: #1a237e;
    }

    .detail-section p {
      margin: 0;
      padding-left: 2rem;
      color: #555;
      line-height: 1.6;
    }

    .detail-section.recommendation {
      background: #e3f2fd;
      padding: 0.75rem;
      border-radius: 4px;
      border-left: 3px solid #1976d2;
    }

    .test-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      padding: 0.5rem 0;
    }

    .test-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.8rem 1.5rem;
      background: #fff;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
      border-left: 5px solid #2e7d32;

      &:hover {
        background-color: #fcfcfc;
      }
    }

    .test-item mat-icon {
      color: #2e7d32;
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      font-size: 20px;
    }

    .show-more {
      margin-top: 0.5rem;
      text-align: center;
      color: #888;
      font-size: 0.85rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RealtimeReportViewComponent {
  @Input() reportData: any;
  @Input() viewMode: 'summary' | 'detailed' = 'summary';

  get failedTests(): any[] {
    return this.reportData?.testResults?.filter((t: any) => t.status === 'fail') || [];
  }

  get passedTests(): any[] {
    return this.reportData?.testResults?.filter((t: any) => t.status === 'pass') || [];
  }

  get displayedPassedTests(): any[] {
    return this.passedTests.slice(0, 5);
  }
}
