import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import * as d3 from 'd3';
import { NumberValue } from 'd3-scale';
import { LineChartData } from '../data-visualizations.interfaces';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.scss'],
  standalone: false,
})
export class LineComponent implements OnInit, AfterViewInit {
  @Input() data: LineChartData[] = [];

  @ViewChild('chart') private chartContainer: ElementRef | undefined;

  constructor() {}
  ngOnInit(): void {
    // Initialization logic if needed
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  private createChart(): void {
    if (!this.chartContainer) return;

    const element = this.chartContainer.nativeElement;
    d3.select(element).select('svg').remove();

    const svg = d3.select(element).append('svg').attr('width', '100%').attr('height', '100%');

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = element.offsetHeight - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    const line1 = d3
      .line<LineChartData>()
      .x(d => x(d.date))
      .y(d => y(d.series1));

    const line2 = d3
      .line<LineChartData>()
      .x(d => x(d.date))
      .y(d => y(d.series2));

    const line3 = d3
      .line<LineChartData>()
      .x(d => x(d.date))
      .y(d => y(d.series3));

    const xDomain = d3.extent(this.data, d => d.date) as [Date, Date];
    x.domain(xDomain);
    y.domain([0, d3.max(this.data.map(d => Math.max(d.series1, d.series2, d.series3))) as number]);

    const xAxis = d3.axisBottom(x).tickFormat((d: Date | NumberValue, i: number) => d3.timeFormat('%b')(d as Date));

    g.append('g').attr('transform', `translate(0,${height})`).call(xAxis as any);

    g.append('g').call(d3.axisLeft(y));

    g.append('path').datum(this.data).attr('fill', 'none').attr('stroke', 'steelblue').attr('stroke-width', 1.5).attr('d', line1(this.data));

    g.append('path').datum(this.data).attr('fill', 'none').attr('stroke', 'green').attr('stroke-width', 1.5).attr('d', line2(this.data));

    g.append('path').datum(this.data).attr('fill', 'none').attr('stroke', 'red').attr('stroke-width', 1.5).attr('d', line3(this.data));
  }
}
