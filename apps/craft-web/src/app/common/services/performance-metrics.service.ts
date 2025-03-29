import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { LoggerService } from './logger.service';

export interface PerformanceMetrics {
  cpuLoad: string;
  memoryUsage: string;
  networkLatency: string;
  cpuLoadRaw: number;
  memoryUsageRaw: number;
  networkLatencyRaw: number;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceMetricsService {
  private metricsSubject = new BehaviorSubject<PerformanceMetrics>({
    cpuLoad: '0.00%',
    memoryUsage: '0.00%',
    networkLatency: '0.00 ms',
    cpuLoadRaw: 0,
    memoryUsageRaw: 0,
    networkLatencyRaw: 0
  });

  // Expose as Observable
  public metrics$ = this.metricsSubject.asObservable();
  private updateInterval: any = null;
  private simulationActive = false;
  
  constructor(private logger: LoggerService) {
    this.logger.registerService('PerformanceMetricsService');
    this.logger.info('Performance metrics service initialized');
    
    // Start simulation by default
    this.startMetricsSimulation();
  }

  /**
   * Start simulating performance metrics
   */
  startMetricsSimulation(): void {
    if (this.simulationActive) return;
    
    this.simulationActive = true;
    this.logger.info('Starting performance metrics simulation');
    
    // Update metrics every 2 seconds
    this.updateInterval = interval(2000).subscribe(() => {
      this.updateSimulatedMetrics();
    });
    
    // Initial update
    this.updateSimulatedMetrics();
  }

  /**
   * Stop simulating performance metrics
   */
  stopMetricsSimulation(): void {
    if (this.updateInterval) {
      this.updateInterval.unsubscribe();
      this.updateInterval = null;
    }
    this.simulationActive = false;
    this.logger.info('Stopped performance metrics simulation');
  }

  /**
   * Update the performance metrics with simulated values
   */
  private updateSimulatedMetrics(): void {
    // Generate realistic fluctuating values
    const now = Date.now();
    
    // CPU load fluctuates between 30% and 70% with occasional spikes
    const cpuBase = 30 + Math.sin(now / 10000) * 20;
    const cpuSpike = Math.random() > 0.8 ? Math.random() * 30 : 0;
    const cpuLoadRaw = Math.min(100, cpuBase + cpuSpike);
    
    // Memory tends to gradually increase over time
    const memBase = 50 + Math.sin(now / 50000) * 30;
    const memoryUsageRaw = Math.min(100, memBase + (Math.random() * 20));
    
    // Network latency fluctuates with occasional spikes
    const latencyBase = 2 + Math.sin(now / 5000);
    const latencySpike = Math.random() > 0.9 ? Math.random() * 10 : 0;
    const networkLatencyRaw = Math.max(0.5, latencyBase + latencySpike);
    
    const metrics: PerformanceMetrics = {
      cpuLoad: `${cpuLoadRaw.toFixed(2)}%`,
      memoryUsage: `${memoryUsageRaw.toFixed(2)}%`,
      networkLatency: `${networkLatencyRaw.toFixed(2)} ms`,
      cpuLoadRaw,
      memoryUsageRaw,
      networkLatencyRaw
    };
    
    this.metricsSubject.next(metrics);
    this.logger.debug('Updated performance metrics', { metrics });
  }
  
  /**
   * Get current metrics value
   */
  getCurrentMetrics(): PerformanceMetrics {
    return this.metricsSubject.getValue();
  }
}
