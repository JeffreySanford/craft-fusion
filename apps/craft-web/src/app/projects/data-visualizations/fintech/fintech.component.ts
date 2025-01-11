import { Component, ElementRef, Input, ViewChild, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-fintech-chart',
  templateUrl: './fintech.component.html',
  styleUrls: ['./fintech.component.scss'],
  standalone: false
})
export class FintechComponent implements OnChanges {
  constructor(private cdr: ChangeDetectorRef) {}
  @Input() data: any[] = [];
  @ViewChild('chart', { static: true }) chartContainer!: ElementRef;

  colors: Record<string, string> = {
    LOL: 'blue',
    OMG: 'green',
    WTF: 'purple',
    BBQ: 'orange',
    ROFL: 'cyan'
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

      const margin = { top: 10, right: 10, bottom: 60, left: 30 };
      const width = element.offsetWidth - margin.left - margin.right;
      const height = element.offsetHeight - margin.top - margin.bottom;

      const svg = d3.select(element)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const tooltip = d3.select(element)
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

      const filteredData = this.data.filter(d => d.group !== 'extreme' && (d.trade === 'buy' || d.trade === 'sell'));
      const extremeEvents = this.data.filter(d => d.group === 'extreme');

      const x = d3.scaleTime()
        .domain([d3.min(filteredData, d => d.startTime)!, d3.max(filteredData, d => d.endTime)!])
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain([d3.min(filteredData, d => Math.min(d.startValue, d.endValue))!, d3.max(filteredData, d => Math.max(d.startValue, d.endValue))!])
        .range([height, 0]);

      const xAxis = d3.axisBottom(x).ticks(d3.timeYear.every(1));
      const yAxis = d3.axisLeft(y).ticks(5);

      svg.append('g').attr('class', 'x axis').attr('transform', `translate(0,${height})`).call(xAxis);
      svg.append('g').attr('class', 'y axis').call(yAxis);

      svg.selectAll('.bar')
        .data(filteredData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.startTime))
        .attr('y', d => y(Math.max(d.startValue, d.endValue)))
        .attr('width', d => x(d.endTime) - x(d.startTime))
        .attr('height', d => Math.abs(y(d.startValue) - y(d.endValue)))
        .attr('fill', d => this.colors[d.stockIndicator] || 'black')
        .on('mouseover', function(event, d) {
          tooltip.transition().duration(200).style('opacity', .9);
          tooltip.html(`Start: ${d.startValue}<br>End: ${d.endValue}`)
            .style('left', (event.pageX + 5) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
          tooltip.transition().duration(500).style('opacity', 0);
        });

      // Function to calculate the average value
      function averageValue(d: { startValue: number; endValue: number }) {
        return (d.startValue + d.endValue) / 2;
      }

      svg.selectAll('.extreme-bar')
        .data(extremeEvents)
        .enter()
        .append('rect')
        .attr('class', 'extreme-bar')
        .attr('x', d => {
          const xPos = x(d.startTime) - 2.5;
          console.log(`x: ${xPos}, startTime: ${d.startTime}`);
          return xPos;
        })
        .attr('y', d => {
          const avgValue = averageValue(d);
          const yPos = y(avgValue);
          console.log(`y: ${yPos}, avgValue: ${avgValue}`);
          return yPos;
        })
        .attr('width', 5)
        .attr('height', d => {
          const height = Math.abs(y(d.startValue) - y(d.endValue));
          console.log(`height: ${height}, startValue: ${d.startValue}, endValue: ${d.endValue}`);
          return height;
        })
        .attr('fill', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 2)
        .on('mouseover', function(event, d) {
          tooltip.transition().duration(200).style('opacity', .9);
          tooltip.html(`Start: ${d.startValue}<br>End: ${d.endValue}`)
            .style('left', (event.pageX + 5) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
          tooltip.transition().duration(500).style('opacity', 0);
        });

      // Add dashed line chart
      svg.selectAll('.line')
        .data(filteredData)
        .enter()
        .append('line')
        .attr('x1', d => x(d.startTime))
        .attr('y1', d => y(d.startValue))
        .attr('x2', d => x(d.endTime))
        .attr('y2', d => y(d.endValue))
        .attr('stroke', d => this.colors[d.stockIndicator] || 'black')
        .attr('stroke-dasharray', '5,5');

      // Add average lines for each stock
      const stockIndicators = Object.keys(this.colors).filter(key => key !== 'extreme');
      stockIndicators.forEach(stock => {
        const stockData = filteredData.filter(d => d.stockIndicator === stock);
        const avgData = d3.rollups(
          stockData,
          v => d3.mean(v, d => (d.startValue + d.endValue) / 2),
          d => d.startTime.getFullYear()
        ).filter(d => d[1] !== undefined) as [number, number][];
        const avgLine = d3.line()
          .x(d => x(new Date(d[0], 0, 1)))
          .y(d => y(d[1]!));

        svg.append('path')
          .datum(avgData)
          .attr('class', 'avg-line')
          .attr('fill', 'none')
          .attr('stroke', this.colors[stock])
          .attr('stroke-width', 2)
          .attr('d', avgLine);
      });
    }
  }
}
