import { Component, OnInit, Renderer2, ViewChild, Input, HostListener } from '@angular/core';
import * as d3 from 'd3';

interface DataPoint {
  startTime: string;
  endTime: string;
  startValue: number;
  endValue: number;
  stockIndicator: string;
  task: string;
}

@Component({
  selector: 'app-fintech-chart',
  templateUrl: './fintech.component.html',
  styleUrls: ['./fintech.component.scss'],
  standalone: false, // Added standalone: false as a requirement
})
export class FintechComponent implements OnInit {
  @ViewChild('chart', { static: true }) chartContainer!: any;
  @Input() data: DataPoint[] = [];

  private svg: any;
  private width!: number;
  private height!: number;
  private margin = { top: 20, right: 30, bottom: 150, left: 50 }; // Increased bottom margin for legend

  constructor(private renderer: Renderer2) {}

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.updateChartDimensions();
    this.createChart();
  }

  ngOnInit(): void {
    if (this.data) {
      this.data = this.data.filter(d => d.startTime && d.endTime && !isNaN(d.startValue) && !isNaN(d.endValue));
      this.updateChartDimensions();
      this.createChart();
    }
  }

  private updateChartDimensions(): void {
    const element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = 400 - this.margin.top - this.margin.bottom;
  }

  private createChart(): void {
    const element = this.chartContainer.nativeElement;

    // Remove any existing SVG
    const existingSvg = this.renderer.selectRootElement(element).querySelector('svg');
    if (existingSvg) {
      this.renderer.removeChild(element, existingSvg);
    }

    this.svg = d3
      .select(element)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // X Scale (time range)
    const x = d3
      .scaleTime()
      .domain(d3.extent(this.data, (d: DataPoint) => new Date(d.startTime)).filter((d: Date | undefined): d is Date => !!d))
      .range([0, this.width]);

    console.log('X scale domain:', x.domain());

    // Y Scale (values)
    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(
          this.data.map((d: DataPoint) => Math.max(d.startValue ?? 0, d.endValue ?? 0)) as number[]
        ) as number,
      ])
      .range([this.height, 0]);

    console.log('Y scale domain:', y.domain());

    // Axes
    this.svg.append('g').attr('transform', `translate(0,${this.height})`).call(d3.axisBottom(x));
    this.svg.append('g').call(d3.axisLeft(y));

    // Colors
    const uniqueStocks = [...new Set(this.data.map((d) => d.stockIndicator))];
    console.log('Unique stocks:', uniqueStocks);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(uniqueStocks);

    // Debug: Verify grouped data
    const groupedData = d3.group(this.data, (d) => d.stockIndicator);
    console.log('Grouped Data:', groupedData);

    // Add Lines for Each Stock
    groupedData.forEach((stockData, stockIndicator) => {
      console.log(`Drawing line for stock: ${stockIndicator}`);
      const line = d3
        .line<DataPoint>()
        .x((d) => {
          const posX = x(new Date(d.startTime));
          return isNaN(posX) ? 0 : posX;
        })
        .y((d) => {
          const posY = y((d.startValue + d.endValue) / 2);
          return isNaN(posY) ? this.height : posY;
        });

      this.svg
        .append('path')
        .datum(stockData)
        .attr('fill', 'none')
        .attr('stroke', colorScale(stockIndicator))
        .attr('stroke-width', 2)
        .attr('d', line);
    });

    // Add Gantt Bars (start to end values for each quarter)
    const barWidth = Math.max(5, this.width / (this.data.length * uniqueStocks.length)); // Dynamic bar width
    console.log('Bar width:', barWidth);

    this.svg
      .selectAll('.gantt-bar')
      .data(this.data)
      .enter()
      .append('rect')
      .attr('class', 'gantt-bar')
      .attr('x', (d: DataPoint) => {
        const posX = x(new Date(d.startTime));
        console.log(`Bar X position for ${d.stockIndicator}:`, posX);
        return isNaN(posX) ? 0 : posX;
      })
      .attr('y', (d: DataPoint) => {
        const posY = y(Math.max(d.startValue, d.endValue));
        console.log(`Bar Y position for ${d.stockIndicator}:`, posY);
        return isNaN(posY) ? this.height : posY;
      })
      .attr('width', barWidth)
      .attr('height', (d: DataPoint) => {
        const height = y(Math.min(d.startValue, d.endValue)) - y(Math.max(d.startValue, d.endValue));
        console.log(`Bar height for ${d.stockIndicator}:`, height);
        return isNaN(height) ? 0 : height;
      })
      .attr('fill', (d: DataPoint) => {
        const color = colorScale(d.stockIndicator);
        console.log(`Bar color for ${d.stockIndicator}:`, color);
        return color;
      })
      .on('mouseover', (event: MouseEvent, d: DataPoint) => {
        console.log(`Mouseover on ${d.stockIndicator}`);
        tooltip.style('opacity', 1)
          .html(
            `<strong>${d.stockIndicator}</strong><br/>Task: ${d.task}<br/>Start Value: ${d.startValue}<br/>End Value: ${d.endValue}`
          )
          .style('left', `${event.pageX + 5}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        console.log('Mouseout');
        tooltip.style('opacity', 0);
      });

    // Tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('text-align', 'center')
      .style('width', '150px')
      .style('padding', '5px')
      .style('font', '12px sans-serif')
      .style('background', 'lightsteelblue')
      .style('border', '0px')
      .style('border-radius', '8px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    // Add Legend
    const legend = this.svg
      .selectAll('.legend')
      .data(uniqueStocks)
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (d: string, i: number) => `translate(0, ${this.height + 20 + i * 20})`);

    legend
      .append('rect')
      .attr('x', 0)
      .attr('width', 18)
      .attr('height', 18)
      .style('fill', (d: string) => {
        const color = colorScale(d);
        console.log(`Legend color for ${d}:`, color);
        return color;
      });

    legend
      .append('text')
      .attr('x', 24)
      .attr('y', 9)
      .attr('dy', '.35em')
      .style('text-anchor', 'start')
      .style('font', '12px sans-serif')
      .text((d: string) => {
        console.log(`Legend text for ${d}`);
        return `${d}`;
      });
  }
}
