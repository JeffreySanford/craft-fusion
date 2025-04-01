import { Component, Input, OnInit, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface ChartDataItem {
  name: string;  // Add the name property that was missing
  series: Array<{
    label: string;
    value: number;
  }>;
  color?: string; // Add optional color property
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss'],
  standalone: false
})
export class LineChartComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() data: ChartDataItem[] = [];
  @Input() height: number = 300;
  @Input() xAxisLabel: string = '';
  @Input() yAxisLabel: string = '';
  @Input() showLegend: boolean = true;
  @Input() animate: boolean = true;
  @Input() colorScheme: string[] = [
    '#002868', // Navy Blue - Primary patriotic color
    '#BF0A30', // Red - Secondary patriotic color
    '#FFD700', // Gold - Accent patriotic color
    '#4682B4', // Steel Blue
    '#E40032', // Bright Red
    '#0A3161', // Deep Navy
    '#FFBF00'  // Rich Gold
  ];

  @ViewChild('chartContainer') chartContainer!: ElementRef;

  private destroy$ = new Subject<void>();
  
  // Chart configuration
  chartData: any[] = [];
  chartOptions: any;
  currentTheme: string = 'light-theme';
  
  constructor(private themeService: ThemeService) {}
  
  ngOnInit(): void {
    this.setupTheme();
    this.processData();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.processData();
    }
  }
  
  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Process input data for chart display
   */
  private processData(): void {
    // Implementation will depend on your charting library
    if (!this.data || this.data.length === 0) return;
    
    this.chartData = this.data.map((item, index) => {
      return {
        name: item.name,
        data: item.series,
        color: item.color || this.colorScheme[index % this.colorScheme.length]
      };
    });
  }
  
  /**
   * Setup theme subscription
   */
  private setupTheme(): void {
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        this.currentTheme = theme;
        this.renderChart();
      });
  }
  
  /**
   * Render chart with current data and theme
   */
  private renderChart(): void {
    if (!this.chartContainer || !this.chartData.length) return;
    
    // Chart rendering implementation would go here
    // This would call a charting library like Chart.js or D3
    
    console.log('Chart rendered with theme:', this.currentTheme);
    console.log('Chart data:', this.chartData);
  }
  
  /**
   * Generate a color for a data item
   * @param label Data item label
   * @returns A color from the color scheme
   */
  generateColor(label: string): string {
    // Simple hash function to determine color
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
      hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % this.colorScheme.length;
    return this.colorScheme[index];
  }
}
