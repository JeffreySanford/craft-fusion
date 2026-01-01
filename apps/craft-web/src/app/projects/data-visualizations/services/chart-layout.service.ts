import { Injectable } from '@angular/core';
import { ExtendedChartData } from '../data-visualizations.component';

@Injectable()
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
      'Layout optimized:',
      sortedCharts.map(c => `${c.name} (${c.size}: ${c.specialLayout || 'standard'})`),
    );
    return sortedCharts;
  }

  private processLargeCharts(largeCharts: ExtendedChartData[], sortedCharts: ExtendedChartData[]): void {

    if (largeCharts.length === 0) return;

    console.log(`Processing ${largeCharts.length} large charts with special layouts`);

    largeCharts.forEach((chart, index) => {
      chart.position = index;

      if (largeCharts.length === 1) {

        chart.specialLayout = 'size-large-single';
        console.log(`Setting ${chart.name} to full width (size-large-single)`);
      } else if (largeCharts.length === 2) {

        chart.specialLayout = 'size-large-half';
        console.log(`Setting ${chart.name} to half width with full height (size-large-half)`);
      } else {

        chart.specialLayout = 'size-large-standard';
        console.log(`Setting ${chart.name} to standard large size (size-large-standard)`);
      }

      if (!chart.chartClass) {
        chart.chartClass = this.calculateChartClass(chart.component);
      }

      sortedCharts.push(chart);
    });
  }

  private processMediumSmallCombination(mediumCharts: ExtendedChartData[], smallCharts: ExtendedChartData[], sortedCharts: ExtendedChartData[]): void {

    while (mediumCharts.length > 0 && smallCharts.length > 0) {
      console.log('Creating medium+small pair');

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
    if (mediumCharts.length === 0) return;

    console.log(`Processing ${mediumCharts.length} remaining medium charts`);

    if (mediumCharts.length === 1) {
      const chart = mediumCharts[0];
      if (chart) {
        chart.position = sortedCharts.length;
        chart.specialLayout = 'medium-tile-full';
        sortedCharts.push(chart);
      }
    } else {

      mediumCharts.forEach(chart => {
        chart.position = sortedCharts.length;
        chart.specialLayout = 'medium-tile-standard';
        sortedCharts.push(chart);
      });
    }
  }

  private processRemainingSmall(smallCharts: ExtendedChartData[], sortedCharts: ExtendedChartData[]): void {
    if (smallCharts.length === 0) return;

    const smallCount = smallCharts.length;
    console.log(`Processing ${smallCount} remaining small charts`);

    const layoutClass = this.getSmallTileLayout(smallCount);

    if (smallCount === 4) {
      smallCharts.forEach((chart, index) => {
        chart.position = sortedCharts.length;
        chart.specialLayout = layoutClass;

        chart.specialRow = index < 2 ? 'first-row' : 'second-row';

        sortedCharts.push(chart);
      });
    } else {
      smallCharts.forEach(chart => {
        chart.position = sortedCharts.length;
        chart.specialLayout = layoutClass;
        sortedCharts.push(chart);
      });
    }
  }

  private getSmallTileLayout(count: number): string {
    if (count === 1) return 'small-tile-full';
    if (count === 2 || count === 4) return 'small-tile-half';                                         
    if (count === 3) return 'small-tile-third';
    return 'small-tile-fourth';                        
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
