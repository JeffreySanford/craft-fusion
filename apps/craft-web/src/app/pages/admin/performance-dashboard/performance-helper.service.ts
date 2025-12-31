import { Injectable } from '@angular/core';
import Chart from 'chart.js/auto';

@Injectable({ providedIn: 'root' })
export class PerformanceHelperService {
  createBarChart(ctx: CanvasRenderingContext2D, labels: string[], data: number[], colors: string[]) {
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Value',
            data,
            backgroundColor: colors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true },
        },
      },
    });
  }

  updateChartData(chart: any, labels: string[], data: number[], colors?: string[]) {
    if (!chart) return;
    chart.data.labels = labels;
    if (chart.data.datasets && chart.data.datasets[0]) {
      chart.data.datasets[0].data = data;
      if (colors) chart.data.datasets[0].backgroundColor = colors;
    }
    try {
      chart.update();
    } catch (e) {
      // no-op in case chart isn't ready
    }
  }

  generateEmptySparkline(): string {
    const width = 250;
    const height = 80;
    return `
      <svg width="${width}" height="${height}" class="sparkline-detailed empty" xmlns="http://www.w3.org/2000/svg">
        <text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="var(--md-sys-color-on-surface, #9CA3AF)" font-size="12">No data available</text>
      </svg>
    `;
  }

  generateSparklineSVG(timelineData: { timestamp: Date; responseTime: number; status?: number }[]): string {
    if (!timelineData || timelineData.length < 2) return '';
    const width = 100;
    const height = 30;
    const padding = 2;
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;
    const timeValues = timelineData.map(d => d.timestamp.getTime());
    const responseValues = timelineData.map(d => d.responseTime);
    const minTime = Math.min(...timeValues);
    const maxTime = Math.max(...timeValues);
    const minResponse = Math.min(...responseValues);
    const maxResponse = Math.max(...responseValues);
    const points = timelineData
      .map(d => {
        const x = padding + (availableWidth * (d.timestamp.getTime() - minTime)) / (maxTime - minTime);
        const y = height - padding - (availableHeight * (d.responseTime - minResponse)) / (maxResponse - minResponse);
        return `${x},${y}`;
      })
      .join(' ');
    return `
      <svg width="${width}" height="${height}" class="sparkline">
        <polyline fill="none" stroke="url(#sparklineGradient)" stroke-width="1.5" points="${points}" />
        <defs>
            <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" class="spark-stop-a" />
              <stop offset="50%" class="spark-stop-b" />
              <stop offset="100%" class="spark-stop-c" />
            </linearGradient>
        </defs>
      </svg>
    `;
  }

  generateDetailedSparklineSVG(timelineData: { timestamp: Date; responseTime: number; status: number }[]): string {
    if (!timelineData || timelineData.length < 2) return this.generateEmptySparkline();
    const width = 250;
    const height = 80;
    const padding = 5;
    const innerWidth = width - 2 * padding;
    const innerHeight = height - 2 * padding;
    const responseTimes = timelineData.map(data => data.responseTime);
    const statuses = timelineData.map(data => data.status);
    const timeValues = timelineData.map(d => d.timestamp.getTime());
    const minTime = Math.min(...timeValues);
    const maxTime = Math.max(...timeValues);
    const minResponse = 0;
    const maxResponse = Math.max(...responseTimes) * 1.1;
    const pathData = timelineData
      .map(d => {
        const ts = d.timestamp instanceof Date ? d.timestamp : new Date(d.timestamp as any);
        const x = padding + (innerWidth * (ts.getTime() - minTime)) / (maxTime - minTime);
        const y = height - padding - (innerHeight * (d.responseTime - minResponse)) / (maxResponse - minResponse);
        return `${x},${y}`;
      })
      .join(' ');
    let dotsHtml = '';
    timelineData.forEach((d, index) => {
      const x = padding + (innerWidth * (d.timestamp.getTime() - minTime)) / (maxTime - minTime);
      const y = height - padding - (innerHeight * (d.responseTime - minResponse)) / (maxResponse - minResponse);
      const status = statuses[index];
      const statusNum = typeof status === 'number' ? status : Number(status);
      let dotColor = 'var(--craft-live-color, #10B981)';
      if (statusNum >= 400) dotColor = 'var(--md-sys-color-error, #EF4444)';
      else if (statusNum >= 300) dotColor = 'var(--md-sys-color-warning, #F59E0B)';
      dotsHtml += `<circle cx="${x}" cy="${y}" r="3" fill="${dotColor}" stroke="rgba(255,255,255,0.3)" stroke-width="1"></circle>`;
    });
    const areaData = pathData + ` L ${padding + innerWidth},${height - padding} L ${padding},${height - padding} Z`;
    const svg = `
      <svg width="${width}" height="${height}" class="sparkline-detailed" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="rgba(59, 130, 246, 0.5)" />
            <stop offset="100%" stop-color="rgba(59, 130, 246, 0)" />
          </linearGradient>
        </defs>
        <path d="${areaData}" fill="url(#areaGradient)" />
        <path d="${pathData}" fill="none" stroke="var(--md-sys-color-primary, #3B82F6)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        ${dotsHtml}
      </svg>
    `;
    return svg;
  }
}
