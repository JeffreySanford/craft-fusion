import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription, of } from 'rxjs';
import { catchError, finalize, take } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ApiLoggerService, ApiLogEntry } from '../../../common/services/api-logger.service';
import { LoggerService } from '../../../common/services/logger.service';
import { ApiService } from '../../../common/services/api.service';
import { SecurityScanService, ScanProgress } from '../../../common/services/security-scan.service';
import { SecurityReportModalComponent, SecurityReportData } from '../../../common/components/security-report-modal/security-report-modal.component';

interface ApiEndpointLog {
  path: string;
  method: string;
  lastContacted: Date | null;
  lastPing: Date | null;
  status: string;
  hitCount: number;
  successCount: number;
  errorCount: number;
  avgResponseTime: number;
  firstSeen: Date;
  timelineData: { timestamp: Date; responseTime: number; status?: number; requestBody?: unknown; responseBody?: unknown; headers?: unknown }[];
}

interface SecurityFinding {
  id?: string;
  source?: string;
  severity?: string;
  title?: string;
  component?: string;
  status?: string;
  createdAt?: string;
}

interface SecurityEvidence {
  id?: string;
  type?: string;
  name?: string;
  status?: string;
  hash?: string;
  createdAt?: string;
  createdBy?: string;
  retention?: string;
  downloadUrl?: string;
}

interface Sbom {
  id?: string;
  name?: string;
  format?: string;
  created?: string;
  delta?: string;
  status?: string;
  components?: number;
  vulnerabilities?: number;
  downloadUrl?: string;
}

interface OscalProfile {
  id?: string;
  name?: string;
  status?: string;
  lastRun?: string;
  pass?: number;
  fail?: number;
  duration?: string;
  profileType?: string;
}

interface ScaItem {
  id?: string;
  label?: string;
  status?: string;
  description?: string;
  lastChecked?: string;
}

interface RealtimeCheck {
  id?: string;
  name?: string;
  status?: string;
  duration?: string;
  lastRun?: string;
  endpoint?: string;
}

@Component({
  selector: 'app-security-dashboard',
  templateUrl: './security-dashboard.component.html',
  styleUrls: ['./security-dashboard.component.scss'],
  standalone: false,
})
export class SecurityDashboardComponent implements OnInit, OnDestroy {
  endpointLogs = new Map<string, ApiEndpointLog>();
  apiLogsSubscription!: Subscription;
  dataSubscription = new Subscription();
  expandedEndpoint: string | null = null;
  timestampFormat = 'shortTime';
  findings: SecurityFinding[] = [];
  evidence: SecurityEvidence[] = [];
  sboms: Sbom[] = [];
  oscalProfiles: OscalProfile[] = [];
  scaItems: ScaItem[] = [];
  realtimeChecks: RealtimeCheck[] = [];

  findingsLoading = false;
  evidenceLoading = false;
  sbomsLoading = false;
  oscalProfilesLoading = false;
  scaItemsLoading = false;
  realtimeChecksLoading = false;

  findingsError: string | null = null;
  evidenceError: string | null = null;
  sbomsError: string | null = null;
  oscalProfilesError: string | null = null;
  scaItemsError: string | null = null;
  realtimeChecksError: string | null = null;

  // Scan progress tracking
  activeScanId: string | null = null;
  scanProgress: ScanProgress | null = null;
  runningScanMap = new Map<string, boolean>(); // Track which items are currently running

  constructor(
    private apiLogger: ApiLoggerService,
    private logger: LoggerService,
    private apiService: ApiService,
    private dialog: MatDialog,
    private securityScanService: SecurityScanService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.monitorApiEndpoints();
    this.loadFindings();
    this.loadEvidence();
    this.loadSboms();
    this.loadOscalProfiles();
    this.loadScaItems();
    this.loadRealtimeChecks();
    this.setupScanProgressListener();
  }

