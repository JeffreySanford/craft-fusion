import { Component, ElementRef, Input, ViewChild, Renderer2, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import * as d3 from 'd3';

interface Stock {
  symbol: string;
  data: { date: Date; close: number }[];
}

@Component({
  selector: 'app-finance-chart',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss'],
  standalone: false
})

export class FinanceComponent implements OnInit, OnChanges {
  @Input() data: any[] = [];
  @Input() width: number = 0;
  @Input() height: number = 0;
  @Input() inOverlay: boolean = false; // New input to detect overlay mode
  @Input() showMarketPhases: boolean = false; // Default to hide market phases on initial load
  @Input() showMarketPhasesControl: boolean = true; // Make control visible by default
  @ViewChild('chart', { static: true }) chartContainer!: ElementRef;
  stocks: any[] = [];
  resolved: boolean = false;
  activeStock: string | null = null;
  
  // Store paths for animation replay
  private stockPaths: Map<string, any> = new Map();
  
  // Patriotic color scheme - enhanced contrast
  private colorScheme = ['#d62828', '#003049', '#0077b6', '#588157', '#1d3557'];

  // New properties for the status box
  showStatusBox: boolean = false;
  statusStock: string = '';
  statusPrice: string = '';
  statusDate: string = '';

  // Add a property to store sorted stocks for the legend
  sortedStocks: {symbol: string, currentPrice: number, color: string}[] = [];

  // Add property to track latest data date
  latestDataDate: Date | null = null;

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    // Initial setup if needed
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.data && (changes['data'] || changes['width'] || changes['inOverlay'])) {
      this.stocks = this.data.map((stock: any) => stock.symbol);
      if(this.stocks.length > 0) {
        // Sort stocks by price before rendering
        this.sortStocksByCurrentPrice();
        this.renderChart(this.data);
      }
    }
  }
  
  // New method to sort stocks by their current (latest) price
  private sortStocksByCurrentPrice(): void {
    // Create an array of objects with symbol and current price
    this.sortedStocks = this.data.map((stock: any) => {
      // Get the most recent price data point
      const latestDataPoint = stock.data
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      // Update the latest data date if needed
      if (latestDataPoint && (!this.latestDataDate || 
          new Date(latestDataPoint.date) > this.latestDataDate)) {
        this.latestDataDate = new Date(latestDataPoint.date);
      }
      
      return {
        symbol: stock.symbol,
        currentPrice: latestDataPoint ? latestDataPoint.close : 0,
        color: '' // Will be set after sorting
      };
    });
    
    // Sort by price in descending order (highest price first)
    this.sortedStocks.sort((a, b) => b.currentPrice - a.currentPrice);
    
    // Assign colors based on the sorted order
    this.sortedStocks.forEach((stock, index) => {
      stock.color = this.colorScheme[index % this.colorScheme.length];
    });
  }
  
  getStockColor(symbol: string): string {
    const stockEntry = this.sortedStocks.find(s => s.symbol === symbol);
    return stockEntry ? stockEntry.color : this.colorScheme[0];
  }
  
  // Highlight stock on legend hover
  highlightStock(stock: string, index: number): void {
    this.activeStock = stock;
    
    // Highlight the line
    d3.selectAll(`.line.stock-${stock.toLowerCase()}`)
      .classed('highlighted', true);
      
    // Highlight related data points
    d3.selectAll(`.dot-${index}`)
      .classed('highlighted', true);
      
    // Replay line animation
    this.replayLineAnimation(stock);
  }
  
  // Remove highlight on mouse leave
  unhighlightStock(): void {
    this.activeStock = null;
    
    // Remove highlight from all lines and points
    d3.selectAll('.line')
      .classed('highlighted', false);
      
    d3.selectAll('.data-point')
      .classed('highlighted', false);
  }
  
  // Replay the line drawing animation
  replayLineAnimation(stockSymbol: string): void {
    const path = this.stockPaths.get(stockSymbol);
    if (path) {
      const pathElement = path.node();
      if (pathElement) {
        const totalLength = pathElement.getTotalLength();
        
        // Interrupt any ongoing transitions
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
            // Reset the dasharray after animation completes
            d3.select(pathElement)
              .attr('stroke-dasharray', 'none');
          });
      }
    }
  }

  onMarketPhasesChange(): void {
    // Clear any existing chart before re-rendering
    if (this.chartContainer) {
      const element = this.renderer.selectRootElement(this.chartContainer.nativeElement);
      d3.select(element).selectAll('*').remove();
    }
    this.renderChart(this.data);
  }

  renderChart(stocks: { symbol: string; data: { date: Date; close: number }[] }[]): void {
    if (this.chartContainer) {
      // Clear previous paths
      this.stockPaths.clear();
      
      const element = this.renderer.selectRootElement(this.chartContainer.nativeElement);
      d3.select(element).selectAll('*').remove();

      if (this.data.length === 0) {
        d3.select(element).append('text').attr('x', '50%').attr('y', '50%').attr('text-anchor', 'middle').text('No data available');
        return;
      }

      // Get the actual dimensions of the container - ensure we use the full space
      const containerWidth = element.clientWidth || this.width || 800;
      const containerHeight = element.clientHeight || this.height || 400;

      // Reduce margins to maximize chart area
      const margin = {
        top: Math.max(20, containerHeight * 0.05),
        right: Math.max(20, containerWidth * 0.03),
        bottom: Math.max(30, containerHeight * 0.08),
        left: Math.max(40, containerWidth * 0.06)
      };
      
      const width = containerWidth - margin.left - margin.right;
      const height = containerHeight - margin.top - margin.bottom;

      // Create SVG element with explicit dimensions
      const svg = d3
        .select(element)
        .append('svg')
        .attr('width', containerWidth)
        .attr('height', containerHeight)
        .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Get all data points for domain calculations
      let allDataPoints: { date: Date; close: number }[] = [];
      stocks.forEach((stock: Stock) => {
        allDataPoints = allDataPoints.concat(stock.data);
      });
      
      if (allDataPoints.length === 0) {
        svg.append('text')
          .attr('x', width / 2)
          .attr('y', height / 2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#777')
          .text('No data available');
        return;
      }

      // Create common scales for both visualizations
      const timeExtent = d3.extent(allDataPoints, d => d.date) as [Date, Date];
      const x = d3
        .scaleTime()
        .domain(timeExtent)
        .range([0, width]);

      // CONDITIONAL RENDERING BASED ON TOGGLE STATE
      if (this.showMarketPhases) {
        // RENDER GANTT CHART VIEW
        this.renderMarketPhasesView(svg, x, width, height, timeExtent);
      } else {
        // RENDER STOCKS LINE CHART VIEW
        this.renderStocksView(svg, x, width, height, stocks, allDataPoints);
      }
    }
  }

  // New method to render market phases (Gantt chart) view with improved layout
  private renderMarketPhasesView(svg: any, x: any, width: number, height: number, timeExtent: [Date, Date]): void {
    // Remove any existing tooltips first
    d3.select(this.chartContainer.nativeElement).selectAll('.tooltip, .gantt-tooltip').remove();

    // Extract years from timeExtent
    const minYear = timeExtent[0].getFullYear();
    const maxYear = timeExtent[1].getFullYear();
    
    // Calculate quarters and months for more meaningful time periods
    const timeData = this.generateTimeData(minYear, maxYear);
    
    // Create main container with enhanced styling
    const containerGroup = svg.append('g')
      .attr('class', 'chart-background-container');
      
    // Add a backdrop for the chart
    containerGroup.append('rect')
      .attr('width', width + 20)
      .attr('height', height + 20)
      .attr('x', -10)
      .attr('y', -10)
      .attr('fill', 'rgba(248, 249, 250, 0.95)')
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))');
      
    // Create a "container" group for the gantt chart with better visual pop
    const ganttContainer = svg.append('g')
      .attr('class', 'gantt-container')
      .attr('filter', 'drop-shadow(0 2px 5px rgba(0,0,0,0.1))');
      
    // Header background for better visual separation
    ganttContainer.append('rect')
      .attr('width', width)
      .attr('height', 40)
      .attr('fill', 'rgba(29, 53, 87, 0.9)')
      .attr('rx', 6)
      .attr('ry', 6);
    
    // Title text with better contrast
    ganttContainer.append('text')
      .attr('class', 'gantt-main-title')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('fill', '#ffffff')
      .text('Market Phases Analysis');
    
    // Create content container with padding
    const contentContainer = ganttContainer.append('g')
      .attr('class', 'gantt-content')
      .attr('transform', 'translate(0, 50)');
      
    // Adjust height to account for header
    const contentHeight = height - 60;
    
    // Create time period bands with full height
    const timeContainer = contentContainer.append('g')
      .attr('class', 'time-container');
      
    // Draw time axis with quarters and months
    const xAxis = d3.axisBottom(x)
      .ticks(d3.timeMonth.every(1))
      .tickFormat((d) => {
        const date = d instanceof Date ? d : new Date(d.valueOf());
        const month = date.getMonth();
        const year = date.getFullYear();
        
        // Show quarter labels for first month of each quarter
        if (month % 3 === 0) {
          const quarter = Math.floor(month / 3) + 1;
          return `Q${quarter} ${year}`;
        }
        
        // Show month for other ticks
        return d3.timeFormat('%b')(date);
      });
      
    contentContainer.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${contentHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('dy', '1em')
      .attr('transform', 'rotate(-20)')
      .style('text-anchor', 'end')
      .style('fill', '#333')
      .style('font-weight', 'bold');
      
    // Draw quarter and month boundaries
    timeData.quarters.forEach(quarter => {
      contentContainer.append('rect')
        .attr('x', x(quarter.start))
        .attr('y', 0)
        .attr('width', x(quarter.end) - x(quarter.start))
        .attr('height', contentHeight)
        .attr('fill', quarter.index % 2 === 0 ? 'rgba(240, 240, 240, 0.4)' : 'rgba(248, 249, 250, 0.4)')
        .attr('stroke', 'rgba(0,0,0,0.05)')
        .attr('stroke-width', 1);
    });

    // Generate market phases that cover the full time period
    const marketPhases = this.generateMarketPhases(minYear, maxYear);
    
    // Create a container for each phase type with full height
    const phasesContainer = contentContainer.append('g')
      .attr('class', 'phases-container');
      
    // Draw market phases with full height (stacked vertically)
    const phaseTypes = ['bull', 'bear', 'consolidation'];
    const typeHeight = contentHeight / phaseTypes.length;
    
    phaseTypes.forEach((type, index) => {
      // Filter phases by type
      const typePhases = marketPhases.filter(phase => phase.type === type);
      
      // Create container for this phase type
      const typeContainer = phasesContainer.append('g')
        .attr('class', `phase-type-container phase-${type}`)
        .attr('transform', `translate(0, ${index * typeHeight})`);
        
      // Add type background with styling for better visual separation
      typeContainer.append('rect')
        .attr('width', width)
        .attr('height', typeHeight)
        .attr('fill', this.getPhaseBackgroundColor(type))
        .attr('stroke', this.getPhaseStrokeColor(type))
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.6);
      
      // Add type label on the left
      typeContainer.append('text')
        .attr('class', 'phase-type-label')
        .attr('x', 10)
        .attr('y', typeHeight / 2)
        .attr('dominant-baseline', 'middle')
        .attr('fill', this.getPhaseStrokeColor(type))
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .style('text-shadow', '0 0 5px rgba(255,255,255,0.8), 0 0 5px rgba(255,255,255,0.8)')
        .text(type.charAt(0).toUpperCase() + type.slice(1));
      
      // Draw phase bars for this type
      typePhases.forEach(phase => {
        // Calculate phase width with safety margins
        const rawPhaseWidth = x(phase.end) - x(phase.start);
        const phaseWidth = Math.max(2, Math.min(rawPhaseWidth, width - x(phase.start)));
        
        // Create group for phase
        const phaseGroup = typeContainer.append('g')
          .attr('class', `phase-group phase-${type}`)
          .attr('transform', `translate(${x(phase.start)}, 0)`);
        
        // Add phase rectangle with enhanced styling and clipping
        const phaseRect = phaseGroup.append('rect')
          .attr('class', `market-phase phase-${type}`)
          .attr('width', phaseWidth)
          .attr('height', typeHeight * 0.8)
          .attr('y', typeHeight * 0.1) // Center vertically
          .attr('rx', 6)
          .attr('ry', 6)
          .attr('fill', this.getPhaseColor(type))
          .attr('stroke', this.getPhaseStrokeColor(type))
          .attr('stroke-width', 2)
          .attr('opacity', 0.9);
        
        // Add phase label if there's enough space, with improved text constraints
        if (phaseWidth > 60) {
          // Create clipping path for the text to ensure it stays within the phase
          const clipId = `clip-phase-${phase.type}-${Math.random().toString(36).substr(2, 9)}`;
          
          phaseGroup.append('clipPath')
            .attr('id', clipId)
            .append('rect')
              .attr('width', Math.max(2, phaseWidth - 16)) // Leave some padding
              .attr('height', typeHeight)
              .attr('x', 8) // Add left padding
              .attr('y', 0);
          
          phaseGroup.append('text')
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
            .text(phase.label);
        }
        
        // Add tooltip interaction
        phaseGroup.on('mouseover', (event: MouseEvent) => {
          phaseRect.transition()
            .duration(200)
            .attr('opacity', 1)
            .attr('stroke-width', 3)
            .attr('height', typeHeight * 0.9)
            .attr('y', typeHeight * 0.05);
            
          this.showPhaseTooltip(event, phase, type);
        })
        .on('mouseout', () => {
          phaseRect.transition()
            .duration(200)
            .attr('opacity', 0.9)
            .attr('stroke-width', 2)
            .attr('height', typeHeight * 0.8)
            .attr('y', typeHeight * 0.1);
            
          this.hidePhaseTooltip();
        });
      });
    });
    
    // Add stock performance mini-charts overlaid on phases
    this.addStockPerformanceOverlay(contentContainer, x, width, contentHeight, timeExtent);
  }

  // New helper method to generate time data with quarters and months
  private generateTimeData(startYear: number, endYear: number): { quarters: any[], months: any[] } {
    const quarters = [];
    const months = [];
    
    for (let year = startYear; year <= endYear; year++) {
      for (let quarter = 0; quarter < 4; quarter++) {
        const quarterStartMonth = quarter * 3;
        const quarterStart = new Date(year, quarterStartMonth, 1);
        
        // Handle end date of quarter (first day of next quarter or year)
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
          index: (year - startYear) * 4 + quarter
        });
        
        // Add months for this quarter
        for (let m = 0; m < 3; m++) {
          const monthIdx = quarterStartMonth + m;
          if (monthIdx <= 11) { // Ensure month is valid
            const monthStart = new Date(year, monthIdx, 1);
            const monthEnd = new Date(year, monthIdx + 1, 1);
            months.push({
              start: monthStart,
              end: monthEnd,
              label: monthStart.toLocaleDateString('en-US', { month: 'short' }),
              quarter: quarter + 1
            });
          }
        }
      }
    }
    
    return { quarters, months };
  }

  // New method to add stock performance mini-charts overlaid on the phases
  private addStockPerformanceOverlay(container: any, x: any, width: number, height: number, timeExtent: [Date, Date]): void {
    // Calculate scale for stock prices
    const allStockData: { date: Date; close: number; symbol: string }[] = [];
    this.data.forEach((stock: any) => {
      stock.data.forEach((dataPoint: any) => {
        allStockData.push({
          date: dataPoint.date instanceof Date ? dataPoint.date : new Date(dataPoint.date),
          close: +dataPoint.close,
          symbol: stock.symbol
        });
      });
    });
    
    if (allStockData.length === 0) {
      return;
    }
    
    const allPrices = allStockData.map(d => d.close);
    const priceExtent = [
      Math.min(...allPrices) * 0.9,
      Math.max(...allPrices) * 1.1
    ];
    
    const y = d3.scaleLinear()
      .domain(priceExtent)
      .range([height * 0.8, height * 0.2]); // Leave space at top and bottom
    
    // Create a container for stock lines
    const stockContainer = container.append('g')
      .attr('class', 'stock-performance-overlay')
      .attr('transform', `translate(0, 0)`);
    
    // Create a line generator with smoother curve
    const line = d3.line<any>()
      .x(d => x(d.date))
      .y(d => y(d.close))
      .curve(d3.curveCatmullRom.alpha(0.5)); // Smoother curve
    
    // Draw mini line for each stock with reduced opacity
    this.sortedStocks.forEach((stock, index) => {
      const stockData = allStockData.filter(d => d.symbol === stock.symbol)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
        
      if (stockData.length > 1) {
        // Create a clipping path to ensure the line stays within the chart
        const clipId = `clip-path-${stock.symbol}`;
        container.append('clipPath')
          .attr('id', clipId)
          .append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', width)
          .attr('height', height);
        
        // Draw the stock line with more subtle styling
        stockContainer.append('path')
          .datum(stockData)
          .attr('class', `stock-line stock-${stock.symbol.toLowerCase()}`)
          .attr('d', line)
          .attr('clip-path', `url(#${clipId})`)
          .attr('fill', 'none')
          .attr('stroke', stock.color)
          .attr('stroke-width', 2) // Reduced from 3
          .attr('stroke-opacity', 0.5) // Reduced from 0.8
          .attr('stroke-dasharray', '0') // Solid line
          .style('pointer-events', 'none');
        
        // Add only a few key points instead of all significant points
        const keyPoints = this.getKeyPoints(stockData, 3); // Reduced number of points
        stockContainer.selectAll(`.point-${stock.symbol}`)
          .data(keyPoints)
          .enter()
          .append('circle')
          .attr('class', `stock-point stock-${stock.symbol.toLowerCase()}`)
          .attr('cx', (d: { date: Date; close: number }) => x(d.date))
          .attr('cy', (d: { close: d3.NumberValue; }) => y(d.close))
          .attr('r', 3) // Smaller points
          .attr('fill', 'white')
          .attr('stroke', stock.color)
          .attr('stroke-width', 1) // Thinner stroke
          .attr('opacity', 0.6) // More transparent
          .style('pointer-events', 'none');
      }
    });
  }

  // Helper method to get only key points (start, end, and major changes)
  private getKeyPoints(data: any[], maxPoints: number = 3): any[] {
    if (data.length <= maxPoints) {
      return data;
    }
    
    // Always include first and last points
    const points = [data[0], data[data.length - 1]];
    
    // If we need more points, add the most significant change
    if (maxPoints > 2 && data.length > 2) {
      let maxChange = 0;
      let maxChangePoint = data[0];
      
      for (let i = 1; i < data.length - 1; i++) {
        const prevPoint = data[i - 1];
        const currPoint = data[i];
        const nextPoint = data[i + 1];
        
        const changeBeforeCurr = Math.abs(currPoint.close - prevPoint.close);
        const changeAfterCurr = Math.abs(nextPoint.close - currPoint.close);
        const totalChange = changeBeforeCurr + changeAfterCurr;
        
        if (totalChange > maxChange) {
          maxChange = totalChange;
          maxChangePoint = currPoint;
        }
      }
      
      points.push(maxChangePoint);
    }
    
    return points.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // New helper method for better tooltip display
  private showPhaseTooltip(event: MouseEvent, phase: any, phaseType: string): void {
    const tooltip = d3.select(this.chartContainer.nativeElement)
      .append('div')
      .attr('class', 'gantt-tooltip')
      .style('opacity', 0)
      .style('z-index', '1500');
      
    // Format dates nicely
    const startDate = phase.start.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    const endDate = phase.end.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    
    // Calculate duration
    const durationMs = phase.end.getTime() - phase.start.getTime();
    const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24));
    let durationText = `${durationDays} days`;
    if (durationDays > 30) {
      const months = Math.round(durationDays / 30);
      durationText = `${months} month${months > 1 ? 's' : ''} (${durationDays} days)`;
    }
    
    // Enhanced tooltip content with better formatting
    let tooltipContent = `
      <div class="tooltip-header ${phaseType}-header">${phase.label}</div>
      <div class="tooltip-period"><strong>Period:</strong> ${startDate} - ${endDate}</div>
      <div class="tooltip-duration"><strong>Duration:</strong> ${durationText}</div>
      <div class="tooltip-type"><strong>Type:</strong> ${phaseType.charAt(0).toUpperCase() + phaseType.slice(1)} Market</div>
    `;
    
    // Add stock performance section if we have data
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
    
    // Position tooltip with better layout
    const tooltipWidth = 280;
    const tooltipNode = tooltip.node() as HTMLElement;
    const xPos = Math.min(event.pageX + 10, window.innerWidth - tooltipWidth - 20);
    
    tooltip.style('left', `${xPos}px`)
      .style('top', `${event.pageY - 20}px`)
      .transition()
      .duration(200)
      .style('opacity', 1);
  }

  // Helper method to hide phase tooltip
  private hidePhaseTooltip(): void {
    d3.select(this.chartContainer.nativeElement).selectAll('.gantt-tooltip')
      .transition()
      .duration(200)
      .style('opacity', 0)
      .remove();
  }

  // Helper method to calculate stock performance in a phase
  private calculateStockPerformanceInPhase(phase: any): any[] {
    const results: any[] = [];
    
    this.sortedStocks.forEach(stock => {
      // Find data points for this stock within the phase period
      const stockData = this.data
        .find((s: any) => s.symbol === stock.symbol)?.data
        .filter((d: any) => {
          const date = d.date instanceof Date ? d.date : new Date(d.date);
          return date >= phase.start && date <= phase.end;
        })
        .sort((a: any, b: any) => {
          const dateA = a.date instanceof Date ? a.date : new Date(a.date);
          const dateB = b.date instanceof Date ? b.date : new Date(b.date);
          return dateA.getTime() - dateB.getTime();
        });
        
      if (stockData && stockData.length > 1) {
        const firstPrice = +stockData[0].close;
        const lastPrice = +stockData[stockData.length - 1].close;
        const percentChange = ((lastPrice - firstPrice) / firstPrice) * 100;
        
        results.push({
          symbol: stock.symbol,
          firstPrice,
          lastPrice,
          percentChange,
          color: stock.color
        });
      }
    });
    
    // Sort by percent change (best performers first)
    return results.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));
  }

  // Updated helper method for phase background colors
  private getPhaseBackgroundColor(phaseType: string): string {
    switch(phaseType) {
      case 'bull': return 'rgba(235, 251, 238, 0.7)'; // Light green background
      case 'bear': return 'rgba(253, 235, 236, 0.7)'; // Light red background  
      case 'consolidation': return 'rgba(252, 248, 232, 0.7)'; // Light yellow/orange background
      default: return 'rgba(240, 240, 240, 0.7)'; // Light grey
    }
  }

  // New method to render stocks line chart view
  private renderStocksView(svg: any, x: any, width: number, height: number, 
                          stocks: { symbol: string; data: { date: Date; close: number }[] }[], 
                          allDataPoints: { date: Date; close: number }[]): void {
    // Remove any existing tooltips first
    d3.select(this.chartContainer.nativeElement).selectAll('.tooltip, .gantt-tooltip').remove();

    // Create tooltip with higher z-index
    const tooltip = d3.select(this.chartContainer.nativeElement)
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('z-index', '1500'); // Higher z-index to prevent overlap

    // Use patriotic color scheme
    const color = (symbol: string) => {
      const stockEntry = this.sortedStocks.find(s => s.symbol === symbol);
      return stockEntry ? stockEntry.color : this.colorScheme[0];
    };
        
    const globalMin = d3.min(allDataPoints, d => +d.close) || 0;
    const globalMax = d3.max(allDataPoints, d => +d.close) || 100;
    const yDomain = [globalMin * 0.95, globalMax * 1.05]; // Add 5% padding

    const y = d3
      .scaleLinear()
      .domain(yDomain)
      .range([height, 0]);
    
    // Add grid
    function makeGrid(scale: any, axis: string) {
      return d3.axisBottom(scale)
        .ticks(10)
        .tickSize(axis === 'x' ? -height : -width)
        .tickFormat(() => '');
    }
    
    // Add X grid
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(makeGrid(x, 'x'));
    
    // Add Y grid
    svg.append('g')
      .attr('class', 'grid')
      .call(makeGrid(y, 'y'));

    // Add Y axis
    svg.append('g')
      .attr('class', 'y axis')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .style('fill', '#d62828')
      .style('font-weight', 'bold')
      .style('font-size', '11px');
      
    // Add X axis
    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .ticks(d3.timeMonth.every(2))
        .tickFormat((d) => d3.timeFormat('%b %y')(d instanceof Date ? d : new Date(d.valueOf()))))
      .selectAll('text')
      .attr('dy', '1em')
      .attr('transform', 'rotate(-15)')
      .style('text-anchor', 'end')
      .style('fill', '#333');

    // Draw background for better contrast
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'rgba(255,255,255,0.5)')
      .attr('rx', 5)
      .attr('ry', 5);
      
    // Continue with existing code for drawing stock lines and points
    stocks.forEach((stock: Stock, index: number) => {
      const formattedData = stock.data.map(d => ({
        date: d.date instanceof Date ? d.date : new Date(d.date),
        close: +d.close,
      }));
      
      // Create path with animation
      const drawLine = (data: any[], stockSymbol: string, lineIndex: number) => {
        // ...existing line drawing code...
        const line = d3
          .line<{ date: Date; close: number }>()
          .x(d => x(d.date))
          .y(d => y(d.close))
          .curve(d3.curveMonotoneX);

        // Get path length for animation
        const path = svg
          .append('path')
          .datum(data)
          .attr('class', `line stock-${stockSymbol.toLowerCase()}`)
          .attr('d', line)
          .attr('stroke', color(stockSymbol)) // Use consistent color based on sorted price
          .attr('stroke-width', 3)
          .attr('fill', 'none')
          .style('opacity', 0.85);
        
        // Store path for later animation replay
        this.stockPaths.set(stockSymbol, path);
        
        // Animate the line drawing
        const totalLength = path.node()?.getTotalLength() || 0;
        path
          .attr("stroke-dasharray", totalLength + " " + totalLength)
          .attr("stroke-dashoffset", totalLength)
          .transition()
          .duration(1500)
          .ease(d3.easeLinear)
          .attr("stroke-dashoffset", 0)
          .on('end', () => {
            // Clear dash array after animation
            path.attr("stroke-dasharray", null);
            // Add stock symbol labels after animation completes
            addStockLabels(data, stockSymbol, lineIndex);
          });
        
        return path;
      };
      
      // Add stock symbols along the line with contrasting background box
      const addStockLabels = (data: any[], stockSymbol: string, lineIndex: number) => {
        // Add symbol at the end of the line
        const lastPoint = data[data.length - 1];
        
        // Create a group for the label and its background
        const labelGroup = svg.append('g')
          .attr('class', `stock-label-group stock-${stockSymbol.toLowerCase()}-label`);
        
        // Calculate label text for sizing the background
        const labelText = stockSymbol;
        const tempText = labelGroup.append('text')
          .text(labelText)
          .style('visibility', 'hidden'); // Invisible, just for measuring
        
        // Get text dimensions for proper background sizing
        const textNode = tempText.node();
        const textBBox = textNode ? textNode.getBBox() : {width: 50, height: 14};
        tempText.remove(); // Remove the measuring text
        
        // Add background rectangle with padding
        const padding = 6;
        const backgroundWidth = textBBox.width + padding * 2;
        const backgroundHeight = textBBox.height + padding * 1.5;
        
        // Position label slightly offset from the end point - moved further right
        // Increase the offset from 10 to 25 to move labels more to the right
        const xPos = x(lastPoint.date) + 25; 
        const yPos = y(lastPoint.close);
        
        // Create background rectangle with the stock color as a border
        labelGroup.append('rect')
          .attr('class', 'stock-label-background')
          .attr('x', xPos - padding)
          .attr('y', yPos - backgroundHeight/2)
          .attr('width', backgroundWidth)
          .attr('height', backgroundHeight)
          .attr('fill', 'rgba(255, 255, 255, 0.85)') // Semi-transparent white background
          .attr('stroke', color(stockSymbol)) // Border color matches the line color
          .attr('stroke-width', 1.5)
          .attr('rx', 4) // Rounded corners
          .attr('ry', 4);
        
        // Add the text on top of the background
        labelGroup.append('text')
          .attr('class', 'stock-symbol-label')
          .attr('x', xPos + backgroundWidth/2 - padding)
          .attr('y', yPos)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .text(labelText)
          .attr('fill', color(stockSymbol)) // Text color matches the line color
          .style('opacity', 0)
          .transition()
          .duration(500)
          .style('opacity', 1);
        
        // Add hover interaction to highlight the associated line
        labelGroup.on('mouseover', () => {
          // Highlight the corresponding line
          d3.select(`.line.stock-${stockSymbol.toLowerCase()}`)
            .classed('highlighted', true);
        })
        .on('mouseout', () => {
          // Remove highlight
          d3.select(`.line.stock-${stockSymbol.toLowerCase()}`)
            .classed('highlighted', false);
        });
      };

      // Draw animated line
      drawLine(formattedData, stock.symbol, index);

      // ...existing code for data points...
      // Select data points to show
      let dataPointsToShow: { date: Date; close: number }[] = [];
      if (formattedData.length > 0) {
        const dataLength = formattedData.length;
        const indices = Array.from({length: 10}, (_, i) => 
          Math.floor(dataLength * i / 9)
        );
        
        if (indices[indices.length - 1] !== dataLength - 1) {
          indices[indices.length - 1] = dataLength - 1;
        }
        
        dataPointsToShow = indices.map(i => formattedData[i]);
      }
      
      // Add data points with animation
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
        .attr('stroke', color(stock.symbol)) // Use consistent color based on sorted price
        .attr('stroke-width', 2)
        .style('opacity', 0)
        .each(function(this: SVGCircleElement, d: any) {
          d3.select(this).datum({
            ...d,
            stockSymbol: stock.symbol
          });
        })
        .transition()
        .delay((_: any, i: number) => 1500 + i * 100)
        .duration(500)
        .attr('r', 4)
        .style('opacity', 1);
      
      // Event handlers for data points
      svg.selectAll(`.dot-${index}`)
        .on('mouseover', (event: MouseEvent, d: any) => {
          // ...existing mouseover code...
          const target = event.target as SVGCircleElement;
          
          tooltip.transition()
            .duration(200)
            .style('opacity', 0.95)
            .style('transform', 'scale(1.05)');
          
          // Format date nicely
          const formattedDate = d.date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          
          // Enhanced tooltip with header and formatted values
          tooltip.html(
            `<div class="tooltip-header">${d.stockSymbol}</div>` +
            `<div>Date: ${formattedDate}</div>` +
            `<div>Price: $${d.close.toFixed(2)}</div>`
          )
          .style('left', `${event.pageX}px`)
          .style('top', `${event.pageY - 28}px`);
          
          // Update status box in bottom left
          this.statusStock = d.stockSymbol;
          this.statusPrice = d.close.toFixed(2);
          this.statusDate = formattedDate;
          this.showStatusBox = true;
          
          // Use fixed positioning method instead of event-based
          this.updateStatusPosition(event);

          // Highlight the circle with animation
          d3.select(target)
            .transition()
            .duration(200)
            .attr('r', 6)
            .attr('stroke-width', 3);
          
          // Add hover line with animation
          svg.append('line')
            .attr('class', 'hover-line')
            .attr('x1', x(d.date))
            .attr('x2', x(d.date))
            .attr('y1', height)
            .attr('y2', height)
            .attr('stroke', color(stock.symbol)) // Use consistent color based on sorted price
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '3,3')
            .transition()
            .duration(200)
            .attr('y2', 0);
        })
        .on('mouseout', (event: MouseEvent) => {
          // ...existing mouseout code...
          tooltip.transition()
            .duration(500)
            .style('opacity', 0)
            .style('transform', 'scale(1)');
          
          // Hide status box
          this.showStatusBox = false;

          // Restore circle size with animation
          d3.select(event.target as Element)
            .transition()
            .duration(300)
            .attr('r', 4)
            .attr('stroke-width', 2);
          
          // Remove hover line with animation
          svg.selectAll('.hover-line')
            .transition()
            .duration(200)
            .style('opacity', 0)
            .remove();
        });
    });
  }

  // Helper method to get color for different market phases
  private getPhaseColor(phaseType: string): string {
    switch(phaseType) {
      case 'bull': return '#a8e6cf'; // Light green
      case 'bear': return '#ffaaa5'; // Light red
      case 'consolidation': return '#ffd3b6'; // Light orange
      default: return '#d8e2dc'; // Light grey
    }
  }
  
  // Add helper method for phase stroke colors
  private getPhaseStrokeColor(phaseType: string): string {
    switch(phaseType) {
      case 'bull': return '#2a9d8f'; // Darker green
      case 'bear': return '#e76f51'; // Darker red
      case 'consolidation': return '#f4a261'; // Darker orange
      default: return '#6b705c'; // Darker grey
    }
  }
  
  // Add helper method for phase label colors
  private getPhaseLabelColor(phaseType: string): string {
    switch(phaseType) {
      case 'bull': return '#264653'; // Dark text on light background
      case 'bear': return '#264653'; // Dark text on light background
      case 'consolidation': return '#264653'; // Dark text on light background
      default: return '#264653'; // Dark text
    }
  }

  // Helper method to generate realistic market phases based on data range
  private generateMarketPhases(startYear: number, endYear: number): any[] {
    let phases = [];
    let currentYear = startYear;
    
    while (currentYear <= endYear) {
      // For simplicity, just alternating between bull and bear markets
      phases.push({ 
        start: new Date(`${currentYear}-01-01`), 
        end: new Date(`${currentYear}-06-30`), 
        type: 'bull', 
        label: `Bull Market ${currentYear}`
      });
      
      phases.push({ 
        start: new Date(`${currentYear}-07-01`), 
        end: new Date(`${currentYear}-10-31`), 
        type: 'bear', 
        label: `Bear Market ${currentYear}`
      });
      
      phases.push({ 
        start: new Date(`${currentYear}-11-01`), 
        end: new Date(`${currentYear}-12-31`), 
        type: 'consolidation', 
        label: `Consolidation ${currentYear}`
      });
      
      currentYear++;
    }
    
    return phases;
  }

  // Add method to better format market phase labels
  formatMarketPhaseLabel(phase: any): string {
    return `${phase.type.charAt(0).toUpperCase() + phase.type.slice(1)} Market`;
  }

  // Update the status position function for consistent placement
  updateStatusPosition(event: MouseEvent): void {
    const statusBox = document.querySelector('.stock-status-box') as HTMLElement;
    if (statusBox && this.showStatusBox) {
      // Get container dimensions
      const rect = this.chartContainer.nativeElement.getBoundingClientRect();
      
      // Calculate position - use fixed position relative to chart container
      // rather than following the cursor for consistent experience
      const statusWidth = 140; // Match the width in CSS
      const statusHeight = 60; // Minimum height in CSS
      
      // Position in bottom left with padding (default position)
      statusBox.style.left = '20px';
      statusBox.style.bottom = '20px';
      statusBox.style.top = 'auto';
      
      // Apply any additional styling to ensure visibility
      statusBox.style.zIndex = '2000';
    }
  }
}
