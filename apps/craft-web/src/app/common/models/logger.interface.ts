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
  debug(message: string, details?: unknown, component?: string): void;
  info(message: string, details?: unknown, component?: string): void;
  warn(message: string, details?: unknown, component?: string): void;
  error(message: string, details?: unknown, component?: string): void;
}

/**
 * Null logger implementation that does nothing.
 * Used as a fallback when a proper logger is not available.
 */
export class NullLogger implements ILogger {
  debug(message: string, details?: unknown, component?: string): void {}
  info(message: string, details?: unknown, component?: string): void {}
  warn(message: string, details?: unknown, component?: string): void {}
  error(message: string, details?: unknown, component?: string): void {}
}
