import { Component, ElementRef, Input, ViewChild, Renderer2, OnInit, OnChanges } from '@angular/core';
import * as d3 from 'd3';

interface Stock {
  symbol: string;
  data: { date: Date; close: number }[];
}

@Component({
  selector: 'app-finance-chart',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss'],
  standalone: false,
})

export class FinanceComponent implements OnInit, OnChanges {
  @Input() data: any[] = [];
  @ViewChild('chart', { static: true }) chartContainer!: ElementRef;
  stocks: any[] = [];
  resolved: boolean = false;

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    // Initial setup if needed
  }

  ngOnChanges(): void {
    if (this.data) {
      this.stocks = this.data.map((stock: any) => stock.symbol);
      if(this.stocks.length > 0) {
        debugger
        this.renderChart(this.data);
      }
    }
  }

  renderChart(stocks: { symbol: string; data: { date: Date; close: number }[] }[]): void {
    if (this.chartContainer) {
      const element = this.renderer.selectRootElement(this.chartContainer.nativeElement);
      d3.select(element).selectAll('*').remove();

      if (this.data.length === 0) {
        d3.select(element).append('text').attr('x', '50%').attr('y', '50%').attr('text-anchor', 'middle').text('No data available');
        return;
      }

      const margin = { top: 10, right: 10, bottom: 60, left: 30 };
      const width = element.offsetWidth - margin.left - margin.right;
      const height = element.offsetHeight - margin.top - margin.bottom;

      const svg = d3
        .select(element)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const tooltip = d3.select(element).append('div').attr('class', 'tooltip').style('opacity', 0);

      const color = d3.scaleOrdinal(d3.schemeCategory10);

      stocks.forEach((stock: Stock, index: number) => {
        const formattedData = stock.data.map((d: { date: Date; close: number }) => ({
          date: d.date,
          close: +d.close,
        }));

        const x = d3
          .scaleTime()
          .domain(d3.extent(formattedData, (d: { date: Date; close: number }) => d.date) as [Date, Date])
          .range([0, width]);

        const y = d3
          .scaleLinear()
          .domain([d3.min(formattedData, (d: { date: Date; close: number }) => +d.close)!, d3.max(formattedData, (d: { date: Date; close: number }) => +d.close)!])
          .range([height, 0]);

        const xAxis = d3.axisBottom(x).ticks(d3.timeMonth.every(2)).tickFormat((domainValue: Date | d3.NumberValue) => {
          return d3.timeFormat('%m/%y')(domainValue instanceof Date ? domainValue : new Date(domainValue.valueOf()));
        });
        const yAxis = d3.axisLeft(y).ticks(5);

        if (index === 0) {
          svg.append('g').attr('class', 'x axis').attr('transform', `translate(0,${height})`).call(xAxis);
          svg.append('g').attr('class', 'y axis').call(yAxis);
        }

        const line = d3
          .line<{ date: Date; close: number }>()

          .x(d => x(d.date))
          .y(d => y(d.close));

        svg
          .append('path')
          .datum(formattedData)
          .attr('class', `line stock-${stock.symbol.toLowerCase()}`)
          .attr('d', line)
          .attr('stroke', color(index.toString()))
          .attr('fill', 'none');

        // Add circles for each data point to enable tooltip
        svg
          .selectAll(`.dot-${index}`)
          .data(formattedData)
          .enter()
          .append('circle')
          .attr('class', `dot dot-${index}`)
          .attr('cx', d => x(d.date))
          .attr('cy', d => y(d.close))
          .attr('r', 1)
          .attr('fill', color(index.toString()))
          .on('mouseover', function (event, d) {
            tooltip.transition().duration(200).style('opacity', 0.9);
            tooltip
              .html(`Date: ${d.date.toLocaleDateString()}<br>Close: ${d.close}`)
              .style('left', '50%')
              .style('top', '0.5em')
              .style('transform', 'translateX(-50%)');
            d3.select(this).attr('r', 3); // Highlight the circle
            svg
              .append('line')
              .attr('class', 'hover-line')
              .attr('x1', x(d.date))
              .attr('x2', x(d.date))
              .attr('y1', 0)
              .attr('y2', height)
              .attr('stroke', 'gray')
              .attr('stroke-width', 1)
              .attr('stroke-dasharray', '4');
          })
          .on('mouseout', function () {
            tooltip.transition().duration(500).style('opacity', 0);
            d3.select(this).attr('r', 1); // Remove highlight from the circle
            svg.selectAll('.hover-line').remove(); // Remove the hover line
          });

      });

      // Add legend
      const legend = svg
        .selectAll('.legend')
        .data(stocks)
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', (d, i) => `translate(0,${i * 20})`);

      legend
        .append('rect')
        .attr('x', width - 18)
        .attr('width', 18)
        .attr('height', 18)
        .style('fill', (d, i) => color(i.toString()));

      legend
        .append('text')
        .attr('x', width - 24)
        .attr('y', 9)
        .attr('dy', '.35em')
        .style('text-anchor', 'end')
        .text(d => d.symbol);
    }
  }
}
