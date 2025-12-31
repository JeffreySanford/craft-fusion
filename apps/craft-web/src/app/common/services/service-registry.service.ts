import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggerService } from './logger.service';

export interface ServiceInfo {
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  isConnected: boolean;
  hasError: boolean;
  lastActivity: Date;
  errorCount: number;
  usageCount: number;
  avgResponseTime?: number;
  successRate?: number;
  type: 'http' | 'socket' | 'state' | 'utility' | 'auth' | 'other';
  category: 'core' | 'feature' | 'third-party' | 'deprecated';
}

@Injectable({
  providedIn: 'root',
})
export class ServiceRegistryService {
  private servicesSubject = new BehaviorSubject<ServiceInfo[]>([]);
  private servicesMap = new Map<string, ServiceInfo>();

  // Observable that components can subscribe to for service updates
  public services$ = this.servicesSubject.asObservable();

  constructor(private logger: LoggerService) {
    this.logger.registerService('ServiceRegistryService');
    this.logger.info('ServiceRegistry initialized');
  }

  /**
   * Register a service with the registry
   */
  registerService(serviceInfo: Partial<ServiceInfo> & { name: string }): void {
    // Create a new service info object with defaults for missing properties
    const info: ServiceInfo = {
      description: '',
      status: 'active',
      isConnected: true,
      hasError: false,
      lastActivity: new Date(),
      errorCount: 0,
      usageCount: 0,
      type: 'other',
      category: 'core',
      ...serviceInfo,
    };

    this.servicesMap.set(info.name, info);
    this.updateServices();
    this.logger.debug(`Service registered: ${info.name}`, { type: info.type, category: info.category });
  }

  /**
   * Update service status
   */
  updateServiceStatus(serviceName: string, updates: Partial<ServiceInfo>): void {
    const service = this.servicesMap.get(serviceName);

    if (service) {
      // Update the service info
      const updatedService = {
        ...service,
        ...updates,
        lastActivity: new Date(),
      };

      this.servicesMap.set(serviceName, updatedService);
      this.updateServices();
    } else {
      this.logger.warn(`Attempted to update unknown service: ${serviceName}`);
    }
  }

  /**
   * Record service activity
   */
  recordActivity(serviceName: string, isError: boolean = false, responseTime?: number): void {
    const service = this.servicesMap.get(serviceName);

    if (service) {
      // Update usage and error counts
      service.usageCount++;

      if (isError) {
        service.errorCount++;
        service.hasError = true;
        service.status = 'error';
      }

      // Update average response time if provided
      if (responseTime !== undefined) {
        if (service.avgResponseTime === undefined) {
          service.avgResponseTime = responseTime;
        } else {
          // Calculate running average
          service.avgResponseTime = (service.avgResponseTime * (service.usageCount - 1) + responseTime) / service.usageCount;
        }
      }

      // Calculate success rate
      service.successRate = ((service.usageCount - service.errorCount) / service.usageCount) * 100;

      // Update last activity timestamp
      service.lastActivity = new Date();

      this.updateServices();
    }
  }

  /**
   * Get services by category
   */
  getServicesByCategory(category: string): Observable<ServiceInfo[]> {
    return new BehaviorSubject<ServiceInfo[]>(Array.from(this.servicesMap.values()).filter(service => service.category === category)).asObservable();
  }

  /**
   * Update the services subject with current values
   */
  private updateServices(): void {
    this.servicesSubject.next(Array.from(this.servicesMap.values()));
  }
}
