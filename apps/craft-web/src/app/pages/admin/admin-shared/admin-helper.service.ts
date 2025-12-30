import { Injectable } from '@angular/core';
import { ServiceCallMetric } from '../../../common/services/logger.service';

@Injectable({ providedIn: 'root' })
export class AdminHelperService {
  constructor() {}

  getMetricIcon(metric: ServiceCallMetric): string {
    if (!metric || !metric.status) return 'help_outline';
    if (metric.status >= 500) return 'error';
    if (metric.status >= 400) return 'warning';
    if (metric.status >= 300) return 'swap_horiz';
    return 'check_circle';
  }

  getMetricLabel(metric: ServiceCallMetric): string {
    if (!metric || !metric.status) return 'Unknown';
    if (metric.status >= 500) return 'Server Error';
    if (metric.status >= 400) return 'Client Error';
    if (metric.status >= 300) return 'Redirect';
    return 'Success';
  }

  getMetricValue(metric: ServiceCallMetric): number {
    return metric?.duration || 0;
  }

  getMetricUnit(): string {
    return 'ms';
  }

  parseFloatSafe(value: string): number {
    return parseFloat(value) || 0;
  }

  getPercentage(duration?: number): number {
    if (!duration) return 0;
    return Math.min(100, (duration / 500) * 100);
  }

  getDurationClass(duration?: number): string {
    if (!duration) return '';
    if (duration < 100) return 'duration-fast';
    if (duration < 300) return 'duration-medium';
    return 'duration-slow';
  }

  getStatusClass(status?: number): string {
    if (!status) return 'status-unknown';
    if (status === 1) return 'status-in-process';
    if (status >= 200 && status < 300) return 'status-success';
    if (status >= 300 && status < 400) return 'status-redirect';
    if (status >= 400 && status < 500) return 'status-client-error';
    if (status >= 500) return 'status-server-error';
    return 'status-unknown';
  }

  getSuccessRateColor(rate: number): string {
    const red = Math.round(255 * (1 - rate / 100));
    const green = Math.round(255 * (rate / 100));
    return `${red}, ${green}, 0`;
  }
}