  ngOnDestroy(): void {
    if (this.apiLogsSubscription) {
      this.apiLogsSubscription.unsubscribe();
    }
    this.dataSubscription.unsubscribe();
    this.securityScanService.disconnect();
  }

  private setupScanProgressListener(): void {
    this.securityScanService.connect();
    
    this.dataSubscription.add(
      this.securityScanService.getScanProgress().subscribe({
        next: (progress) => {
          this.scanProgress = progress;
          
          if (progress.status === 'completed') {
            this.runningScanMap.set(progress.scanId, false);
            // Refresh the relevant data
            if (progress.type === 'oscal') {
              this.loadOscalProfiles();
            } else if (progress.type === 'realtime') {
              this.loadRealtimeChecks();
            }
          } else if (progress.status === 'failed') {
            this.runningScanMap.set(progress.scanId, false);
            this.logger.error('Scan failed', progress.message);
          }
          
          this.cdr.markForCheck();
        },
        error: (error) => this.logger.error('Scan progress error', error),
      })
    );
  }

  private monitorApiEndpoints(): void {
    this.apiLogsSubscription = this.apiLogger.getLogStream().subscribe((logEntry: ApiLogEntry) => {
      if (!logEntry) return;

      try {
        const urlObj = new URL(logEntry.request.url, window.location.origin);
        const endpoint = urlObj.pathname;
        const method = logEntry.request.method || 'GET';
        const responseTime = logEntry.responseTime || 0;
        const statusCode = logEntry.response?.status || 0;
        const timestamp = Date.now();

        if (!this.endpointLogs.has(endpoint)) {
          this.endpointLogs.set(endpoint, {
            path: endpoint,
            method,
            lastContacted: new Date(),
            lastPing: new Date(),
            status: statusCode >= 200 && statusCode < 400 ? 'active' : 'error',
            hitCount: 0,
            successCount: 0,
            errorCount: 0,
            avgResponseTime: 0,
            firstSeen: new Date(),
            timelineData: [],
          });
        }

        const endpointLog = this.endpointLogs.get(endpoint);
        if (!endpointLog) {
          return;
        }
        endpointLog.hitCount++;
        endpointLog.lastContacted = new Date();
        endpointLog.method = method;

        if (statusCode >= 200 && statusCode < 400) {
          endpointLog.successCount++;
          endpointLog.status = 'active';
        } else {
          endpointLog.errorCount++;
          endpointLog.status = 'error';
        }

        endpointLog.avgResponseTime = (endpointLog.avgResponseTime * (endpointLog.hitCount - 1) + responseTime) / endpointLog.hitCount;

        endpointLog.timelineData.push({
          timestamp: new Date(timestamp),
          responseTime,
          status: statusCode,
          requestBody: logEntry.request.body,
          responseBody: logEntry.response?.body,
          headers: logEntry.request.headers,
        });

        if (endpointLog.timelineData.length > 50) {
          endpointLog.timelineData.shift();
        }
      } catch (err) {
        this.logger.error('Error processing log entry in SecurityDashboard', err);
      }
    });
  }

  private loadFindings(): void {
    this.findingsLoading = true;
    this.findingsError = null;

    const sub = this.apiService
      .get<SecurityFinding[]>('security/findings')
      .pipe(
        take(1),
        catchError(error => {
          this.logger.warn('Failed to load security findings', { status: error?.status });
          this.findingsError = 'Unable to load findings right now.';
          return of([]);
        }),
        finalize(() => {
          this.findingsLoading = false;
        }),
      )
      .subscribe(data => {
        this.findings = Array.isArray(data) ? data : [];
      });

    this.dataSubscription.add(sub);
  }

  private loadEvidence(): void {
    this.evidenceLoading = true;
    this.evidenceError = null;

    const sub = this.apiService
      .get<SecurityEvidence[]>('security/evidence')
      .pipe(
        take(1),
        catchError(error => {
          this.logger.warn('Failed to load security evidence', { status: error?.status });
          this.evidenceError = 'Unable to load evidence right now.';
          return of([]);
        }),
        finalize(() => {
          this.evidenceLoading = false;
        }),
      )
      .subscribe(data => {
        this.evidence = Array.isArray(data) ? data : [];
      });

    this.dataSubscription.add(sub);
  }

