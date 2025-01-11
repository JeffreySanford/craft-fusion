import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FireAlertComponent } from './fire-alert.component';

describe('FireAlertComponent', () => {
  let component: FireAlertComponent;
  let fixture: ComponentFixture<FireAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FireAlertComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FireAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the map', () => {
    expect(component.map).toBeDefined();
  });
});
