import { Injectable, Logger } from '@nestjs/common';
import { hostname } from 'os';

export interface HealthStatus {
  status: 'online' | 'degraded' | 'offline';
  uptime: number;
  timestamp: number;
  hostname: string;
  version: string;
  environment: string;
  memory: {
    free: number;
    total: number;
    usage: number;
  };
  services: {
    database: 'up' | 'down' | 'degraded';
    cache: 'up' | 'down' | 'degraded';
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime: number;
  private readonly version: string;
  private readonly environment: string;

  constructor() {
    this.startTime = Date.now();
    this.version = process.env.npm_package_version || '1.0.0';
    this.environment = process.env.NODE_ENV || 'development';
    this.logger.log(`Health service initialized in ${this.environment} environment`);
  }

  checkHealth(): HealthStatus {
    const currentTime = Date.now();
    const uptimeMs = currentTime - this.startTime;
    
    this.logger.debug(`Health check requested at ${new Date().toISOString()}`);

    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const freeMemory = Math.round(memoryUsage.heapTotal - memoryUsage.heapUsed);
    const totalMemory = Math.round(memoryUsage.heapTotal);
    const memoryUsagePercent = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);
    
    // Check service health (mocked for demonstration)
    // In a real application, you would check actual connections
    const databaseStatus = this.checkDatabaseHealth();
    const cacheStatus = this.checkCacheHealth();
    
    // Determine overall status
    let status: 'online' | 'degraded' | 'offline' = 'online';
    if (databaseStatus === 'down' || cacheStatus === 'down') {
      status = 'degraded';
      this.logger.warn('Health status is degraded due to service issues');
    } else {
      this.logger.log('Health status is online, all services operating normally');
    }
    
    const healthStatus: HealthStatus = {
      status,
      uptime: uptimeMs,
      timestamp: currentTime,
      hostname: hostname(),
      version: this.version,
      environment: this.environment,
      memory: {
        free: freeMemory,
        total: totalMemory,
        usage: memoryUsagePercent,
      },
      services: {
        database: databaseStatus,
        cache: cacheStatus,
      },
    };
    
    this.logger.debug('Health check details', healthStatus);
    return healthStatus;
  }
  
  private checkDatabaseHealth(): 'up' | 'down' | 'degraded' {
    // In a real application, check actual database connectivity
    this.logger.debug('Checking database health');
    try {
      // Simulate database check
      return 'up';
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return 'down';
    }
  }
  
  private checkCacheHealth(): 'up' | 'down' | 'degraded' {
    // In a real application, check actual cache service
    this.logger.debug('Checking cache health');
    try {
      // Simulate cache check
      return 'up';
    } catch (error) {
      this.logger.error('Cache health check failed', error);
      return 'down';
    }
  }
}
