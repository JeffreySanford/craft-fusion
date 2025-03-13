import { Component, OnInit, Input, ElementRef, OnDestroy, OnChanges, SimpleChanges, AfterViewInit, Renderer2 } from '@angular/core';
import * as d3 from 'd3';
import { BarChartData } from '../data-visualizations.interfaces';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.scss'],
  standalone: false
})

export class BarComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @Input() data: BarChartData[] | undefined;
  @Input() width: number = 0;
  @Input() height: number = 0;
  
  title = 'Quarterly Performance Comparison';
  subtitle = 'Comparing three key metrics across months';
  colors: string[] = ['#69b3a2', '#404080', '#ff4d4d'];
  private destroy$ = new Subject<void>();
  private svg: any;
  private container: any;
  private tooltip: any;
  private resizeObserver: ResizeObserver | null = null;
  
  // Define value labels to make the chart more meaningful
  private valueLabels: { [key: string]: string } = {
    'value1': 'Revenue',
    'value2': 'Expenses',
    'value3': 'Profit'
  };
  
  constructor(private el: ElementRef, private renderer: Renderer2) { }

  ngOnInit(): void {
    // Colors are initialized here
  }

  ngAfterViewInit(): void {
    // Initialize the chart after the view has been initialized
    setTimeout(() => {
      this.initChart();
      
      // Setup resize observer for container element
      this.setupResizeObserver();
      
      // Also listen for window resize events
      fromEvent(window, 'resize')
        .pipe(
          debounceTime(250),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.updateChart();
        });
    }, 100); // Short delay to ensure container is ready
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Update chart if data changes
    if (changes['data'] && !changes['data'].firstChange) {
      this.updateChart();
    }
    
    // Update chart if width or height inputs change - force immediate update
    if ((changes['width'] || changes['height']) && this.container) {
      setTimeout(() => {
        this.updateChart();
      }, 150); // Add a delay to ensure container has adjusted
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Cleanup resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  private setupResizeObserver(): void {
    // Use ResizeObserver API to watch for container size changes
    if (typeof ResizeObserver !== 'undefined') {
      const container = this.el.nativeElement.querySelector('.bar-chart-container');
      if (container) {
        this.resizeObserver = new ResizeObserver(entries => {
          this.updateChart();
        });
        this.resizeObserver.observe(container);
      }
    }
  }

  private initChart(): void {
    const containerElement = this.el.nativeElement.querySelector('.bar-chart-container');
    if (!containerElement) {
      console.error('Bar chart container element not found');
      return;
    }
    
    // Ensure container is cleared before initializing
    while (containerElement.firstChild) {
      containerElement.removeChild(containerElement.firstChild);
    }
    
    this.container = d3.select(containerElement);
    
    // Create tooltip once
    // Remove existing tooltip if it exists
    d3.select(this.el.nativeElement).selectAll('.bar-tooltip').remove();
    
    this.tooltip = d3.select(this.el.nativeElement)
      .append('div')
      .attr('class', 'bar-tooltip')
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
      .style('max-width', '200px')
      .style('text-align', 'left');
    
    // Log dimension info for debugging
    console.log('Bar chart container dimensions:', {
      width: containerElement.clientWidth,
      height: containerElement.clientHeight,
      offsetWidth: containerElement.offsetWidth,
      offsetHeight: containerElement.offsetHeight
    });
    
    // Create chart with logged dimensions
    this.createChart();
  }

  private updateChart(): void {
    // Remove existing chart
    if (this.container) {
      this.container.select('svg').remove();
      
      // Log updated dimensions
      const containerElement = this.container.node();
      if (containerElement) {
        console.log('Updating bar chart with dimensions:', {
          width: containerElement.clientWidth,
          height: containerElement.clientHeight
        });
      }
      
      // Create new chart with updated dimensions
      this.createChart();
    }
  }

  private createChart(): void {
    if (!this.data || !this.container || this.data.length === 0) return;

    // Get container dimensions
    const containerNode = this.container.node();
    if (!containerNode) return;
    
    // Check if we're in fullscreen mode by checking for parent element with full-expanded class
    const isFullscreen = !!containerNode.closest('.full-expanded');
    
    const containerWidth = this.width || containerNode.getBoundingClientRect().width;
    const containerHeight = containerNode.getBoundingClientRect().height;
    
    // Adjust margins based on screen size
    // Use smaller margins when space is constrained, larger when in fullscreen
    const margin = {
      top: isFullscreen ? 50 : 40,
      right: isFullscreen ? 40 : 30,
      bottom: isFullscreen ? 70 : 60,
      left: isFullscreen ? 70 : 60
    };
    
    const width = Math.max(containerWidth - margin.left - margin.right, 100);
    const height = Math.max(containerHeight - margin.top - margin.bottom - 40, 100);
    
    // Remove existing SVG before creating a new one to avoid duplication
    this.container.selectAll('svg').remove();

    // Create SVG element with calculated dimensions
    this.svg = this.container
      .append('svg')
      .attr('width', containerWidth) // Use full container width
      .attr('height', containerHeight) // Use full container height
      .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`) // Set viewBox for proper scaling
      .attr('preserveAspectRatio', 'xMinYMin meet') // Preserve aspect ratio but ensure chart fills space
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Adjust font sizes based on screen size
    const titleFontSize = isFullscreen ? '20px' : '14px';
    const subtitleFontSize = isFullscreen ? '16px' : '12px';
    const axisFontSize = isFullscreen ? '14px' : '12px';
    
    // Add chart title
    this.svg.append('text')
      .attr('class', 'chart-title')
      .attr('x', width / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .style('font-size', titleFontSize)
      .style('font-weight', 'bold')
      .style('fill', '#fff')
      .text(this.title);

    // Add chart subtitle
    this.svg.append('text')
      .attr('class', 'chart-subtitle')
      .attr('x', width / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .style('font-size', subtitleFontSize)
      .style('fill', '#ccc')
      .text(this.subtitle);

    // X axis - use fewer tick marks if width is small
    const x = d3.scaleBand()
      .domain(this.data.map(d => d.month))
      .range([0, width])
      .padding(0.2);

    // Reduce tick marks if container is narrow
    const xAxis = d3.axisBottom(x);
    if (width < 300) {
      xAxis.tickValues(this.data.filter((_, i) => i % 2 === 0).map(d => d.month));
    }

    this.svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-35)')
      .style('text-anchor', 'end')
      .style('font-size', axisFontSize)
      .style('fill', '#ddd');

    // Find max value for Y scale
    const yMax = d3.max(this.data, d => 
      Math.max(...d.values.map(v => v.amount))
    ) as number;
    
    // Y axis with fewer tick marks and more readable labels
    const y = d3.scaleLinear()
      .domain([0, yMax * 1.1]) // Add 10% padding at top
      .nice()
      .range([height, 0]);

    // Limit the number of y-axis ticks based on height
    const yTickCount = height < 150 ? 3 : 5;
    
    this.svg.append('g')
      .call(d3.axisLeft(y).ticks(yTickCount).tickFormat((d) => this.formatYLabel(d as number)))
      .selectAll('text')
      .style('font-size', axisFontSize)
      .style('fill', '#ddd');

    // Add X axis label
    this.svg.append('text')
      .attr('class', 'x-axis-label')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', axisFontSize)
      .style('fill', '#ddd')
      .text('Month');

    // Add Y axis label
    this.svg.append('text')
      .attr('class', 'y-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -margin.left + 15)
      .attr('text-anchor', 'middle')
      .style('font-size', axisFontSize)
      .style('fill', '#ddd')
      .text('Amount ($)');

    // Draw bars with improved interaction using Renderer2
    this.data.forEach((d, i) => {
      const barWidth = x.bandwidth() / d.values.length;
      
      d.values.forEach((v, j) => {
        // Get the label for this value
        const valueLabel = this.valueLabels[v.label] || v.label;
        
        const rect = this.svg.append('rect')
          .attr('class', `bar${j + 1} bar-interactive`)
          .attr('x', x(d.month)! + barWidth * j)
          .attr('y', y(v.amount))
          .attr('width', barWidth)
          .attr('height', height - y(v.amount))
          .attr('fill', this.colors[j % this.colors.length])
          .attr('rx', 3) // Rounded corners
          .attr('ry', 3);
          
        // Store the bar's data as properties for easy access during events
        rect.datum({
          month: d.month,
          valueLabel: valueLabel,
          amount: v.amount,
          colorIndex: j % this.colors.length
        });
        
        rect.on('mouseover', (event: MouseEvent) => {
          // Get the element and its data safely
          const target = event.target as SVGRectElement;
          const data = d3.select(target).datum() as any;
          
          // Enhanced tooltip
          this.tooltip.transition()
            .duration(200)
            .style('opacity', 0.9);
            
          this.tooltip.html(`
            <div style="font-weight:bold; margin-bottom:5px; color:${this.colors[data.colorIndex]}">
              ${data.valueLabel}
            </div>
            <div>Month: <strong>${data.month}</strong></div>
            <div>Amount: <strong>$${data.amount.toLocaleString()}</strong></div>
            <div style="font-size:10px; margin-top:5px; opacity:0.7">
              Click for detailed analysis
            </div>
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
            
          // Highlight bar on hover using Renderer2 approach
          this.renderer.setStyle(target, 'opacity', 0.8);
          this.renderer.setStyle(target, 'stroke', '#fff');
          this.renderer.setStyle(target, 'stroke-width', 2);
        })
        .on('mouseout', (event: MouseEvent) => {
          this.tooltip.transition()
            .duration(500)
            .style('opacity', 0);
            
          // Restore bar appearance using Renderer2
          const target = event.target as SVGRectElement;
          this.renderer.setStyle(target, 'opacity', 1);
          this.renderer.setStyle(target, 'stroke', 'none');
          this.renderer.removeStyle(target, 'stroke-width');
        })
        .on('click', (event: MouseEvent) => {
          const target = event.target as SVGRectElement;
          const data = d3.select(target).datum() as any;
          console.log(`Bar clicked: ${data.month} - ${data.valueLabel}: $${data.amount}`);
          // Future functionality could include detailed view/analytics
        });
      });
    });
    
    // Add a more descriptive legend with value labels
    const legendValues = this.data[0].values.map(v => this.valueLabels[v.label] || v.label);
    const legendX = width - 150;
    const legendY = 0;
    
    const legend = this.svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${legendX},${legendY})`);
      
    legendValues.forEach((value, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);
        
      legendRow.append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', this.colors[i % this.colors.length]);
        
      legendRow.append('text')
        .attr('x', 15)
        .attr('y', 9)
        .attr('font-size', '11px')
        .attr('fill', '#ddd')
        .text(value);
    });
  }
  
  // Helper method to format Y axis labels
  private formatYLabel(value: number): string {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value}`;
  }
}
