import { Injectable } from '@angular/core';
import Chart from 'chart.js/auto';

@Injectable({ providedIn: 'root' })
export class PerformanceHelperService {
  createBarChart(ctx: CanvasRenderingContext2D, labels: string[], data: number[], colors: string[]) {
    const shortLabels = labels.map(label => {
      // Shorten service names for better display
      return label.replace('Service', '').replace('State', '').trim();
    });
    
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: shortLabels,
        datasets: [
          {
            label: 'Avg Response Time (ms)',
            data,
            backgroundColor: colors,
            borderWidth: 1,
            borderColor: colors.map(c => c),
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              title: (items) => {
                const index = items[0]?.dataIndex;
                return index !== undefined ? labels[index] : '';
              },
              label: (context) => {
                const value = context.parsed.y;
                return value !== null ? `Response Time: ${value.toFixed(1)}ms` : 'No data';
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: {
                size: 11,
              },
              maxRotation: 45,
              minRotation: 45,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              callback: (value) => `${value}ms`,
            },
          },
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
        <text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="#9CA3AF" font-size="12">No data available</text>
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
            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.8" />
            <stop offset="50%" style="stop-color:#10b981;stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:#ef4444;stop-opacity:0.8" />
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
      let dotColor = '#10B981';
      if (statusNum >= 400) dotColor = '#EF4444';
      else if (statusNum >= 300) dotColor = '#F59E0B';
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
        <path d="${pathData}" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        ${dotsHtml}
      </svg>
    `;
    return svg;
  }
}
