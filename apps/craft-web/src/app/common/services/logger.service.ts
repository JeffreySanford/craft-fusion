import { HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface BaseServiceCallMetric {
  serviceName: string;
  method: string;
  url: string;
  timestamp: number;
  duration?: number;
  status?: number;
}

export interface ServiceCallMetric extends BaseServiceCallMetric {
  securityEvents: number;
  authAttempts: number;
  failedAuths: number;
  activeUsers: number;
  averageLatency: number;
  errorRate: number;
  lastIncident?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private readonly LOGGER_PREFIX = '%cLOGGER:';
  private readonly LOGGER_STYLE = 'color: #8A2BE2; font-weight: bold;'; // Purple text
  private readonly ERROR_STYLE = 'color: #FF3333; font-weight: bold;'; // Red text
  private readonly WARN_STYLE = 'color: #FFAA33; font-weight: bold;';  // Orange text
  private readonly INFO_STYLE = 'color: #33AAFF; font-weight: bold;';  // Blue text

  private serviceCallsSubject = new BehaviorSubject<ServiceCallMetric[]>([]);
  serviceCalls$ = this.serviceCallsSubject.asObservable();

  private logsSubject = new BehaviorSubject<string[]>([]);
  logs$ = this.logsSubject.asObservable();
  
  // Store active service calls for timing
  private activeServiceCalls = new Map<string, BaseServiceCallMetric>();

  constructor() {
    console.log(this.LOGGER_PREFIX + ' Logger service initialized', this.LOGGER_STYLE);
  }

  /**
   * @description Logs an error message to the console with a red color.
   * @param {string} msg - The error message to log.
   * @returns {void}
   */
  error(msg: string) {
    const logMessage = `${this.LOGGER_PREFIX} %c${msg}`;
    console.log(logMessage, this.LOGGER_STYLE, this.ERROR_STYLE);
    this.addLog(logMessage, 'error');
  }

  /**
   * @description Logs a warning message to the console with an orange color.
   * @param {string} msg - The warning message to log.
   * @returns {void}
   */
  warn(msg: string) {
    const logMessage = `${this.LOGGER_PREFIX} %c${msg}`;
    console.log(logMessage, this.LOGGER_STYLE, this.WARN_STYLE);
    this.addLog(logMessage, 'warn');
  }

  /**
   * @description Logs an informational message to the console with a blue color.
   * @param {string} msg - The informational message to log.
   * @returns {void}
   */
  info(msg: string) {
    const logMessage = `${this.LOGGER_PREFIX} %c${msg}`;
    // Remove the console logging for CPU Load messages
    if (!msg.includes('CPU Load')) {
      console.log(logMessage, this.LOGGER_STYLE, this.INFO_STYLE);
    }
    this.addLog(logMessage, 'info');
  }

  /**
   * @description Logs details about an HTTP request to the console.
   * @param {HttpRequest<any>} request - The HTTP request object.
   * @returns {void}
   */
  log(request: HttpRequest<any>) {
    const logMessage = `${this.LOGGER_PREFIX} Request: %c${request.method} - ${request.urlWithParams}`;
    console.log(logMessage, this.LOGGER_STYLE, this.INFO_STYLE);
    this.addLog(logMessage, 'log');
  }

  /**
   * Start tracking a service call
   */
  startServiceCall(serviceName: string, method: string, url: string): string {
    const callId = `${serviceName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metric: BaseServiceCallMetric = {
      serviceName,
      method,
      url,
      timestamp: performance.now()
    };
    
    this.activeServiceCalls.set(callId, metric);
    this.info(`Starting ${method} call to ${serviceName} (${url})`);
    
    return callId;
  }

  /**
   * End tracking a service call
   */
  endServiceCall(callId: string, status?: number): void {
    const call = this.activeServiceCalls.get(callId);
    if (call) {
      const endTime = performance.now();
      const duration = endTime - call.timestamp;
      
      // Create full service metric with default values
      const fullMetric: ServiceCallMetric = {
        ...call,
        duration,
        status,
        securityEvents: 0,
        authAttempts: 0,
        failedAuths: 0,
        activeUsers: 0,
        averageLatency: duration,
        errorRate: status && status >= 400 ? 100 : 0,
        lastIncident: status && status >= 400 ? new Date() : undefined
      };
      
      // Add to metrics
      const currentCalls = this.serviceCallsSubject.getValue();
      this.serviceCallsSubject.next([...currentCalls, fullMetric]);
      
      // Remove from active calls
      this.activeServiceCalls.delete(callId);
      
      this.info(`Completed call to ${call.serviceName} (${duration.toFixed(2)}ms) with status ${status || 'unknown'}`);
    }
  }

  /**
   * Get the latest service call metrics
   */
  getServiceCallMetrics(limit: number = 10): ServiceCallMetric[] {
    const currentCalls = this.serviceCallsSubject.getValue();
    return currentCalls.slice(Math.max(0, currentCalls.length - limit));
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.serviceCallsSubject.next([]);
  }

  private addLog(message: string, level: string): void {
    // Use an ISO timestamp to ensure proper parsing later in LoggerDisplayComponent
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    const currentLogs = this.logsSubject.getValue();
    this.logsSubject.next([...currentLogs, logEntry]);
  }

  getLogs(): string[] {
    return this.logsSubject.getValue();
  }
}
