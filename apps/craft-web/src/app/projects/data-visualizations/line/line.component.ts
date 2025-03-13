import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges, Renderer2 } from '@angular/core';
import * as d3 from 'd3';
import { NumberValue } from 'd3-scale';
import { LineChartData } from '../data-visualizations.interfaces';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.scss'],
  standalone: false,
})
export class LineComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() data: LineChartData[] = [];
  @Input() width: number = 0;
  @Input() height: number = 0;

  @ViewChild('chart') private chartContainer: ElementRef | undefined;
  
  // Add titles and series information
  chartTitle: string = 'Annual Performance Trends';
  chartSubtitle: string = '12-month comparison of key metrics';
  
  // Define series names for better readability
  seriesNames = {
    'series1': 'New Users',
    'series2': 'Active Sessions',
    'series3': 'Revenue'
  };
  
  // Color scheme for the lines
  colors = ['steelblue', 'green', 'red'];
  
  // Create tooltip
  private tooltip: any;

  constructor(private renderer: Renderer2) {}
  
  ngOnInit(): void {
    // Initialization logic if needed
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['width'] || changes['data']) && 
        this.chartContainer && this.chartContainer.nativeElement) {
      setTimeout(() => {
        this.createChart();
      });
    }
  }

  private createChart(): void {
    if (!this.chartContainer) return;

    const element = this.chartContainer.nativeElement;
    d3.select(element).select('svg').remove();
    
    // Check if we're in fullscreen mode
    const isFullscreen = !!element.closest('.full-expanded');
    
    // Initialize tooltip
    this.tooltip = d3.select(element)
      .append('div')
      .attr('class', 'line-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background-color', 'rgba(0, 0, 0, 0.7)')
      .style('color', 'white')
      .style('border-radius', '4px')
      .style('padding', '8px')
      .style('pointer-events', 'none')
      .style('z-index', '10')
      .style('font-size', '12px')
      .style('box-shadow', '0 2px 10px rgba(0,0,0,0.2)')
      .style('max-width', '250px');

    // Let container size be controlled by CSS
    const svg = d3.select(element).append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('preserveAspectRatio', 'xMinYMin meet'); // Ensure chart scales properly

    // Use container dimensions
    const containerWidth = this.width || element.offsetWidth;
    const containerHeight = element.offsetHeight;

    // Set SVG viewBox for responsive scaling
    svg.attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`);

    // Adjust margins based on available space
    const margin = { 
      top: isFullscreen ? 50 : 40, 
      right: isFullscreen ? 90 : 80, 
      bottom: isFullscreen ? 60 : 50, 
      left: isFullscreen ? 70 : 60 
    };
    
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Adjust font sizes based on fullscreen state
    const titleFontSize = isFullscreen ? '20px' : '14px';
    const subtitleFontSize = isFullscreen ? '16px' : '12px';
    const axisFontSize = isFullscreen ? '14px' : '11px';

    // Add chart title with adjusted position
    svg.append('text')
      .attr('class', 'chart-title')
      .attr('x', containerWidth / 2)
      .attr('y', isFullscreen ? 25 : 15)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .style('font-size', titleFontSize)
      .style('font-weight', 'bold')
      .style('fill', '#fff')
      .text(this.chartTitle);

    // Add chart subtitle
    svg.append('text')
      .attr('class', 'chart-subtitle')
      .attr('x', containerWidth / 2)
      .attr('y', 32)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .style('font-size', subtitleFontSize)
      .style('fill', '#ccc')
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

    // Create a more user-friendly x-axis with fewer tick marks for smaller screens
    const tickCount = isFullscreen ? 12 : (width < 400 ? 6 : 12);
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
      .style('font-size', axisFontSize)
      .style('fill', '#ddd');

    // Create a better y-axis with fewer ticks and formatted values
    const yTickCount = isFullscreen ? 10 : (height < 150 ? 4 : 8);
    g.append('g')
      .attr('class', 'y axis')
      .call(d3.axisLeft(y).ticks(yTickCount).tickFormat(this.formatYValue))
      .selectAll('text')
      .style('font-size', axisFontSize)
      .style('fill', '#ddd');

    // Add X axis label
    g.append('text')
      .attr('class', 'x-axis-label')
      .attr('x', width / 2)
      .attr('y', height + 40) // Position below the axis
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#ddd')
      .text('Month');

    // Add Y axis label
    g.append('text')
      .attr('class', 'y-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40) // Position to the left of the axis
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#ddd')
      .text('Value');

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

    // Draw the lines with enhanced styling
    const drawLine = (lineFunc: any, data: any, color: string, index: number) => {
      const seriesKey = `series${index + 1}`;
      const seriesName = this.seriesNames[seriesKey as keyof typeof this.seriesNames] || seriesKey;
      
      // Create path with animation
      const path = g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('class', 'line')
        .attr('d', lineFunc);
      
      // Animate the line drawing
      const pathLength = path.node()?.getTotalLength() || 0;
      path.attr('stroke-dasharray', pathLength)
        .attr('stroke-dashoffset', pathLength)
        .transition()
        .duration(1000)
        .attr('stroke-dashoffset', 0);
      
      // Add data points with tooltips using Renderer2
      const circles = g.selectAll(`.dot-series${index + 1}`)
        .data(data)
        .enter().append('circle')
        .attr('class', `dot-series${index + 1}`)
        .attr('cx', (d: any) => x(d.date))
        .attr('cy', (d: any) => y(d[seriesKey]))
        .attr('r', isFullscreen ? 6 : 4)
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
        this.renderer.setStyle(target, 'r', isFullscreen ? '8px' : '6px');
        this.renderer.setStyle(target, 'opacity', '1');
      })
      .on('mouseout', (event: MouseEvent) => {
        this.tooltip.transition()
          .duration(500)
          .style('opacity', 0);
          
        // Restore point appearance using Renderer2
        const target = event.target as SVGCircleElement;
        this.renderer.setStyle(target, 'r', isFullscreen ? '6px' : '4px');
        this.renderer.setStyle(target, 'opacity', '0.7');
      });
    };

    // Draw the three lines with their respective data
    drawLine(line1, this.data, this.colors[0], 0);
    drawLine(line2, this.data, this.colors[1], 1);
    drawLine(line3, this.data, this.colors[2], 2);
    
    // Add a legend
    const legendX = isFullscreen ? width - 150 : width + 20;
    const legendY = isFullscreen ? 0 : 0;
    
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${legendX}, ${legendY})`);
      
    Object.entries(this.seriesNames).forEach(([key, name], i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);
        
      legendRow.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', this.colors[i]);
        
      legendRow.append('text')
        .attr('x', 20)
        .attr('y', 9)
        .attr('font-size', '11px')
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
      case 'series1': // New Users
        return value.toLocaleString();
      case 'series2': // Active Sessions
        return value.toLocaleString();
      case 'series3': // Revenue
        return `$${value.toLocaleString()}`;
      default:
        return value.toString();
    }
  }
}
