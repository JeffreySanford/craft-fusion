import { Injectable } from '@angular/core';
import { ExtendedChartData } from '../../projects/data-visualizations/data-visualizations.component';

@Injectable({
  providedIn: 'root'
})
export class ChartLayoutService {
  constructor() { }

  /**
   * Optimize chart layout based on sizes and combinations
   */
  optimizeChartLayout(charts: ExtendedChartData[]): ExtendedChartData[] {
    console.log('Optimizing chart layout for', charts.length, 'charts');

    // Sort charts by size
    const largeCharts = charts.filter(chart => chart.size === 'large');
    const mediumCharts = charts.filter(chart => chart.size === 'medium');
    const smallCharts = charts.filter(chart => chart.size === 'small');
    
    // Create optimized array
    const sortedCharts: ExtendedChartData[] = [];
    
    // Handle large charts first
    this.processLargeCharts(largeCharts, sortedCharts);
    
    // Handle medium + small combinations
    this.processMediumSmallCombination(mediumCharts, smallCharts, sortedCharts);
    
    // Add any remaining medium charts
    this.processRemainingMedium(mediumCharts, sortedCharts);
    
    // Add any remaining small charts
    this.processRemainingSmall(smallCharts, sortedCharts);
    
    console.log('Optimized layout:', sortedCharts.map(c => c.size));
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

  private processMediumSmallCombination(
    mediumCharts: ExtendedChartData[], 
    smallCharts: ExtendedChartData[], 
    sortedCharts: ExtendedChartData[]
  ): void {
    // Create medium+small pairs if both exist
    if (mediumCharts.length > 0 && smallCharts.length > 0) {
      console.log('Creating medium+small pairs');
      
      // Take first medium chart
      const mediumChart = mediumCharts.shift();
      if (mediumChart) {
        mediumChart.position = sortedCharts.length;
        mediumChart.specialLayout = 'medium-with-small';
        sortedCharts.push(mediumChart);
      }
      
      // Take first small chart
      const smallChart = smallCharts.shift();
      if (smallChart) {
        smallChart.position = sortedCharts.length;
        smallChart.specialLayout = 'small-with-medium';
        sortedCharts.push(smallChart);
      }
    }
  }

  private processRemainingMedium(mediumCharts: ExtendedChartData[], sortedCharts: ExtendedChartData[]): void {
    mediumCharts.forEach((chart) => {
      chart.position = sortedCharts.length;
      sortedCharts.push(chart);
    });
  }

  private processRemainingSmall(smallCharts: ExtendedChartData[], sortedCharts: ExtendedChartData[]): void {
    smallCharts.forEach((chart, index) => {
      chart.position = sortedCharts.length;
      
      // Mark third small tile for special positioning
      if (index === 2) {
        chart.specialPosition = true;
      } else {
        chart.specialPosition = false;
      }
      
      sortedCharts.push(chart);
    });
  }

  calculateChartClass(componentType: string): string {
    // Base classes that apply to all charts
    const baseClass = 'fixed-chart-content';
    
    // Map component types to specific CSS classes
    switch (componentType) {
      case 'app-line-chart':
        return `${baseClass} line-chart-content`;
      case 'app-bar-chart':
        return `${baseClass} bar-chart-content`;
      case 'app-finance-chart':
        return `${baseClass} finance-chart-content`;
      case 'app-quantum-fisher-tile':
      case 'app-fire-alert':
        return `${baseClass} scrollable-chart-content`;
      default:
        return baseClass;
    }
  }
}