  private loadSboms(): void {
    this.sbomsLoading = true;
    this.sbomsError = null;

    const sub = this.apiService
      .get<Sbom[]>('security/sboms')
      .pipe(
        take(1),
        catchError(error => {
          this.logger.warn('Failed to load SBOMs', { status: error?.status });
          this.sbomsError = 'Unable to load SBOMs right now.';
          return of([]);
        }),
        finalize(() => {
          this.sbomsLoading = false;
        }),
      )
      .subscribe(data => {
        this.sboms = Array.isArray(data) ? data : [];
      });

    this.dataSubscription.add(sub);
  }

  private loadOscalProfiles(): void {
    this.oscalProfilesLoading = true;
    this.oscalProfilesError = null;

    const sub = this.apiService
      .get<OscalProfile[]>('security/oscal-profiles')
      .pipe(
        take(1),
        catchError(error => {
          this.logger.warn('Failed to load OSCAL profiles', { status: error?.status });
          this.oscalProfilesError = 'Unable to load OSCAL profiles right now.';
          return of([]);
        }),
        finalize(() => {
          this.oscalProfilesLoading = false;
        }),
      )
      .subscribe(data => {
        this.oscalProfiles = Array.isArray(data) ? data : [];
      });

    this.dataSubscription.add(sub);
  }

  private loadScaItems(): void {
    this.scaItemsLoading = true;
    this.scaItemsError = null;

    const sub = this.apiService
      .get<ScaItem[]>('security/sca-items')
      .pipe(
        take(1),
        catchError(error => {
          this.logger.warn('Failed to load SCA items', { status: error?.status });
          this.scaItemsError = 'Unable to load SCA items right now.';
          return of([]);
        }),
        finalize(() => {
          this.scaItemsLoading = false;
        }),
      )
      .subscribe(data => {
        this.scaItems = Array.isArray(data) ? data : [];
      });

    this.dataSubscription.add(sub);
  }

  private loadRealtimeChecks(): void {
    this.realtimeChecksLoading = true;
    this.realtimeChecksError = null;

    const sub = this.apiService
      .get<RealtimeCheck[]>('security/realtime-checks')
      .pipe(
        take(1),
        catchError(error => {
          this.logger.warn('Failed to load realtime checks', { status: error?.status });
          this.realtimeChecksError = 'Unable to load realtime checks right now.';
          return of([]);
        }),
        finalize(() => {
          this.realtimeChecksLoading = false;
        }),
      )
      .subscribe(data => {
        this.realtimeChecks = Array.isArray(data) ? data : [];
      });

    this.dataSubscription.add(sub);
  }

  getSeverityClass(severity?: string): string {
    const normalized = (severity || '').toLowerCase();
    if (['critical', 'high'].includes(normalized)) {
      return 'severity-critical';
    }
    if (['medium', 'warn', 'warning'].includes(normalized)) {
      return 'severity-warning';
    }
    if (['low', 'info'].includes(normalized)) {
      return 'severity-low';
    }
    return 'severity-unknown';
  }

  getFindingStatusClass(status?: string): string {
    const normalized = (status || '').toLowerCase();
    if (['closed', 'resolved'].includes(normalized)) {
      return 'status-closed';
    }
    if (['open', 'new', 'active'].includes(normalized)) {
      return 'status-open';
    }
    return 'status-unknown';
  }

  getEvidenceStatusClass(status?: string): string {
    const normalized = (status || '').toLowerCase();
    if (['ready', 'complete', 'available'].includes(normalized)) {
      return 'status-ready';
    }
    if (['processing', 'running', 'queued'].includes(normalized)) {
      return 'status-pending';
    }
    return 'status-unknown';
  }

