import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeroTileComponent } from './hero-tile.component';
import { AdminMaterialModule } from '../../admin-material.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('HeroTileComponent', () => {
  let component: HeroTileComponent;
  let fixture: ComponentFixture<HeroTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HeroTileComponent],
      imports: [AdminMaterialModule, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display label, value, and subLabel', () => {
    component.label = 'Test Label';
    component.value = '42';
    component.subLabel = 'Test Subtitle';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test Label');
    expect(compiled.textContent).toContain('42');
    expect(compiled.textContent).toContain('Test Subtitle');
  });

  it('should apply status class correctly', () => {
    component.status = 'ok';
    expect(component.statusClass).toBe('status-ok');

    component.status = 'warning';
    expect(component.statusClass).toBe('status-warning');

    component.status = 'critical';
    expect(component.statusClass).toBe('status-critical');
  });

  it('should apply delta class correctly', () => {
    component.delta = 5;
    expect(component.deltaClass).toBe('delta-positive');

    component.delta = -3;
    expect(component.deltaClass).toBe('delta-negative');

    component.delta = 0;
    expect(component.deltaClass).toBe('delta-neutral');
  });

  it('should show correct delta icon', () => {
    component.delta = 10;
    expect(component.deltaIcon).toBe('trending_up');

    component.delta = -10;
    expect(component.deltaIcon).toBe('trending_down');

    component.delta = 0;
    expect(component.deltaIcon).toBe('trending_flat');
  });

  it('should emit tileClick when clickable and clicked', () => {
    spyOn(component.tileClick, 'emit');
    component.clickable = true;

    component.onTileClick();

    expect(component.tileClick.emit).toHaveBeenCalled();
  });

  it('should not emit tileClick when not clickable', () => {
    spyOn(component.tileClick, 'emit');
    component.clickable = false;

    component.onTileClick();

    expect(component.tileClick.emit).not.toHaveBeenCalled();
  });

  it('should display detail text when provided', () => {
    component.detail = 'Additional detail';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Additional detail');
  });

  it('should apply pulse class when showPulse is true', () => {
    component.showPulse = true;
    fixture.detectChanges();

    const article = fixture.nativeElement.querySelector('.hero-tile');
    expect(article?.classList.contains('pulse')).toBe(true);
  });

  it('should apply clickable class when clickable is true', () => {
    component.clickable = true;
    fixture.detectChanges();

    const article = fixture.nativeElement.querySelector('.hero-tile');
    expect(article?.classList.contains('clickable')).toBe(true);
  });

  it('should set aria attributes correctly for clickable tiles', () => {
    component.clickable = true;
    component.label = 'Errors';
    component.value = '5';
    component.subLabel = '3 warnings';
    fixture.detectChanges();

    const article = fixture.nativeElement.querySelector('.hero-tile');
    expect(article?.getAttribute('role')).toBe('button');
    expect(article?.getAttribute('tabindex')).toBe('0');
    expect(article?.getAttribute('aria-label')).toContain('Errors: 5');
  });

  it('should not set aria button attributes for non-clickable tiles', () => {
    component.clickable = false;
    fixture.detectChanges();

    const article = fixture.nativeElement.querySelector('.hero-tile');
    expect(article?.getAttribute('role')).toBeNull();
    expect(article?.getAttribute('tabindex')).toBeNull();
  });
});
