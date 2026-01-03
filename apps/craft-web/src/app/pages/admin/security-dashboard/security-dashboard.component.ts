import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiLoggerService, ApiLogEntry } from '../../../common/services/api-logger.service';
import { LoggerService } from '../../../common/services/logger.service';

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

@Component({
  selector: 'app-security-dashboard',
  templateUrl: './security-dashboard.component.html',
  styleUrls: ['./security-dashboard.component.scss'],
  standalone: false,
})
export class SecurityDashboardComponent implements OnInit, OnDestroy {
  endpointLogs = new Map<string, ApiEndpointLog>();
  apiLogsSubscription!: Subscription;
  expandedEndpoint: string | null = null;
  timestampFormat = 'shortTime';

  constructor(
    private apiLogger: ApiLoggerService,
    private logger: LoggerService,
  ) {}

  ngOnInit(): void {
    this.monitorApiEndpoints();
  }

  ngOnDestroy(): void {
    if (this.apiLogsSubscription) {
      this.apiLogsSubscription.unsubscribe();
    }
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

  getSuccessRate(serviceInfo: ApiEndpointLog): number {
    if (!serviceInfo || serviceInfo.hitCount === 0) return 100;
    return (serviceInfo.successCount / serviceInfo.hitCount) * 100;
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
}