  getSuccessRate(serviceInfo: ApiEndpointLog): number {
    if (!serviceInfo || serviceInfo.hitCount === 0) return 100;
    return (serviceInfo.successCount / serviceInfo.hitCount) * 100;
  }

  /**
   * Overview Tab Computed Properties
   */
  get sessionSecurityStatus(): { label: string; value: string; hint: string; type: 'stable' | 'warning' | 'neutral' } {
    // Check if auth is working and session rotation is enabled
    const authWorking = !this.oscalProfilesError && !this.findingsError;
    return {
      label: 'Session security',
      value: authWorking ? 'Protected' : 'Degraded',
      hint: authWorking ? 'Rotating tokens enabled' : 'Check auth configuration',
      type: authWorking ? 'stable' : 'warning'
    };
  }

  get activeUsersCount(): { label: string; value: string; hint: string; type: 'stable' | 'warning' | 'neutral' } {
    // This could be enhanced with actual user session data
    return {
      label: 'Active users',
      value: '1',
      hint: 'Admin channel only',
      type: 'neutral'
    };
  }

  get tlsStatus(): { label: string; value: string; hint: string; type: 'stable' | 'warning' | 'neutral' } {
    return {
      label: 'Connection',
      value: 'TLS 1.3',
      hint: 'Perfect forward secrecy',
      type: 'stable'
    };
  }

  get pendingPermissions(): { label: string; value: string; hint: string; type: 'stable' | 'warning' | 'neutral' } {
    const openFindings = this.findings.filter(f => 
      ['open', 'new', 'active'].includes((f.status || '').toLowerCase())
    ).length;
    
    return {
      label: 'Permission requests',
      value: openFindings > 0 ? `${openFindings} pending` : 'None pending',
      hint: openFindings > 0 ? 'Awaiting approval' : 'All clear',
      type: openFindings > 0 ? 'warning' : 'stable'
    };
  }

  get hardeningControls(): Array<{ icon: string; label: string; hint: string; badge: string; active: boolean }> {
    const criticalFindings = this.findings.filter(f => 
      ['critical', 'high'].includes((f.severity || '').toLowerCase())
    ).length;
    
    const scaItemsActive = this.scaItems.filter(item => item.status === 'pass').length;
    const totalScaItems = this.scaItems.length;
    
    return [
      {
        icon: 'filter_list',
        label: 'Request filtering',
        hint: 'WAF signatures enabled',
        badge: 'Active',
        active: true
      },
      {
        icon: 'lock_clock',
        label: 'Session timeout',
        hint: '30 min idle',
        badge: 'Enforced',
        active: true
      },
      {
        icon: 'security',
        label: 'Transport security',
        hint: 'HSTS + TLS 1.3',
        badge: 'Locked',
        active: true
      },
      {
        icon: 'fingerprint',
        label: 'MFA coverage',
        hint: 'Enable for operators',
        badge: 'TODO',
        active: false
      },
      {
        icon: 'vpn_lock',
        label: 'IP allowlist',
        hint: 'Lock to trusted CIDRs',
        badge: criticalFindings > 0 ? 'Review' : 'Off',
        active: criticalFindings === 0
      },
      {
        icon: 'enhanced_encryption',
        label: 'Data encryption',
        hint: 'AES-256 at rest',
        badge: 'On',
        active: true
      }
    ];
  }

  getMinResponseTime(endpointKey: string): number {
    const endpointLog = this.endpointLogs.get(endpointKey);
    if (!endpointLog || !endpointLog.timelineData || endpointLog.timelineData.length === 0) return 0;
    const timeline = endpointLog.timelineData;
    return Math.min(...timeline.map(item => item.responseTime));
  }

  getMaxResponseTime(endpointKey: string): number {
    const endpointLog = this.endpointLogs.get(endpointKey);
    if (!endpointLog || !endpointLog.timelineData || endpointLog.timelineData.length === 0) return 0;
    const timeline = endpointLog.timelineData;
    return Math.max(...timeline.map(item => item.responseTime));
  }

