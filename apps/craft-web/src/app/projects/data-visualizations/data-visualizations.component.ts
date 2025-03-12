import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { BarChartData, LineChartData, MapChartData, ChartData } from './data-visualizations.interfaces';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Observable, Subscription, forkJoin, of } from 'rxjs';
import { YahooService } from '../../common/services/yahoo.service';
import moment from 'moment';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-data-visualizations',
  templateUrl: './data-visualizations.component.html',
  styleUrls: ['./data-visualizations.component.scss'],
  standalone: false,
})
export class DataVisualizationsComponent implements OnInit {
  isMobile = false;
  expandedTileIndex: number | null = null;

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

  public charts: ChartData[] = [
    { name: 'Line Chart', component: 'app-line-chart', color: 'blue', data: this.lineChartData, size: 'small' },
    { name: 'Bar Chart', component: 'app-bar-chart', color: 'green', data: this.barChartData, size: 'small' },
    { name: 'Quantum Fisher Information', component: 'app-quantum-fisher-tile', color: 'purple', data: [], size: 'medium' },
    { name: 'FinTech Chart', component: 'app-finance-chart', color: 'red', data: [], size: 'medium' },
    { name: 'Fire Alert Chart', component: 'app-fire-alert', color: 'orange', data: [], size: 'small' },
  ];

  public fintechChartData: any[] = [];
  financeData: any;

  constructor(private breakpointObserver: BreakpointObserver, private cdr: ChangeDetectorRef, private yahooService: YahooService) {
    this.loadFintechChartData()
      .pipe()
      .subscribe(data => {
        this.fintechChartData = data;
        this.charts[3].data = this.fintechChartData;
        this.cdr.detectChanges();
      });
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

  openTile(index: number) {
    // Make sure the quantum visualization reinitializes when its tile is opened
    this.expandedTileIndex = this.expandedTileIndex === index ? null : index;

    // If opening the quantum tile, trigger window resize event to ensure D3 visualization renders properly
    if (this.expandedTileIndex !== null && this.charts[this.expandedTileIndex].component === 'app-quantum-fisher-tile') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
  }

  drop(event: CdkDragDrop<ChartData[]>) {
    moveItemInArray(this.charts, event.previousIndex, event.currentIndex);
    // Save the new order to the state if needed
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
}
