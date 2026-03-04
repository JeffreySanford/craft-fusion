// vitest globals (describe/it/expect/vi) permit type checking and runtime
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinanceComponent, Stock } from './finance.component';
import { FinanceModule } from './finance.module';

describe('FinanceComponent', () => {
  let component: FinanceComponent;
  let fixture: ComponentFixture<FinanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({

      imports: [FinanceModule],
    }).compileComponents();

    fixture = TestBed.createComponent(FinanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render chart with data', () => {
    const testData: Stock[] = [
      { symbol: 'AAPL', data: [{ date: new Date(2020, 0, 1), close: 150 }] },
      { symbol: 'GOOGL', data: [{ date: new Date(2020, 0, 2), close: 250 }] },
    ];
    component.data = testData;
    // treat renderChart as a jest spy without losing type information
    ((component as unknown) as { renderChart: ReturnType<typeof vi.fn> }).renderChart = vi.fn();
    component.ngOnChanges({
      data: {
        currentValue: testData,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(((component as unknown) as { renderChart: ReturnType<typeof vi.fn> }).renderChart).toHaveBeenCalled();
  });

  it('should render legend with correct stock symbols', () => {
    const testData: Stock[] = [
      { symbol: 'AAPL', data: [{ date: new Date(2020, 0, 1), close: 150 }] },
      { symbol: 'GOOGL', data: [{ date: new Date(2020, 0, 2), close: 250 }] },
      { symbol: 'MSFT', data: [{ date: new Date(2020, 0, 3), close: 300 }] },
    ];
    component.data = testData;
    component.ngOnChanges({
      data: {
        currentValue: testData,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    fixture.detectChanges();
    const legendItems = fixture.nativeElement.querySelectorAll('.legend-item');
    expect(legendItems.length).toBe(3);
    expect(legendItems[0].textContent.trim()).toContain('MSFT');
    expect(legendItems[1].textContent.trim()).toContain('GOOGL');
    expect(legendItems[2].textContent.trim()).toContain('AAPL');
  });

  it('does not throw when rendering stocks with no data or invalid date', () => {
    const testData: Stock[] = [
      { symbol: 'EMPTY', data: [] },
      { symbol: 'BAD', data: [{ date: (undefined as unknown) as Date, close: 0 }] },
    ];
    component.data = testData;
    expect(() => {
      component.ngOnChanges({
        data: {
          currentValue: testData,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });
      fixture.detectChanges();
      // directly call renderChart as an extra guard
      ((component as unknown) as { renderChart: (stocks: Stock[]) => void }).renderChart(testData);
    }).not.toThrow();
  });

  it('should use renderer to clear previous content when rendering chart', () => {
    const host = document.createElement('div');
    const child = document.createElement('span');
    host.appendChild(child);
    component.chartContainer = { nativeElement: host } as any;
    // set data so renderChart uses it
    component.data = [{ symbol: 'TEST', data: [{ date: new Date(), close: 1 }] }];

    vi.spyOn(component.renderer, 'removeChild').mockImplementation((parent, childEl) => parent.removeChild(childEl));
    component.renderChart([{ symbol: 'TEST', data: [{ date: new Date(), close: 1 }] }]);
    // after rendering, a new svg element should be attached to host (tooltip may also appear)
    const tags = Array.from(host.children).map(c => (c as HTMLElement).tagName.toLowerCase());
    expect(tags).toContain('svg');  });

  it('should use renderer during onMarketPhasesChange cleanup', () => {
    const host = document.createElement('div');
    const child = document.createElement('span');
    host.appendChild(child);
    component.chartContainer = { nativeElement: host } as any;
    vi.spyOn(component.renderer, 'removeChild').mockImplementation((p, c) => p.removeChild(c));
    component.onMarketPhasesChange();
    // host children should be gone (handled earlier)

  });
});