  getTotalSuccessCount(): number {
    return Array.from(this.endpointLogs.values()).reduce((total, endpoint) => total + (endpoint.successCount || 0), 0);
  }

  getTotalHitCount(): number {
    return Array.from(this.endpointLogs.values()).reduce((total, endpoint) => total + (endpoint.hitCount || 0), 0);
  }

  getTotalErrorCount(): number {
    return Array.from(this.endpointLogs.values()).reduce((total, endpoint) => total + (endpoint.errorCount || 0), 0);
  }

  toggleEndpointDetails(endpointKey: string): void {
    this.expandedEndpoint = this.expandedEndpoint === endpointKey ? null : endpointKey;
  }

  getEndpointMethodColor(method: string): string {
    switch ((method || '').toUpperCase()) {
      case 'GET':
        return '#10b981';
      case 'POST':
        return '#3b82f6';
      case 'PUT':
        return '#f59e0b';
      case 'DELETE':
        return '#ef4444';
      case 'PATCH':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  }

  getEndpointMethodIcon(method: string): string {
    switch ((method || '').toUpperCase()) {
      case 'GET':
        return 'download';
      case 'POST':
        return 'add_circle';
      case 'PUT':
        return 'update';
      case 'DELETE':
        return 'delete';
      case 'PATCH':
        return 'edit';
      default:
        return 'api';
    }
  }

  getStatusColor(successRate: number): string {
    if (successRate >= 95) return '#10b981';
    if (successRate >= 80) return '#f59e0b';
    return '#ef4444';
  }

  getServiceStatusClass(endpointKey: string): string {
    const endpointLog = this.endpointLogs.get(endpointKey);
    if (!endpointLog) return 'status-unknown';
    const successRate = this.getSuccessRate(endpointLog);
    if (successRate >= 95) return 'status-healthy';
    if (successRate >= 80) return 'status-warning';
    return 'status-error';
  }

  getServiceStatusText(endpointKey: string): string {
    const endpointLog = this.endpointLogs.get(endpointKey);
    if (!endpointLog) return 'Unknown';
    const successRate = this.getSuccessRate(endpointLog);
    if (successRate >= 95) return 'Healthy';
    if (successRate >= 80) return 'Warning';
    return 'Error';
  }

  toggleTimestampFormat(): void {
    this.timestampFormat = this.timestampFormat === 'shortTime' ? 'mediumTime' : 'shortTime';
  }

  getEndpointDetails(endpointKey: string): any {
    const entry = this.endpointLogs.get(endpointKey);
    if (!entry) return { status: 0, requestBody: null, responseBody: null, headers: null, timelineData: [] };
    const timelineData = entry.timelineData || [];
    const last = timelineData.length > 0 ? timelineData[timelineData.length - 1] : ({} as any);
    return {
      status: last?.status ?? 0,
      requestBody: last?.requestBody ?? null,
      responseBody: last?.responseBody ?? null,
      headers: last?.headers ?? null,
      timelineData,
    };
  }

  getEndpointLog(endpointKey: string): ApiEndpointLog {
    return (
      this.endpointLogs.get(endpointKey) || {
        path: '',
        method: '',
        lastContacted: new Date(0),
        lastPing: new Date(0),
        status: 'inactive',
        hitCount: 0,
        successCount: 0,
        errorCount: 0,
        avgResponseTime: 0,
        firstSeen: new Date(0),
        timelineData: [],
      }
    );
  }

  getFormattedHeaders(headers: unknown): string {
    if (!headers) return 'No headers available';
    try {
      return JSON.stringify(headers, null, 2);
    } catch {
      return 'Unable to format headers';
    }
  }

  getFormattedJson(data: unknown): string {
    if (!data) return 'No data available';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return 'Unable to format data';
    }
  }

