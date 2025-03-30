import { PerformanceMetric } from '../services/logger.service';

/**
 * SVG Charts Utility Class
 * Provides reusable methods for generating SVG charts used throughout the application
 */
export class SvgCharts {
  /**
   * Generate SVG path string for a sparkline chart from an array of numbers
   * @param data Array of numeric values to plot
   * @param width Width of the chart
   * @param height Height of the chart
   * @returns SVG path string (d attribute)
   */
  static generateSparklinePath(data: number[], width: number, height: number): string {
    if (!data || data.length < 2) return '';
    
    const min = Math.min(...data);
    const max = Math.max(...data) - min || 1; // Add || 1 to prevent division by zero
    
    // Calculate step between points
    const xStep = width / (data.length - 1);
    
    // Start path at first point
    let path = `M 0,${height - ((data[0] - min) * height / max)}`;
    
    // Add line to each subsequent point
    for (let i = 1; i < data.length; i++) {
      const x = i * xStep;
      const y = height - ((data[i] - min) * height / max);
      path += ` L ${x},${y}`;
    }
    
    return path;
  }

  /**
   * Get appropriate color for a metric based on its trend
   * @param metric Performance metric with history data
   * @returns Color code (hex)
   */
  static getMetricColor(metric: PerformanceMetric): string {
    // If no history or single point, use default
    if (!metric.history || metric.history.length <= 1) {
      return '#4BC0C0'; // Default teal color
    }
    
    // Calculate trend (current vs average)
    const current = metric.value;
    const avg = metric.avg || 0;
    const diff = current - avg;
    
    // Color based on trend direction and magnitude
    if (Math.abs(diff) < avg * 0.1) { // Within 10% of average
      return '#4BC0C0'; // Teal - stable
    } else if (diff > 0) {
      return '#FF6384'; // Red - higher than average (often bad for performance metrics)
    } else {
      return '#36A2EB'; // Blue - lower than average (often good for performance metrics)
    }
  }
  
  /**
   * Calculate coordinates for minimum value indicator
   * @param metric Performance metric with history data
   * @param width Chart width
   * @param height Chart height
   * @returns SVG circle coordinates {cx, cy}
   */
  static getMinPointCoordinates(metric: PerformanceMetric, width: number, height: number): {cx: number, cy: number} | null {
    if (!metric.history || !metric.min || metric.min === undefined) {
      return null;
    }
    
    const minIndex = metric.history.indexOf(metric.min);
    if (minIndex === -1) return null;
    
    const cx = minIndex * (width / (metric.history.length - 1));
    const cy = height - ((metric.min - (metric.min || 0)) * height / ((metric.max || 1) - (metric.min || 0) || 1));
    
    return { cx, cy };
  }
  
  /**
   * Calculate coordinates for maximum value indicator
   * @param metric Performance metric with history data
   * @param width Chart width
   * @param height Chart height
   * @returns SVG circle coordinates {cx, cy}
   */
  static getMaxPointCoordinates(metric: PerformanceMetric, width: number, height: number): {cx: number, cy: number} | null {
    if (!metric.history || !metric.max || metric.max === undefined) {
      return null;
    }
    
    const maxIndex = metric.history.indexOf(metric.max);
    if (maxIndex === -1) return null;
    
    const cx = maxIndex * (width / (metric.history.length - 1));
    const cy = height - ((metric.max - (metric.min || 0)) * height / ((metric.max || 1) - (metric.min || 0) || 1));
    
    return { cx, cy };
  }
  
  /**
   * Format a numeric value for display with specified precision
   * @param value Numeric value
   * @param precision Number of decimal places
   * @returns Formatted string
   */
  static formatMetricValue(value: number | undefined, precision: number = 1): string {
    if (value === undefined) return 'N/A';
    return value.toFixed(precision);
  }

