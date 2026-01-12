import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { PeasantKitchenComponent } from './peasant-kitchen.component';

describe('PeasantKitchenComponent', () => {
  let component: PeasantKitchenComponent;
  let fixture: ComponentFixture<PeasantKitchenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PeasantKitchenComponent],
      imports: [RouterTestingModule.withRoutes([])],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PeasantKitchenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