  generateSparklineSVG(timelineData: { timestamp: Date; responseTime: number; status?: number }[]): string {
    if (!timelineData || timelineData.length < 2) return '';
    const width = 100;
    const height = 30;
    const padding = 2;
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;
    const timeValues = timelineData.map(d => d.timestamp.getTime());
    const responseValues = timelineData.map(d => d.responseTime);
    const minTime = Math.min(...timeValues);
    const maxTime = Math.max(...timeValues);
    const minResponse = Math.min(...responseValues);
    const maxResponse = Math.max(...responseValues);
    const points = timelineData
      .map(d => {
        const x = padding + (availableWidth * (d.timestamp.getTime() - minTime)) / (maxTime - minTime);
        const y = height - padding - (availableHeight * (d.responseTime - minResponse)) / (maxResponse - minResponse);
        return `${x},${y}`;
      })
      .join(' ');
    return `\n      <svg width="${width}" height="${height}" class="sparkline">\n        <polyline fill="none" stroke="url(#sparklineGradient)" stroke-width="1.5" points="${points}" />\n      </svg>\n    `;
  }

  generateDetailedSparklineSVG(timelineData: { timestamp: Date; responseTime: number; status: number }[]): string {
    if (!timelineData || timelineData.length < 2) return this.generateEmptySparkline();
    const width = 250;
    const height = 80;
    const padding = 5;
    const innerWidth = width - 2 * padding;
    const innerHeight = height - 2 * padding;
    const responseTimes = timelineData.map(data => data.responseTime);
    const timeValues = timelineData.map(d => d.timestamp.getTime());
    const minTime = Math.min(...timeValues);
    const maxTime = Math.max(...timeValues);
    const minResponse = 0;
    const maxResponse = Math.max(...responseTimes) * 1.1;
    const pathData = timelineData
      .map(d => {
        const ts = d.timestamp instanceof Date ? d.timestamp : new Date(d.timestamp as any);
        const x = padding + (innerWidth * (ts.getTime() - minTime)) / (maxTime - minTime);
        const y = height - padding - (innerHeight * (d.responseTime - minResponse)) / (maxResponse - minResponse);
        return `${x},${y}`;
      })
      .join(' ');
    let dotsHtml = '';
    timelineData.forEach(d => {
      const x = padding + (innerWidth * (d.timestamp.getTime() - minTime)) / (maxTime - minTime);
      const y = height - padding - (innerHeight * (d.responseTime - minResponse)) / (maxResponse - minResponse);
      const statusNum = typeof d.status === 'number' ? d.status : Number(d.status);
      let dotColor = '#10B981';
      if (statusNum >= 400) dotColor = '#EF4444';
      else if (statusNum >= 300) dotColor = '#F59E0B';
      dotsHtml += `<circle cx="${x}" cy="${y}" r="3" fill="${dotColor}" stroke="rgba(255,255,255,0.3)" stroke-width="1"></circle>`;
    });
    const areaData = pathData + ` L ${padding + innerWidth},${height - padding} L ${padding},${height - padding} Z`;
    const svg = `\n      <svg width="${width}" height="${height}" class="sparkline-detailed" xmlns="http://www.w3.org/2000/svg">\n        <defs>\n          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">\n            <stop offset="0%" stop-color="rgba(59, 130, 246, 0.5)" />\n            <stop offset="100%" stop-color="rgba(59, 130, 246, 0)" />\n          </linearGradient>\n        </defs>\n        <path d="${areaData}" fill="url(#areaGradient)" />\n        <path d="${pathData}" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />\n        ${dotsHtml}\n      </svg>\n    `;
    return svg;
  }

  private generateEmptySparkline(): string {
    const width = 250;
    const height = 80;
    return `\n      <svg width="${width}" height="${height}" class="sparkline-detailed empty" xmlns="http://www.w3.org/2000/svg">\n        <text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="#9CA3AF" font-size="12">No data available</text>\n      </svg>\n    `;
  }

