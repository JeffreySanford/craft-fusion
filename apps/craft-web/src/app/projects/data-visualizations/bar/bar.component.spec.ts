import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarComponent } from './bar.component';

describe('BarComponent', () => {
  let component: BarComponent;
  let fixture: ComponentFixture<BarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have showLegend property set to true by default', () => {
    expect(component.showLegend).toBeTruthy();
  });

  it('should have legendItems array initialized', () => {
    expect(component.legendItems).toBeDefined();
    expect(Array.isArray(component.legendItems)).toBeTruthy();
  });

  it('should toggle legend visibility', () => {
    const initialVisibility = component.showLegend;
    const newVisibility = component.toggleLegend();
    expect(newVisibility).toEqual(!initialVisibility);
    expect(component.showLegend).toEqual(newVisibility);
  });

  it('should have data starting from US inception in 1776', () => {

    const gdpData = component['gdpData'];
    expect(gdpData[0].year).toEqual(1776);
  });
});
