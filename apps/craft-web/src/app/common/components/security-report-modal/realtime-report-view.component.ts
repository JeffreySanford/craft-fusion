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
    }

    .report-header {
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid rgba(255, 215, 0, 0.3);
    }

    .report-header h3 {
      margin: 0 0 0.5rem 0;
      color: #FFD700;
    }

    .endpoint {
      margin: 0;
      color: rgba(255, 255, 255, 0.6);
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }

    .report-summary {
      background: rgba(255, 215, 0, 0.05);
      border: 1px solid rgba(255, 215, 0, 0.2);
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
      color: rgba(255, 255, 255, 0.6);
      text-transform: uppercase;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: #FFD700;
    }

    .stat-item.pass .stat-value { color: #4CAF50; }
    .stat-item.fail .stat-value { color: #F44336; }
    .stat-item.warn .stat-value { color: #FF9800; }

    .status-pass { color: #4CAF50; }
    .status-warn { color: #FF9800; }
    .status-fail { color: #F44336; }

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
      color: #FFD700;
    }

    .group-icon {
      font-size: 1.5rem;
    }

    .group-icon.fail { color: #F44336; }
    .group-icon.pass { color: #4CAF50; }

    ::ng-deep .test-panel {
      background: rgba(20, 15, 10, 0.6) !important;
      border: 1px solid rgba(255, 215, 0, 0.2);
      border-radius: 8px !important;
      margin-bottom: 0.5rem !important;
    }

    ::ng-deep .test-panel.fail {
      border-left: 4px solid #F44336;
    }

    .test-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
    }

    .test-number {
      color: rgba(255, 255, 255, 0.5);
      font-weight: 600;
    }

    .test-name {
      flex: 1;
      color: rgba(255, 255, 255, 0.9);
    }

    .severity-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .severity-critical { background: #B71C1C; color: white; }
    .severity-high { background: #F44336; color: white; }
    .severity-medium { background: #FF9800; color: white; }
    .severity-low { background: #FFC107; color: black; }

    .response-time {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.9rem;
    }

    .test-details {
      padding: 1rem;
      background: rgba(0, 0, 0, 0.2);
    }

    .detail-row {
      margin-bottom: 0.75rem;
      color: rgba(255, 255, 255, 0.85);
    }

    .detail-row strong {
      color: #FFD700;
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
      color: #FFD700;
    }

    .detail-section p {
      margin: 0;
      padding-left: 2rem;
      color: rgba(255, 255, 255, 0.85);
      line-height: 1.6;
    }

    .detail-section.recommendation {
      background: rgba(33, 150, 243, 0.1);
      padding: 0.75rem;
      border-radius: 4px;
      border-left: 3px solid #2196F3;
    }

    .test-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .test-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      background: rgba(20, 15, 10, 0.4);
      border-radius: 4px;
      border-left: 3px solid #4CAF50;
    }

    .test-item mat-icon {
      color: #4CAF50;
    }

    .show-more {
      margin-top: 0.5rem;
      text-align: center;
      color: rgba(255, 255, 255, 0.5);
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
