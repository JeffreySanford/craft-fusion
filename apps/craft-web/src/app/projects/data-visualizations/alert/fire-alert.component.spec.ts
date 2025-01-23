import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FireAlertComponent } from './fire-alert.component';

describe('FireAlertComponent', () => {
  let component: FireAlertComponent;
  let fixture: ComponentFixture<FireAlertComponent>;

  const mockCities = [
    {
      name: 'City A',
      state: 'State A',
      timezone: 'PST',
      coords: { lat: 34.0522, lng: -118.2437 },
      alerts: [
        { id: 1, name: 'Alert 1' },
        { id: 2, name: 'Alert 2' }
      ]
    },
    {
      name: 'City B',
      state: 'State B',
      timezone: 'PST',
      coords: { lat: 36.1699, lng: -115.1398 },
      alerts: [
        { id: 3, name: 'Alert 3' },
        { id: 4, name: 'Alert 4' }
      ]
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FireAlertComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FireAlertComponent);
    component = fixture.componentInstance;
    component.cities = mockCities;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the map', () => {
    expect(component.map).toBeDefined();
  });

  it('should have tabs for each alert', () => {
    expect(component.alerts.length).toBeGreaterThan(0);
    const tabElements = fixture.nativeElement.querySelectorAll('mat-tab');
    expect(tabElements.length).toBe(component.alerts.length);
  });
});
