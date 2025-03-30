import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { HealthStatus } from './health.service';

/**
 * Mock API service that provides simulated data for local development
 * and when backend services are unavailable
 */
@Injectable({
  providedIn: 'root'
})
export class MockApiService {
  private startupTime = Date.now();

  constructor(private logger: LoggerService) {
    this.logger.registerService('MockApiService');
    this.logger.info('Mock API service initialized - will provide simulated data');
  }

  /**
   * Get mock health status data
   */
  getMockHealthStatus(): Observable<HealthStatus> {
    this.logger.debug('Providing mock health status data');
    
    const mockStatus: HealthStatus = {
      status: 'online',
      uptime: Date.now() - this.startupTime,
      timestamp: Date.now(),
      hostname: 'mock-server',
      version: '1.0.0-mock',
      environment: 'development',
      memory: {
        free: 512 * 1024 * 1024, // 512MB
        total: 1024 * 1024 * 1024, // 1GB
        usage: 50 // 50% usage
      },
      services: {
        database: 'up',
        cache: 'up'
      }
    };
    
    // Add some random variations
    if (Math.random() > 0.8 && mockStatus.memory) {
      mockStatus.memory.usage = 75; // Occasionally show higher memory usage
    }
    
    if (Math.random() > 0.9 && mockStatus.services) {
      mockStatus.services.cache = 'degraded'; // Occasionally show degraded cache
    }
    
    // Simulate network delay
    return of(mockStatus).pipe(
      delay(Math.random() * 200 + 100) // 100-300ms delay
    );
  }
  
  /**
   * Get mock file document data
   */
  getMockDocumentData(filename: string): Observable<any> {
    this.logger.debug('Providing mock document data', { filename });
    
    return of({
      filename,
      content: 'This is mock document content for ' + filename,
      createdAt: new Date().toISOString(),
      size: Math.floor(Math.random() * 1000000) // Random file size
    }).pipe(
      delay(Math.random() * 300 + 200) // 200-500ms delay
    );
  }
  
  /**
   * Get mock API status
   */
  getMockApiStatus(): Observable<any> {
    return of({
      status: 'online',
      message: 'Mock API is running',
      timestamp: new Date().toISOString()
    }).pipe(
      delay(50) // Small delay for realism
    );
  }
  
  /**
   * Helper method to determine if we should use mock data
   * based on connection errors and environment settings
   */
  static shouldUseMockData(connectionErrors: number): boolean {
    // Use mock data after a few connection errors
    return connectionErrors > 2;
  }
}
