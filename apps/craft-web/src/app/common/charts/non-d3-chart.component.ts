import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-non-d3-chart',
  template: `<canvas #chartCanvas></canvas>`,
  standalone: true
})
export class NonD3ChartComponent implements AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  selectedMetrics: string[] = ['cpu', 'memory', 'network'];
  private chart!: Chart;

  ngAfterViewInit() {
    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [
          { label: 'Example', data: [10, 20, 15], backgroundColor: 'blue' }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  updateSelectedMetrics(metrics: string[]): void {
    this.selectedMetrics = metrics;
    this.updateChartSettings();
  }

  private updateChartSettings(): void {
    const c = this.selectedMetrics.length;
    let label = '';
    if (c === 1) {
      const metric = this.selectedMetrics[0];
      if (metric === 'cpu') label = 'CPU (%)';
      else if (metric === 'memory') label = 'Memory (GB)';
      else if (metric === 'network') label = 'Network (ms)';
    }
    this.chart.options.scales = {
      y: {
        title: { display: !!label, text: label },
        beginAtZero: true
      }
    };
    this.chart.update();
  }
}
