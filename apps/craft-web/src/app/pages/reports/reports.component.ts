import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PerformanceMetricsService, ApiPerformanceSummary, HistoricalDataPoint } from '../../common/services/performance-metrics.service';
import { ThemeService } from '../../common/services/theme.service';
import { LoggerService } from '../../common/services/logger.service';
import { ChartDataItem } from '../../common/components/line-chart/line-chart.component';

// Extend the HistoricalDataPoint with required properties
interface ExtendedHistoricalDataPoint extends HistoricalDataPoint {
  label: string;
  value: number;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  standalone: false
})
export class ReportsComponent implements OnInit, OnDestroy {
  // System metrics
  systemMetrics$: Observable<any>;
  apiPerformance$: Observable<ApiPerformanceSummary>;
  
  // Chart data
  cpuMemoryData: ChartDataItem[] = [];
  apiPerformanceData: ChartDataItem[] = [];
  
  // Analysis data
  systemSummary: any = {};
  apiSummary: ApiPerformanceSummary | null = null;
  
  // Theme & settings
  currentTheme = '';
  refreshInterval = 30000; // 30 seconds
  
  // Destroy subject for cleanup
  private destroy$ = new Subject<void>();
  
  constructor(
    private performanceService: PerformanceMetricsService,
    private themeService: ThemeService,
    private logger: LoggerService
  ) {
    this.systemMetrics$ = this.performanceService.metrics$;
    this.apiPerformance$ = this.performanceService.apiPerformance$;
  }
  
  ngOnInit(): void {
    this.logger.info('Reports component initialized');
    
    this.performanceService.startMetricsSimulation();
    this.performanceService.startFramerateSampling();
    
    this.systemMetrics$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(metrics => {
      this.systemSummary = metrics;
    });
    
    this.apiPerformance$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(performance => {
      this.apiSummary = performance;
    });
    
    this.loadCpuMemoryChart();
    this.loadApiPerformanceChart();
  }
  
  ngOnDestroy(): void {
    this.performanceService.stopFramerateSampling();
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadCpuMemoryChart(): void {
    this.performanceService.getHistoricalData(
      7, 60 // 7 days, 60 min intervals
    ).subscribe(data => {
      // Add label and value properties for each data point
      const preparedData = data.map(item => ({
        ...item,
        label: new Date(item.timestamp).toLocaleTimeString(),
        value: item.cpuUsage
      })) as ExtendedHistoricalDataPoint[];
      
      const cpuData = preparedData.map(item => ({
        label: item.label,
        value: item.value
      }));
      
      const memoryData = preparedData.map(item => ({
        label: item.label,
        value: (item.value * 1.2) % 100 // Create some variation
      }));
      
      // Set chart data
      this.cpuMemoryData = [
        {
          name: 'CPU',
          series: cpuData
        },
        {
          name: 'Memory',
          series: memoryData
        }
      ];
    });
  }

  loadApiPerformanceChart(): void {
    this.performanceService.getHistoricalData(
      3, 30 // 3 days, 30 min intervals
    ).subscribe(data => {
      // Add label and value properties for each data point
      const preparedData = data.map(item => ({
        ...item,
        label: new Date(item.timestamp).toLocaleTimeString(),
        value: Math.floor(Math.random() * 50) + 50 // Random API response time between 50-100ms
      })) as ExtendedHistoricalDataPoint[];
      
      const apiData = preparedData.map(item => ({
        label: item.label,
        value: (item.value * 3) // Scale for response time in ms
      }));
      
      this.apiPerformanceData = [
        {
          name: 'Response Time',
          series: apiData
        },
        {
          name: 'Error Rate',
          series: apiData.map(item => ({
            label: item.label,
            value: item.value * 0.1 // 10% of response time as error rate
          }))
        }
      ];
    });
  }
}
