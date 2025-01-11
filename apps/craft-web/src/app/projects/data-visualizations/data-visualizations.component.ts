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
    { task: 'Buy LOL', startTime: new Date('2020-01-10'), endTime: new Date('2020-01-12'), startValue: 100, endValue: 105, group: 'normal', stockIndicator: 'LOL', trade: 'buy' },
    { task: 'Sell OMG', startTime: new Date('2020-02-15'), endTime: new Date('2020-02-18'), startValue: 110, endValue: 108, group: 'normal', stockIndicator: 'OMG', trade: 'sell' },
    { task: 'Buy WTF', startTime: new Date('2020-03-20'), endTime: new Date('2020-03-22'), startValue: 115, endValue: 120, group: 'normal', stockIndicator: 'WTF', trade: 'buy' },
    { task: 'Sell BBQ', startTime: new Date('2020-04-25'), endTime: new Date('2020-04-28'), startValue: 125, endValue: 123, group: 'normal', stockIndicator: 'BBQ', trade: 'sell' },
    { task: 'Buy ROFL', startTime: new Date('2020-05-01'), endTime: new Date('2020-05-03'), startValue: 130, endValue: 135, group: 'normal', stockIndicator: 'ROFL', trade: 'buy' },
    { task: 'Sell LOL', startTime: new Date('2020-06-05'), endTime: new Date('2020-06-07'), startValue: 140, endValue: 138, group: 'normal', stockIndicator: 'LOL', trade: 'sell' },
    { task: 'Buy OMG', startTime: new Date('2020-07-10'), endTime: new Date('2020-07-12'), startValue: 145, endValue: 150, group: 'normal', stockIndicator: 'OMG', trade: 'buy' },
    { task: 'Sell WTF', startTime: new Date('2020-08-15'), endTime: new Date('2020-08-18'), startValue: 150, endValue: 148, group: 'normal', stockIndicator: 'WTF', trade: 'sell' },
    { task: 'Buy BBQ', startTime: new Date('2020-09-20'), endTime: new Date('2020-09-22'), startValue: 140, endValue: 120, group: 'normal', stockIndicator: 'BBQ', trade: 'buy' }, // Q3 dip
    { task: 'Sell ROFL', startTime: new Date('2020-10-25'), endTime: new Date('2020-10-28'), startValue: 130, endValue: 128, group: 'normal', stockIndicator: 'ROFL', trade: 'sell' },
    { task: 'Buy LOL', startTime: new Date('2020-11-01'), endTime: new Date('2020-11-03'), startValue: 135, endValue: 140, group: 'normal', stockIndicator: 'LOL', trade: 'buy' },
    { task: 'Sell OMG', startTime: new Date('2020-12-05'), endTime: new Date('2020-12-07'), startValue: 145, endValue: 143, group: 'normal', stockIndicator: 'OMG', trade: 'sell' },
    { task: 'Buy WTF', startTime: new Date('2021-01-10'), endTime: new Date('2021-01-12'), startValue: 150, endValue: 155, group: 'normal', stockIndicator: 'WTF', trade: 'buy' },
    { task: 'Sell BBQ', startTime: new Date('2021-02-15'), endTime: new Date('2021-02-18'), startValue: 140, endValue: 138, group: 'normal', stockIndicator: 'BBQ', trade: 'sell' },
    { task: 'Buy ROFL', startTime: new Date('2021-03-20'), endTime: new Date('2021-03-22'), startValue: 145, endValue: 150, group: 'normal', stockIndicator: 'ROFL', trade: 'buy' },
    { task: 'Sell LOL', startTime: new Date('2021-04-25'), endTime: new Date('2021-04-28'), startValue: 150, endValue: 148, group: 'normal', stockIndicator: 'LOL', trade: 'sell' },
    { task: 'Buy OMG', startTime: new Date('2021-05-01'), endTime: new Date('2021-05-03'), startValue: 140, endValue: 145, group: 'normal', stockIndicator: 'OMG', trade: 'buy' },
    { task: 'Sell WTF', startTime: new Date('2021-06-05'), endTime: new Date('2021-06-07'), startValue: 145, endValue: 143, group: 'normal', stockIndicator: 'WTF', trade: 'sell' },
    { task: 'Buy BBQ', startTime: new Date('2021-07-10'), endTime: new Date('2021-07-12'), startValue: 150, endValue: 155, group: 'normal', stockIndicator: 'BBQ', trade: 'buy' },
    { task: 'Sell ROFL', startTime: new Date('2021-08-15'), endTime: new Date('2021-08-18'), startValue: 140, endValue: 138, group: 'normal', stockIndicator: 'ROFL', trade: 'sell' },
    { task: 'Buy LOL', startTime: new Date('2021-09-20'), endTime: new Date('2021-09-22'), startValue: 130, endValue: 110, group: 'normal', stockIndicator: 'LOL', trade: 'buy' }, // Q3 dip
    { task: 'Sell OMG', startTime: new Date('2021-10-25'), endTime: new Date('2021-10-28'), startValue: 120, endValue: 118, group: 'normal', stockIndicator: 'OMG', trade: 'sell' },
    { task: 'Buy WTF', startTime: new Date('2021-11-01'), endTime: new Date('2021-11-03'), startValue: 125, endValue: 130, group: 'normal', stockIndicator: 'WTF', trade: 'buy' },
    { task: 'Sell BBQ', startTime: new Date('2021-12-05'), endTime: new Date('2021-12-07'), startValue: 135, endValue: 133, group: 'normal', stockIndicator: 'BBQ', trade: 'sell' },
    { task: 'Buy ROFL', startTime: new Date('2022-01-10'), endTime: new Date('2022-01-12'), startValue: 140, endValue: 145, group: 'normal', stockIndicator: 'ROFL', trade: 'buy' },
    { task: 'Sell LOL', startTime: new Date('2022-02-15'), endTime: new Date('2022-02-18'), startValue: 145, endValue: 143, group: 'normal', stockIndicator: 'LOL', trade: 'sell' },
    { task: 'Buy OMG', startTime: new Date('2022-03-20'), endTime: new Date('2022-03-22'), startValue: 140, endValue: 145, group: 'normal', stockIndicator: 'OMG', trade: 'buy' },
    { task: 'Sell WTF', startTime: new Date('2022-04-25'), endTime: new Date('2022-04-28'), startValue: 145, endValue: 143, group: 'normal', stockIndicator: 'WTF', trade: 'sell' },
    { task: 'Buy BBQ', startTime: new Date('2022-05-01'), endTime: new Date('2022-05-03'), startValue: 150, endValue: 155, group: 'normal', stockIndicator: 'BBQ', trade: 'buy' },
    { task: 'Sell ROFL', startTime: new Date('2022-06-05'), endTime: new Date('2022-06-07'), startValue: 140, endValue: 138, group: 'normal', stockIndicator: 'ROFL', trade: 'sell' },
    { task: 'Buy LOL', startTime: new Date('2022-07-10'), endTime: new Date('2022-07-12'), startValue: 130, endValue: 135, group: 'normal', stockIndicator: 'LOL', trade: 'buy' },
    { task: 'Sell OMG', startTime: new Date('2022-08-15'), endTime: new Date('2022-08-18'), startValue: 135, endValue: 133, group: 'normal', stockIndicator: 'OMG', trade: 'sell' },
    { task: 'Buy WTF', startTime: new Date('2022-09-20'), endTime: new Date('2022-09-22'), startValue: 140, endValue: 120, group: 'normal', stockIndicator: 'WTF', trade: 'buy' }, // Q3 dip
    { task: 'Sell BBQ', startTime: new Date('2022-10-25'), endTime: new Date('2022-10-28'), startValue: 130, endValue: 128, group: 'normal', stockIndicator: 'BBQ', trade: 'sell' },
    { task: 'Buy ROFL', startTime: new Date('2022-11-01'), endTime: new Date('2022-11-03'), startValue: 135, endValue: 140, group: 'normal', stockIndicator: 'ROFL', trade: 'buy' },
    { task: 'Sell LOL', startTime: new Date('2022-12-05'), endTime: new Date('2022-12-07'), startValue: 140, endValue: 138, group: 'normal', stockIndicator: 'LOL', trade: 'sell' },
    { task: 'Buy OMG', startTime: new Date('2023-01-10'), endTime: new Date('2023-01-12'), startValue: 145, endValue: 150, group: 'normal', stockIndicator: 'OMG', trade: 'buy' },
    { task: 'Sell WTF', startTime: new Date('2023-02-15'), endTime: new Date('2023-02-18'), startValue: 150, endValue: 148, group: 'normal', stockIndicator: 'WTF', trade: 'sell' },
    { task: 'Buy BBQ', startTime: new Date('2023-03-20'), endTime: new Date('2023-03-22'), startValue: 140, endValue: 145, group: 'normal', stockIndicator: 'BBQ', trade: 'buy' },
    { task: 'Sell ROFL', startTime: new Date('2023-04-25'), endTime: new Date('2023-04-28'), startValue: 145, endValue: 143, group: 'normal', stockIndicator: 'ROFL', trade: 'sell' },
    { task: 'Buy LOL', startTime: new Date('2023-05-01'), endTime: new Date('2023-05-03'), startValue: 150, endValue: 155, group: 'normal', stockIndicator: 'LOL', trade: 'buy' },
    { task: 'Sell OMG', startTime: new Date('2023-06-05'), endTime: new Date('2023-06-07'), startValue: 140, endValue: 138, group: 'normal', stockIndicator: 'OMG', trade: 'sell' },
    { task: 'Buy WTF', startTime: new Date('2023-07-10'), endTime: new Date('2023-07-12'), startValue: 145, endValue: 150, group: 'normal', stockIndicator: 'WTF', trade: 'buy' },
    { task: 'Sell BBQ', startTime: new Date('2023-08-15'), endTime: new Date('2023-08-18'), startValue: 150, endValue: 148, group: 'normal', stockIndicator: 'BBQ', trade: 'sell' },
    { task: 'Buy ROFL', startTime: new Date('2023-09-20'), endTime: new Date('2023-09-22'), startValue: 140, endValue: 120, group: 'normal', stockIndicator: 'ROFL', trade: 'buy' }, // Q3 dip
    { task: 'Sell LOL', startTime: new Date('2023-10-25'), endTime: new Date('2023-10-28'), startValue: 130, endValue: 128, group: 'normal', stockIndicator: 'LOL', trade: 'sell' },
    { task: 'Buy OMG', startTime: new Date('2023-11-01'), endTime: new Date('2023-11-03'), startValue: 135, endValue: 140, group: 'normal', stockIndicator: 'OMG', trade: 'buy' },
    { task: 'Sell WTF', startTime: new Date('2023-12-05'), endTime: new Date('2023-12-07'), startValue: 140, endValue: 138, group: 'normal', stockIndicator: 'WTF', trade: 'sell' },
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
    { name: 'Fire Alert Chart', component: 'app-fire-alert', color: 'orange', data: [] },
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

      // Update the average lines to track the entire width of the chart and data points
      this.updateAverageLines();
    });
  }

  openTile(index: number) {
    this.expandedTileIndex = this.expandedTileIndex === index ? null : index;
  }

  drop(event: CdkDragDrop<ChartData[]>) {
    moveItemInArray(this.charts, event.previousIndex, event.currentIndex);
    // Save the new order to the state if needed
  }

  private updateAverageLines() {
    // Implement the logic to update the average lines to track the entire width of the chart and data points
  }
}
