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
    (component as any).renderChart = jest.fn();
    component.ngOnChanges({
      data: {
        currentValue: testData,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect((component as any).renderChart).toHaveBeenCalled();
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
});
