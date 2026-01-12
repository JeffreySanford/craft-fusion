import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { BarChartData, LineChartData, ChartData } from './data-visualizations.interfaces';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Observable, of } from 'rxjs';
import { YahooService, HistoricalData } from '../../common/services/yahoo.service';
import { catchError } from 'rxjs/operators';
import { MatIconRegistry } from '@angular/material/icon';
import { ChartLayoutService } from './services/chart-layout.service';
import { SocketClientService } from '../../common/services/socket-client.service';
import { LoggerService } from '../../common/services/logger.service';

@Component({
  selector: 'app-data-visualizations',
  templateUrl: './data-visualizations.component.html',
  styleUrls: ['./data-visualizations.component.scss'],
  standalone: false,
})
export class DataVisualizationsComponent implements OnInit, OnDestroy {
  isMobile = false;
  isSidebarCollapsed = false;
  availableChartsView: 'list' | 'tiles' = 'list';
  expandedTileIndex: number | null = null;
  fullExpandedTileIndex: number | null = null;                                          

  displayedCharts: ExtendedChartData[] = [];
  availableCharts: ExtendedChartData[] = [];
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

  public allCharts: ExtendedChartData[] = [
    { name: 'Line Chart', component: 'app-line-chart', color: 'dodgerblue', data: this.lineChartData, size: 'medium', active: true, displayMode: 'tile' },
    { name: 'Bar Chart', component: 'app-bar-chart', color: 'limegreen', data: this.barChartData, size: 'medium', active: true, displayMode: 'tile' },
    { name: 'Financial Technologies', component: 'app-finance-chart', color: 'tomato', data: [], size: 'medium', active: false, displayMode: 'tile' },
    { name: 'Fire Alert Chart', component: 'app-fire-alert', color: 'orange', data: [], size: 'large', active: false, displayMode: 'fullscreen' },
  ];

  public fintechChartData: HistoricalData[] = [];
  financeData: unknown;

