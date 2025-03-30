import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

/**
 * Log levels in increasing verbosity
 */
export enum LogLevel {
  ERROR = 0,
  WARNING = 1,
  INFO = 2,
  DEBUG = 3,
  PERFORMANCE = 4
}

/**
 * Performance metric format for detailed performance logging
 */
export interface PerformanceMetric {
  action: string;
  duration: number;
  timestamp: Date;
  category?: string;
}

/**
 * Enhanced Log Entry format with detailed metadata
 */
export interface LogEntry {
  level: string;
  message: string;
  timestamp: Date;
  data?: any;
  step?: string;
  stepNumber?: number;
  context?: string;
  category?: string;
  source?: string;
  serviceName?: string;
  metrics?: Array<{name: string, value: any, unit?: string}>;
  content?: any;
  details?: any;
}

/**
 * Step tracking information
 */
export interface StepInfo {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'failed';
  parentId?: string;
  children: string[];
  data?: any;
}

/**
 * Log level info for styling
 */
export interface LogLevelInfo {
  color: string;
  icon: string;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private readonly logLevel = environment.logLevel || 'info';
  private logHistory: LogEntry[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private activeServices = new Set<string>();
  private logToConsole = true;
  
  // Explicit type signature for color mapping
  private colorMapping: Record<string, string> = {
    error: '#BF0A30', // Red
    warn: '#FFC107',  // Yellow/Gold
    info: '#002868',  // Navy Blue
    debug: '#8A2BE2', // Blue Violet
    trace: '#4CAF50',  // Green
    performance: '#4CAF50' // Performance
  };

  // Logs observable for components that need to subscribe to log updates
  private logsSubject = new BehaviorSubject<LogEntry[]>([]);
  public logs$ = this.logsSubject.asObservable();

  // Step tracking
  private steps = new Map<string, StepInfo>();
  private currentSteps$ = new BehaviorSubject<StepInfo[]>([]);
  private stepCounter = 0;
  private flowId = this.generateFlowId();

  // For service call tracking
  private serviceCallStartTimes = new Map<string, number>();

  constructor(private http: HttpClient) {
    console.log('%c📋 Logger Service Initialized 📋', 'background: #002868; color: white; padding: 4px; border-radius: 4px; font-weight: bold;');

    // Print logger configuration
    console.log(
      `%cLogger Configuration:\n` +
      `Log Level: ${this.logLevel}\n` +
      `Environment: ${environment.production ? 'Production' : 'Development'}\n` +
      `Console Output: ${this.logToConsole ? 'Enabled' : 'Disabled'}`,
      'background: #333; color: #bada55; padding: 4px; border-radius: 4px;'
    );
  }

  /**
   * Register a service with the logger
   * @param serviceName Name of the service to register
   */
  registerService(serviceName: string): void {
    this.activeServices.add(serviceName);
    this.info(`Service registered: ${serviceName}`, {
      category: 'SERVICE_REGISTRY',
      source: 'LoggerService'
    });
  }

  /**
   * Log a message at the info level with USA-themed styling
   * @param message Message to log
   * @param data Optional data to include in the log
   */
  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  /**
   * Log a message at the debug level
   * @param message Message to log
   * @param data Optional data to include in the log
   */
  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  /**
   * Log a message at the error level
   * @param message Message to log
   * @param data Optional data to include in the log
   */
  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  /**
   * Log a message at the warn level
   * @param message Message to log
   * @param data Optional data to include in the log
   */
  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  /**
   * Log a message at the trace level
   * @param message Message to log
   * @param data Optional data to include in the log
   */
  trace(message: string, data?: any): void {
    this.log('trace', message, data);
  }

  /**
   * Log performance metrics
   * @param message Message describing the performance metrics
   * @param metrics Array of performance metrics
   * @param metadata Optional additional metadata
   */
  performance(message: string, metrics: Array<{name: string, value: any, unit?: string}>, metadata?: any): void {
    // Merge metrics and additional metadata
    const data = {
      metrics,
      ...(metadata || {}) // Spread metadata if provided, otherwise empty object
    };
    this.log('performance', message, data);
  }

  /**
   * Start tracking a service call
   * @param service Service making the call
   * @param method HTTP method
   * @param url URL being called
   * @returns Call ID to use with endServiceCall
   */
  startServiceCall(service: string, method: string, url: string): string {
    const callId = `${service}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.serviceCallStartTimes.set(callId, performance.now());

    this.debug(`🚀 API Call Started: ${method} ${url}`, {
      category: 'API_CALL',
      source: service,
      callId,
      method,
      url
    });

    return callId;
  }

  /**
   * End tracking a service call
   * @param callId Call ID from startServiceCall
   * @param statusCode HTTP status code
   */
  endServiceCall(callId: string, statusCode: number): void {
    const startTime = this.serviceCallStartTimes.get(callId);
    if (!startTime) {
      this.warn(`Cannot end service call with unknown ID: ${callId}`);
      return;
    }

    const duration = Math.round(performance.now() - startTime);
    this.serviceCallStartTimes.delete(callId);

    // Log at different levels based on response code
    const level = statusCode >= 400 ? 'error' : (statusCode >= 300 ? 'warn' : 'debug');

    this[level](`🏁 API Call Completed: Status ${statusCode}, Duration: ${duration}ms`, {
      category: 'API_CALL',
      duration,
      statusCode,
      callId
    });

    // Track performance metric
    this.performanceMetrics.push({
      action: `API Call ${callId}`,
      duration,
      timestamp: new Date(),
      category: 'API_CALL'
    });
  }

  /**
   * Start a new step in a workflow
   * @param name Step name
   * @param data Optional data for the step
   * @param parentId Optional parent step ID
   * @returns Step ID
   */
  startStep(name: string, data?: any, parentId?: string): string {
    const stepNumber = ++this.stepCounter;
    const stepId = `${this.flowId}-step-${stepNumber}`;

    const stepInfo: StepInfo = {
      id: stepId,
      name,
      startTime: Date.now(),
      status: 'running',
      parentId,
      children: [],
      data
    };

    this.steps.set(stepId, stepInfo);

    // If this is a child step, update parent
    if (parentId && this.steps.has(parentId)) {
      const parent = this.steps.get(parentId)!;
      parent.children.push(stepId);
      this.steps.set(parentId, parent);
    }

    // Update current steps
    this.updateCurrentSteps();

    // Log the step start
    this.info(`📋 STEP ${stepNumber}: ${name} started`, {
      step: name,
      stepNumber,
      stepId,
      parentId,
      category: 'STEP',
      data
    });

    return stepId;
  }

  /**
   * Complete a step in a workflow
   * @param stepId Step ID from startStep
   * @param data Optional result data
   */
  completeStep(stepId: string, data?: any): void {
    if (!this.steps.has(stepId)) {
      this.warn(`Cannot complete unknown step: ${stepId}`);
      return;
    }

    const step = this.steps.get(stepId)!;
    step.endTime = Date.now();
    step.status = 'completed';
    if (data) {
      step.data = { ...step.data, ...data };
    }

    this.steps.set(stepId, step);

    // Update current steps
    this.updateCurrentSteps();

    // Calculate duration
    const duration = step.endTime - step.startTime;

    // Log the step completion
    this.info(`✅ STEP ${this.getStepNumberFromId(stepId)}: ${step.name} completed in ${duration}ms`, {
      step: step.name,
      stepId,
      duration,
      category: 'STEP',
      data: step.data
    });
  }

  /**
   * Fail a step in a workflow
   * @param stepId Step ID from startStep
   * @param error Error information
   */
  failStep(stepId: string, error: any): void {
    if (!this.steps.has(stepId)) {
      this.warn(`Cannot fail unknown step: ${stepId}`);
      return;
    }

    const step = this.steps.get(stepId)!;
    step.endTime = Date.now();
    step.status = 'failed';
    step.data = { ...step.data, error };

    this.steps.set(stepId, step);

    // Update current steps
    this.updateCurrentSteps();

    // Calculate duration
    const duration = step.endTime - step.startTime;

    // Log the step failure
    this.error(`❌ STEP ${this.getStepNumberFromId(stepId)}: ${step.name} failed after ${duration}ms`, {
      step: step.name,
      stepId,
      duration,
      category: 'STEP',
      error
    });
  }

  /**
   * Start a new flow with a unique ID
   */
  startFlow(flowName: string): string {
    this.flowId = this.generateFlowId();
    this.stepCounter = 0;

    this.info(`🌊 FLOW: ${flowName} started`, {
      flowId: this.flowId,
      flowName,
      category: 'FLOW'
    });

    return this.flowId;
  }

  /**
   * Get the current active steps
   */
  getCurrentSteps(): Observable<StepInfo[]> {
    return this.currentSteps$.asObservable();
  }

  /**
   * Core log method - processes all log messages
   * @param level Log level
   * @param message Message to log
   * @param data Optional data to include in the log
   */
  private log(level: string, message: string, data?: any): void {
    // Skip logging if the level is below the configured level
    if (!this.shouldLog(level)) {
      return;
    }

    // Create the log entry
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      data
    };

    // Extract metadata from data if present
    if (data) {
      if (data.category) entry.category = data.category;
      if (data.context) entry.context = data.context;
      if (data.source) entry.source = data.source;
      if (data.step) entry.step = data.step;
      if (data.stepNumber) entry.stepNumber = data.stepNumber;
      if (data.serviceName) entry.serviceName = data.serviceName;
      if (data.metrics) entry.metrics = data.metrics;
      if (data.content) entry.content = data.content;
      if (data.details) entry.details = data.details;
    }

    // Add to history
    this.logHistory.push(entry);

    // Notify subscribers
    this.logsSubject.next([...this.logHistory]);

    // Trim history if it gets too large
    if (this.logHistory.length > 1000) {
      this.logHistory.shift();
    }

    // Log to console if enabled
    if (this.logToConsole) {
      this.logToConsoleWithStyling(entry);
    }

    // Optional: Send log to server
    this.sendLogToServer(entry).subscribe();
  }

  /**
   * Log to console with patriotic styling
   */
  private logToConsoleWithStyling(entry: LogEntry): void {
    const color = this.colorMapping[entry.level] || '#333333';
    const emoji = this.getEmojiForLevel(entry.level);

    // Construct message prefix
    let prefix = `%c${emoji} ${this.formatTimestamp(entry.timestamp)}`;
    if (entry.serviceName) prefix += ` [${entry.serviceName}]`;
    if (entry.category) prefix += ` [${entry.category}]`;

    // Style parameters for console log
    const styles = `color: ${color}; font-weight: bold;`;

    // Format data if present
    if (entry.data && Object.keys(entry.data).length > 0) {
      if (Object.keys(entry.data).some(key => ['category', 'context', 'source', 'step', 'stepNumber', 'serviceName'].includes(key))) {
        // Create a new object without metadata fields for cleaner logging
        const displayData = { ...entry.data };
        ['category', 'context', 'source', 'step', 'stepNumber', 'serviceName'].forEach(key => {
          delete displayData[key];
        });

        // Only log data if there are remaining properties
        if (Object.keys(displayData).length > 0) {
          console[entry.level === 'error' ? 'error' : 'log'](
            `${prefix}: ${entry.message}`, styles, displayData
          );
        } else {
          console[entry.level === 'error' ? 'error' : 'log'](
            `${prefix}: ${entry.message}`, styles
          );
        }
      } else {
        console[entry.level === 'error' ? 'error' : 'log'](
          `${prefix}: ${entry.message}`, styles, entry.data
        );
      }
    } else {
      console[entry.level === 'error' ? 'error' : 'log'](
        `${prefix}: ${entry.message}`, styles
      );
    }
  }

  /**
   * Get logs filtered by level and/or category
   * @param level Optional log level to filter by
   * @param category Optional category to filter by
   * @returns Filtered log entries
   */
  getLogs(level?: string, category?: string): LogEntry[] {
    let filtered = [...this.logHistory];

    if (level) {
      filtered = filtered.filter(entry => entry.level === level);
    }

    if (category) {
      filtered = filtered.filter(entry => entry.category === category);
    }

    return filtered;
  }

  /**
   * Get logs by numeric log level
   * @param level Numeric log level (from LogLevel enum)
   * @returns Filtered log entries
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    // Map numeric levels to string levels
    const levelMap = {
      [LogLevel.ERROR]: 'error',
      [LogLevel.WARNING]: 'warn',
      [LogLevel.INFO]: 'info',
      [LogLevel.DEBUG]: 'debug',
      [LogLevel.PERFORMANCE]: 'performance'
    };
    
    return this.getLogs(levelMap[level as keyof typeof levelMap]);
  }

  /**
   * Get logs by category
   * @param category Category name
   * @returns Filtered log entries
   */
  getLogsByCategory(category: string): LogEntry[] {
    return this.getLogs(undefined, category);
  }

  /**
   * Get logs by tag/keyword
   * @param tag Tag or keyword to search for
   * @returns Filtered log entries
   */
  getLogsByTag(tag: string): LogEntry[] {
    return this.logHistory.filter(entry => {
      // Search in message
      if (entry.message && entry.message.toLowerCase().includes(tag.toLowerCase())) {
        return true;
      }
      
      // Search in category
      if (entry.category && entry.category.toLowerCase().includes(tag.toLowerCase())) {
        return true;
      }
      
      // Search in data if it's a string
      if (entry.data && typeof entry.data === 'string' && 
          entry.data.toLowerCase().includes(tag.toLowerCase())) {
        return true;
      }
      
      return false;
    });
  }

  /**
   * Get log level info for styling
   */
  getLogLevelInfo(level: LogLevel | string): LogLevelInfo {
    // Map numeric levels to string levels if needed
    let levelStr: string;
    
    if (typeof level === 'number') {
      const levelMap = {
        [LogLevel.ERROR]: 'error',
        [LogLevel.WARNING]: 'warn',
        [LogLevel.INFO]: 'info',
        [LogLevel.DEBUG]: 'debug',
        [LogLevel.PERFORMANCE]: 'performance'
      };
      levelStr = levelMap[level as keyof typeof levelMap] || 'info';
    } else {
      levelStr = level || 'info';
    }

    switch (levelStr) {
      case 'error':
        return { color: '#BF0A30', icon: 'error', label: 'Error' };
      case 'warn':
        return { color: '#FFC107', icon: 'warning', label: 'Warning' };
      case 'info':
        return { color: '#002868', icon: 'info', label: 'Info' };
      case 'debug':
        return { color: '#8A2BE2', icon: 'code', label: 'Debug' };
      case 'performance':
        return { color: '#4CAF50', icon: 'speed', label: 'Performance' };
      default:
        return { color: '#607D8B', icon: 'help', label: 'Unknown' };
    }
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logHistory = [];
    this.logsSubject.next([]);
    this.info('Logs cleared', { category: 'SYSTEM' });
  }

  /**
   * Get the latest performance metrics
   */
  getPerformanceMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics];
  }

  /**
   * Send a log entry to the server
   */
  private sendLogToServer(entry: LogEntry): Observable<any> {
    // Skip server logging in development
    if (!environment.production) {
      return of(null);
    }

    return this.http.post('/api/logs', entry).pipe(
      catchError(err => {
        // Only log to console, don't retry to avoid infinite loop
        console.error('Failed to send log to server:', err);
        return of(null);
      })
    );
  }

  /**
   * Check if a log level should be logged based on configured level
   */
  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug', 'trace', 'performance'];
    const configLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex <= configLevelIndex;
  }

  /**
   * Format timestamp for console output
   */
  private formatTimestamp(date: Date): string {
    return date.toLocaleTimeString([], { hour12: false });
  }

  /**
   * Get emoji for log level
   */
  private getEmojiForLevel(level: string): string {
    switch (level) {
      case 'error': return '🔴';
      case 'warn':  return '🟠';
      case 'info':  return '🔵';
      case 'debug': return '🟣';
      case 'trace': return '⚪';
      case 'performance': return '⚡';
      default:      return '📋';
    }
  }

  /**
   * Generate a flow ID
   */
  private generateFlowId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `flow-${timestamp}-${random}`;
  }

  /**
   * Update the current steps observable
   */
  private updateCurrentSteps(): void {
    const currentSteps: StepInfo[] = [];
    this.steps.forEach(step => {
      if (step.status === 'running') {
        currentSteps.push(step);
      }
    });

    this.currentSteps$.next(currentSteps);
  }

  /**
   * Extract step number from step ID
   */
  private getStepNumberFromId(stepId: string): number {
    const match = stepId.match(/-step-(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  }
}
