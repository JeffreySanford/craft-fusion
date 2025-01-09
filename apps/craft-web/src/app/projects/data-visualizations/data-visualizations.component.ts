import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { BarChartData, ChartData, FintechChartData, LineChartData, MapChartData } from './data-visualizations.interfaces';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DataVisualizationService } from './data-visualizations.service';

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
    {
      stockIndicator: 'GOOGL',
      task: 'Buy GOOGL',
      startTime: new Date('2023-01-01'),
      endTime: new Date('2023-01-03'),
      startValue: 1450,
      endValue: 1500,
      group: 'buy',
      trade: 'buy',
    },
    {
      stockIndicator: 'AMZN',
      task: 'Sell AMZN',
      startTime: new Date('2023-01-05'),
      endTime: new Date('2023-01-07'),
      startValue: 3100,
      endValue: 3050,
      group: 'sell',
      trade: 'sell',
    },
    { stockIndicator: 'BAH', task: 'Buy BAH', startTime: new Date('2023-01-10'), endTime: new Date('2023-01-12'), startValue: 80, endValue: 85, group: 'buy', trade: 'buy' },
    { stockIndicator: 'ACN', task: 'Sell ACN', startTime: new Date('2023-01-15'), endTime: new Date('2023-01-18'), startValue: 220, endValue: 215, group: 'sell', trade: 'sell' },
    {
      stockIndicator: 'GOOGL',
      task: 'Buy GOOGL',
      startTime: new Date('2023-01-20'),
      endTime: new Date('2023-01-22'),
      startValue: 1500,
      endValue: 1550,
      group: 'buy',
      trade: 'buy',
    },
    {
      stockIndicator: 'AMZN',
      task: 'Sell AMZN',
      startTime: new Date('2023-01-25'),
      endTime: new Date('2023-01-28'),
      startValue: 3050,
      endValue: 3000,
      group: 'sell',
      trade: 'sell',
    },
    { stockIndicator: 'BAH', task: 'Buy BAH', startTime: new Date('2023-02-01'), endTime: new Date('2023-02-03'), startValue: 85, endValue: 90, group: 'buy', trade: 'buy' },
    { stockIndicator: 'ACN', task: 'Sell ACN', startTime: new Date('2023-02-05'), endTime: new Date('2023-02-07'), startValue: 215, endValue: 210, group: 'sell', trade: 'sell' },
    {
      stockIndicator: 'GOOGL',
      task: 'Buy GOOGL',
      startTime: new Date('2023-02-10'),
      endTime: new Date('2023-02-12'),
      startValue: 1550,
      endValue: 1600,
      group: 'buy',
      trade: 'buy',
    },
    {
      stockIndicator: 'AMZN',
      task: 'Sell AMZN',
      startTime: new Date('2023-02-15'),
      endTime: new Date('2023-02-18'),
      startValue: 3000,
      endValue: 2950,
      group: 'sell',
      trade: 'sell',
    },
    { stockIndicator: 'BAH', task: 'Buy BAH', startTime: new Date('2023-02-20'), endTime: new Date('2023-02-22'), startValue: 90, endValue: 95, group: 'buy', trade: 'buy' },
    { stockIndicator: 'ACN', task: 'Sell ACN', startTime: new Date('2023-02-25'), endTime: new Date('2023-02-28'), startValue: 210, endValue: 205, group: 'sell', trade: 'sell' },
    {
      stockIndicator: 'GOOGL',
      task: 'Buy GOOGL',
      startTime: new Date('2023-03-01'),
      endTime: new Date('2023-03-03'),
      startValue: 1600,
      endValue: 1650,
      group: 'buy',
      trade: 'buy',
    },
    {
      stockIndicator: 'AMZN',
      task: 'Sell AMZN',
      startTime: new Date('2023-03-05'),
      endTime: new Date('2023-03-07'),
      startValue: 2950,
      endValue: 2900,
      group: 'sell',
      trade: 'sell',
    },
    { stockIndicator: 'BAH', task: 'Buy BAH', startTime: new Date('2023-03-10'), endTime: new Date('2023-03-12'), startValue: 95, endValue: 100, group: 'buy', trade: 'buy' },
    { stockIndicator: 'ACN', task: 'Sell ACN', startTime: new Date('2023-03-15'), endTime: new Date('2023-03-18'), startValue: 205, endValue: 200, group: 'sell', trade: 'sell' },
    {
      stockIndicator: 'GOOGL',
      task: 'Buy GOOGL',
      startTime: new Date('2023-03-20'),
      endTime: new Date('2023-03-22'),
      startValue: 1650,
      endValue: 1700,
      group: 'buy',
      trade: 'buy',
    },
    {
      stockIndicator: 'AMZN',
      task: 'Sell AMZN',
      startTime: new Date('2023-03-25'),
      endTime: new Date('2023-03-26'),
      startValue: 2900,
      endValue: 2850,
      group: 'sell',
      trade: 'sell',
    },
    {
      stockIndicator: 'GOOGL',
      task: 'Buy GOOGL',
      startTime: new Date('2024-01-01'),
      endTime: new Date('2024-01-03'),
      startValue: 1700,
      endValue: 1750,
      group: 'buy',
      trade: 'buy',
    },
    {
      stockIndicator: 'AMZN',
      task: 'Sell AMZN',
      startTime: new Date('2024-01-05'),
      endTime: new Date('2024-01-07'),
      startValue: 3200,
      endValue: 3150,
      group: 'sell',
      trade: 'sell',
    },
    { stockIndicator: 'BAH', task: 'Buy BAH', startTime: new Date('2024-01-10'), endTime: new Date('2024-01-12'), startValue: 100, endValue: 105, group: 'buy', trade: 'buy' },
    { stockIndicator: 'ACN', task: 'Sell ACN', startTime: new Date('2024-01-15'), endTime: new Date('2024-01-18'), startValue: 230, endValue: 225, group: 'sell', trade: 'sell' },
    {
      stockIndicator: 'GOOGL',
      task: 'Buy GOOGL',
      startTime: new Date('2024-01-20'),
      endTime: new Date('2024-01-22'),
      startValue: 1750,
      endValue: 1800,
      group: 'buy',
      trade: 'buy',
    },
    {
      stockIndicator: 'AMZN',
      task: 'Sell AMZN',
      startTime: new Date('2024-01-25'),
      endTime: new Date('2024-01-28'),
      startValue: 3150,
      endValue: 3100,
      group: 'sell',
      trade: 'sell',
    },
    { stockIndicator: 'BAH', task: 'Buy BAH', startTime: new Date('2024-02-01'), endTime: new Date('2024-02-03'), startValue: 105, endValue: 110, group: 'buy', trade: 'buy' },
    { stockIndicator: 'ACN', task: 'Sell ACN', startTime: new Date('2024-02-05'), endTime: new Date('2024-02-07'), startValue: 225, endValue: 220, group: 'sell', trade: 'sell' },
    {
      stockIndicator: 'GOOGL',
      task: 'Buy GOOGL',
      startTime: new Date('2024-02-10'),
      endTime: new Date('2024-02-12'),
      startValue: 1800,
      endValue: 1850,
      group: 'buy',
      trade: 'buy',
    },
    {
      stockIndicator: 'AMZN',
      task: 'Sell AMZN',
      startTime: new Date('2024-02-15'),
      endTime: new Date('2024-02-18'),
      startValue: 3100,
      endValue: 3050,
      group: 'sell',
      trade: 'sell',
    },
    { stockIndicator: 'BAH', task: 'Buy BAH', startTime: new Date('2024-02-20'), endTime: new Date('2024-02-22'), startValue: 110, endValue: 115, group: 'buy', trade: 'buy' },
    { stockIndicator: 'ACN', task: 'Sell ACN', startTime: new Date('2024-02-25'), endTime: new Date('2024-02-28'), startValue: 220, endValue: 215, group: 'sell', trade: 'sell' },
    {
      stockIndicator: 'GOOGL',
      task: 'Buy GOOGL',
      startTime: new Date('2024-03-01'),
      endTime: new Date('2024-03-03'),
      startValue: 1850,
      endValue: 1900,
      group: 'buy',
      trade: 'buy',
    },
    {
      stockIndicator: 'AMZN',
      task: 'Sell AMZN',
      startTime: new Date('2024-03-05'),
      endTime: new Date('2024-03-07'),
      startValue: 3050,
      endValue: 3000,
      group: 'sell',
      trade: 'sell',
    },
    { stockIndicator: 'BAH', task: 'Buy BAH', startTime: new Date('2024-03-10'), endTime: new Date('2024-03-12'), startValue: 115, endValue: 120, group: 'buy', trade: 'buy' },
    { stockIndicator: 'ACN', task: 'Sell ACN', startTime: new Date('2024-03-15'), endTime: new Date('2024-03-18'), startValue: 215, endValue: 210, group: 'sell', trade: 'sell' },
    {
      stockIndicator: 'GOOGL',
      task: 'Buy GOOGL',
      startTime: new Date('2024-03-20'),
      endTime: new Date('2024-03-22'),
      startValue: 1900,
      endValue: 1950,
      group: 'buy',
      trade: 'buy',
    },
    {
      stockIndicator: 'AMZN',
      task: 'Sell AMZN',
      startTime: new Date('2024-03-25'),
      endTime: new Date('2024-03-26'),
      startValue: 3000,
      endValue: 2950,
      group: 'sell',
      trade: 'sell',
    },
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

  constructor(private breakpointObserver: BreakpointObserver, private fintechService: DataVisualizationService) {}

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
      const starttime = new Date('2020-01-01').getTime() / 1000;
      const endtime = new Date().getTime() / 1000;
      const stocks = ['AAPL', 'GOOGL', 'AMZN', 'BAH', 'ACN'];

      stocks.forEach(stock => {
        this.loadStockData(stock, 'D', starttime, endtime);
      });

      const sortedData = [...this.fintechChartData].sort((a, b) => a.endValue - a.startValue - (b.endValue - b.startValue));
      const extremeCount = Math.ceil(this.fintechChartData.length * 0.1);

      sortedData.slice(0, extremeCount).forEach(d => (d.group = 'extreme'));
      sortedData.slice(-extremeCount).forEach(d => (d.group = 'extreme'));
    });
  }

  loadStockData(symbol: string, resolution: string, from: number, to: number): void {
    this.fintechService.getStockData(symbol, resolution, from, to).subscribe({
      next: (data) => {
        console.log(data);
        debugger // Log raw data for debugging
        this.fintechChartData = data;
      },
      error: (err) => console.error('Error fetching stock data:', err),
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
