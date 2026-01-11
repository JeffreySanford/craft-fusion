import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinanceComponent } from './finance.component';
import { FinanceChartData } from '../data-visualizations.interfaces';
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
    const testData: FinanceChartData[] = [
      { task: 'Task 1', startTime: new Date(), endTime: new Date(), group: 'normal', stockIndicator: 'AAPL', trade: 'buy', startValue: 100, endValue: 150 },
      { task: 'Task 2', startTime: new Date(), endTime: new Date(), group: 'extreme', stockIndicator: 'GOOGL', trade: 'sell', startValue: 200, endValue: 250 },
    ];
    component.data = testData;
    fixture.detectChanges();
    spyOn(component, 'renderChart');
    component.ngOnChanges({
      data: {
        currentValue: testData,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(component.renderChart).toHaveBeenCalled();
  });

  it('should render legend with correct stock symbols', () => {
    const testData: FinanceChartData[] = [
      { task: 'Task 1', startTime: new Date(), endTime: new Date(), group: 'normal', stockIndicator: 'AAPL', trade: 'buy', startValue: 100, endValue: 150 },
      { task: 'Task 2', startTime: new Date(), endTime: new Date(), group: 'extreme', stockIndicator: 'GOOGL', trade: 'sell', startValue: 200, endValue: 250 },
    ];
    component.data = testData;
    component.stocks = [{ symbol: 'AAPL' }, { symbol: 'GOOGL' }, { symbol: 'MSFT' }];
    fixture.detectChanges();
    const legendItems = fixture.nativeElement.querySelectorAll('.legend-item');
    expect(legendItems.length).toBe(3);
    expect(legendItems[0].textContent.trim()).toContain('AAPL');
    expect(legendItems[1].textContent.trim()).toContain('GOOGL');
    expect(legendItems[2].textContent.trim()).toContain('MSFT');
  });
});
