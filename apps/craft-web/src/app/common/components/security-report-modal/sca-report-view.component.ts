import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-sca-report-view',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatExpansionModule],
  template: `
    <div class="sca-report">
      <div class="report-header">
        <h3>{{ itemLabel || 'Security Checklist Assessment' }}</h3>
        <p *ngIf="itemDescription">{{ itemDescription }}</p>
      </div>

      <div class="report-summary" *ngIf="hasDetailedData">
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-label">Status:</span>
            <span class="stat-value" [class]="'status-' + reportData.status">
              {{ reportData.status?.toUpperCase() }}
            </span>
          </div>
          <div class="stat-item" *ngIf="reportData.total">
            <span class="stat-label">Total:</span>
            <span class="stat-value">{{ reportData.total }}</span>
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

      <div class="checks-section" *ngIf="reportData.checkResults">
        <!-- Failed Checks -->
        <div class="checks-group" *ngIf="failedChecks.length > 0">
          <h4>
            <mat-icon class="group-icon fail">error</mat-icon>
            Failed Checks ({{ failedChecks.length }})
          </h4>
          
          <mat-accordion class="checks-accordion">
            <mat-expansion-panel *ngFor="let check of failedChecks; let i = index" class="check-panel fail">
              <mat-expansion-panel-header>
                <mat-panel-title class="check-title">
                  <span class="check-number">{{ i + 1 }}.</span>
                  <span class="check-name">{{ check.title }}</span>
                  <span class="severity-badge" [class]="'severity-' + check.severity">
                    {{ check.severity?.toUpperCase() || 'MEDIUM' }}
                  </span>
                </mat-panel-title>
              </mat-expansion-panel-header>

              <div class="check-details">
                <div class="detail-section" *ngIf="check.description">
                  <div class="detail-header">
                    <mat-icon>description</mat-icon>
                    <strong>Issue:</strong>
                  </div>
                  <p>{{ check.description }}</p>
                </div>

                <div class="detail-section recommendation" *ngIf="check.recommendation">
                  <div class="detail-header">
                    <mat-icon>build</mat-icon>
                    <strong>Remediation:</strong>
                  </div>
                  <p>{{ check.recommendation }}</p>
                </div>

                <div class="detail-section evidence" *ngIf="check.evidence">
                  <div class="detail-header">
                    <mat-icon>fact_check</mat-icon>
                    <strong>Evidence:</strong>
                  </div>
                  <p>{{ check.evidence }}</p>
                </div>

                <div class="detail-section reference" *ngIf="check.reference">
                  <div class="detail-header">
                    <mat-icon>link</mat-icon>
                    <strong>Reference:</strong>
                  </div>
                  <p>{{ check.reference }}</p>
                </div>
              </div>
            </mat-expansion-panel>
          </mat-accordion>
        </div>

        <!-- Passed Checks -->
        <div class="checks-group" *ngIf="passedChecks.length > 0">
          <h4>
            <mat-icon class="group-icon pass">check_circle</mat-icon>
            Passed Checks ({{ passedChecks.length }})
          </h4>
          
          <div class="check-list">
            <div *ngFor="let check of displayedPassedChecks" class="check-item pass">
              <mat-icon>check</mat-icon>
              <span class="check-name">{{ check.title }}</span>
            </div>
          </div>

          <div class="show-more" *ngIf="passedChecks.length > 10">
            <p>... and {{ passedChecks.length - 10 }} more</p>
          </div>
        </div>
      </div>

      <!-- Summary list view for multiple items -->
      <div class="items-list" *ngIf="isItemsList">
        <div *ngFor="let item of items; let i = index" class="item-card">
          <div class="item-header">
            <span class="item-number">{{ i + 1 }}.</span>
            <span class="item-label">{{ item.label }}</span>
            <span class="status-badge" [class]="'status-' + item.status">
              {{ item.status?.toUpperCase() }}
            </span>
          </div>
          <p *ngIf="item.description" class="item-description">{{ item.description }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sca-report {
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

    .report-header p {
      margin: 0;
      color: rgba(255, 255, 255, 0.7);
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
    .status-todo { color: #9E9E9E; }

    .checks-section {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .checks-group h4 {
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

    ::ng-deep .check-panel {
      background: rgba(20, 15, 10, 0.6) !important;
      border: 1px solid rgba(255, 215, 0, 0.2);
      border-radius: 8px !important;
      margin-bottom: 0.5rem !important;
    }

    ::ng-deep .check-panel.fail {
      border-left: 4px solid #F44336;
    }

    .check-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
    }

    .check-number {
      color: rgba(255, 255, 255, 0.5);
      font-weight: 600;
    }

    .check-name {
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

    .check-details {
      padding: 1rem;
      background: rgba(0, 0, 0, 0.2);
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

    .detail-section.evidence {
      background: rgba(156, 39, 176, 0.1);
      padding: 0.75rem;
      border-radius: 4px;
      border-left: 3px solid #9C27B0;
    }

    .detail-section.reference {
      background: rgba(96, 125, 139, 0.1);
      padding: 0.75rem;
      border-radius: 4px;
      font-size: 0.9rem;
    }

    .check-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .check-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      background: rgba(20, 15, 10, 0.4);
      border-radius: 4px;
      border-left: 3px solid #4CAF50;
    }

    .check-item mat-icon {
      color: #4CAF50;
    }

    .show-more {
      margin-top: 0.5rem;
      text-align: center;
      color: rgba(255, 255, 255, 0.5);
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .item-card {
      background: rgba(20, 15, 10, 0.4);
      border: 1px solid rgba(255, 215, 0, 0.2);
      border-radius: 8px;
      padding: 1rem;
    }

    .item-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .item-number {
      color: rgba(255, 255, 255, 0.5);
      font-weight: 600;
    }

    .item-label {
      flex: 1;
      color: #FFD700;
      font-weight: 600;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .item-description {
      margin: 0;
      padding-left: 2rem;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScaReportViewComponent {
  @Input() reportData: any;
  @Input() viewMode: 'summary' | 'detailed' = 'summary';

  get isItemsList(): boolean {
    return Array.isArray(this.reportData);
  }

  get hasDetailedData(): boolean {
    return !this.isItemsList && this.reportData?.checkResults;
  }

  get items(): any[] {
    return this.isItemsList ? this.reportData : [];
  }

  get itemLabel(): string {
    return !this.isItemsList ? this.reportData?.label : '';
  }

  get itemDescription(): string {
    return !this.isItemsList ? this.reportData?.description : '';
  }

  get failedChecks(): any[] {
    return this.reportData?.checkResults?.filter((c: any) => c.status === 'fail') || [];
  }

  get passedChecks(): any[] {
    return this.reportData?.checkResults?.filter((c: any) => c.status === 'pass') || [];
  }

  get displayedPassedChecks(): any[] {
    return this.passedChecks.slice(0, 10);
  }
}
