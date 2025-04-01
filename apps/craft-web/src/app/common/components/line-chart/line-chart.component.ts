import { Component, Input, OnInit, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Chart, registerables, ChartConfiguration, ChartTypeRegistry } from 'chart.js';
import { ThemeService } from '../../services/theme.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

// Register all Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss'],
  standalone: false
})
export class LineChartComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() data: any[] = [];
  @Input() options: any = {};
  @Input() loading = false;
  @Input() error = false;
  @Input() errorMessage = '';
  @Input() showLegend = true;
  
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;
  private chart: Chart | null = null;
  private destroy$ = new Subject<void>();
  
  constructor(private themeService: ThemeService) {}
  
  ngOnInit(): void {
    // Subscribe to theme changes to update chart colors
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateChart();
      });
  }
  
  ngAfterViewInit(): void {
    // Create the chart after the view is initialized
    this.createChart();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    // Update the chart when inputs change
    if ((changes['data'] || changes['options']) && this.chart) {
      this.updateChart();
    }
  }
  
  ngOnDestroy(): void {
    // Clean up resources
    if (this.chart) {
      this.chart.destroy();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private createChart(): void {
    if (!this.chartCanvas) return;
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Get theme-specific colors
    const colors = this.getChartColors();
    
    // Create the chart configuration with proper typings
    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: this.data.map(d => d.label || ''),
        datasets: [{
          label: 'Performance',
          data: this.data.map(d => d.value || 0),
          borderColor: colors.primary,
          backgroundColor: colors.backgroundGradient,
          borderWidth: 2,
          fill: true,
        }]
      },
      options: {
        ...this.options,
        plugins: {
          tooltip: {
            backgroundColor: colors.tooltipBackground,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText,
            borderColor: colors.tooltipBorder,
            borderWidth: 1
          },
          legend: {
            labels: {
              color: colors.text
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: colors.gridColor
            },
            ticks: {
              color: colors.text
            }
          },
          y: {
            grid: {
              color: colors.gridColor
            },
            ticks: {
              color: colors.text
            }
          }
        }
      }
    };
    
    this.chart = new Chart(ctx, config);
  }
  
  private updateChart(): void {
    if (!this.chart) return;
    
    // Update data
    this.chart.data.labels = this.data.map(d => d.label || '');
    this.chart.data.datasets[0].data = this.data.map(d => d.value || 0);
    
    // Update colors based on theme
    const colors = this.getChartColors();
    this.chart.data.datasets[0].borderColor = colors.primary;
    this.chart.data.datasets[0].backgroundColor = colors.backgroundGradient;
    
    // Update and render
    this.chart.update();
  }
  
  private getChartColors(): any {
    // Get current theme-based colors
    const isDarkTheme = document.body.classList.contains('dark-theme');
    
    if (isDarkTheme) {
      return {
        primary: '#4dabf7',
        backgroundGradient: this.createGradient([36, 171, 247, 0.3], [36, 171, 247, 0]),
        tooltipBackground: 'rgba(33, 33, 33, 0.9)',
        tooltipText: '#ffffff',
        tooltipBorder: 'rgba(255, 255, 255, 0.2)',
        text: 'rgba(255, 255, 255, 0.7)',
        gridColor: 'rgba(255, 255, 255, 0.1)'
      };
    }
    
    // Light theme colors
    return {
      primary: '#0050b3',
      backgroundGradient: this.createGradient([0, 80, 179, 0.2], [0, 80, 179, 0]),
      tooltipBackground: 'rgba(255, 255, 255, 0.95)',
      tooltipText: '#333333',
      tooltipBorder: 'rgba(0, 0, 0, 0.1)',
      text: 'rgba(0, 0, 0, 0.7)',
      gridColor: 'rgba(0, 0, 0, 0.1)'
    };
  }
  
  private createGradient(colorStart: number[], colorEnd: number[]): CanvasGradient | string {
    if (!this.chartCanvas) return `rgba(${colorStart.join(',')})`;
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return `rgba(${colorStart.join(',')})`;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, `rgba(${colorStart.join(',')})`);
    gradient.addColorStop(1, `rgba(${colorEnd.join(',')})`);
    
    return gradient;
  }
  
  generateColor(label: string): string {
    // Simple hash function to generate consistent colors based on string
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
      hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate RGB values
    const r = (hash & 0xFF0000) >> 16;
    const g = (hash & 0x00FF00) >> 8;
    const b = hash & 0x0000FF;
    
    return `rgb(${r}, ${g}, ${b})`;
  }
}
