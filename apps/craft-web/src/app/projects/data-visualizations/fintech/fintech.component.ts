import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import * as d3 from 'd3';
import { FintechChartData } from '../data-visualizations.interfaces';

@Component({
  selector: 'app-fintech-chart',
  templateUrl: './fintech.component.html',
  styleUrls: ['./fintech.component.scss'],
  standalone: false,
})
export class FintechComponent implements OnChanges {
  @Input() data: FintechChartData[] | undefined;
  @ViewChild('chart', { static: true }) private chartContainer: ElementRef | undefined;

  constructor(private cdr: ChangeDetectorRef) {}

  private colors = {
    buy: 'blue',
    sell: 'green',
    extreme: 'red',
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.renderChart();
    }
  }

  renderChart(): void {
    if (this.data && this.chartContainer) {
      const element = this.chartContainer.nativeElement;
      d3.select(element).selectAll('*').remove();
      const colors = [
        { name: 'GOOGL', color: 'blue' },
        { name: 'AMZN', color: 'green' },
        { name: 'BAH', color: 'purple' },
        { name: 'ACN', color: 'orange' },
      ];

      const margin = { top: 10, right: 10, bottom: 50, left: 50 };
      const width = element.offsetWidth - margin.left - margin.right;
      const height = element.offsetHeight - margin.top - margin.bottom;

      const svg = d3
        .select(element)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const x = d3
        .scaleTime()
        .domain([d3.min(this.data, d => d.startTime)!, d3.max(this.data, d => d.endTime)!])
        .range([0, width]);

      const y = d3
        .scaleLinear()
        .domain([d3.min(this.data, d => Math.min(d.startValue, d.endValue))!, d3.max(this.data, d => Math.max(d.startValue, d.endValue))!])
        .range([height, 0]);

      svg.append('g').attr('class', 'x axis').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat((domainValue: Date | d3.NumberValue) => d3.timeFormat("%b %Y")(domainValue instanceof Date ? domainValue : new Date(domainValue.valueOf()))));
      svg.append('g').attr('class', 'y axis').call(d3.axisLeft(y));

      svg
        .selectAll('.bar')
        .data(this.data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.startTime))
        .attr('y', d => y(Math.max(d.startValue, d.endValue)))
        .attr('width', d => x(d.endTime) - x(d.startTime))
        .attr('height', d => Math.abs(y(d.startValue) - y(d.endValue)))
        .attr('fill', d => colors.find(color => color.name === d.stockIndicator)?.color || 'black');

      // Add legend
      const legend = svg
        .selectAll('.legend')
        .data(colors)
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', (d, i) => `translate(0,${i * 20})`);

      legend
        .append('rect')
        .attr('x', width - 18)
        .attr('width', 18)
        .attr('height', 18)
        .style('fill', d => d.color);

      legend
        .append('text')
        .attr('x', width - 24)
        .attr('y', 9)
        .attr('dy', '.35em')
        .style('text-anchor', 'end')
        .text(d => d.name);

      this.cdr.detectChanges();
    }
  }
}
