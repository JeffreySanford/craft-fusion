import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { BarChartData, ChartData, FintechChartData, LineChartData, MapChartData } from './data-visualizations.interfaces';

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
    { date: new Date('2024-01-01'), series1: 500, series2: 600, series3: 700 },
    { date: new Date('2024-02-01'), series1: 550, series2: 620, series3: 680 },
    { date: new Date('2024-03-01'), series1: 580, series2: 640, series3: 720 },
  ];

  public fintechChartData: FintechChartData[] = [
    { task: 'Buy AAPL', startTime: new Date('2024-01-10'), endTime: new Date('2024-01-12') },
    { task: 'Sell TSLA', startTime: new Date('2024-01-15'), endTime: new Date('2024-01-18') },
    { task: 'Buy AMZN', startTime: new Date('2024-02-01'), endTime: new Date('2024-02-03') },
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
  }
}