  tileWidth: number = 0;
  tileHeight: number = 0;
  resizeObserver: ResizeObserver | null = null;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private cdr: ChangeDetectorRef,
    private yahooService: YahooService,
    private iconRegistry: MatIconRegistry,
    private chartLayoutService: ChartLayoutService,
    private socketClient: SocketClientService,
    private logger: LoggerService,
  ) {
    this.logger.info('DataVisualizationsComponent instantiated', { suppressConsole: true });

    this.registerIcons();

    this.availableCharts = [...this.allCharts];

    this.loadFintechChartData()
      .pipe()
      .subscribe((data: HistoricalData[]) => {
        this.fintechChartData = data;

        const financeChartIndex = this.availableCharts.findIndex(c => c.component === 'app-finance-chart');
        if (financeChartIndex !== -1) {
          const chart = this.availableCharts.at(financeChartIndex);
          if (chart) chart.data = this.fintechChartData as any[];
        }

        const displayedFinanceIndex = this.displayedCharts.findIndex(c => c.component === 'app-finance-chart');
        if (displayedFinanceIndex !== -1) {
          const chart = this.displayedCharts.at(displayedFinanceIndex);
          if (chart) chart.data = this.fintechChartData as any[];
        }

        setTimeout(() => this.cdr.detectChanges());
      });

    this.socketClient.on<any>('yahoo:data').subscribe((data: any) => {

      this.fintechChartData = Array.isArray(data) ? (data as HistoricalData[]) : [];
      setTimeout(() => this.cdr.detectChanges());
    });

  }

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
      setTimeout(() => this.cdr.detectChanges());
    });

    this.setupResizeObserver();

    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);

    this.allCharts.forEach(chart => {

      if (chart.component === 'app-line-chart' || chart.component === 'app-bar-chart') {
        chart.active = true;
      } else {
        chart.active = false;
      }

      if (!chart.size) {
        chart.size = 'medium';
      }

      if (!chart.displayMode) {
        chart.displayMode = 'tile';
      }

      if (!chart.position) {
        chart.position = 0;
      }

      chart.chartClass = this.chartLayoutService.calculateChartClass(chart.component);
    });

    this.displayedCharts = this.allCharts.filter(chart => chart.active);
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    document.body.style.overflow = '';
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          if (entry.contentBoxSize) {

            const contentBoxSize = Array.isArray(entry.contentBoxSize) ? entry.contentBoxSize[0] : entry.contentBoxSize;

            this.tileWidth = contentBoxSize.inlineSize;
            this.tileHeight = contentBoxSize.blockSize;
          } else {

            this.tileWidth = entry.contentRect.width;
            this.tileHeight = entry.contentRect.height;
          }
          this.cdr.detectChanges();
        }
      });

      setTimeout(() => {
        const container = document.querySelector('.visualization-container');
        if (container) {
          this.resizeObserver!.observe(container);
        }
      }, 200);
    }
  }

  getTileDimensions(chart: ChartData): { width: number; height: number } {
    const baseHeight = chart.size === 'small' ? 250 : chart.size === 'large' ? 450 : 350;

    return {
      width: 0,                                   
      height: baseHeight,
    };
  }

  isChartActive(chart: ChartData): boolean {
    return this.displayedCharts.some(c => c.component === chart.component);
  }

  toggleChart(chart: ChartData, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.isChartActive(chart)) {
      this.removeTile(chart);
    } else {
      this.addTile(chart);
    }

    setTimeout(() => {
      this.updateListItemStyles();
    });
  }

  hasRoomForMoreTiles(newTile: ChartData): boolean {
    if (!newTile || !newTile.size) {
      console.warn('Invalid tile data provided to hasRoomForMoreTiles');
      return false;
    }

    const largeCount = this.displayedCharts.filter(c => c.size === 'large').length;
    const mediumCount = this.displayedCharts.filter(c => c.size === 'medium').length;
    const smallCount = this.displayedCharts.filter(c => c.size === 'small').length;

    console.log(`Checking space - Current tile counts: ${largeCount} large, ${mediumCount} medium, ${smallCount} small`);
    console.log(`Attempting to add: ${newTile.name} (${newTile.size})`);

    if (largeCount > 0) {

      if (largeCount >= 2) {

        return false;
      }
      if (newTile.size !== 'large') {

        return false;
      }
      return true;                               
    }

    if (newTile.size === 'large' && (mediumCount > 0 || smallCount > 0)) {
      return false;                                           
    }

    if (newTile.size === 'medium') {

      if (mediumCount >= 4) {
        return false;
      }

      if (mediumCount >= 2 && smallCount >= 1) {
        return false;
      }

      if (smallCount >= 3) {
        return false;
      }

      return true;
    }

    if (newTile.size === 'small') {

      if (smallCount >= 6) {
        return false;
      }

      if (mediumCount === 2 && smallCount >= 2) {
        return false;
      }

      if (mediumCount >= 3) {
        return false;
      }

      return true;
    }

    return false;                                  
  }

  getChartClasses(chart: ChartData): string {

    return this.calculateChartClass(chart.component);
  }

  addTile(chart: ChartData): void {
    console.log('Adding tile:', chart.name, chart.size);

    this.ensureRoomForTile(chart);

    const chartCopy = { ...chart } as ExtendedChartData;

    chartCopy.chartClass = this.chartLayoutService.calculateChartClass(chartCopy.component);

    if (chartCopy.size === 'large') {
      this.displayedCharts.unshift(chartCopy);
    } else {
      this.displayedCharts.push(chartCopy);
    }

    this.optimizeChartLayout();

    if ((chartCopy as ExtendedChartData).displayMode === 'fullscreen') {
      setTimeout(() => {
        const index = this.displayedCharts.findIndex(c => c.component === chartCopy.component);
        if (index !== -1) {
          this.expandedTileIndex = null;
          this.fullExpandedTile(index);
        }
      }, 200);
      return;
    }

    setTimeout(() => {
      this.resizeCharts();
    }, 150);
  }

  private ensureRoomForTile(newTile: ChartData): void {
    if (this.hasRoomForMoreTiles(newTile)) {
      return;
    }

    while (this.displayedCharts.length > 0 && !this.hasRoomForMoreTiles(newTile)) {
      const removed = this.displayedCharts[this.displayedCharts.length - 1];
      if (!removed) break;
      console.log(`Auto-removed tile to make space: ${removed.name}`);
      this.removeTile(removed, undefined, false);
    }

    if (!this.hasRoomForMoreTiles(newTile)) {
      console.warn('No room after trimming tiles; clearing layout to add the requested tile.');
      this.displayedCharts = [];
      this.expandedTileIndex = null;
      this.fullExpandedTileIndex = null;
      document.body.style.overflow = '';
    }
  }

  private optimizeChartLayout(): void {
    this.displayedCharts = this.chartLayoutService.optimizeChartLayout(this.displayedCharts);
  }

  removeTile(chart: ChartData, event?: MouseEvent, triggerResize: boolean = true): void {
    if (event) {
      event.stopPropagation();
    }

    const index = this.displayedCharts.findIndex(c => c.component === chart.component);
    if (index !== -1) {
      console.log(`Removing tile: ${chart.name}, index: ${index}`);
      this.displayedCharts.splice(index, 1);
      if (this.expandedTileIndex !== null) {
        if (index === this.expandedTileIndex) {
          this.expandedTileIndex = null;
        } else if (index < this.expandedTileIndex) {
          this.expandedTileIndex -= 1;
        }
      }

      if (this.fullExpandedTileIndex !== null) {
        if (index === this.fullExpandedTileIndex) {
          this.fullExpandedTileIndex = null;
          document.body.style.overflow = '';
        } else if (index < this.fullExpandedTileIndex) {
          this.fullExpandedTileIndex -= 1;
        }
      }
      setTimeout(() => this.cdr.detectChanges());

      if (triggerResize) {
        setTimeout(() => {
          this.resizeCharts();
        }, 150);
      }
    }
  }

  openTile(index: number) {

    this.expandedTileIndex = this.expandedTileIndex === index ? null : index;

    if (this.expandedTileIndex !== null) {
      setTimeout(() => {
        this.resizeCharts();
      }, 150);
    }
  }

  drop(event: CdkDragDrop<ExtendedChartData[]>) {
    moveItemInArray(this.displayedCharts, event.previousIndex, event.currentIndex);
    setTimeout(() => this.cdr.detectChanges());

    setTimeout(() => {
      this.resizeCharts();
    }, 150);
  }

  getIconForChart(chart: ChartData): string {
    switch (chart.component) {
      case 'app-line-chart':
        return 'show_chart';
      case 'app-bar-chart':
        return 'bar_chart';
      case 'app-finance-chart':
        return 'trending_up';
      case 'app-fire-alert':
        return 'warning';
      default:
        return 'widgets';
    }
  }

  private loadFintechChartData(): Observable<HistoricalData[]> {
    const stockSymbols = ['AAPL', 'GOOGL', 'MSFT'];                                    

    return this.yahooService.getHistoricalData(stockSymbols, '1d', '1y').pipe(
      catchError(error => {
        console.error(`Error loading data for ${stockSymbols}:`, error);
        return of([] as HistoricalData[]);
      }),
    );
  }

  getTileSize(size: string | undefined): string {
    return `size-${size || 'medium'}`;
  }

  private registerIcons(): void {

    this.iconRegistry.setDefaultFontSetClass('material-icons');

    const matIconsUrl = 'https://fonts.googleapis.com/icon?family=Material+Icons';

    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = matIconsUrl;
    document.head.appendChild(linkEl);

    this.iconRegistry.registerFontClassAlias('material-icons');
  }

  updateListItemStyles(): void {

    setTimeout(() => {
      const listItems = document.querySelectorAll('.visualization-sidebar mat-list-item');

      listItems.forEach((item, index) => {
        const chart = this.availableCharts.at(index);
        if (!chart) return;                                                
        if (this.isChartActive(chart)) {
          const c = chart as ExtendedChartData;

          (item as HTMLElement).style.borderLeftColor = c.color;
          (item as HTMLElement).style.color = c.color;

          (item as HTMLElement).style.boxShadow = `0 0 10px rgba(${this.hexToRgb(c.color)}, 0.3)`;

          item.classList.add('active');

          const icons = item.querySelectorAll('mat-icon');
          icons.forEach(icon => {
            (icon as HTMLElement).style.color = chart.color;
            (icon as HTMLElement).style.filter = `drop-shadow(0 0 5px ${chart.color})`;
          });

          const titleText = item.querySelector('[matListItemTitle]');
          if (titleText) {
            (titleText as HTMLElement).style.color = chart.color;
            (titleText as HTMLElement).style.textShadow = `0 0 5px rgba(${this.hexToRgb(chart.color)}, 0.5)`;
          }
        } else {

          item.classList.remove('active');
          (item as HTMLElement).style.borderLeftColor = 'transparent';
          (item as HTMLElement).style.color = '';
          (item as HTMLElement).style.boxShadow = '';

          const icons = item.querySelectorAll('mat-icon');
          icons.forEach(icon => {
            (icon as HTMLElement).style.color = '';
            (icon as HTMLElement).style.filter = '';
          });

          const titleText = item.querySelector('[matListItemTitle]');
          if (titleText) {
            (titleText as HTMLElement).style.color = '';
            (titleText as HTMLElement).style.textShadow = '';
          }
        }
      });
    });
  }

  private hexToRgb(hex: string = '#000000'): string {
    if (!hex || typeof hex !== 'string') hex = '#000000';

    const cleaned = hex.startsWith('#') ? hex.slice(1) : hex;

    const full =
      cleaned.length === 3
        ? cleaned
            .split('')
            .map(c => c + c)
            .join('')
        : cleaned.padEnd(6, '0').slice(0, 6);

    const r = parseInt(full.substring(0, 2), 16) || 0;
    const g = parseInt(full.substring(2, 4), 16) || 0;
    const b = parseInt(full.substring(4, 6), 16) || 0;

    return `${r}, ${g}, ${b}`;
  }

  ngAfterViewInit() {

    this.updateListItemStyles();

    setTimeout(() => {

      document.querySelectorAll('mat-icon').forEach(icon => {
        icon.classList.add('material-icons');
      });
    }, 100);
  }

  toggleVisualizationSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    setTimeout(() => this.cdr.detectChanges());

    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }

  toggleAvailableChartsView(): void {
    this.availableChartsView = this.availableChartsView === 'list' ? 'tiles' : 'list';
    setTimeout(() => this.cdr.detectChanges());

    if (this.availableChartsView === 'list') {
      this.updateListItemStyles();
    }
  }

  resizeCharts(): void {

    this.cdr.detectChanges();

    window.dispatchEvent(new Event('resize'));

    this.cdr.detectChanges();

    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      this.cdr.detectChanges();
    }, 100);
  }

  getChartClass(chart: ExtendedChartData): string {
    if (!chart.chartClass) {

      chart.chartClass = this.chartLayoutService.calculateChartClass(chart.component);
    }

    return chart.chartClass;
  }

  private calculateChartClass(componentType: string): string {
    return this.chartLayoutService.calculateChartClass(componentType);
  }

  handleTileClick(index: number, event: MouseEvent): void {

    if (
      (event.target as HTMLElement).closest('button') ||
      (event.target as HTMLElement).closest('mat-slider') ||
      (event.target as HTMLElement).closest('mat-checkbox') ||
      (event.target as HTMLElement).closest('mat-select')
    ) {
      return;
    }

    if (this.fullExpandedTileIndex !== null) {
      return;
    }

    if (this.expandedTileIndex === index) {
      this.fullExpandedTile(index);
    } else {

      this.openTile(index);
    }
  }

  openFullScreen(index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.fullExpandedTileIndex === index) {
      return;
    }
    this.fullExpandedTile(index);
  }

  fullExpandedTile(index: number): void {
    this.fullExpandedTileIndex = index;

    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      this.resizeCharts();
    }, 300);
  }

  restoreTile(_index: number, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    this.fullExpandedTileIndex = null;

    document.body.style.overflow = '';

    setTimeout(() => {
      this.resizeCharts();
    }, 300);
  }

  handleBackdropClick(event: MouseEvent): void {

    if ((event.target as HTMLElement).classList.contains('fullscreen-backdrop')) {
      this.restoreTile(this.fullExpandedTileIndex!);
    }
  }

  getTileClasses(chart: ExtendedChartData, index: number): string {
    const classes = [this.getTileSize(chart.size)];

    if (chart.component === 'app-line-chart') classes.push('chart-type-line');
    if (chart.component === 'app-bar-chart') classes.push('chart-type-bar');
    if (chart.component === 'app-finance-chart') classes.push('chart-type-finance');

    if (this.expandedTileIndex === index) classes.push('expanded');
    if (this.fullExpandedTileIndex === index) classes.push('full-expanded');

    if (chart.size === 'small') {
      if (chart.position === 0) classes.push('small-tile-first-row');
      if (chart.position === 1) classes.push('small-tile-first-row');
      if (chart.position === 2) classes.push('small-tile-third');
      if (chart.position && chart.position > 2) classes.push('small-tile-other');
    }

    if (chart.specialLayout) {
      classes.push(chart.specialLayout);
    }

    if (chart.specialPosition) {
      classes.push('special-position');
    }

    if (chart.specialRow) {
      classes.push(chart.specialRow);
    }

    return classes.join(' ');
  }
}

export interface ExtendedChartData extends ChartData {
  chartClass?: string;                                        
  position?: number;                              
  specialPosition?: boolean;                                
  specialLayout?: string;                                    
  specialRow?: string;                                                        
}
