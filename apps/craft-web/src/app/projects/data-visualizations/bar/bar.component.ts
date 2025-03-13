import { Component, OnInit, Input, ElementRef, OnDestroy, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
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
  title = 'Bar Chart';
  colors: string[] = ['#69b3a2', '#404080', '#ff4d4d'];
  private destroy$ = new Subject<void>();
  private svg: any;
  private container: any;
  private resizeObserver: ResizeObserver | null = null;
  
  constructor(private el: ElementRef) { }

  ngOnInit(): void {
    // Colors are initialized here
  }

  ngAfterViewInit(): void {
    // Initialize the chart after the view has been initialized
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
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Update chart if data changes
    if (changes['data'] && !changes['data'].firstChange) {
      this.updateChart();
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
    this.container = d3.select(this.el.nativeElement.querySelector('.bar-chart-container'));
    this.createChart();
  }

  private updateChart(): void {
    // Remove existing chart
    this.container.select('svg').remove();
    
    // Create new chart with updated dimensions
    this.createChart();
  }

  private createChart(): void {
    if (!this.data || !this.container || this.data.length === 0) return;

    // Get actual container dimensions
    const containerNode = this.container.node();
    if (!containerNode) return;
    
    const containerWidth = containerNode.getBoundingClientRect().width;
    // Use a reasonable aspect ratio, or calculate based on available height
    const containerHeight = Math.min(containerWidth * 0.6, 300);
    
    // Setup margins
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = Math.max(containerWidth - margin.left - margin.right, 100);
    const height = Math.max(containerHeight - margin.top - margin.bottom, 100);

    // Create SVG element with calculated dimensions
    this.svg = this.container
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X axis
    const x = d3.scaleBand()
      .domain(this.data.map(d => d.month))
      .range([0, width])
      .padding(0.2);

    this.svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '12px')
      .style('fill', '#ddd');

    // Find max value for Y scale
    const yMax = d3.max(this.data, d => 
      Math.max(...d.values.map(v => v.amount))
    ) as number;
    
    // Y axis
    const y = d3.scaleLinear()
      .domain([0, yMax * 1.1]) // Add 10% padding at top
      .nice()
      .range([height, 0]);

    this.svg.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#ddd');

    // Draw bars
    this.data.forEach((d, i) => {
      const barWidth = x.bandwidth() / d.values.length;
      
      d.values.forEach((v, j) => {
        this.svg.append('rect')
          .attr('class', `bar${j + 1}`)
          .attr('x', x(d.month)! + barWidth * j)
          .attr('y', y(v.amount))
          .attr('width', barWidth)
          .attr('height', height - y(v.amount))
          .attr('fill', this.colors[j % this.colors.length])
          .attr('rx', 3) // Rounded corners
          .attr('ry', 3);
          
        // Add hover effect
        this.svg.append('title')
          .text(`${d.month}: ${v.label} - ${v.amount}`);
      });
    });
    
    // Add a title if needed
    this.svg.append('text')
      .attr('x', width / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', '#fff')
      .text('Monthly Comparison');
  }
}
