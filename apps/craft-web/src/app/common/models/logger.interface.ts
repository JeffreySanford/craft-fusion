/**
 * Interface for logging services to implement.
 * This helps break circular dependencies between services.
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface ILogger {
  debug(message: string, details?: any, component?: string): void;
  info(message: string, details?: any, component?: string): void;
  warn(message: string, details?: any, component?: string): void;
  error(message: string, details?: any, component?: string): void;
}

/**
 * Null logger implementation that does nothing.
 * Used as a fallback when a proper logger is not available.
 */
export class NullLogger implements ILogger {
  debug(_message: string, _details?: any, _component?: string): void {}
  info(_message: string, _details?: any, _component?: string): void {}
  warn(_message: string, _details?: any, _component?: string): void {}
  error(_message: string, _details?: any, _component?: string): void {}
}
