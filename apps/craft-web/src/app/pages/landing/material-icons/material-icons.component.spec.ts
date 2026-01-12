import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MaterialIconsComponent } from './material-icons.component';

describe('MaterialIconsComponent', () => {
  let component: MaterialIconsComponent;
  let fixture: ComponentFixture<MaterialIconsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MaterialIconsComponent],
      imports: [MatIconModule],
    }).compileComponents();

    fixture = TestBed.createComponent(MaterialIconsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
