import { Injectable } from '@angular/core';
import { ExtendedChartData } from '../data-visualizations.component';

@Injectable()
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
    
    // Handle large charts first with improved positioning
    this.processLargeCharts(largeCharts, sortedCharts);
    
    // Handle medium + small combinations
    this.processMediumSmallCombination(mediumCharts, smallCharts, sortedCharts);
    
    // Add any remaining medium charts
    this.processRemainingMedium(mediumCharts, sortedCharts);
    
    // Add remaining small charts with adaptive sizing
    this.processRemainingSmall(smallCharts, sortedCharts);
    
    console.log('Layout optimized:', sortedCharts.map(c => `${c.name} (${c.size}: ${c.specialLayout || 'standard'})`));
    return sortedCharts;
  }

  private processLargeCharts(largeCharts: ExtendedChartData[], sortedCharts: ExtendedChartData[]): void {
    // If there are large charts, process them differently based on count
    if (largeCharts.length === 0) return;
    
    console.log(`Processing ${largeCharts.length} large charts with special layouts`);
    
    // Assign positions and special layouts
    
    largeCharts.forEach((chart, index) => {
      chart.position = index;
      
      if (largeCharts.length === 1) {
        // Single large chart should be full-width
        chart.specialLayout = 'size-large-single';
        console.log(`Setting ${chart.name} to full width (size-large-single)`);
      } else if (largeCharts.length === 2) {
        // With exactly two large charts, make them half-width each with full height
        chart.specialLayout = 'size-large-half';
        console.log(`Setting ${chart.name} to half width with full height (size-large-half)`);
      } else {
        // With 3+ large charts, use standard large size
        chart.specialLayout = 'size-large-standard';
        console.log(`Setting ${chart.name} to standard large size (size-large-standard)`);
      }
      
      // Ensure all large tiles have chart class pre-calculated
      if (!chart.chartClass) {
        chart.chartClass = this.calculateChartClass(chart.component);
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
    while (mediumCharts.length > 0 && smallCharts.length > 0) {
      console.log('Creating medium+small pair');
      
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
    if (mediumCharts.length === 0) return;
    
    console.log(`Processing ${mediumCharts.length} remaining medium charts`);
    
    // Determine optimal layout based on medium chart count
    if (mediumCharts.length === 1) {
      const chart = mediumCharts[0];
      if (chart) {
        chart.position = sortedCharts.length;
        chart.specialLayout = 'medium-tile-full';
        sortedCharts.push(chart);
      }
    } else {
      // Multiple medium charts - standard sizing
      mediumCharts.forEach((chart) => {
        chart.position = sortedCharts.length;
        chart.specialLayout = 'medium-tile-standard';
        sortedCharts.push(chart);
      });
    }
  }

  private processRemainingSmall(smallCharts: ExtendedChartData[], sortedCharts: ExtendedChartData[]): void {
    if (smallCharts.length === 0) return;
    
    // Count total small charts for adaptive sizing
    const smallCount = smallCharts.length;
    console.log(`Processing ${smallCount} remaining small charts`);
    
    // Get layout class based on count (small-tile-half for 2 or 4 tiles)
    const layoutClass = this.getSmallTileLayout(smallCount);
    
    // For 2×2 grid layout with 4 small tiles, assign row positions
    if (smallCount === 4) {
      smallCharts.forEach((chart, index) => {
        chart.position = sortedCharts.length;
        chart.specialLayout = layoutClass;
        
        // Mark which row this tile belongs to (first or second)
        chart.specialRow = index < 2 ? 'first-row' : 'second-row';
        
        sortedCharts.push(chart);
      });
    } else {
      smallCharts.forEach((chart) => {
        chart.position = sortedCharts.length;
        chart.specialLayout = layoutClass;
        sortedCharts.push(chart);
      });
    }
  }
  
  // Determine appropriate layout class based on small tile count
  private getSmallTileLayout(count: number): string {
    if (count === 1) return 'small-tile-full';
    if (count === 2 || count === 4) return 'small-tile-half'; // Use half width for both 2 and 4 tiles
    if (count === 3) return 'small-tile-third';
    return 'small-tile-fourth'; // Default for 5+ tiles
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
      case 'app-fire-alert':
        return `${baseClass} scrollable-chart-content`;
      default:
        return baseClass;
    }
  }
}
