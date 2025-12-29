import { Injectable, Logger } from '@nestjs/common';
import * as os from 'os';
import { BehaviorSubject, Observable, interval, timer, combineLatest, of } from 'rxjs';
import { map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';

export interface SystemMetrics {
  uptime: number;
  memory: {
    total: number;
    free: number;
    used: number;
    usage: number;
  };
  cpu: {
    loadAvg: number[];
    usage: number;
  };
  process: {
    pid: number;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
  };
  timestamp: number;
}

interface ServiceStatus {
  name: string;
  status: boolean;
  responseTime?: number;
}

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthData {
  status: HealthStatus;
  services: Record<string, boolean>;
  uptime: number;
  version: string;
  metrics?: SystemMetrics;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private startTime: number = Date.now();
  
  // Use BehaviorSubject to store and emit service status changes
  private servicesSubject = new BehaviorSubject<Record<string, boolean>>({
    api: true,
    database: true,
    cache: true,
    storage: true
  });

  // Create a hot observable for services status
  public readonly services$ = this.servicesSubject.asObservable();

  // Create a hot observable for system metrics that emits every 5 seconds
  private readonly systemMetrics$ = interval(5000).pipe(
    startWith(0),
    map(() => this.getSystemMetrics()),
    shareReplay(1)
  );
  
  // Create a hot observable for health status that combines services and uptime
  private readonly healthStatus$ = this.services$.pipe(
    map(services => {
      const allServicesUp = Object.values(services).every(status => status === true);
      const someServicesUp = Object.values(services).some(status => status === true);

      let status: HealthStatus;
      if (allServicesUp) {
        status = 'healthy';
      } else if (someServicesUp) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        status,
        services,
        uptime: Math.floor((Date.now() - this.startTime) / 1000), // Uptime in seconds
        version: process.env.npm_package_version || '1.0.0'
      };
    }),
    shareReplay(1)
  );

  constructor() {
    this.logger.log('HealthService initialized');
  }

  getHealthStatus(): Observable<HealthData> {
    return combineLatest([
      this.healthStatus$,
      this.systemMetrics$
    ]).pipe(
      map(([health, metrics]) => ({
        ...health,
        metrics
      })),
      shareReplay(1)
    );
  }

  getHealth(): Observable<{ status: HealthStatus, services: Record<string, boolean>, uptime: number, version: string }> {
    return this.healthStatus$;
  }

  getSystemMetrics(): SystemMetrics {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    return {
      uptime: os.uptime(),
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        usage: Math.floor((usedMem / totalMem) * 100)
      },
      cpu: {
        loadAvg: os.loadavg(),
        usage: this.calculateCpuUsage()
      },
      process: {
        pid: process.pid,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      },
      timestamp: Date.now()
    };
  }
  
  private calculateCpuUsage(): number {
    // This is a simplified calculation
    const loadAvg = os.loadavg()[0]; // 1-minute load average
    const cpus = os.cpus().length;
    
    return Math.min(100, Math.floor((loadAvg / cpus) * 100));
  }
  
  checkServices(): Observable<ServiceStatus[]> {
    return this.services$.pipe(
      map(services => 
        Object.entries(services).map(([name, status]) => ({
          name,
          status,
          responseTime: Math.random() * 100 // Simulated response time
        }))
      )
    );
  }
  
  getMetricsStream(intervalMs: number = 5000): Observable<SystemMetrics> {
    // Return a new stream with the requested interval
    return interval(intervalMs).pipe(
      startWith(0),
      map(() => this.getSystemMetrics()),
      shareReplay(1)
    );
  }
  
  updateServiceStatus(serviceName: string, isUp: boolean): void {
    const currentServices = this.servicesSubject.getValue();
    if (serviceName in currentServices) {
      const updatedServices = { 
        ...currentServices, 
        [serviceName]: isUp 
      };
      this.servicesSubject.next(updatedServices);
      this.logger.log(`Service ${serviceName} status updated to ${isUp ? 'up' : 'down'}`);
    }
  }
}
