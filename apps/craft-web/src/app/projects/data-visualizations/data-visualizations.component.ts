import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { BarChartData, FintechChartData, LineChartData, MapChartData, ChartData } from './data-visualizations.interfaces';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

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
    { month: 'January', values: [{ label: 'value1', amount: 150 }, { label: 'value2', amount: 200 }, { label: 'value3', amount: 180 }] },
    { month: 'February', values: [{ label: 'value1', amount: 200 }, { label: 'value2', amount: 180 }, { label: 'value3', amount: 220 }] },
    { month: 'March', values: [{ label: 'value1', amount: 250 }, { label: 'value2', amount: 230 }, { label: 'value3', amount: 210 }] },
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
    { task: 'Buy AAPL', startTime: new Date('2024-01-10'), endTime: new Date('2024-01-12'), startValue: 150, endValue: 155, group: 'buy', stockIndicator: 'AAPL', trade: 'buy' },
    { task: 'Sell TSLA', startTime: new Date('2024-01-15'), endTime: new Date('2024-01-18'), startValue: 200, endValue: 195, group: 'sell', stockIndicator: 'TSLA', trade: 'sell' },
    { task: 'Buy MSFT', startTime: new Date('2024-01-20'), endTime: new Date('2024-01-22'), startValue: 250, endValue: 255, group: 'buy', stockIndicator: 'MSFT', trade: 'buy' },
    { task: 'Sell GOOGL', startTime: new Date('2024-01-25'), endTime: new Date('2024-01-28'), startValue: 300, endValue: 295, group: 'sell', stockIndicator: 'GOOGL', trade: 'sell' },
    { task: 'Buy AMZN', startTime: new Date('2024-02-01'), endTime: new Date('2024-02-03'), startValue: 350, endValue: 355, group: 'buy', stockIndicator: 'AMZN', trade: 'buy' },
    { task: 'Sell FB', startTime: new Date('2024-02-05'), endTime: new Date('2024-02-07'), startValue: 400, endValue: 395, group: 'sell', stockIndicator: 'FB', trade: 'sell' },
    { task: 'Buy NFLX', startTime: new Date('2024-02-10'), endTime: new Date('2024-02-12'), startValue: 450, endValue: 455, group: 'buy', stockIndicator: 'NFLX', trade: 'buy' },
    { task: 'Sell NVDA', startTime: new Date('2024-02-15'), endTime: new Date('2024-02-18'), startValue: 500, endValue: 495, group: 'sell', stockIndicator: 'NVDA', trade: 'sell' },
    { task: 'Buy BABA', startTime: new Date('2024-02-20'), endTime: new Date('2024-02-22'), startValue: 550, endValue: 555, group: 'buy', stockIndicator: 'BABA', trade: 'buy' },
    { task: 'Sell TSM', startTime: new Date('2024-02-25'), endTime: new Date('2024-02-28'), startValue: 600, endValue: 595, group: 'sell', stockIndicator: 'TSM', trade: 'sell' },
    { task: 'Buy V', startTime: new Date('2024-03-01'), endTime: new Date('2024-03-03'), startValue: 650, endValue: 655, group: 'buy', stockIndicator: 'V', trade: 'buy' },
    { task: 'Sell MA', startTime: new Date('2024-03-05'), endTime: new Date('2024-03-07'), startValue: 700, endValue: 695, group: 'sell', stockIndicator: 'MA', trade: 'sell' },
    { task: 'Buy JPM', startTime: new Date('2024-03-10'), endTime: new Date('2024-03-12'), startValue: 750, endValue: 755, group: 'buy', stockIndicator: 'JPM', trade: 'buy' },
    { task: 'Sell BAC', startTime: new Date('2024-03-15'), endTime: new Date('2024-03-18'), startValue: 800, endValue: 795, group: 'sell', stockIndicator: 'BAC', trade: 'sell' },
    { task: 'Buy WMT', startTime: new Date('2024-03-20'), endTime: new Date('2024-03-22'), startValue: 850, endValue: 855, group: 'buy', stockIndicator: 'WMT', trade: 'buy' },
    { task: 'Extreme Event 1', startTime: new Date('2024-03-25'), endTime: new Date('2024-03-26'), startValue: 900, endValue: 400, group: 'extreme', stockIndicator: 'EXT1', trade: 'extreme' },
    { task: 'Extreme Event 2', startTime: new Date('2024-04-01'), endTime: new Date('2024-04-02'), startValue: 1000, endValue: 400, group: 'extreme', stockIndicator: 'EXT2', trade: 'extreme' },
    { task: 'Extreme Event 3', startTime: new Date('2024-04-05'), endTime: new Date('2024-04-06'), startValue: 1100, endValue: 500, group: 'extreme', stockIndicator: 'EXT3', trade: 'extreme' },
    { task: 'Extreme Event 4', startTime: new Date('2024-04-10'), endTime: new Date('2024-04-11'), startValue: 1200, endValue: 600, group: 'extreme', stockIndicator: 'EXT4', trade: 'extreme' },
    { task: 'Extreme Event 5', startTime: new Date('2024-04-15'), endTime: new Date('2024-04-16'), startValue: 1300, endValue: 700, group: 'extreme', stockIndicator: 'EXT5', trade: 'extreme' },
    { task: 'Extreme Event 6', startTime: new Date('2024-04-20'), endTime: new Date('2024-04-21'), startValue: 1400, endValue: 800, group: 'extreme', stockIndicator: 'EXT6', trade: 'extreme' },
    { task: 'Extreme Event 7', startTime: new Date('2024-04-25'), endTime: new Date('2024-04-26'), startValue: 1500, endValue: 900, group: 'extreme', stockIndicator: 'EXT7', trade: 'extreme' },
    { task: 'Extreme Event 8', startTime: new Date('2024-05-01'), endTime: new Date('2024-05-02'), startValue: 1600, endValue: 1000, group: 'extreme', stockIndicator: 'EXT8', trade: 'extreme' },
    { task: 'Extreme Event 9', startTime: new Date('2024-05-05'), endTime: new Date('2024-05-06'), startValue: 1700, endValue: 1100, group: 'extreme', stockIndicator: 'EXT9', trade: 'extreme' },
    { task: 'Extreme Event 10', startTime: new Date('2024-05-10'), endTime: new Date('2024-05-11'), startValue: 1800, endValue: 1200, group: 'extreme', stockIndicator: 'EXT10', trade: 'extreme' }
  ];

  public mapChartData: MapChartData[] = [
    { name: 'Restaurant A', coordinates: [40.7128, -74.006], city: 'New York', state: 'NY' },
    { name: 'Restaurant B', coordinates: [34.0522, -118.2437], city: 'Los Angeles', state: 'CA' },
    { name: 'Restaurant C', coordinates: [41.8781, -87.6298], city: 'Chicago', state: 'IL' },
  ];

  public charts: ChartData[] = [
    { name: 'Line Chart', component: 'app-line-chart', color: 'blue', data: this.lineChartData },
    { name: 'Bar Chart', component: 'app-bar-chart', color: 'green', data: this.barChartData },
    { name: 'FinTech Chart', component: 'app-fintech-chart', color: 'red', data: this.fintechChartData },
    { name: 'Map Chart', component: 'app-map-chart', color: 'purple', data: this.mapChartData },
  ];

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;

      // Mark the top 10% and bottom 10% trades as extreme
      const sortedData = [...this.fintechChartData].sort((a, b) => a.endValue - a.startValue - (b.endValue - b.startValue));
      const extremeCount = Math.ceil(this.fintechChartData.length * 0.1);

      sortedData.slice(0, extremeCount).forEach(d => (d.group = 'extreme'));
      sortedData.slice(-extremeCount).forEach(d => (d.group = 'extreme'));
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
