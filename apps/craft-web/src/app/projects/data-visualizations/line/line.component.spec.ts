import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineComponent } from './line.component';

describe('LineComponent', () => {
  let component: LineComponent;
  let fixture: ComponentFixture<LineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LineComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should remove existing svg and tooltip using renderer when creating chart', () => {
    // prepare a fake container with parent and dimensions so createChart doesn't crash
    const wrapper = document.createElement('div');
    const host = document.createElement('div');
    Object.defineProperty(host, 'offsetWidth', { value: 200, configurable: true });
    Object.defineProperty(host, 'offsetHeight', { value: 200, configurable: true });
    wrapper.appendChild(host);
    const svg = document.createElement('svg');
    const tip = document.createElement('div');
    tip.className = 'line-tooltip';
    host.appendChild(svg);
    host.appendChild(tip);
    // also give parent dimensions
    Object.defineProperty(wrapper, 'offsetWidth', { value: 200, configurable: true });
    Object.defineProperty(wrapper, 'offsetHeight', { value: 200, configurable: true });
    (component as any).chartContainer = { nativeElement: host } as any;

    vi.spyOn((component as any).renderer, 'removeChild').mockImplementation((p: any, c: any) => p.removeChild(c));
    (component as any).createChart();
    expect((component as any).renderer.removeChild).toHaveBeenCalled();
  });
});
