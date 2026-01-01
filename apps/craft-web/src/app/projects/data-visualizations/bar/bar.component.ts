import { Component, OnInit, Input, ElementRef, OnDestroy, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import * as d3 from 'd3';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

interface MetricData {
  year: number;
  value: number;
}

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.scss'],
  standalone: false,
})
export class BarComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @Input() data: MetricData[] = [];                                       
  @Input() width: number = 0;
  @Input() height: number = 0;
  @Input() showLegend: boolean = false;                        

  colors: string[] = ['#2196F3', '#FF5722', '#4CAF50'];

  legendItems: string[] = ['GDP Growth', 'Population', 'Industrial Output'];

  currentMetric: string = 'gdp';

  private destroy$ = new Subject<void>();
  private resizeObserver: ResizeObserver | null = null;
  private tooltip: any;

  private gdpData: MetricData[] = [
    { year: 1776, value: 0.0004 },
    { year: 1800, value: 0.002 },
    { year: 1850, value: 0.01 },
    { year: 1900, value: 0.3 },
    { year: 1950, value: 2.3 },
    { year: 2000, value: 10 },
    { year: 2024, value: 27.5 },
  ];

  private lifeExpectancyData: MetricData[] = [
    { year: 1776, value: 35 },
    { year: 1800, value: 39 },
    { year: 1850, value: 43 },
    { year: 1900, value: 48 },
    { year: 1950, value: 68 },
    { year: 2000, value: 76 },
    { year: 2024, value: 79 },
  ];

  private internetData: MetricData[] = [
    { year: 1950, value: 0 },
    { year: 1980, value: 0.01 },
    { year: 1990, value: 0.5 },
    { year: 2000, value: 120 },
    { year: 2010, value: 220 },
    { year: 2024, value: 330 },
  ];

  private metricLabels: { [key: string]: string } = {
    gdp: 'GDP (Trillions)',
    lifeExpectancy: 'Life Expectancy (Years)',
    internet: 'Internet Users (Millions)',
  };

  private metricColors: { [key: string]: string } = {
    gdp: '#3C3B6E',                          
    lifeExpectancy: '#B22234',                    
    internet: '#3498db',                                  
  };

  constructor(private el: ElementRef) {}

  ngOnInit(): void {

    if (!this.legendItems || this.legendItems.length === 0) {
      this.legendItems = ['GDP Growth', 'Life Expectancy', 'Internet Usage'];
    }
  }

  ngAfterViewInit(): void {

    setTimeout(() => {
      this.initChart();

      this.setupResizeObserver();

      fromEvent(window, 'resize')
        .pipe(debounceTime(250), takeUntil(this.destroy$))
        .subscribe(() => {
          this.updateChart();
        });
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges): void {

    if ((changes['width'] || changes['height']) && this.el.nativeElement.querySelector('#barChart')) {
      setTimeout(() => this.updateChart(), 150);
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
    if (typeof ResizeObserver !== 'undefined') {
      const container = this.el.nativeElement.querySelector('.bar-chart');
      if (container) {
        this.resizeObserver = new ResizeObserver(() => {
          this.updateChart();
        });
        this.resizeObserver.observe(container);
      }
    }
  }

  private initChart(): void {

    const chartElement = this.el.nativeElement.querySelector('#barChart');
    if (!chartElement) return;

    chartElement.innerHTML = '';

    d3.select(this.el.nativeElement).selectAll('.bar-tooltip').remove();
    this.tooltip = d3
      .select(this.el.nativeElement)
      .append('div')
      .attr('class', 'bar-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('z-index', '10');

    this.createChart();
  }

  private updateChart(): void {
    const chartElement = this.el.nativeElement.querySelector('#barChart');
    if (!chartElement) return;

    chartElement.innerHTML = '';

    this.createChart();
  }

  private createChart(): void {
    const chartElement = this.el.nativeElement.querySelector('#barChart');
    if (!chartElement) return;

    const containerRect = chartElement.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height || 400;                   

    const isFullscreen = !!chartElement.closest('.full-expanded');

    const margin = {
      top: isFullscreen ? 50 : 40,
      right: isFullscreen ? 40 : 20,
      bottom: isFullscreen ? 80 : 60,
      left: isFullscreen ? 80 : 60,
    };

    const width = Math.max(containerWidth - margin.left - margin.right, 100);
    const height = Math.max(containerHeight - margin.top - margin.bottom - 100, 200);                                  

    const svg = d3
      .select(chartElement)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const currentData = this.getCurrentData();

    const xScale = d3
      .scaleBand()
      .domain(currentData.map(d => d.year.toString()))
      .range([0, width])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(currentData, d => d.value) as number])
      .nice()
      .range([height, 0]);

    svg
      .append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(xScale).tickSize(0))
      .selectAll('text')
      .style('font-size', isFullscreen ? '16px' : '14px')
      .style('fill', '#fff');

    svg
      .append('g')
      .call(d3.axisLeft(yScale).ticks(6))
      .selectAll('text')
      .style('font-size', isFullscreen ? '16px' : '14px')
      .style('fill', '#fff');

    const barColor = this.metricColors[this.currentMetric] || '#3C3B6E';

    svg
      .selectAll('rect')
      .data(currentData)
      .enter()
      .append('rect')
      .attr('x', d => xScale(d.year.toString()) as number)
      .attr('width', xScale.bandwidth())
      .attr('y', height)                                 
      .attr('height', 0)                                     
      .attr('fill', barColor)
      .attr('rx', 5)
      .style('filter', 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))')                               
      .transition()
      .duration(1000)
      .delay((_, i) => i * 100)
      .attr('y', d => yScale(d.value))
      .attr('height', d => height - yScale(d.value));

    setTimeout(() => {
      svg
        .selectAll('rect')
        .on('mouseover', (event, d) => {
          const data = d as MetricData;
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr('fill', this.currentMetric === 'gdp' ? '#5C6BC0' : this.currentMetric === 'lifeExpectancy' ? '#E57373' : '#64B5F6')
            .style('filter', 'drop-shadow(0 3px 5px rgba(0,0,0,0.4))');

          let tooltipContent = '';
          if (this.currentMetric === 'gdp') {
            tooltipContent = `<strong>${data.year}</strong><br>GDP: $${data.value} Trillion`;
          } else if (this.currentMetric === 'lifeExpectancy') {
            tooltipContent = `<strong>${data.year}</strong><br>Life Expectancy: ${data.value} years`;
          } else if (this.currentMetric === 'internet') {
            tooltipContent = `<strong>${data.year}</strong><br>Internet Users: ${data.value} Million`;
          }

          this.tooltip
            .html(tooltipContent)
            .style('opacity', 0.9)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 28}px`);
        })
        .on('mouseout', event => {
          d3.select(event.currentTarget).transition().duration(200).attr('fill', barColor).style('filter', 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))');

          this.tooltip.style('opacity', 0);
        });
    }, 1100);                                          

    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height + (isFullscreen ? 50 : 40))
      .style('text-anchor', 'middle')
      .style('fill', '#fff')
      .style('font-size', isFullscreen ? '18px' : '14px')
      .text('Year');

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -margin.left + (isFullscreen ? 30 : 20))
      .style('text-anchor', 'middle')
      .style('fill', '#fff')
      .style('font-size', isFullscreen ? '18px' : '14px')
      .text(this.metricLabels[this.currentMetric] || 'Value');

    let title = 'US Progress (1776-2024)';
    if (this.currentMetric === 'gdp') {
      title = 'US GDP Growth (1776-2024)';
    } else if (this.currentMetric === 'lifeExpectancy') {
      title = 'US Life Expectancy (1776-2024)';
    } else if (this.currentMetric === 'internet') {
      title = 'US Internet Usage (1950-2024)';
    }

    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', isFullscreen ? '24px' : '18px')
      .style('font-weight', 'bold')
      .style('fill', '#fff')
      .text(title);
  }

  private getCurrentData(): MetricData[] {
    switch (this.currentMetric) {
      case 'lifeExpectancy':
        return this.lifeExpectancyData;
      case 'internet':
        return this.internetData;
      case 'gdp':
      default:
        return this.gdpData;
    }
  }

  toggleMetric(metric: string, event: MouseEvent): void {

    event.stopPropagation();

    if (this.currentMetric !== metric) {
      this.currentMetric = metric;
      this.updateChart();
    }
  }

  public toggleLegend(): boolean {
    this.showLegend = !this.showLegend;
    return this.showLegend;
  }
}
