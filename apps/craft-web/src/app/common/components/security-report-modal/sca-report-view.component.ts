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
            <mat-icon class="item-icon" [class]="item.status">
              {{ item.status === 'pass' ? 'check_circle' : item.status === 'warn' ? 'error_outline' : 'schedule' }}
            </mat-icon>
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

    .report-header p {
      margin: 0;
      color: #666;
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
    .status-todo { color: #757575; font-weight: 600; }

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

    ::ng-deep .check-panel {
      background: #fff !important;
      border: 1px solid #e0e0e0 !important;
      border-radius: 8px !important;
      margin-bottom: 0.5rem !important;
      box-shadow: none !important;
    }

    ::ng-deep .check-panel.fail {
      border-left: 4px solid #c62828 !important;
    }

    .check-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
    }

    .check-number {
      color: #888;
      font-weight: 600;
    }

    .check-name {
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

    .check-details {
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

    .detail-section.evidence {
      background: #f3e5f5;
      padding: 0.75rem;
      border-radius: 4px;
      border-left: 3px solid #8e24aa;
    }

    .detail-section.reference {
      background: #eceff1;
      padding: 0.75rem;
      border-radius: 4px;
      font-size: 0.9rem;
      color: #455a64;
    }

    .check-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      padding: 0.5rem 0;
    }

    .check-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.8rem 1.5rem;
      background: #fff;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
      border-left: 5px solid #2e7d32;
      transition: background-color 0.2s;

      &:hover {
        background-color: #fcfcfc;
      }
    }

    .check-item mat-icon {
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

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .item-card {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.25rem 1.75rem;
      box-shadow: 0 2px 5px rgba(0,0,0,0.08);
      border-left: 5px solid #1a237e;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.12);
      }
    }

    .item-header {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 0.75rem;
    }

    .item-icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      font-size: 24px;
      
      &.pass { color: #2e7d32; }
      &.warn { color: #ef6c00; }
      &.todo { color: #757575; }
    }

    .item-number {
      color: #999;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .item-label {
      flex: 1;
      color: #1a237e;
      font-weight: 700;
      font-size: 1.05rem;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .item-description {
      margin: 0;
      padding-left: 2rem;
      color: #666;
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
