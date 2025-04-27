import { Controller, Get } from '@nestjs/common';
import { 
  HealthCheckResult, 
  HealthIndicatorResult, 
  HealthCheck, 
  HealthIndicatorStatus
} from '@nestjs/terminus';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(
    private healthService: HealthService
  ) {}

  @Get()
  @HealthCheck()
  check(): Observable<HealthCheckResult> {
    return this.healthService.getHealth().pipe(
      map(health => {
        // Create a properly formatted HealthIndicatorResult object
        const servicesStatus: HealthIndicatorResult = {};
        
        // Format each service with the required status property
        Object.entries(health.services).forEach(([key, value]) => {
          servicesStatus[key] = {
            status: value ? 'up' : 'down' as HealthIndicatorStatus 
          };
        });
        
        // For errors, create a properly formatted HealthIndicatorResult
        const errorResult: HealthIndicatorResult | undefined = 
          health.status !== 'healthy' 
            ? {
                system: {
                  status: 'down' as HealthIndicatorStatus,
                  message: `Some services are ${health.status}`
                }
              } 
            : undefined;
        
        // Return the properly typed result
        const result: HealthCheckResult = {
          status: health.status === 'healthy' ? 'ok' : 'error',
          info: servicesStatus,
          error: errorResult,
          details: servicesStatus
        };
        
        return result;
      })
    );
  }

  @Get('detailed')
  getDetailedHealth(): Observable<any> {
    return this.healthService.getHealthStatus();
  }
}
