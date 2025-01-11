import { Component, OnInit, Input, ElementRef } from '@angular/core';
import * as d3 from 'd3';
import { BarChartData } from '../data-visualizations.interfaces';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.scss'],
  standalone: false
})

export class BarComponent implements OnInit {
  @Input() data: BarChartData[] | undefined;
  title = 'Bar Chart';
  colors: string[] = [];
  
  constructor(private el: ElementRef) { }

  ngOnInit(): void {
    this.createChart();
  }

  createChart(): void {
    const element = this.el.nativeElement;
    const data = this.data;

    if (data) {
      this.colors = ['#69b3a2', '#404080', '#ff4d4d'];
      const margin = { top: 10, right: 30, bottom: 40, left: 40 };
      const width = 390 - margin.left - margin.right;
      const height = 200 - margin.top - margin.bottom;

      const svg = d3.select(element)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const x = d3.scaleBand()
        .domain(data.map(d => d.month))
        .range([0, width])
        .padding(0.2);

      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => Math.max(...d.values.map(v => v.amount))) as number])
        .nice()
        .range([height, 0]);

      svg.append('g')
        .call(d3.axisLeft(y));

      data.forEach((d, i) => {
        d.values.forEach((v, j) => {
          svg.append('rect')
            .attr('class', `bar${j + 1}`)
            .attr('x', x(d.month)! + (x.bandwidth() / d.values.length) * j)
            .attr('y', y(v.amount))
            .attr('width', x.bandwidth() / d.values.length)
            .attr('height', height - y(v.amount))
            .attr('fill', this.colors[j]);
        });
      });
    }
  }
}
