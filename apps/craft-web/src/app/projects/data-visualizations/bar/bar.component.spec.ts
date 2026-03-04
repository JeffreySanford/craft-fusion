import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarComponent } from './bar.component';

describe('BarComponent', () => {
  let component: BarComponent;
  let fixture: ComponentFixture<BarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have showLegend property set to false by default', () => {
    expect(component.showLegend).toBeFalsy();
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
    expect(gdpData?.length).toBeGreaterThan(0);
    const firstEntry = gdpData?.[0];
    expect(firstEntry?.year).toEqual(1776);
  });

  it('uses renderer to remove previous svg and tooltips when initializing chart', () => {
    const host = document.createElement('div');
    const chart = document.createElement('div');
    chart.id = 'barChart';
    const svg = document.createElement('svg');
    const tip = document.createElement('div');
    tip.className = 'bar-tooltip';
    chart.appendChild(svg);
    chart.appendChild(tip);
    host.appendChild(chart); // ensure querySelector finds #barChart
    component.el = { nativeElement: host } as any;

    const spy = vi.spyOn(component.renderer, 'removeChild').mockImplementation((p, c) => p.removeChild(c));
    component['initChart']();
    // the old tooltip should be cleared from host
    expect(host.querySelectorAll('.bar-tooltip').length).toBe(1);
    // chart container should now contain a freshly-created svg element
    const chartChildren = host.querySelector('#barChart')?.children;
    expect(chartChildren?.length).toBe(1);
    expect(chartChildren?.[0].tagName.toLowerCase()).toBe('svg');
    expect(spy).toHaveBeenCalled();
  });
});
