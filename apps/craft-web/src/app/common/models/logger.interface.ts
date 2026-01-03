export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface ILogger {
  debug(message: string, details?: unknown, component?: string): void;
  info(message: string, details?: unknown, component?: string): void;
  warn(message: string, details?: unknown, component?: string): void;
  error(message: string, details?: unknown, component?: string): void;
}

export class NullLogger implements ILogger {
  debug(message: string, details?: unknown, component?: string): void {
    void message;
    void details;
    void component;
  }
  info(message: string, details?: unknown, component?: string): void {
    void message;
    void details;
    void component;
  }
  warn(message: string, details?: unknown, component?: string): void {
    void message;
    void details;
    void component;
  }
  error(message: string, details?: unknown, component?: string): void {
    void message;
    void details;
    void component;
  }
}
