import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { BarChartData, LineChartData, MapChartData, ChartData } from './data-visualizations.interfaces';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Observable, Subscription, forkJoin, of } from 'rxjs';
import { YahooService } from '../../common/services/yahoo.service';
import moment from 'moment';
import { catchError } from 'rxjs/operators';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { SidebarStateService } from '../../common/services/sidebar-state.service';

@Component({
  selector: 'app-data-visualizations',
  templateUrl: './data-visualizations.component.html',
  styleUrls: ['./data-visualizations.component.scss'],
  standalone: false,
})
export class DataVisualizationsComponent implements OnInit, OnDestroy {
  isMobile = false;
  isSidebarCollapsed = false;
  expandedTileIndex: number | null = null;
  
  // Track displayed and available charts
  displayedCharts: ChartData[] = [];
  availableCharts: ChartData[] = [];
  private sidebarSubscription: Subscription;

  public barChartData: BarChartData[] = [
    {
      month: 'January',
      values: [
        { label: 'value1', amount: 150 },
        { label: 'value2', amount: 200 },
        { label: 'value3', amount: 180 },
      ],
    },
    {
      month: 'February',
      values: [
        { label: 'value1', amount: 200 },
        { label: 'value2', amount: 180 },
        { label: 'value3', amount: 220 },
      ],
    },
    {
      month: 'March',
      values: [
        { label: 'value1', amount: 250 },
        { label: 'value2', amount: 230 },
        { label: 'value3', amount: 210 },
      ],
    },
  ];

  public lineChartData: LineChartData[] = [
    { date: new Date('2024-01-01'), series1: 500, series2: 3000, series3: 7000 },
    { date: new Date('2024-02-01'), series1: 1500, series2: 6200, series3: 6800 },
    { date: new Date('2024-03-01'), series1: 5800, series2: 6400, series3: 7200 },
    { date: new Date('2024-04-01'), series1: 6000, series2: 6600, series3: 7400 },
    { date: new Date('2024-05-01'), series1: 6200, series2: 6800, series3: 7600 },
    { date: new Date('2024-06-01'), series1: 6400, series2: 7000, series3: 7800 },
    { date: new Date('2024-07-01'), series1: 6600, series2: 7200, series3: 8000 },
    { date: new Date('2024-08-01'), series1: 6800, series2: 7400, series3: 8200 },
    { date: new Date('2024-09-01'), series1: 7000, series2: 7600, series3: 8400 },
    { date: new Date('2024-10-01'), series1: 7200, series2: 7800, series3: 8600 },
    { date: new Date('2024-11-01'), series1: 7400, series2: 8000, series3: 8800 },
    { date: new Date('2024-12-01'), series1: 7600, series2: 8200, series3: 9000 },
  ];

  // Master list of all chart data
  public allCharts: ChartData[] = [
    { name: 'Line Chart', component: 'app-line-chart', color: 'dodgerblue', data: this.lineChartData, size: 'small' },
    { name: 'Bar Chart', component: 'app-bar-chart', color: 'limegreen', data: this.barChartData, size: 'small' },
    { name: 'Quantum Fisher Information', component: 'app-quantum-fisher-tile', color: 'mediumpurple', data: [], size: 'medium' },
    { name: 'FinTech Chart', component: 'app-finance-chart', color: 'tomato', data: [], size: 'medium' },
    { name: 'Fire Alert Chart', component: 'app-fire-alert', color: 'orange', data: [], size: 'small' },
  ];

  public fintechChartData: any[] = [];
  financeData: any;

