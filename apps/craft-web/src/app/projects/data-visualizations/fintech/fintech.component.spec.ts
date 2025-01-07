import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FintechComponent } from './fintech.component';
import { FintechChartData } from '../data-visualizations.interfaces';

describe('FintechComponent', () => {
  let component: FintechComponent;
  let fixture: ComponentFixture<FintechComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FintechComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FintechComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render chart with data', () => {
    const testData: FintechChartData[] = [
      { task: 'Task 1', startTime: new Date(), endTime: new Date(), group: 'group1' },
      { task: 'Task 2', startTime: new Date(), endTime: new Date(), group: 'group2' }
    ];
    component.data = testData;
    fixture.detectChanges();
    spyOn(component, 'renderChart');
    component.ngOnChanges({
      data: {
        currentValue: testData,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true
      }
    });
    expect(component.renderChart).toHaveBeenCalled();
  });
});
