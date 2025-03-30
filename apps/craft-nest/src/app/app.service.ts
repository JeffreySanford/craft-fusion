import { Injectable, Logger } from '@nestjs/common';
import { ServerMetricsResponse, UserMetrics } from './app.controller';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';

interface SafeEnvironmentVars {
  [key: string]: string | undefined;
}

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private goServerUrl = 'http://localhost:4000'; // Example URL for the Go server

  constructor(private readonly httpService: HttpService) {
    this.logger.log('AppService initialized');
    this.logEnvironmentDetails();
  }

  getHello(): string {
    this.logger.log('Hello endpoint accessed');
    return 'Hello from Craft Fusion NestJS API!';
  }

  getData(): { message: string } {
    this.logger.log('Nest server data requested');
    return { message: 'Hello API' };
  }

  getNestServerMetrics(): ServerMetricsResponse {
    this.logger.log('Nest server metrics requested');
    // Collect and return Nest server metrics
    return {
      name: 'Nest Server',
      tol: Date.now(),
      status: this.calculateServerStatus(65, 75, 120), // CPU, memory, latency values
      latency: 120,
      serverMetrics: {
        cpu: 65,
        memory: 75,
        uptime: 3600 * 24 * 2 + 3600 * 5, // 2 days and 5 hours in seconds
        activeUsers: 42,
        requestsPerSecond: 17,
      },
      apiPerformance: {
        avgResponseTime: 120,
        totalRequests: 15674,
        successfulRequests: 15520,
        failedRequests: 154,
        endpointStats: {
          '/api/users': { hits: 5234, avgResponseTime: 95, errors: 27 },
          '/api/products': { hits: 4521, avgResponseTime: 135, errors: 64 },
          '/api/orders': { hits: 3811, avgResponseTime: 210, errors: 41 },
          '/api/metrics': { hits: 2108, avgResponseTime: 38, errors: 22 },
        }
      }
    };
  }

  getGoServerMetrics(): Observable<ServerMetricsResponse> {
    this.logger.log('Go server metrics requested');
    
    return this.httpService.get<any>(`${this.goServerUrl}/metrics`).pipe(
      timeout(5000), // 5 second timeout
      map(response => {
        const data = response.data;
        
        // Transform the data to match our interface structure
        return {
          name: 'Go Server',
          tol: Date.now(),
          status: this.calculateServerStatus(data.cpu || 45, data.memory || 60, data.latency || 85),
          latency: data.latency || 85,
          serverMetrics: {
            cpu: data.cpu || 45,
            memory: data.memory || 60,
            uptime: data.uptime || 3600 * 24 * 5, // 5 days in seconds
            activeUsers: data.activeUsers || 37,
            requestsPerSecond: data.rps || 22,
          },
          apiPerformance: {
            avgResponseTime: data.avgResponseTime || 85,
            totalRequests: data.totalRequests || 18932,
            successfulRequests: data.successfulRequests || 18830,
            failedRequests: data.failedRequests || 102,
            endpointStats: data.endpointStats || {
              '/api/auth': { hits: 6243, avgResponseTime: 65, errors: 18 },
              '/api/data': { hits: 7821, avgResponseTime: 95, errors: 51 },
              '/api/status': { hits: 4868, avgResponseTime: 42, errors: 33 },
            }
          }
        } as ServerMetricsResponse;
      }),
      catchError((err: AxiosError) => {
        this.logger.error('Failed to fetch Go server metrics', err.message);
        // If Go server is unavailable, return a default offline status
        return of({
          name: 'Go Server',
          tol: Date.now(),
          status: 'offline',
          latency: 0,
          serverMetrics: {
            cpu: 0,
            memory: 0,
            uptime: 0,
            activeUsers: 0,
            requestsPerSecond: 0,
          },
          apiPerformance: {
            avgResponseTime: 0,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            endpointStats: {}
          }
        } as ServerMetricsResponse);
      })
    );
  }

  getUserMetrics(): UserMetrics {
    this.logger.log('User metrics requested');
    // In a real app, this would come from the client
    return {
      clientInfo: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        ipAddress: '192.168.1.105',
        location: {
          country: 'United States',
          city: 'New York',
          latitude: 40.7128,
          longitude: -74.0060
        },
        browserInfo: {
          name: 'Chrome',
          version: '91.0.4472.124',
          platform: 'Windows'
        }
      },
      performance: {
        networkLatency: 125,
        fps: 58,
        pageLoadTime: 1250,
        memoryUsage: 85
      },
      activity: {
        clicks: 24,
        scrolls: 17,
        keypresses: 146,
        sessionDuration: 720,
        pageViews: 5
      },
      timestamp: Date.now()
    };
  }

  private calculateServerStatus(
    cpuUsage: number,
    memoryUsage: number,
    latency: number
  ): 'online' | 'degraded' | 'warning' | 'offline' {
    if (cpuUsage === 0 && memoryUsage === 0 && latency === 0) {
      return 'offline';
    } else if (cpuUsage > 90 || memoryUsage > 90 || latency > 300) {
      return 'warning';
    } else if (cpuUsage > 70 || memoryUsage > 80 || latency > 200) {
      return 'degraded';
    }
    return 'online';
  }

  private logEnvironmentDetails(): void {
    this.logger.log(`Application running in ${process.env.NODE_ENV || 'development'} mode`);
    this.logger.log(`Node.js version: ${process.version}`);
    this.logger.log(`Process ID: ${process.pid}`);
    
    // Log available memory
    const totalMemory = Math.round(process.memoryUsage().heapTotal / 1024 / 1024);
    this.logger.log(`Total heap memory: ${totalMemory} MB`);
    
    // Log environment variables (excluding sensitive ones)
    const safeEnvVars: SafeEnvironmentVars = Object.keys(process.env)
      .filter(key => 
        !key.toLowerCase().includes('secret') && 
        !key.toLowerCase().includes('password') &&
        !key.toLowerCase().includes('token')
      )
      .reduce((obj: SafeEnvironmentVars, key: string) => {
        if (key.startsWith('npm_') || key.startsWith('_')) return obj;
        obj[key] = process.env[key];
        return obj;
      }, {});
      
    this.logger.debug('Environment variables:', safeEnvVars);
  }
}
