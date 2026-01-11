import { Component, ElementRef, Input, ViewChild, Renderer2, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import * as d3 from 'd3';

interface Stock {
  symbol: string;
  data: { date: Date; close: number }[];
}

interface Quarter {
  start: Date;
  end: Date;
  label: string;
  index: number;
}

interface Month {
  start: Date;
  end: Date;
  label: string;
  quarter: number;
}

type Phase = { start: Date; end: Date; type: 'bull' | 'bear' | 'consolidation'; label: string };

@Component({
  selector: 'app-finance-chart',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss'],
  standalone: false,
})
export class FinanceComponent implements OnInit, OnChanges {
  @Input() data: Stock[] = [];
  @Input() width: number = 0;
  @Input() height: number = 0;
  @Input() inOverlay: boolean = false;                                    
  @Input() showMarketPhases: boolean = false;                                                 
  @Input() showMarketPhasesControl: boolean = true;                                   
  @ViewChild('chart', { static: true }) chartContainer!: ElementRef;
  stocks: string[] = [];
  resolved: boolean = false;
  activeStock: string | null = null;

  private stockPaths: Map<string, d3.Selection<SVGPathElement, any, null, undefined>> = new Map();

  private colorScheme = ['#d62828', '#003049', '#0077b6', '#588157', '#1d3557'];

  showStatusBox: boolean = false;
  statusStock: string = '';
  statusPrice: string = '';
  statusDate: string = '';

  sortedStocks: { symbol: string; currentPrice: number; color: string }[] = [];

  latestDataDate: Date | null = null;

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.data && (changes['data'] || changes['width'] || changes['inOverlay'])) {
      this.stocks = this.data.map((stock: Stock) => stock.symbol);
      if (this.stocks.length > 0) {

        this.sortStocksByCurrentPrice();
        this.renderChart(this.data);
      }
    }
  }

  private sortStocksByCurrentPrice(): void {

    this.sortedStocks = this.data.map((stock: Stock) => {

      const latestDataPoint = stock.data && stock.data.length > 0 ? stock.data.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : undefined;

      if (latestDataPoint && (!this.latestDataDate || new Date(latestDataPoint.date) > this.latestDataDate)) {
        this.latestDataDate = new Date(latestDataPoint.date);
      }

      return {
        symbol: stock.symbol,
        currentPrice: latestDataPoint ? +latestDataPoint.close : 0,
        color: '',                             
      };
    });

    this.sortedStocks.sort((a, b) => b.currentPrice - a.currentPrice);

    this.sortedStocks.forEach((stock, index) => {
      stock.color = (this.colorScheme[index % this.colorScheme.length] || this.colorScheme[0]) as string;
    });
  }

  getStockColor(symbol: string): string {
    const stockEntry = this.sortedStocks.find(s => s.symbol === symbol);
    return (stockEntry ? stockEntry.color : this.colorScheme[0]) as string;
  }

  highlightStock(stock: string, index: number): void {
    this.activeStock = stock;

    d3.selectAll(`.line.stock-${stock.toLowerCase()}`).classed('highlighted', true);

    d3.selectAll(`.dot-${index}`).classed('highlighted', true);

    this.replayLineAnimation(stock);
  }

  unhighlightStock(): void {
    this.activeStock = null;

    d3.selectAll('.line').classed('highlighted', false);

    d3.selectAll('.data-point').classed('highlighted', false);
  }

  replayLineAnimation(stockSymbol: string): void {
    const path = this.stockPaths.get(stockSymbol);
    if (path) {
      const pathElement = path.node();
      if (pathElement) {
        const totalLength = pathElement.getTotalLength();

        d3.select(pathElement)
          .interrupt()
          .attr('stroke-dasharray', totalLength + ' ' + totalLength)
          .attr('stroke-dashoffset', totalLength)
          .style('animation', 'none')
          .transition()
          .duration(1000)
          .ease(d3.easeLinear)
          .attr('stroke-dashoffset', 0)
          .on('end', () => {

            d3.select(pathElement).attr('stroke-dasharray', 'none');
          });
      }
    }
  }

  onMarketPhasesChange(): void {

    if (this.chartContainer) {
      const element = this.renderer.selectRootElement(this.chartContainer.nativeElement);
      d3.select(element).selectAll('*').remove();
    }
    this.renderChart(this.data);
  }

  renderChart(stocks: { symbol: string; data: { date: Date; close: number }[] }[]): void {
    if (this.chartContainer) {

      this.stockPaths.clear();

      const element = this.renderer.selectRootElement(this.chartContainer.nativeElement);
      d3.select(element).selectAll('*').remove();

      if (this.data.length === 0) {
        d3.select(element).append('text').attr('x', '50%').attr('y', '50%').attr('text-anchor', 'middle').text('No data available');
        return;
      }

      const containerWidth = element.clientWidth || this.width || 800;
      const containerHeight = element.clientHeight || this.height || 400;

      const margin = {
        top: Math.max(20, containerHeight * 0.05),
        right: Math.max(20, containerWidth * 0.03),
        bottom: Math.max(30, containerHeight * 0.08),
        left: Math.max(40, containerWidth * 0.06),
      };

      const width = containerWidth - margin.left - margin.right;
      const height = containerHeight - margin.top - margin.bottom;

      const svg = d3
        .select(element)
        .append('svg')
        .attr('width', containerWidth)
        .attr('height', containerHeight)
        .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      let allDataPoints: { date: Date; close: number }[] = [];
      stocks.forEach((stock: Stock) => {
        allDataPoints = allDataPoints.concat(stock.data);
      });

      if (allDataPoints.length === 0) {
        svg
          .append('text')
          .attr('x', width / 2)
          .attr('y', height / 2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#777')
          .text('No data available');
        return;
      }

      const timeExtent = d3.extent(allDataPoints, d => d.date) as [Date, Date];
      const x = d3.scaleTime().domain(timeExtent).range([0, width]);

      if (this.showMarketPhases) {

        this.renderMarketPhasesView(svg, x, width, height, timeExtent);
      } else {

        this.renderStocksView(svg, x, width, height, stocks, allDataPoints);
      }
    }
  }

  private renderMarketPhasesView(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    x: d3.ScaleTime<number, number>,
    width: number,
    height: number,
    timeExtent: [Date, Date],
  ): void {

    d3.select(this.chartContainer.nativeElement).selectAll('.tooltip, .gantt-tooltip').remove();

    const minYear = timeExtent[0].getFullYear();
    const maxYear = timeExtent[1].getFullYear();

    const timeData = this.generateTimeData(minYear, maxYear);

    const containerGroup = svg.append('g').attr('class', 'chart-background-container');

    containerGroup
      .append('rect')
      .attr('width', width + 20)
      .attr('height', height + 20)
      .attr('x', -10)
      .attr('y', -10)
      .attr('fill', 'rgba(248, 249, 250, 0.95)')
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))');

    const ganttContainer = svg.append('g').attr('class', 'gantt-container').attr('filter', 'drop-shadow(0 2px 5px rgba(0,0,0,0.1))');

    ganttContainer.append('rect').attr('width', width).attr('height', 40).attr('fill', 'rgba(29, 53, 87, 0.9)').attr('rx', 6).attr('ry', 6);

    ganttContainer
      .append('text')
      .attr('class', 'gantt-main-title')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('fill', '#ffffff')
      .text('Market Phases Analysis');

    const contentContainer = ganttContainer.append('g').attr('class', 'gantt-content').attr('transform', 'translate(0, 50)');

    const contentHeight = height - 60;

    contentContainer.append('g').attr('class', 'time-container');

    const xAxis = d3
      .axisBottom(x)
      .ticks(d3.timeMonth.every(1))
      .tickFormat(d => {
        const date = d instanceof Date ? d : new Date(d.valueOf());
        const month = date.getMonth();
        const year = date.getFullYear();

        if (month % 3 === 0) {
          const quarter = Math.floor(month / 3) + 1;
          return `Q${quarter} ${year}`;
        }

        return d3.timeFormat('%b')(date);
      });

    contentContainer
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${contentHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('dy', '1em')
      .attr('transform', 'rotate(-20)')
      .style('text-anchor', 'end')
      .style('fill', '#333')
      .style('font-weight', 'bold');

    timeData.quarters.forEach((quarter: Quarter) => {
      contentContainer
        .append('rect')
        .attr('x', x(quarter.start))
        .attr('y', 0)
        .attr('width', x(quarter.end) - x(quarter.start))
        .attr('height', contentHeight)
        .attr('fill', quarter.index % 2 === 0 ? 'rgba(240, 240, 240, 0.4)' : 'rgba(248, 249, 250, 0.4)')
        .attr('stroke', 'rgba(0,0,0,0.05)')
        .attr('stroke-width', 1);
    });

    const marketPhases: Phase[] = this.generateMarketPhases(minYear, maxYear);

    const phasesContainer = contentContainer.append('g').attr('class', 'phases-container');

    const phaseTypes: Phase['type'][] = ['bull', 'bear', 'consolidation'];
    const typeHeight = contentHeight / phaseTypes.length;

    phaseTypes.forEach((type, index) => {

      const typePhases = marketPhases.filter((phase: Phase) => phase.type === type);

      const typeContainer = phasesContainer
        .append('g')
        .attr('class', `phase-type-container phase-${type}`)
        .attr('transform', `translate(0, ${index * typeHeight})`);

      typeContainer
        .append('rect')
        .attr('width', width)
        .attr('height', typeHeight)
        .attr('fill', this.getPhaseBackgroundColor(type))
        .attr('stroke', this.getPhaseStrokeColor(type))
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.6);

      typeContainer
        .append('text')
        .attr('class', 'phase-type-label')
        .attr('x', 10)
        .attr('y', typeHeight / 2)
        .attr('dominant-baseline', 'middle')
        .attr('fill', this.getPhaseStrokeColor(type))
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .style('text-shadow', '0 0 5px rgba(255,255,255,0.8), 0 0 5px rgba(255,255,255,0.8)')
        .text(type.charAt(0).toUpperCase() + type.slice(1));

      typePhases.forEach((phase: Phase) => {

        const rawPhaseWidth = x(phase.end) - x(phase.start);
        const phaseWidth = Math.max(2, Math.min(rawPhaseWidth, width - x(phase.start)));

        const phaseGroup = typeContainer
          .append('g')
          .attr('class', `phase-group phase-${type}`)
          .attr('transform', `translate(${x(phase.start)}, 0)`);

        const phaseRect = phaseGroup
          .append('rect')
          .attr('class', `market-phase phase-${type}`)
          .attr('width', phaseWidth)
          .attr('height', typeHeight * 0.8)
          .attr('y', typeHeight * 0.1)                     
          .attr('rx', 6)
          .attr('ry', 6)
          .attr('fill', this.getPhaseColor(type))
          .attr('stroke', this.getPhaseStrokeColor(type))
          .attr('stroke-width', 2)
          .attr('opacity', 0.9);

        if (phaseWidth > 60) {

          const clipId = `clip-phase-${phase.type}-${Math.random().toString(36).substr(2, 9)}`;

          phaseGroup
            .append('clipPath')
            .attr('id', clipId)
            .append('rect')
            .attr('width', Math.max(2, phaseWidth - 16))                      
            .attr('height', typeHeight)
            .attr('x', 8)                    
            .attr('y', 0);

          phaseGroup
            .append('text')
            .attr('class', 'phase-label')
            .attr('x', phaseWidth / 2)
            .attr('y', typeHeight / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', Math.min(14, Math.max(10, phaseWidth / 10)))
            .attr('font-weight', 'bold')
            .attr('fill', '#000000')
            .attr('clip-path', `url(#${clipId})`)
            .style('text-shadow', '0 0 5px rgba(255,255,255,1), 0 0 5px rgba(255,255,255,1)')
            .text(phase.label as string);
        }
      });
    });

    this.addStockPerformanceOverlay(contentContainer, x, width, contentHeight);
  }

  private generateTimeData(startYear: number, endYear: number): { quarters: Quarter[]; months: Month[] } {
    const quarters: Quarter[] = [];
    const months: Month[] = [];

    for (let year = startYear; year <= endYear; year++) {
      for (let quarter = 0; quarter < 4; quarter++) {
        const quarterStartMonth = quarter * 3;
        const quarterStart = new Date(year, quarterStartMonth, 1);

        let quarterEndMonth = quarterStartMonth + 3;
        let quarterEndYear = year;
        if (quarterEndMonth > 11) {
          quarterEndMonth = 0;
          quarterEndYear = year + 1;
        }
        const quarterEnd = new Date(quarterEndYear, quarterEndMonth, 1);

        quarters.push({
          start: quarterStart,
          end: quarterEnd,
          label: `Q${quarter + 1} ${year}`,
          index: (year - startYear) * 4 + quarter,
        });

        for (let m = 0; m < 3; m++) {
          const monthIdx = quarterStartMonth + m;
          if (monthIdx <= 11) {

            const monthStart = new Date(year, monthIdx, 1);
            const monthEnd = new Date(year, monthIdx + 1, 1);
            months.push({
              start: monthStart,
              end: monthEnd,
              label: monthStart.toLocaleDateString('en-US', { month: 'short' }),
              quarter: quarter + 1,
            });
          }
        }
      }
    }

    return { quarters, months };
  }

  private addStockPerformanceOverlay(container: d3.Selection<SVGGElement, unknown, null, undefined>, x: d3.ScaleTime<number, number>, width: number, height: number): void {

    const allStockData: { date: Date; close: number; symbol: string }[] = [];
    this.data.forEach((stock: Stock) => {
      (stock.data || []).forEach(dataPoint => {
        allStockData.push({
          date: dataPoint.date instanceof Date ? dataPoint.date : new Date(dataPoint.date),
          close: +dataPoint.close,
          symbol: stock.symbol,
        });
      });
    });

    if (allStockData.length === 0) {
      return;
    }

    const allPrices = allStockData.map(d => d.close);
    const priceExtent = [Math.min(...allPrices) * 0.9, Math.max(...allPrices) * 1.1];

    const y = d3
      .scaleLinear()
      .domain(priceExtent)
      .range([height * 0.8, height * 0.2]);                                 

    const stockContainer = container.append('g').attr('class', 'stock-performance-overlay').attr('transform', `translate(0, 0)`);

    const line = d3
      .line<{ date: Date; close: number }>()
      .x(d => x(d.date))
      .y(d => y(d.close))
      .curve(d3.curveCatmullRom.alpha(0.5));                  

    this.sortedStocks.forEach((stock, index) => {
      const stockData = allStockData.filter(d => d.symbol === stock.symbol).sort((a, b) => a.date.getTime() - b.date.getTime());

      if (stockData.length > 1) {

        const clipId = `clip-path-${stock.symbol}`;
        container.append('clipPath').attr('id', clipId).append('rect').attr('x', 0).attr('y', 0).attr('width', width).attr('height', height);

        stockContainer
          .append('path')
          .datum(stockData)
          .attr('class', `stock-line stock-${stock.symbol.toLowerCase()}`)
          .attr('d', line)
          .attr('clip-path', `url(#${clipId})`)
          .attr('fill', 'none')
          .attr('stroke', stock.color)
          .attr('stroke-width', 2)                  
          .attr('stroke-opacity', 0.5)                    
          .attr('stroke-dasharray', '0')              
          .style('pointer-events', 'none');

        const keyPoints = this.getKeyPoints(stockData, 3);                            
        stockContainer
          .selectAll(`.point-${stock.symbol}`)
          .data(keyPoints)
          .enter()
          .append('circle')
          .attr('class', `stock-point stock-${stock.symbol.toLowerCase()}`)
          .attr('cx', (d: { date: Date; close: number }) => x(d.date))
          .attr('cy', (d: { close: d3.NumberValue }) => y(d.close))
          .attr('r', 3)                  
          .attr('fill', 'white')
          .attr('stroke', stock.color)
          .attr('stroke-width', 1)                  
          .attr('opacity', 0.6)                    
          .style('pointer-events', 'none');
      }
    });
  }

  private getKeyPoints(data: { date: Date; close: number }[], maxPoints: number = 3): { date: Date; close: number }[] {
    if (data.length <= maxPoints) {
      return data;
    }

    const points: { date: Date; close: number }[] = [data[0]!, data[data.length - 1]!];

    if (maxPoints > 2 && data.length > 2) {
      let maxChange = 0;
      let maxChangePoint = data[0];

      for (let i = 1; i < data.length - 1; i++) {
        const prevPoint = data[i - 1]!;
        const currPoint = data[i]!;
        const nextPoint = data[i + 1]!;

        const changeBeforeCurr = Math.abs(currPoint.close - prevPoint.close);
        const changeAfterCurr = Math.abs(nextPoint.close - currPoint.close);
        const totalChange = changeBeforeCurr + changeAfterCurr;

        if (totalChange > maxChange) {
          maxChange = totalChange;
          maxChangePoint = currPoint;
        }
      }

      points.push(maxChangePoint!);
    }

    return points.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private showPhaseTooltip(event: MouseEvent, phase: Phase, phaseType: Phase['type']): void {
    const tooltip = d3.select(this.chartContainer.nativeElement).append('div').attr('class', 'gantt-tooltip').style('opacity', 0).style('z-index', '1500');

    const startDate = phase.start.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const endDate = phase.end.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const durationMs = phase.end.getTime() - phase.start.getTime();
    const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24));
    let durationText = `${durationDays} days`;
    if (durationDays > 30) {
      const months = Math.round(durationDays / 30);
      durationText = `${months} month${months > 1 ? 's' : ''} (${durationDays} days)`;
    }

    let tooltipContent = `
      <div class="tooltip-header ${phaseType}-header">${phase.label}</div>
      <div class="tooltip-period"><strong>Period:</strong> ${startDate} - ${endDate}</div>
      <div class="tooltip-duration"><strong>Duration:</strong> ${durationText}</div>
      <div class="tooltip-type"><strong>Type:</strong> ${phaseType.charAt(0).toUpperCase() + phaseType.slice(1)} Market</div>
    `;

    const stockPerformance = this.calculateStockPerformanceInPhase(phase);
    if (stockPerformance.length > 0) {
      tooltipContent += `<div class="stock-performance"><strong>Stock Performance:</strong></div>`;
      stockPerformance.forEach(perf => {
        const trendClass = perf.percentChange >= 0 ? 'perf-positive' : 'perf-negative';
        const trendIndicator = perf.percentChange >= 0 ? '▲' : '▼';
        tooltipContent += `
          <div class="stock-perf-item">
            <span>${perf.symbol}:</span>
            <span class="${trendClass}">${trendIndicator} ${Math.abs(perf.percentChange).toFixed(2)}%</span>
            <span>($${perf.firstPrice.toFixed(2)} → $${perf.lastPrice.toFixed(2)})</span>
          </div>
        `;
      });
    }

    tooltip.html(tooltipContent);

    const tooltipWidth = 280;
    const tooltipNode = tooltip.node() as HTMLElement;
    const xPos = Math.min(event.pageX + 10, window.innerWidth - tooltipWidth - 20);

    tooltip
      .style('left', `${xPos}px`)
      .style('top', `${event.pageY - 20}px`)
      .transition()
      .duration(200)
      .style('opacity', 1);
  }

  private hidePhaseTooltip(): void {
    d3.select(this.chartContainer.nativeElement).selectAll('.gantt-tooltip').transition().duration(200).style('opacity', 0).remove();
  }

  private calculateStockPerformanceInPhase(phase: Phase): { symbol: string; firstPrice: number; lastPrice: number; percentChange: number; color: string }[] {
    const results: { symbol: string; firstPrice: number; lastPrice: number; percentChange: number; color: string }[] = [];

    this.sortedStocks.forEach(stock => {

      const stockEntry = this.data.find((s: Stock) => s.symbol === stock.symbol);
      const stockData = stockEntry
        ? (stockEntry.data || [])
            .filter(d => {
              const date = d.date instanceof Date ? d.date : new Date(d.date);
              return date >= phase.start && date <= phase.end;
            })
            .sort((a, b) => {
              const dateA = a.date instanceof Date ? a.date : new Date(a.date);
              const dateB = b.date instanceof Date ? b.date : new Date(b.date);
              return dateA.getTime() - dateB.getTime();
            })
        : undefined;

      if (stockData && stockData.length > 1) {
        const stockDataNonNull = stockData as { date: Date; close: number }[];
        const firstPrice = +stockDataNonNull[0]!.close;
        const lastPrice = +stockDataNonNull[stockDataNonNull.length - 1]!.close;
        const percentChange = ((lastPrice - firstPrice) / firstPrice) * 100;

        results.push({
          symbol: stock.symbol,
          firstPrice,
          lastPrice,
          percentChange,
          color: stock.color,
        });
      }
    });

    return results.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));
  }

  private getPhaseBackgroundColor(phaseType: Phase['type']): string {
    switch (phaseType) {
      case 'bull':
        return 'rgba(235, 251, 238, 0.7)';                          
      case 'bear':
        return 'rgba(253, 235, 236, 0.7)';                        
      case 'consolidation':
        return 'rgba(252, 248, 232, 0.7)';                                  
      default:
        return 'rgba(240, 240, 240, 0.7)';              
    }
  }

  private renderStocksView(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    x: d3.ScaleTime<number, number>,
    width: number,
    height: number,
    stocks: { symbol: string; data: { date: Date; close: number }[] }[],
    allDataPoints: { date: Date; close: number }[],
  ): void {

    d3.select(this.chartContainer.nativeElement).selectAll('.tooltip, .gantt-tooltip').remove();

    const tooltip = d3.select(this.chartContainer.nativeElement).append('div').attr('class', 'tooltip').style('opacity', 0).style('position', 'absolute').style('z-index', '1500');                                     

    const color = (symbol: string) => {
      const stockEntry = this.sortedStocks.find(s => s.symbol === symbol);
      return (stockEntry?.color ?? this.colorScheme[0]) as string;
    };

    const globalMin = d3.min(allDataPoints, d => +d.close) || 0;
    const globalMax = d3.max(allDataPoints, d => +d.close) || 100;
    const yDomain = [globalMin * 0.95, globalMax * 1.05];                  

    const y = d3.scaleLinear().domain(yDomain).range([height, 0]);

    function makeGrid(scale: any, axis: string) {
      return (axis === 'x' ? d3.axisBottom(scale) : d3.axisLeft(scale))
        .ticks(10)
        .tickSize(axis === 'x' ? -height : -width)
        .tickFormat(() => '');
    }

    svg.append('g').attr('class', 'grid').attr('transform', `translate(0,${height})`).call(makeGrid(x, 'x'));

    svg.append('g').attr('class', 'grid').call(makeGrid(y, 'y'));

    svg.append('g').attr('class', 'y axis').call(d3.axisLeft(y).ticks(5)).selectAll('text').style('fill', '#d62828').style('font-weight', 'bold').style('font-size', '11px');

    svg
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(d3.timeMonth.every(2))
          .tickFormat(d => d3.timeFormat('%b %y')(d instanceof Date ? d : new Date(d.valueOf()))),
      )
      .selectAll('text')
      .attr('dy', '1em')
      .attr('transform', 'rotate(-15)')
      .style('text-anchor', 'end')
      .style('fill', '#333');

    svg.append('rect').attr('width', width).attr('height', height).attr('fill', 'rgba(255,255,255,0.5)').attr('rx', 5).attr('ry', 5);

    stocks.forEach((stock: Stock, index: number) => {
      const formattedData = stock.data.map(d => ({
        date: d.date instanceof Date ? d.date : new Date(d.date),
        close: +d.close,
      }));

      const drawLine = (data: { date: Date; close: number }[], stockSymbol: string, _lineIndex: number) => {
        const lineGen = d3
          .line<{ date: Date; close: number }>()
          .x(d => x(d.date))
          .y(d => y(d.close))
          .curve(d3.curveMonotoneX);

        const path = svg
          .append('path')
          .datum(data)
          .attr('class', `line stock-${stockSymbol.toLowerCase()}`)
          .attr('d', lineGen as any)
          .attr('stroke', color(stockSymbol))                                              
          .attr('stroke-width', 3)
          .attr('fill', 'none')
          .style('opacity', 0.85);

        this.stockPaths.set(stockSymbol, path as any);

        const totalLength = (path.node() as SVGPathElement)?.getTotalLength?.() || 0;
        path
          .attr('stroke-dasharray', totalLength + ' ' + totalLength)
          .attr('stroke-dashoffset', totalLength)
          .transition()
          .duration(1500)
          .ease(d3.easeLinear)
          .attr('stroke-dashoffset', 0)
          .on('end', () => {

            path.attr('stroke-dasharray', null);

            addStockLabels(data, stockSymbol, _lineIndex);
          });

        return path;
      };

      const addStockLabels = (data: unknown[], stockSymbol: string, lineIndex: number) => {

        const lastPoint = data[data.length - 1] as { date: Date; close: number };

        const labelGroup = svg.append('g').attr('class', `stock-label-group stock-${stockSymbol.toLowerCase()}-label`);

        const labelText = stockSymbol;
        const tempText = labelGroup.append('text').text(labelText).style('visibility', 'hidden');                                 

        const textNode = tempText.node() as SVGTextElement | null;
        const textBBox = textNode ? textNode.getBBox() : { width: 50, height: 14 };
        tempText.remove();                             

        const padding = 6;
        const backgroundWidth = textBBox.width + padding * 2;
        const backgroundHeight = textBBox.height + padding * 1.5;

        const xPos = x(lastPoint.date) + 25;
        const yPos = y(lastPoint.close);

        labelGroup
          .append('rect')
          .attr('class', 'stock-label-background')
          .attr('x', xPos - padding)
          .attr('y', yPos - backgroundHeight / 2)
          .attr('width', backgroundWidth)
          .attr('height', backgroundHeight)
          .attr('fill', 'rgba(255, 255, 255, 0.85)')                                     
          .attr('stroke', color(stockSymbol))                                       
          .attr('stroke-width', 1.5)
          .attr('rx', 4)                   
          .attr('ry', 4);

        labelGroup
          .append('text')
          .attr('class', 'stock-symbol-label')
          .attr('x', xPos + backgroundWidth / 2 - padding)
          .attr('y', yPos)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .text(labelText)
          .attr('fill', color(stockSymbol))                                     
          .style('opacity', 0)
          .transition()
          .duration(500)
          .style('opacity', 1);

        labelGroup
          .on('mouseover', () => {

            d3.select(`.line.stock-${stockSymbol.toLowerCase()}`).classed('highlighted', true);
          })
          .on('mouseout', () => {

            d3.select(`.line.stock-${stockSymbol.toLowerCase()}`).classed('highlighted', false);
          });
      };

      drawLine(formattedData, stock.symbol, index);

      let dataPointsToShow: { date: Date; close: number }[] = [];
      if (formattedData.length > 0) {
        const dataLength = formattedData.length;
        const indices = Array.from({ length: 10 }, (_, i) => Math.floor((dataLength * i) / 9));

        if (indices[indices.length - 1] !== dataLength - 1) {
          indices[indices.length - 1] = dataLength - 1;
        }

        dataPointsToShow = indices.map(i => formattedData[i]).filter((x): x is { date: Date; close: number } => !!x);
      }

      svg
        .selectAll(`.dot-${index}`)
        .data(dataPointsToShow)
        .enter()
        .append('circle')
        .attr('class', `dot data-point dot-${index}`)
        .attr('cx', (d: { date: Date; close: number }) => x(d.date))
        .attr('cy', (d: { date: Date; close: number }) => y(d.close))
        .attr('r', 0)
        .attr('fill', 'white')
        .attr('stroke', color(stock.symbol))                                              
        .attr('stroke-width', 2)
        .style('opacity', 0)
        .each(function (this: SVGCircleElement, d) {
          d3.select(this).datum({
            ...(d as any),
            stockSymbol: stock.symbol,
          });
        })
        .transition()
        .delay((_: any, i: number) => 1500 + i * 100)
        .duration(500)
        .attr('r', 4)
        .style('opacity', 1);

      svg
        .selectAll(`.dot-${index}`)
        .on('mouseover', (event: MouseEvent, d: any) => {

          const datum = d as { date: Date; close: number; stockSymbol: string };
          const target = event.target as SVGCircleElement;

          tooltip.transition().duration(200).style('opacity', 0.95).style('transform', 'scale(1.05)');

          const formattedDate = (datum.date instanceof Date ? datum.date : new Date(datum.date)).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });

          tooltip
            .html(`<div class="tooltip-header">${datum.stockSymbol}</div>` + `<div>Date: ${formattedDate}</div>` + `<div>Price: $${datum.close.toFixed(2)}</div>`)
            .style('left', `${event.pageX}px`)
            .style('top', `${event.pageY - 28}px`);

          this.statusStock = datum.stockSymbol;
          this.statusPrice = datum.close.toFixed(2);
          this.statusDate = formattedDate;
          this.showStatusBox = true;

          this.updateStatusPosition(event);

          d3.select(target).transition().duration(200).attr('r', 6).attr('stroke-width', 3);

          svg
            .append('line')
            .attr('class', 'hover-line')
            .attr('x1', x(datum.date))
            .attr('x2', x(datum.date))
            .attr('y1', height)
            .attr('y2', height)
            .attr('stroke', color(stock.symbol))                                              
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '3,3')
            .transition()
            .duration(200)
            .attr('y2', 0);
        })
        .on('mouseout', (event: MouseEvent) => {

          tooltip.transition().duration(500).style('opacity', 0).style('transform', 'scale(1)');

          this.showStatusBox = false;

          d3.select(event.target as Element)
            .transition()
            .duration(300)
            .attr('r', 4)
            .attr('stroke-width', 2);

          svg.selectAll('.hover-line').transition().duration(200).style('opacity', 0).remove();
        });
    });
  }

  private getPhaseColor(phaseType: string): string {
    switch (phaseType) {
      case 'bull':
        return '#a8e6cf';               
      case 'bear':
        return '#ffaaa5';             
      case 'consolidation':
        return '#ffd3b6';                
      default:
        return '#d8e2dc';              
    }
  }

  private getPhaseStrokeColor(phaseType: string): string {
    switch (phaseType) {
      case 'bull':
        return '#2a9d8f';                
      case 'bear':
        return '#e76f51';              
      case 'consolidation':
        return '#f4a261';                 
      default:
        return '#6b705c';               
    }
  }

  private getPhaseLabelColor(phaseType: string): string {
    switch (phaseType) {
      case 'bull':
        return '#264653';                                 
      case 'bear':
        return '#264653';                                 
      case 'consolidation':
        return '#264653';                                 
      default:
        return '#264653';             
    }
  }

  private generateMarketPhases(startYear: number, endYear: number): Phase[] {
    const phases: Phase[] = [];
    let currentYear = startYear;

    while (currentYear <= endYear) {

      phases.push({
        start: new Date(`${currentYear}-01-01`),
        end: new Date(`${currentYear}-06-30`),
        type: 'bull',
        label: `Bull Market ${currentYear}`,
      });

      phases.push({
        start: new Date(`${currentYear}-07-01`),
        end: new Date(`${currentYear}-10-31`),
        type: 'bear',
        label: `Bear Market ${currentYear}`,
      });

      phases.push({
        start: new Date(`${currentYear}-11-01`),
        end: new Date(`${currentYear}-12-31`),
        type: 'consolidation',
        label: `Consolidation ${currentYear}`,
      });

      currentYear++;
    }

    return phases;
  }

  formatMarketPhaseLabel(phase: unknown): string {
    if (!phase || typeof phase !== 'object') return 'Unknown Market';
    const p = phase as { type?: string };
    const type = typeof p.type === 'string' ? p.type : 'unknown';
    return `${type.charAt(0).toUpperCase() + type.slice(1)} Market`;
  }

  updateStatusPosition(event: MouseEvent): void {
    const statusBox = document.querySelector('.stock-status-box') as HTMLElement;
    if (statusBox && this.showStatusBox) {

      const rect = this.chartContainer.nativeElement.getBoundingClientRect();

      const statusWidth = 140;                          
      const statusHeight = 60;                         

      statusBox.style.left = '20px';
      statusBox.style.bottom = '20px';
      statusBox.style.top = 'auto';

      statusBox.style.zIndex = '2000';
    }
  }
}
