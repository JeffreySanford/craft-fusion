import { Injectable } from '@angular/core';
import { ExtendedChartData } from '../../projects/data-visualizations/data-visualizations.component';

@Injectable({
  providedIn: 'root',
})
export class ChartLayoutService {
  constructor() {}

  optimizeChartLayout(charts: ExtendedChartData[]): ExtendedChartData[] {
    console.log('Optimizing chart layout for', charts.length, 'charts');

    const largeCharts = charts.filter(chart => chart.size === 'large');
    const mediumCharts = charts.filter(chart => chart.size === 'medium');
    const smallCharts = charts.filter(chart => chart.size === 'small');

    const sortedCharts: ExtendedChartData[] = [];

    this.processLargeCharts(largeCharts, sortedCharts);

    this.processMediumSmallCombination(mediumCharts, smallCharts, sortedCharts);

    this.processRemainingMedium(mediumCharts, sortedCharts);

    this.processRemainingSmall(smallCharts, sortedCharts);

    console.log(
      'Optimized layout:',
      sortedCharts.map(c => c.size),
    );
    return sortedCharts;
  }

  private processLargeCharts(largeCharts: ExtendedChartData[], sortedCharts: ExtendedChartData[]): void {
    largeCharts.forEach((chart, index) => {
      chart.position = index;

      if (largeCharts.length === 1) {
        chart.specialLayout = 'size-large-single';
      } else if (largeCharts.length === 2) {
        chart.specialLayout = 'size-large-half';
      } else {
        chart.specialLayout = '';
      }

      sortedCharts.push(chart);
    });
  }

  private processMediumSmallCombination(mediumCharts: ExtendedChartData[], smallCharts: ExtendedChartData[], sortedCharts: ExtendedChartData[]): void {

    if (mediumCharts.length > 0 && smallCharts.length > 0) {
      console.log('Creating medium+small pairs');

      const mediumChart = mediumCharts.shift();
      if (mediumChart) {
        mediumChart.position = sortedCharts.length;
        mediumChart.specialLayout = 'medium-with-small';
        sortedCharts.push(mediumChart);
      }

      const smallChart = smallCharts.shift();
      if (smallChart) {
        smallChart.position = sortedCharts.length;
        smallChart.specialLayout = 'small-with-medium';
        sortedCharts.push(smallChart);
      }
    }
  }

  private processRemainingMedium(mediumCharts: ExtendedChartData[], sortedCharts: ExtendedChartData[]): void {
    mediumCharts.forEach(chart => {
      chart.position = sortedCharts.length;
      sortedCharts.push(chart);
    });
  }

  private processRemainingSmall(smallCharts: ExtendedChartData[], sortedCharts: ExtendedChartData[]): void {
    smallCharts.forEach((chart, index) => {
      chart.position = sortedCharts.length;

      if (index === 2) {
        chart.specialPosition = true;
      } else {
        chart.specialPosition = false;
      }

      sortedCharts.push(chart);
    });
  }

  calculateChartClass(componentType: string): string {

    const baseClass = 'fixed-chart-content';

    switch (componentType) {
      case 'app-line-chart':
        return `${baseClass} line-chart-content`;
      case 'app-bar-chart':
        return `${baseClass} bar-chart-content`;
      case 'app-finance-chart':
        return `${baseClass} finance-chart-content`;
      case 'app-fire-alert':
        return `${baseClass} scrollable-chart-content`;
      default:
        return baseClass;
    }
  }
}
