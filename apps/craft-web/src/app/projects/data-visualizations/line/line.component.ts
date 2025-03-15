import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges, Renderer2, OnDestroy } from '@angular/core';
import * as d3 from 'd3';
import { NumberValue } from 'd3-scale';
import { LineChartData } from '../data-visualizations.interfaces';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.scss'],
  standalone: false,
})
export class LineComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() data: LineChartData[] = [];
  @Input() width: number = 0;
  @Input() height: number = 0;

  @ViewChild('chart') private chartContainer: ElementRef | undefined;
  
  // Patriotic space-themed titles
  chartTitle: string = 'American Space Achievements';
  chartSubtitle: string = 'Advancing the Final Frontier';
  
  // Space-themed series names
  seriesNames = {
    'series1': 'NASA Missions',
    'series2': 'Astronaut Hours in Space',
    'series3': 'Space Innovations'
  };
  
  // Patriotic color scheme - red, white, blue theme
  colors = ['#B22234', '#FFFFFF', '#3C3B6E']; // American flag colors
  
  // Create tooltip
  private tooltip: any;
  
  // Add resize observer and subject for component cleanup
  private resizeObserver: ResizeObserver | null = null;
  private destroy$ = new Subject<void>();

  // Add properties for status messages in the class if not present
  statusMessage: string = '';
  showStatus: boolean = false;

  constructor(private renderer: Renderer2) {}
  
  ngOnInit(): void {
    // Initialization logic if needed
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(250),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.createChart();
      });
  }

  ngAfterViewInit(): void {
    // Force tick to ensure container is properly sized
    setTimeout(() => {
      this.createChart();
      this.setupResizeObserver();
      
      // Force resize detection after a short delay to catch any layout adjustments
      setTimeout(() => {
        if (this.chartContainer && 
            (this.chartContainer.nativeElement.offsetWidth < 100 || 
             this.chartContainer.nativeElement.offsetHeight < 100)) {
          this.createChart();
        }
      }, 300);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['width'] || changes['data'] || changes['height']) && 
        this.chartContainer && this.chartContainer.nativeElement) {
      setTimeout(() => {
        this.createChart();
      });
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }
  
  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined' && this.chartContainer) {
      const container = this.chartContainer.nativeElement;
      this.resizeObserver = new ResizeObserver(entries => {
        this.createChart();
      });
      this.resizeObserver.observe(container);
    }
  }

  private createChart(): void {
    if (!this.chartContainer) return;

    const element = this.chartContainer.nativeElement;
    d3.select(element).select('svg').remove();
    
    // Check if we're in fullscreen mode
    const isFullscreen = !!element.closest('.full-expanded');
    
    // Initialize tooltip
    d3.select(element).selectAll('.line-tooltip').remove();
    
    this.tooltip = d3.select('body')  // Attach to body instead of element for better positioning
      .append('div')
      .attr('class', 'line-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background-color', 'rgba(28, 40, 65, 0.9)')
      .style('border', '1px solid #B22234')
      .style('color', 'white')
      .style('border-radius', '4px')
      .style('padding', '8px')
      .style('pointer-events', 'none')
      .style('z-index', '9999')
      .style('font-size', '12px')
      .style('box-shadow', '0 2px 10px rgba(0,0,0,0.2)')
      .style('max-width', '250px');

    // Force parent container to full size
    d3.select(element.parentNode)
      .style('width', '100%')
      .style('height', '100%');
      
    // Force chart container to full size
    d3.select(element)
      .style('width', '100%')
      .style('height', '100%');

    // Use container size controlled by CSS - ensure full tile usage
    const svg = d3.select(element).append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .style('display', 'block')
      .attr('preserveAspectRatio', 'xMinYMin meet');

    // Get the actual dimensions of the container - use full available space
    // Get parent dimensions if element dimensions are zero
    let containerWidth = element.offsetWidth || element.parentNode.offsetWidth;
    let containerHeight = element.offsetHeight || element.parentNode.offsetHeight;
    
    // If we still don't have valid dimensions, use defaults that can be overridden by viewBox
    if (!containerWidth || containerWidth < 100) containerWidth = 800;
    if (!containerHeight || containerHeight < 100) containerHeight = 400;
    
    // Set SVG viewBox for responsive scaling
    svg.attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`);

    // Adjust margins to maximize chart space - use smaller margins for small containers
    const margin = {
      top: Math.min(containerHeight * 0.08, 40),
      right: Math.min(containerWidth * 0.08, 50),
      bottom: Math.min(containerHeight * 0.12, 50),
      left: Math.min(containerWidth * 0.1, 50)
    };
    
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Dynamically adjust font sizes based on container dimensions
    const titleFontSize = Math.max(containerWidth * 0.022, isFullscreen ? 22 : 16);
    const subtitleFontSize = Math.max(containerWidth * 0.016, isFullscreen ? 18 : 14);
    const axisFontSize = Math.max(containerWidth * 0.011, isFullscreen ? 14 : 11);

    // Add chart title with adjusted position
    svg.append('text')
      .attr('class', 'chart-title')
      .attr('x', containerWidth / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .style('font-size', `${titleFontSize}px`)
      .style('font-weight', 'bold')
      .style('fill', '#B22234') // Patriotic red color
      .text(this.chartTitle);

    // Add chart subtitle
    svg.append('text')
      .attr('class', 'chart-subtitle')
      .attr('x', containerWidth / 2)
      .attr('y', margin.top * 0.8)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .style('font-size', `${subtitleFontSize}px`)
      .style('fill', '#FFFFFF') // White color
      .text(this.chartSubtitle);

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    // Create line generators for each series
    const line1 = d3
      .line<LineChartData>()
      .x(d => x(d.date))
      .y(d => y(d.series1))
      .curve(d3.curveMonotoneX); // Smoother curve

    const line2 = d3
      .line<LineChartData>()
      .x(d => x(d.date))
      .y(d => y(d.series2))
      .curve(d3.curveMonotoneX);

    const line3 = d3
      .line<LineChartData>()
      .x(d => x(d.date))
      .y(d => y(d.series3))
      .curve(d3.curveMonotoneX);

    const xDomain = d3.extent(this.data, d => d.date) as [Date, Date];
    x.domain(xDomain);
    
    // Find the max y value for better scaling
    const yMax = d3.max(this.data.map(d => Math.max(d.series1, d.series2, d.series3))) as number;
    y.domain([0, yMax * 1.1]).nice(); // Add 10% padding and round to nice values

    // Create a more user-friendly x-axis with appropriate tick marks based on chart width
    const tickCount = Math.max(Math.floor(width / 80), 4); // At least 4 ticks, more for wider charts
    const xAxis = d3.axisBottom(x)
      .ticks(tickCount)
      .tickFormat((d: Date | NumberValue, i: number) => {
        const date = d as Date;
        // Use either month abbreviation or month+year format based on space
        return width < 500 ? 
          d3.timeFormat('%b')(date) : // Just the month abbreviation
          d3.timeFormat('%b %y')(date); // Month and year
      });

    // Add the x-axis with rotated labels for better readability
    g.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)')
      .style('font-size', `${axisFontSize}px`)
      .style('fill', '#ddd');

    // Create a better y-axis with appropriate ticks based on chart height
    const yTickCount = Math.max(Math.floor(height / 50), 3); // At least 3 ticks, more for taller charts
    g.append('g')
      .attr('class', 'y axis')
      .call(d3.axisLeft(y).ticks(yTickCount).tickFormat(this.formatYValue))
      .selectAll('text')
      .style('font-size', `${axisFontSize}px`)
      .style('fill', '#ddd');

    // Add X axis label with vertical position adjusted to chart height
    g.append('text')
      .attr('class', 'x-axis-label')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom * 0.6) // Position relative to chart height
      .attr('text-anchor', 'middle')
      .style('font-size', `${axisFontSize * 1.1}px`)
      .style('fill', '#FFFFFF') // White color
      .text('Timeline');

    // Add Y axis label with position adjusted to chart height
    g.append('text')
      .attr('class', 'y-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left * 0.6) // Position relative to margin
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', `${axisFontSize * 1.1}px`)
      .style('fill', '#FFFFFF') // White color
      .text('Achievement Metrics');

    // Add horizontal grid lines for better readability
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y)
        .ticks(yTickCount)
        .tickSize(-width)
        .tickFormat(() => '')
      )
      .selectAll('line')
      .style('stroke', 'rgba(255, 255, 255, 0.1)')
      .style('stroke-dasharray', '2,2');
      
    // Add vertical grid lines for better readability in taller charts
    g.append('g')
      .attr('class', 'grid vertical-grid')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .ticks(tickCount)
        .tickSize(-height)
        .tickFormat(() => '')
      )
      .selectAll('line')
      .style('stroke', 'rgba(255, 255, 255, 0.05)')
      .style('stroke-dasharray', '2,2');

    // Draw the lines with enhanced styling and animation durations based on chart size
    const drawLine = (lineFunc: any, data: any, color: string, index: number) => {
      const seriesKey = `series${index + 1}`;
      const seriesName = this.seriesNames[seriesKey as keyof typeof this.seriesNames] || seriesKey;
      
      // Calculate animation duration based on chart width - longer animations for larger charts
      const animDuration = Math.min(Math.max(width / 3, 500), 1500);
      
      // Create path with animation
      const path = g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', isFullscreen ? 3 : 2)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('class', 'line')
        .attr('d', lineFunc);
      
      // Animate the line drawing
      const pathLength = path.node()?.getTotalLength() || 0;
      path.attr('stroke-dasharray', pathLength)
        .attr('stroke-dashoffset', pathLength)
        .transition()
        .duration(animDuration)
        .attr('stroke-dashoffset', 0);
      
      // Add area beneath the line for emphasis (only if chart is tall enough)
      if (height > 150) {
        const areaGenerator = d3.area<LineChartData>()
          .x(d => x(d.date))
          .y0(height)
          .y1(d => y(d[seriesKey as keyof LineChartData] as number))
          .curve(d3.curveMonotoneX);
        
        g.append('path')
          .datum(data)
          .attr('class', 'area')
          .attr('fill', color)
          .attr('fill-opacity', 0.1)
          .attr('d', areaGenerator)
          .attr('clip-path', 'url(#clip)')
          .style('opacity', 0)
          .transition()
          .delay(animDuration * 0.5) // Start after line is partially drawn
          .duration(animDuration * 0.8)
          .style('opacity', 1);
      }
      
      // Calculate point size based on chart dimensions
      const pointSize = Math.max(Math.min((width + height) / 300, 7), 3); 
      
      // Add data points with tooltips using Renderer2
      const circles = g.selectAll(`.dot-series${index + 1}`)
        .data(data)
        .enter().append('circle')
        .attr('class', `dot-series${index + 1}`)
        .attr('cx', (d: any) => x(d.date))
        .attr('cy', (d: any) => y(d[seriesKey]))
        .attr('r', 0) // Start with radius 0 for animation
        .attr('fill', color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .attr('opacity', 0.7);
      
      // Store series information with each data point
      circles.each(function(d: any) {
        const circle = d3.select(this);
        circle.datum({
          ...d,
          seriesKey: seriesKey,
          seriesName: seriesName,
          color: color
        });
      });
      
      // Animate the points appearing
      circles.transition()
        .delay((d, i) => animDuration * 0.5 + (i * (animDuration / data.length)))
        .duration(300)
        .attr('r', pointSize);
      
      // Handle events with Renderer2
      circles.on('mouseover', (event: MouseEvent, d: any) => {
        const target = event.target as SVGCircleElement;
        const data = d3.select(target).datum() as any;
        
        // Show tooltip with formatted data
        const date = data.date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        });
        
        // Format the value based on the series (different units)
        const value = this.formatSeriesValue(data.seriesKey, data[data.seriesKey]);
        
        this.tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
          
        this.tooltip.html(`
          <div style="font-weight:bold; margin-bottom:5px; color:${data.color}">
            ${data.seriesName}
          </div>
          <div>Date: <strong>${date}</strong></div>
          <div>Value: <strong>${value}</strong></div>
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
          
        // Highlight the point using Renderer2
        this.renderer.setStyle(target, 'r', pointSize * 1.5 + 'px');
        this.renderer.setStyle(target, 'opacity', '1');
        
        // Highlight the corresponding line
        g.selectAll(`.line`).filter((lineData: any, i: number) => i === index)
          .attr('stroke-width', isFullscreen ? 5 : 3)
          .attr('stroke-opacity', 1);
      })
      .on('mouseout', (event: MouseEvent) => {
        this.tooltip.transition()
          .duration(500)
          .style('opacity', 0);
          
        // Restore point appearance using Renderer2
        const target = event.target as SVGCircleElement;
        this.renderer.setStyle(target, 'r', pointSize + 'px');
        this.renderer.setStyle(target, 'opacity', '0.7');
        
        // Restore line appearance
        g.selectAll(`.line`)
          .attr('stroke-width', isFullscreen ? 3 : 2)
          .attr('stroke-opacity', 0.9);
      });
    };

    // Draw the three lines with their respective data
    drawLine(line1, this.data, this.colors[0], 0);
    drawLine(line2, this.data, this.colors[1], 1);
    drawLine(line3, this.data, this.colors[2], 2);
    
    // Remove conditional logic for placing legend; always use top-right
    const legendX = width - 150;
    const legendY = 10; 
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${legendX},${legendY})`);
      
    // Calculate legend item size based on available space
    const legendItemHeight = Math.min(Math.max(height / 15, 15), 25);
    const legendFontSize = Math.max(axisFontSize * 0.9, 10);
    
    Object.entries(this.seriesNames).forEach(([key, name], i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * legendItemHeight})`);
        
      // Add rect with size based on available space
      legendRow.append('rect')
        .attr('width', legendFontSize)
        .attr('height', legendFontSize * 0.8)
        .attr('fill', this.colors[i]);
        
      // Add text with size based on available space
      legendRow.append('text')
        .attr('x', legendFontSize * 1.5)
        .attr('y', legendFontSize * 0.8)
        .attr('font-size', `${legendFontSize}px`)
        .attr('fill', '#ddd')
        .text(name);
    });
  }
  
  // Formatter for Y axis values
  private formatYValue = (value: number | { valueOf(): number }): string => {
    const num = Number(value);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return String(num);
  };
  
  // Format series values with appropriate units
  private formatSeriesValue(series: string, value: number): string {
    switch (series) {
      case 'series1': // NASA Missions
        return `${value.toLocaleString()} missions`;
      case 'series2': // Astronaut Hours
        return `${value.toLocaleString()} hours`;
      case 'series3': // Space Innovations
        return `${value.toLocaleString()} innovations`;
      default:
        return value.toString();
    }
  }

  // A small helper to show messages temporarily (if desired):
  showStatusMessage(message: string, durationMs: number = 3000): void {
    this.statusMessage = message;
    this.showStatus = true;
    setTimeout(() => { this.showStatus = false; }, durationMs);
  }
}
