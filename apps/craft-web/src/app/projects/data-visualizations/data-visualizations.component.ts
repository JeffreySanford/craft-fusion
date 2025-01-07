import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { BarChartData, ChartData, FintechChartData, LineChartData, MapChartData } from './data-visualizations.interfaces';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-data-visualizations',
  templateUrl: './data-visualizations.component.html',
  styleUrls: ['./data-visualizations.component.scss'],
  standalone: false
})
export class DataVisualizationsComponent implements OnInit {
  isMobile = false;
  expandedTileIndex: number | null = null;

  public barChartData: BarChartData[] = [
    { date: 'January', value1: 150, value2: 200, value3: 180 },
    { date: 'February', value1: 200, value2: 180, value3: 220 },
    { date: 'March', value1: 250, value2: 230, value3: 210 },
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

  public fintechChartData: FintechChartData[] = [
    { task: 'Buy AAPL', startTime: new Date('2024-01-10'), endTime: new Date('2024-01-12'), startValue: 150, endValue: 160, group: 'buy' },
    { task: 'Sell TSLA', startTime: new Date('2024-01-15'), endTime: new Date('2024-01-18'), startValue: 200, endValue: 190, group: 'sell' },
    { task: 'Buy MSFT', startTime: new Date('2024-01-20'), endTime: new Date('2024-01-22'), startValue: 250, endValue: 260, group: 'buy' },
    { task: 'Sell GOOGL', startTime: new Date('2024-01-25'), endTime: new Date('2024-01-28'), startValue: 300, endValue: 290, group: 'sell' },
    { task: 'Buy AMZN', startTime: new Date('2024-02-01'), endTime: new Date('2024-02-03'), startValue: 350, endValue: 360, group: 'buy' },
    { task: 'Sell FB', startTime: new Date('2024-02-05'), endTime: new Date('2024-02-07'), startValue: 400, endValue: 390, group: 'sell' },
    { task: 'Buy NFLX', startTime: new Date('2024-02-10'), endTime: new Date('2024-02-12'), startValue: 450, endValue: 460, group: 'buy' },
    { task: 'Sell NVDA', startTime: new Date('2024-02-15'), endTime: new Date('2024-02-18'), startValue: 500, endValue: 490, group: 'sell' },
    { task: 'Buy BABA', startTime: new Date('2024-02-20'), endTime: new Date('2024-02-22'), startValue: 550, endValue: 560, group: 'buy' },
    { task: 'Sell TSM', startTime: new Date('2024-02-25'), endTime: new Date('2024-02-28'), startValue: 600, endValue: 590, group: 'sell' },
    { task: 'Buy V', startTime: new Date('2024-03-01'), endTime: new Date('2024-03-03'), startValue: 650, endValue: 660, group: 'buy' },
    { task: 'Sell MA', startTime: new Date('2024-03-05'), endTime: new Date('2024-03-07'), startValue: 700, endValue: 690, group: 'sell' },
    { task: 'Buy JPM', startTime: new Date('2024-03-10'), endTime: new Date('2024-03-12'), startValue: 750, endValue: 760, group: 'buy' },
    { task: 'Sell BAC', startTime: new Date('2024-03-15'), endTime: new Date('2024-03-18'), startValue: 800, endValue: 790, group: 'sell' },
    { task: 'Buy WMT', startTime: new Date('2024-03-20'), endTime: new Date('2024-03-22'), startValue: 850, endValue: 860, group: 'buy' },
    { task: 'Extreme Event', startTime: new Date('2024-03-25'), endTime: new Date('2024-03-26'), startValue: 900, endValue: 880, group: 'extreme' }
  ];

  public mapChartData: MapChartData[] = [
    { name: 'Restaurant A', coordinates: [40.7128, -74.0060], city: 'New York', state: 'NY' },
    { name: 'Restaurant B', coordinates: [34.0522, -118.2437], city: 'Los Angeles', state: 'CA' },
    { name: 'Restaurant C', coordinates: [41.8781, -87.6298], city: 'Chicago', state: 'IL' },
  ];

  public charts: ChartData[] = [
    { name: 'Line Chart', component: 'app-line-chart', color: 'blue', data: this.lineChartData },
    { name: 'Bar Chart', component: 'app-bar-chart', color: 'green', data: this.barChartData },
    { name: 'FinTech Chart', component: 'app-fintech-chart', color: 'red', data: this.fintechChartData },
    { name: 'Map Chart', component: 'app-map-chart', color: 'purple', data: this.mapChartData }
  ];

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }

  openTile(index: number) {
    this.expandedTileIndex = this.expandedTileIndex === index ? null : index;
  }

  drop(event: CdkDragDrop<ChartData[]>) {
    moveItemInArray(this.charts, event.previousIndex, event.currentIndex);
    // Save the new order to the state if needed
  }
}
