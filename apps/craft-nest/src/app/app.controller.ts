import { Controller, Get, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppService } from './app.service';
import { HealthService, HealthStatus } from './health/health.service';

export interface EndpointStats {
  hits: number;
  avgResponseTime: number;
  errors: number;
}

export interface ServerMetricsResponse {
  name: string; // Server name (Nest or Go)
  tol: number; // Time of Last update (timestamp)
  status: 'online' | 'degraded' | 'warning' | 'offline'; // Server status
  latency: number; // Current latency in ms
  serverMetrics: {
    cpu: number;
    memory: number;
    uptime: number;
    activeUsers: number;
    requestsPerSecond: number;
  };
  apiPerformance: {
    avgResponseTime: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    endpointStats: Record<string, EndpointStats>;
  };
}

export interface UserMetrics {
  clientInfo: {
    userAgent: string;
    ipAddress: string;
    location?: {
      country: string;
      city?: string;
      latitude?: number;
      longitude?: number;
    };
    browserInfo: {
      name: string;
      version: string;
      platform: string;
    };
  };
  performance: {
    networkLatency: number;
    fps: number;
    pageLoadTime: number;
    memoryUsage?: number;
  };
  activity: {
    clicks: number;
    scrolls: number;
    keypresses: number;
    sessionDuration: number;
    pageViews: number;
  };
  timestamp: number; // When these metrics were collected
}

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly healthService: HealthService
  ) {
    this.logger.log('AppController initialized');
  }

  @Get()
  getHello(): string {
    this.logger.log('Root endpoint accessed');
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): HealthStatus {
    this.logger.log('Health check endpoint accessed');
    return this.healthService.checkHealth();
  }

  @Get('status')
  getApiStatus() {
    return {
      status: 'online',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      server: 'NestJS',
      environment: process.env.NODE_ENV || 'development'
    };
  }

  @Get('status')
  getStatus() {
    return this.getApiStatus();
  }

  @Get('api/metrics/nest')
  getNestMetrics(): ServerMetricsResponse {
    return this.appService.getNestServerMetrics();
  }

  @Get('metrics/nest')
  getNestMetricsLegacy(): ServerMetricsResponse {
    return this.appService.getNestServerMetrics();
  }

  @Get('api/metrics/go')
  getGoMetrics(): Observable<ServerMetricsResponse> {
    return this.appService.getGoServerMetrics();
  }

  @Get('user-metrics')
  getUserMetrics(): UserMetrics {
    return this.appService.getUserMetrics();
  }
}
