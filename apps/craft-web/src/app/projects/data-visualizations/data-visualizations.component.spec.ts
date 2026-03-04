// vitest globals for tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
// make sure vitest types are available by reference
///<reference types="vitest" />
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DataVisualizationsComponent } from './data-visualizations.component';
import { ChartLayoutService } from './services/chart-layout.service';
import { DataVisualizationsModule } from './data-visualizations.module';
import { YahooService } from '../../common/services/yahoo.service';
import { of } from 'rxjs';
import { HistoricalData } from '../../common/services/yahoo.service';

describe('DataVisualizationsComponent', () => {
  let component: DataVisualizationsComponent;
  let fixture: ComponentFixture<DataVisualizationsComponent>;
  // spy object for YahooService, mock returns an observable
  let yahooSpy: Partial<YahooService> & { getHistoricalData: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    yahooSpy = { getHistoricalData: vi.fn().mockReturnValue(of([])) } as Partial<YahooService> & { getHistoricalData: ReturnType<typeof vi.fn> };

    await TestBed.configureTestingModule({
      imports: [DataVisualizationsModule, HttpClientTestingModule],
      providers: [ChartLayoutService, { provide: YahooService, useValue: yahooSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(DataVisualizationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('toggles a chart on and off', () => {
    const chart = component.allCharts[0]!; // first entry always exists
    expect(component.isChartActive(chart)).toBeTruthy();
    component.toggleChart(chart);
    expect(component.isChartActive(chart)).toBeFalsy();
    component.toggleChart(chart);
    expect(component.isChartActive(chart)).toBeTruthy();
  });

  it('respects tile limits in hasRoomForMoreTiles', () => {
    // start with no tiles
    component.displayedCharts = [];
    const mediumChart = component.allCharts.find(c => c.size === 'medium')!;
    expect(component.hasRoomForMoreTiles(mediumChart)).toBeTruthy();

    // fill up medium slots to 4
    component.displayedCharts = Array(4).fill(mediumChart);
    expect(component.hasRoomForMoreTiles(mediumChart)).toBeFalsy();
  });

  it('loads fintech data and updates chart arrays', async () => {
    const sample: HistoricalData[] = [
      { symbol: 'AAPL', data: [] },
    ];
    (yahooSpy.getHistoricalData as ReturnType<typeof vi.fn>).mockReturnValue(of(sample));

    // recreate component to trigger constructor logic again
    fixture = TestBed.createComponent(DataVisualizationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // wait for async subscription to complete
    await Promise.resolve();

    // service should have been called with all five symbols using default 1y range
    expect(yahooSpy.getHistoricalData).toHaveBeenCalledWith([
      'AAPL', 'GOOGL', 'MSFT', '^DJI', '^IXIC'
    ], '1d', '1y');

    expect(component.fintechChartData).toEqual(sample);

    const available = component.availableCharts.find(c => c.component === 'app-finance-chart');
    expect((available?.data as unknown as HistoricalData[])).toEqual(sample);
  });

  it('exposes range options and reloads data when range changes', async () => {
    const sample: HistoricalData[] = [
      { symbol: 'AAPL', data: [] },
    ];
    const spy = yahooSpy.getHistoricalData as ReturnType<typeof vi.fn>;
    spy.mockReturnValue(of(sample));

    // initial constructor call already done; clear previous calls
    spy.mockClear();

    // ranges list contains expected elements
    expect(component.financeRangeOptions).toEqual(['1d','5d','2wk','1mo','6mo','1y','all']);
    expect(component.financeRange).toBe('1y');

    // exercise the DOM: render a finance tile and check buttons
    const financeChart = component.availableCharts.find(c => c.component === 'app-finance-chart')!;
    financeChart.active = true;
    component.displayedCharts = [financeChart];
    fixture.detectChanges();

    const btns = fixture.nativeElement.querySelectorAll('.finance-range-buttons button');
    expect(btns.length).toBe(component.financeRangeOptions.length);
    expect(btns[component.financeRangeOptions.indexOf('1y')].classList.contains('active')).toBe(true);

    // simulate click via DOM
    btns[1].click(); // '5d'
    await Promise.resolve();
    fixture.detectChanges();

    expect(component.financeRange).toBe('5d');
    expect(spy).toHaveBeenCalledWith(
      ['AAPL','GOOGL','MSFT','^DJI','^IXIC'],
      '1d',
      '5d'
    );

    // calling again with same range should not issue new request
    spy.mockClear();
    btns[1].click();
    await Promise.resolve();
    expect(spy).not.toHaveBeenCalled();
  });
});
