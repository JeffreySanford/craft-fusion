import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ChartLayoutService } from './chart-layout.service';
import { ExtendedChartData } from '../../projects/data-visualizations/data-visualizations.component';

describe('ChartLayoutService', () => {
  let service: ChartLayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ChartLayoutService] });
    service = TestBed.inject(ChartLayoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('calculateChartClass returns expected classes', () => {
    expect(service.calculateChartClass('app-line-chart')).toContain('line-chart-content');
    expect(service.calculateChartClass('app-bar-chart')).toContain('bar-chart-content');
    expect(service.calculateChartClass('app-fire-alert')).toContain('scrollable-chart-content');
    expect(service.calculateChartClass('unknown')).toEqual('fixed-chart-content');
  });

  it('optimizeChartLayout handles sizes correctly', () => {
    const charts: ExtendedChartData[] = [
      { size: 'large', position: 0 } as ExtendedChartData,
      { size: 'medium', position: 0 } as ExtendedChartData,
      { size: 'small', position: 0 } as ExtendedChartData,
      { size: 'small', position: 0 } as ExtendedChartData,
    ];
    const result = service.optimizeChartLayout(charts);
    // large first
    expect(result[0].size).toBe('large');
    // medium+small pairing
    expect(result[1].size).toBe('medium');
    expect(result[2].size).toBe('small');
  });
});