  constructor(
    private breakpointObserver: BreakpointObserver, 
    private cdr: ChangeDetectorRef, 
    private yahooService: YahooService,
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
    private sidebarStateService: SidebarStateService
  ) {
    // Register icons - this ensures Material icons are available
    this.registerIcons();
    
    // Initialize available and displayed charts
    this.availableCharts = [...this.allCharts];
    
    // By default, only show the Fire Alert tile
    const fireAlertIndex = this.availableCharts.findIndex(chart => chart.component === 'app-fire-alert');
    if (fireAlertIndex !== -1) {
      this.displayedCharts = [this.availableCharts[fireAlertIndex]];
    }
    
    this.loadFintechChartData()
      .pipe()
      .subscribe(data => {
        this.fintechChartData = data;
        
        // Update finance chart data in both arrays
        const financeChartIndex = this.availableCharts.findIndex(c => c.component === 'app-finance-chart');
        if (financeChartIndex !== -1) {
          this.availableCharts[financeChartIndex].data = this.fintechChartData;
        }
        
        const displayedFinanceIndex = this.displayedCharts.findIndex(c => c.component === 'app-finance-chart');
        if (displayedFinanceIndex !== -1) {
          this.displayedCharts[displayedFinanceIndex].data = this.fintechChartData;
        }
        
        this.cdr.detectChanges();
      });

    // Subscribe to sidebar state changes
    this.sidebarSubscription = this.sidebarStateService.isCollapsed$.subscribe(
      isCollapsed => {
        this.isSidebarCollapsed = isCollapsed;
        this.cdr.detectChanges();
      }
    );
  }

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
      this.cdr.detectChanges();
    });

    // Ensure charts render properly by triggering resize after init
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }

  ngOnDestroy() {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }

  // Check if a chart is currently displayed
  isChartActive(chart: ChartData): boolean {
    return this.displayedCharts.some(c => c.component === chart.component);
  }

  // Toggle a chart between displayed and not displayed
  toggleChart(chart: ChartData, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.isChartActive(chart)) {
      this.removeTile(chart);
    } else {
      this.addTile(chart);
    }
    
    // Update all list items to have proper styling
    setTimeout(() => {
      this.updateListItemStyles();
    });
  }

  // Add a tile to the main display
  addTile(chart: ChartData): void {
    // Clone the chart to avoid reference issues
    const chartCopy = { ...chart };
    this.displayedCharts.push(chartCopy);
    this.cdr.detectChanges();
    
    // Ensure proper rendering with slight delay to allow DOM updates
    setTimeout(() => {
      this.resizeCharts();
    }, 150);
  }

  // Remove a tile from the main display
  removeTile(chart: ChartData, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    
    const index = this.displayedCharts.findIndex(c => c.component === chart.component);
    if (index !== -1) {
      this.displayedCharts.splice(index, 1);
      this.cdr.detectChanges();
      
      // Trigger resize for remaining charts
      setTimeout(() => {
        this.resizeCharts();
      }, 150);
    }
  }

  openTile(index: number) {
    // Toggle expanded state
    this.expandedTileIndex = this.expandedTileIndex === index ? null : index;

    // Ensure visualization renders properly when expanded
    if (this.expandedTileIndex !== null) {
      setTimeout(() => {
        this.resizeCharts();
      }, 150);
    }
  }

  drop(event: CdkDragDrop<ChartData[]>) {
    moveItemInArray(this.displayedCharts, event.previousIndex, event.currentIndex);
    this.cdr.detectChanges();
    
    // Resize charts after reordering
    setTimeout(() => {
      this.resizeCharts();
    }, 150);
  }

  // Get an appropriate icon for each chart type
  getIconForChart(chart: ChartData): string {
    switch (chart.component) {
      case 'app-line-chart': return 'show_chart';
      case 'app-bar-chart': return 'bar_chart';
      case 'app-finance-chart': return 'trending_up';
      case 'app-fire-alert': return 'warning';
      case 'app-quantum-fisher-tile': return 'science';
      default: return 'widgets';
    }
  }

  private loadFintechChartData(): Observable<any> {
    const stockSymbols = ['AAPL', 'GOOGL', 'MSFT']; // Add more stock symbols as needed
    const endDate = moment().format('YYYY-MM-DD');
    const startDate = moment().subtract(1, 'years').format('YYYY-MM-DD');

    return this.yahooService.getHistoricalData(stockSymbols, '1d', '1y').pipe(
      catchError(error => {
        console.error(`Error loading data for ${stockSymbols}:`, error);
        return of([]);
      }),
    );
  }

  // Add method to handle tile size classes
  getTileSize(size: string): string {
    return `size-${size || 'medium'}`;
  }

  // Register Material Icons
  private registerIcons(): void {
    // This ensures that Material icons are properly loaded
    this.iconRegistry.setDefaultFontSetClass('material-icons');
  }

  // Add method to update list item styles
  updateListItemStyles(): void {
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      const listItems = document.querySelectorAll('.visualization-sidebar mat-list-item');
      
      listItems.forEach((item, index) => {
        const chart = this.availableCharts[index];
        if (this.isChartActive(chart)) {
          (item as HTMLElement).style.borderLeftColor = chart.color;
        } else {
          (item as HTMLElement).style.borderLeftColor = '';
        }
      });
    });
  }
  
  ngAfterViewInit() {
    // Initialize list item styles after view is initialized
    this.updateListItemStyles();
    
    // ...existing code...
  }

  toggleVisualizationSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    this.cdr.detectChanges();
    
    // Ensure proper rendering
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }

  // New method to trigger resize on all charts
  resizeCharts(): void {
    window.dispatchEvent(new Event('resize'));
  }
}
