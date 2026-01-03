import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges, Renderer2, OnDestroy } from '@angular/core';
import * as d3 from 'd3';
import { NumberValue } from 'd3-scale';
import { LineChartData } from '../data-visualizations.interfaces';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

type LineSeriesKey = Exclude<keyof LineChartData, 'date'>;

interface LegendEntry {
  name: string;
  color: string;
  seriesKey: LineSeriesKey;
  path: d3.Selection<SVGPathElement, LineChartData[], SVGGElement, unknown>;
}

@Component({
  selector: 'app-line-chart',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.fixed.scss'],
  standalone: false,
})
export class LineComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() data: LineChartData[] = [];
  @Input() width: number = 0;
  @Input() height: number = 0;
  @Input() compact: boolean = false;

  @ViewChild('chart') private chartContainer: ElementRef | undefined;

  chartTitle: string = 'American Space Achievements';
  chartSubtitle: string = 'Advancing the Final Frontier';

  seriesLabels = ['NASA Missions', 'Astronaut Hours in Space', 'Space Innovations'];
  seriesAccessors: Array<(d: LineChartData) => number> = [
    d => d.series1,
    d => d.series2,
    d => d.series3,
  ];

  colors = ['var(--md-sys-color-primary, #B22234)', 'var(--md-sys-color-on-primary, #FFFFFF)', 'var(--md-sys-color-secondary, #3C3B6E)'];

  private tooltip: any;

  private resizeObserver: ResizeObserver | null = null;
  private destroy$ = new Subject<void>();

  statusMessage: string = '';
  showStatus: boolean = false;

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {

    fromEvent(window, 'resize')
      .pipe(debounceTime(250), takeUntil(this.destroy$))
      .subscribe(() => {
        this.createChart();
      });
  }

  ngAfterViewInit(): void {

    setTimeout(() => {
      this.createChart();
      this.setupResizeObserver();

      setTimeout(() => {
        if (this.chartContainer && (this.chartContainer.nativeElement.offsetWidth < 100 || this.chartContainer.nativeElement.offsetHeight < 100)) {
          this.createChart();
        }
      }, 300);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['width'] || changes['data'] || changes['height'] || changes['compact']) && this.chartContainer && this.chartContainer.nativeElement) {
      setTimeout(() => {
        this.createChart();
      });
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
    if (typeof ResizeObserver !== 'undefined' && this.chartContainer) {
      const container = this.chartContainer.nativeElement;
      this.resizeObserver = new ResizeObserver(() => {
        this.createChart();
      });
      this.resizeObserver.observe(container);
    }
  }

  private createChart(): void {
    if (!this.chartContainer) return;

    const element = this.chartContainer.nativeElement;
    d3.select(element).select('svg').remove();

    const isFullscreen = !!element.closest('.full-expanded');
    const isCompact = this.compact && !isFullscreen;

    d3.select(element).selectAll('.line-tooltip').remove();

    this.tooltip = d3
      .select('body')                                                            
      .append('div')
      .attr('class', 'line-tooltip')
      .style('opacity', 0);

    d3.select(element.parentNode).style('width', '100%').style('height', '100%');

    d3.select(element).style('width', '100%').style('height', '100%');

    const svg = d3.select(element).append('svg').attr('width', '100%').attr('height', '100%').style('display', 'block').attr('preserveAspectRatio', 'xMinYMin meet');

    let containerWidth = element.offsetWidth || element.parentNode.offsetWidth;
    let containerHeight = element.offsetHeight || element.parentNode.offsetHeight;

    if (!containerWidth || containerWidth < 100) containerWidth = 800;
    if (!containerHeight || containerHeight < 100) containerHeight = 400;

    svg.attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`);

    const margin = {
      top: Math.min(containerHeight * 0.08, 40),
      right: Math.min(containerWidth * 0.08, 50),
      bottom: Math.min(containerHeight * 0.12, 50),
      left: Math.min(containerWidth * 0.1, 50),
    };

    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const defs = svg.append('defs');
    const clipId = `line-clip-${Math.random().toString(36).slice(2, 8)}`;

    defs
      .append('clipPath')
      .attr('id', clipId)
      .append('rect')
      .attr('width', width)
      .attr('height', height);

    const titleFontSize = Math.max(containerWidth * 0.022, isFullscreen ? 22 : isCompact ? 14 : 16);
    const subtitleFontSize = Math.max(containerWidth * 0.016, isFullscreen ? 18 : 14);
    const axisFontSize = Math.max(containerWidth * 0.011, isFullscreen ? 14 : isCompact ? 10 : 11);

    svg
      .append('text')
      .attr('class', 'chart-title')
      .attr('x', containerWidth / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .style('font-size', `${titleFontSize}px`)
      .style('font-weight', 'bold')
      .style('fill', 'var(--md-sys-color-primary, #B22234)')                                     
      .text(this.chartTitle);

    if (!isCompact) {
      svg
        .append('text')
        .attr('class', 'chart-subtitle')
        .attr('x', containerWidth / 2)
        .attr('y', margin.top * 0.8)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .style('font-size', `${subtitleFontSize}px`)
        .style('fill', 'var(--md-sys-color-on-primary, #FFFFFF)')                             
        .text(this.chartSubtitle);
    }

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    const line1 = d3
      .line<LineChartData>()
      .x((d: LineChartData) => x(d.date))
      .y((d: LineChartData) => y(d.series1))
      .curve(d3.curveMonotoneX);

    const line2 = d3
      .line<LineChartData>()
      .x((d: LineChartData) => x(d.date))
      .y((d: LineChartData) => y(d.series2))
      .curve(d3.curveMonotoneX);

    const line3 = d3
      .line<LineChartData>()
      .x((d: LineChartData) => x(d.date))
      .y((d: LineChartData) => y(d.series3))
      .curve(d3.curveMonotoneX);

    const seriesSpecs: Array<{ lineFunc: (d: LineChartData[]) => string | null; def: { key: LineSeriesKey; name: string; accessor: (d: LineChartData) => number }; color: string }> = [
      { lineFunc: line1, def: { key: 'series1', name: 'NASA Missions', accessor: d => d.series1 }, color: this.colors[0] as string },
      { lineFunc: line2, def: { key: 'series2', name: 'Astronaut Hours in Space', accessor: d => d.series2 }, color: this.colors[1] as string },
      { lineFunc: line3, def: { key: 'series3', name: 'Space Innovations', accessor: d => d.series3 }, color: this.colors[2] as string },
    ];

    const xDomain = d3.extent(this.data, d => d.date) as [Date, Date];
    x.domain(xDomain);

    const yMax = d3.max(this.data.map(d => Math.max(d.series1, d.series2, d.series3))) as number;
    y.domain([0, yMax * 1.1]).nice();                                            

    const tickCount = Math.max(Math.floor(width / 80), 4);                                           
    const xAxis = d3
      .axisBottom(x)
      .ticks(tickCount)
      .tickFormat((d: Date | NumberValue) => {
        const date = d as Date;

        return width < 500
          ? d3.timeFormat('%b')(date)                               
          : d3.timeFormat('%b %y')(date);                  
      });

    g.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)')
      .style('font-size', `${axisFontSize}px`)
      .style('fill', 'var(--md-sys-color-surface-variant, #ddd)');

    const yTickCount = Math.max(Math.floor(height / 50), 3);                                            
    g.append('g')
      .attr('class', 'y axis')
      .call(d3.axisLeft(y).ticks(yTickCount).tickFormat(this.formatYValue))
      .selectAll('text')
      .style('font-size', `${axisFontSize}px`)
      .style('fill', 'var(--md-sys-color-surface-variant, #ddd)');

    if (!isCompact) {
      g.append('text')
        .attr('class', 'x-axis-label')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom * 0.6)                                     
        .attr('text-anchor', 'middle')
        .style('font-size', `${axisFontSize * 1.1}px`)
        .style('fill', 'var(--md-sys-color-on-primary, #FFFFFF)')                             
        .text('Timeline');

      g.append('text')
        .attr('class', 'y-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left * 0.6)                               
        .attr('x', -height / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', `${axisFontSize * 1.1}px`)
        .style('fill', 'var(--md-sys-color-on-primary, #FFFFFF)')                             
        .text('Achievement Metrics');
    }

    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .ticks(yTickCount)
          .tickSize(-width)
          .tickFormat(() => ''),
      )
      .selectAll('line')
      .style('stroke', 'rgba(255, 255, 255, 0.1)')
      .style('stroke-dasharray', '2,2');

    g.append('g')
      .attr('class', 'grid vertical-grid')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(tickCount)
          .tickSize(-height)
          .tickFormat(() => ''),
      )
      .selectAll('line')
      .style('stroke', 'rgba(255, 255, 255, 0.05)')
      .style('stroke-dasharray', '2,2');

    const legendEntries: LegendEntry[] = [];
    const baseStrokeWidth = isFullscreen ? 3 : 2;
    const hoverStrokeWidth = isFullscreen ? 5 : 3;
    const defaultStrokeOpacity = 0.92;
    const fadedStrokeOpacity = 0.25;

    const highlightLines = (activeName: string | null): void => {
      legendEntries.forEach(entry => {
        const isActive = activeName === entry.name;
        entry.path
          .transition()
          .duration(200)
          .attr('stroke-width', isActive ? hoverStrokeWidth : baseStrokeWidth)
          .attr('stroke-opacity', isActive || !activeName ? defaultStrokeOpacity : fadedStrokeOpacity);
      });
    };

    const drawLine = (
      lineFunc: (d: LineChartData[]) => string | null,
      data: LineChartData[],
      color: string,
      seriesDef: { key: LineSeriesKey; name: string; accessor: (d: LineChartData) => number },
      seriesIndex: number,
    ) => {
      const { key: seriesKey, name: seriesName, accessor } = seriesDef;
      const animDuration = Math.min(Math.max(width / 3, 500), 1500);

      const gradientId = `line-gradient-${seriesKey}-${Math.floor(Math.random() * 10000)}`;
      const gradient = defs
        .append('linearGradient')
        .attr('id', gradientId)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      gradient.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.45);
      gradient.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0);

      const path = g
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', baseStrokeWidth)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('stroke-opacity', defaultStrokeOpacity)
        .attr('class', 'line')
        .attr('d', (d: LineChartData[]) => lineFunc(d) as string);

      const pathLength = path.node()?.getTotalLength() || 0;
      path.attr('stroke-dasharray', pathLength).attr('stroke-dashoffset', pathLength).transition().duration(animDuration).attr('stroke-dashoffset', 0);

      if (height > 150) {
        const areaGenerator = d3
          .area<LineChartData>()
          .x(d => x(d.date))
          .y0(height)
          .y1(d => y(accessor(d)))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(data)
          .attr('class', 'area')
          .attr('fill', `url(#${gradientId})`)
          .attr('d', (d: LineChartData[]) => areaGenerator(d) as string)
          .attr('clip-path', `url(#${clipId})`)
          .style('opacity', 0)
          .transition()
          .delay(animDuration * 0.4)
          .duration(animDuration * 0.8)
          .style('opacity', 1);
      }

      const pointSize = Math.max(Math.min((width + height) / 300, 7), 3);

      const circles = g
        .selectAll(`.dot-series${seriesIndex + 1}`)
        .data(data as LineChartData[])
        .enter()
        .append('circle')
        .attr('class', `dot-series${seriesIndex + 1}`)
        .attr('cx', (d: LineChartData) => x(d.date))
        .attr('cy', (d: LineChartData) => y(accessor(d)))
        .attr('r', 0)
        .attr('fill', color)
        .attr('stroke', 'var(--md-sys-color-on-primary, #fff)')
        .attr('stroke-width', 1)
        .attr('opacity', 0.7);

      circles.each(function (this: any, d: LineChartData) {
        const circle = d3.select(this);
        circle.datum({
          ...(d as any),
          seriesKey: seriesKey,
          seriesName: seriesName,
          color: color,
        });
      });

      circles
        .transition()
        .delay((_, i) => animDuration * 0.5 + i * (animDuration / data.length))
        .duration(300)
        .attr('r', pointSize);

      legendEntries.push({
        name: seriesName,
        color,
        seriesKey,
        path: path as unknown as LegendEntry['path'],
      });

      circles
        .on('mouseover', (event: MouseEvent) => {
          const target = event.target as SVGCircleElement;
          const data = d3.select(target).datum() as any;

          const date = (data.date as Date).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          });

          const value = this.formatSeriesValue(data.seriesKey as string, data[data.seriesKey as string]);

          this.tooltip.transition().duration(200).style('opacity', 0.9);

          this.tooltip
            .html(
              `
          <div class="tooltip-title series-${seriesIndex}">${data.seriesName}</div>
          <div>Date: <strong>${date}</strong></div>
          <div>Value: <strong>${value}</strong></div>
        `,
            )
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 28 + 'px');

          this.renderer.setStyle(target, 'r', pointSize * 1.5 + 'px');
          this.renderer.setStyle(target, 'opacity', '1');

          highlightLines(data.seriesName);
        })
        .on('mouseout', (event: MouseEvent) => {
          this.tooltip.transition().duration(500).style('opacity', 0);

          const target = event.target as SVGCircleElement;
          this.renderer.setStyle(target, 'r', pointSize + 'px');
          this.renderer.setStyle(target, 'opacity', '0.7');

          highlightLines(null);
        });
    };

    seriesSpecs.forEach((spec, index) => {
      drawLine(spec.lineFunc, this.data, spec.color, spec.def, index);
    });

    highlightLines(null);

    if (!isCompact && legendEntries.length) {
      const legendPadding = 12;
      const legendRowHeight = 26;
      const legendWidth = Math.max(150, Math.min(240, width * 0.35));
      const legendHeight = legendEntries.length * legendRowHeight + legendPadding * 2 + 4;
      const legendX = Math.max(5, width - legendWidth - 10);
      const legendY = Math.max(5, height - legendHeight - 10);

      const legendGroup = g
        .append('g')
        .attr('class', 'legend-card')
        .attr('transform', `translate(${legendX}, ${legendY})`);

      legendGroup
        .append('rect')
        .attr('class', 'legend-card-bg')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .attr('rx', 12)
        .attr('ry', 12);

      legendGroup
        .append('text')
        .attr('class', 'legend-title')
        .attr('x', legendPadding)
        .attr('y', legendPadding + 12)
        .text('Legend');

      const entriesGroup = legendGroup
        .append('g')
        .attr('class', 'legend-items')
        .attr('transform', `translate(${legendPadding}, ${legendPadding + 18})`);

      legendEntries.forEach((entry, idx) => {
        const row = entriesGroup
          .append('g')
          .attr('class', 'legend-row')
          .attr('transform', `translate(0, ${idx * legendRowHeight})`)
          .style('cursor', 'pointer')
          .on('mouseenter', () => highlightLines(entry.name))
          .on('mouseleave', () => highlightLines(null));

        row
          .append('rect')
          .attr('class', 'legend-swatch')
          .attr('width', 14)
          .attr('height', 14)
          .attr('rx', 3)
          .attr('fill', entry.color);

        row
          .append('text')
          .attr('class', 'legend-label')
          .attr('x', 20)
          .attr('y', 12)
          .text(entry.name);
      });
    }
  }

  private formatYValue = (value: number | { valueOf(): number }): string => {
    const num = Number(value);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return String(num);
  };

  private formatSeriesValue(series: string, value: number): string {
    switch (series) {
      case 'series1':                 
        return `${value.toLocaleString()} missions`;
      case 'series2':                   
        return `${value.toLocaleString()} hours`;
      case 'series3':                     
        return `${value.toLocaleString()} innovations`;
      default:
        return value.toString();
    }
  }

  showStatusMessage(message: string, durationMs: number = 3000): void {
    this.statusMessage = message;
    this.showStatus = true;
    setTimeout(() => {
      this.showStatus = false;
    }, durationMs);
  }
}