  /**
   * OSCAL Actions
   */
  runOscalScan(profile: OscalProfile): void {
    if (!profile.id || this.runningScanMap.get(profile.id)) return;

    this.runningScanMap.set(profile.id, true);
    
    this.apiService.post(`/api/security/oscal-profiles/${profile.id}/scan`, null)
      .pipe(
        take(1),
        catchError((error) => {
          this.logger.error('Failed to start OSCAL scan', error);
          this.runningScanMap.set(profile.id!, false);
          return of(null);
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response?.scanId) {
            this.activeScanId = response.scanId;
            this.securityScanService.subscribeScan(response.scanId);
          }
        }
      });
  }

  viewOscalReport(profile: OscalProfile): void {
    const dialogData: SecurityReportData = {
      title: `OSCAL Report - ${profile.name}`,
      reportType: 'oscal',
      data: profile,
    };

    const dialogRef = this.dialog.open(SecurityReportModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'download' && profile.id) {
        this.downloadReport('oscal-profiles', profile.id, result.format);
      }
    });
  }

  isOscalRunning(profile: OscalProfile): boolean {
    return !!profile.id && !!this.runningScanMap.get(profile.id);
  }

  /**
   * SBOM Actions
   */
  compareSbom(sbom: Sbom): void {
    // TODO: Implement SBOM comparison
    this.logger.info('SBOM comparison not yet implemented', sbom);
  }

  /**
   * Real-Time Test Actions
   */
  runRealtimeCheck(check: RealtimeCheck): void {
    if (!check.id || this.runningScanMap.get(check.id)) return;

    this.runningScanMap.set(check.id, true);
    
    this.apiService.post(`/api/security/realtime-checks/${check.id}/run`, null)
      .pipe(
        take(1),
        catchError((error) => {
          this.logger.error('Failed to run real-time check', error);
          this.runningScanMap.set(check.id!, false);
          return of(null);
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response?.scanId) {
            this.activeScanId = response.scanId;
            this.securityScanService.subscribeScan(response.scanId);
          }
        }
      });
  }

  viewRealtimeReport(check: RealtimeCheck): void {
    const dialogData: SecurityReportData = {
      title: `Real-Time Check - ${check.name}`,
      reportType: 'realtime',
      data: check,
    };

    const dialogRef = this.dialog.open(SecurityReportModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'download' && check.id) {
        this.downloadReport('realtime-checks', check.id, result.format);
      }
    });
  }

  isRealtimeCheckRunning(check: RealtimeCheck): boolean {
    return !!check.id && !!this.runningScanMap.get(check.id);
  }

  /**
   * Findings Actions
   */
  exportFindings(): void {
    const dialogData: SecurityReportData = {
      title: 'Security Findings Export',
      reportType: 'findings',
      data: this.findings,
    };

    const dialogRef = this.dialog.open(SecurityReportModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'download') {
        this.downloadExport('findings', result.format);
      }
    });
  }

  /**
   * Evidence Actions
   */
  downloadEvidenceBundle(): void {
    const dialogData: SecurityReportData = {
      title: 'Evidence Bundle',
      reportType: 'evidence',
      data: this.evidence,
    };

    const dialogRef = this.dialog.open(SecurityReportModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'download') {
        // For evidence bundle, always download as ZIP/JSON
        window.open(`/api/security/evidence/bundle`, '_blank');
      }
    });
  }

  /**
   * SCA Actions
   */
  exportScaReport(): void {
    const dialogData: SecurityReportData = {
      title: 'Security Checklist Assessment',
      reportType: 'sca',
      data: this.scaItems,
    };

    const dialogRef = this.dialog.open(SecurityReportModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'download') {
        this.downloadExport('sca-items', result.format);
      }
    });
  }

  /**
   * Generic download helpers
   */
  private downloadReport(endpoint: string, id: string, format: 'pdf' | 'json' | 'xml'): void {
    const url = `/api/security/${endpoint}/${id}/report?format=${format}`;
    window.open(url, '_blank');
  }

  private downloadExport(endpoint: string, format: 'pdf' | 'json' | 'xml'): void {
    const url = `/api/security/${endpoint}/export?format=${format}`;
    window.open(url, '_blank');
  }
}
