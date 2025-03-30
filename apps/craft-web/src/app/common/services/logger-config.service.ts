import { Injectable } from '@angular/core';
import { LoggerService, LogLevel } from './logger.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggerConfigService {
  constructor(private logger: LoggerService) {
    this.configureLogger();
  }
  
  configureLogger(): void {
    // Set appropriate log level based on environment
    if (environment.production) {
      // In production, only show errors, warnings, and info logs
      this.logger.setLogLevel(LogLevel.INFO);
      
      // Disable console output in production if needed
      // this.logger.enableConsoleOutput(false);
    } else {
      // In development, show all logs including debug
      this.logger.setLogLevel(LogLevel.DEBUG);
    }
    
    this.logger.info('Logger configured', {
      environment: environment.production ? 'production' : 'development',
      logLevel: LogLevel[this.logger.getCurrentLogLevel()],
      timestamp: new Date() // Fix: Use Date object instead of timestamp
    });
    
    // Set up categories for grouping logs
    this.setupCategories();
  }
  
  private setupCategories(): void {
    // Register common categories for easier filtering
    const categories = [
      'API', 'AUTH', 'NETWORK', 'UI', 'PERFORMANCE', 'SERVER_CONNECTIVITY'
    ];
    
    categories.forEach(category => {
      this.logger.registerCategory(category);
    });
    
    this.logger.debug('Logger categories configured', { 
      categories,
      timestamp: new Date() // Fix: Use Date object instead of timestamp
    });
  }
}