  /**
   * Generate a complete SVG sparkline element with path and indicators
   * @param data Array of numeric values to plot
   * @param width Chart width
   * @param height Chart height
   * @param color Color for the sparkline path
   * @param showMinMax Show min/max indicators
   * @returns Complete SVG element as string
   */
  static generateSparklineSvg(
    data: number[], 
    width: number = 100, 
    height: number = 30, 
    color: string = '#4BC0C0',
    showMinMax: boolean = true
  ): string {
    if (!data || data.length < 2) return '';
    
    const path = this.generateSparklinePath(data, width, height);
    const min = Math.min(...data);
    const max = Math.max(...data);
    const minIndex = data.indexOf(min);
    const maxIndex = data.indexOf(max);
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <path d="${path}" stroke="${color}" stroke-width="2" fill="none" />`;
    
    if (showMinMax) {
      const minX = minIndex * (width / (data.length - 1));
      const minY = height - ((min - min) * height / ((max - min) || 1));
      
      const maxX = maxIndex * (width / (data.length - 1));
      const maxY = height - ((max - min) * height / ((max - min) || 1));
      
      svg += `
      <circle cx="${minX}" cy="${minY}" r="3" fill="#36A2EB" />
      <circle cx="${maxX}" cy="${maxY}" r="3" fill="#FF6384" />`;
    }
    
    svg += `</svg>`;
    
    return svg;
  }
  
  /**
   * Create a radar chart for a metrics dashboard
   * @param metrics Array of metric objects with values and labels
   * @param size Size of the chart (width and height)
   * @param colors Array of colors to use for each metric
   * @returns SVG string for the radar chart
   */
  static generateRadarChart(
    metrics: Array<{label: string, value: number, maxValue: number}>,
    size: number = 200,
    colors: string[] = ['#FF6384', '#36A2EB', '#4BC0C0', '#FFCE56', '#9966FF']
  ): string {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4; // 80% of half the size
    const sides = metrics.length;
    
    if (sides < 3) return ''; // Need at least 3 points for a radar chart
    
    let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Draw the background grid
    for (let level = 1; level <= 4; level++) {
      const gridRadius = (radius * level) / 4;
      let gridPoints = '';
      
      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
        const x = centerX + gridRadius * Math.cos(angle);
        const y = centerY + gridRadius * Math.sin(angle);
        
        if (i === 0) {
          gridPoints += `M ${x} ${y}`;
        } else {
          gridPoints += ` L ${x} ${y}`;
        }
      }
      
      gridPoints += ' Z'; // Close the path
      svg += `<path d="${gridPoints}" stroke="rgba(255,255,255,0.2)" stroke-width="1" fill="none" />`;
    }
    
    // Draw axis lines
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      svg += `<line x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}" 
              stroke="rgba(255,255,255,0.3)" stroke-width="1" />`;
      
      // Add labels
      const labelX = centerX + (radius + 15) * Math.cos(angle);
      const labelY = centerY + (radius + 15) * Math.sin(angle);
      const textAnchor = 
        angle === -Math.PI / 2 ? 'middle' :
        angle < -Math.PI / 2 || angle > Math.PI / 2 ? 'end' : 'start';
      
      svg += `<text x="${labelX}" y="${labelY}" text-anchor="${textAnchor}" 
              fill="white" font-size="12" font-family="sans-serif">
              ${metrics[i].label}</text>`;
    }
    
    // Draw data polygon
    let dataPoints = '';
    for (let i = 0; i < sides; i++) {
      const value = metrics[i].value;
      const maxValue = metrics[i].maxValue;
      const ratio = Math.min(value / maxValue, 1); // Cap at 1
      
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
      const x = centerX + radius * ratio * Math.cos(angle);
      const y = centerY + radius * ratio * Math.sin(angle);
      
      if (i === 0) {
        dataPoints += `M ${x} ${y}`;
      } else {
        dataPoints += ` L ${x} ${y}`;
      }
    }
    
    dataPoints += ' Z'; // Close the path
    svg += `<path d="${dataPoints}" stroke="${colors[0]}" stroke-width="2" 
            fill="${colors[0]}" fill-opacity="0.3" />`;
    
    svg += `</svg>`;
    
    return svg;
  }

  /**
   * Generate a tiny inline sparkline for log entries
   * @param data Array of values to chart
   * @param width Width in pixels
   * @param height Height in pixels
   * @param color Line color
   * @returns SVG element as string
   */
  static generateTinySparkline(
    data: number[],
    width: number = 50,
    height: number = 12,
    color: string = '#4BC0C0'
  ): string {
    if (!data || data.length < 2) return '';
    
    const path = this.generateSparklinePath(data, width, height);
    
    return `<svg width="${width}" height="${height}" class="tiny-sparkline" xmlns="http://www.w3.org/2000/svg">
      <path d="${path}" stroke="${color}" stroke-width="1" fill="none" />
    </svg>`;
  }

  /**
   * Generate a tiny status dot indicator
   * @param value Current value
   * @param threshold Warning threshold
   * @param criticalThreshold Critical threshold
   * @param size Dot size in pixels
   * @returns SVG element as string
   */
  static generateStatusDot(
    value: number,
    threshold: number = 50,
    criticalThreshold: number = 80,
    size: number = 8
  ): string {
    let color = '#10b981'; // Green/good
    
    if (value >= threshold && value < criticalThreshold) {
      color = '#f59e0b'; // Yellow/warning
    } else if (value >= criticalThreshold) {
      color = '#ef4444'; // Red/critical
    }
    
    return `<svg width="${size}" height="${size}" class="status-dot" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="${color}" />
    </svg>`;
  }

  /**
   * Generate a tiny trend indicator arrow
   * @param currentValue Current value
   * @param previousValue Previous value
   * @param size Size in pixels
   * @returns SVG element as string
   */
  static generateTrendArrow(
    currentValue: number,
    previousValue: number,
    size: number = 12
  ): string {
    const diff = currentValue - previousValue;
    
    if (Math.abs(diff) < 0.1) { // No significant change
      return `<svg width="${size}" height="${size}" class="trend-neutral" xmlns="http://www.w3.org/2000/svg">
        <line x1="2" y1="${size/2}" x2="${size-2}" y2="${size/2}" stroke="#9ca3af" stroke-width="2" />
      </svg>`;
    }
    
    const color = diff > 0 ? '#ef4444' : '#10b981'; // Red for up, Green for down (for metrics where lower is better)
    const points = diff > 0
      ? `${size/2},2 ${size-2},${size-2} 2,${size-2}`  // Up arrow
      : `${size/2},${size-2} ${size-2},2 2,2`;         // Down arrow
      
    return `<svg width="${size}" height="${size}" class="trend-arrow" xmlns="http://www.w3.org/2000/svg">
      <polygon points="${points}" fill="${color}" />
    </svg>`;
  }

  /**
   * Generate a SVG chart (migrated from svg-chart.ts)
   * @param data The data to render in the chart
   * @param options Optional configuration options
   * @returns SVG markup as a string
   */
  static generateChart(data: number[], options?: {
    width?: number;
    height?: number;
    color?: string;
    lineWidth?: number;
    showPoints?: boolean;
  }): string {
    const width = options?.width || 100;
    const height = options?.height || 50;
    const color = options?.color || '#4BC0C0';
    const lineWidth = options?.lineWidth || 2;
    const showPoints = options?.showPoints || false;
    
    // Set up the SVG canvas
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`;
    
    // Generate the path
    const path = this.generateSparklinePath(data, width, height);
    svg += `<path d="${path}" fill="none" stroke="${color}" stroke-width="${lineWidth}" />`;
    
    // Add points if requested
    if (showPoints && data.length > 0) {
      const max = Math.max(...data);
      const min = Math.min(...data);
      const range = max - min || 1;
      
      data.forEach((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        svg += `<circle cx="${x}" cy="${y}" r="2" fill="${color}" />`;
      });
    }
    
    svg += '</svg>';
    return svg;
  }
}
