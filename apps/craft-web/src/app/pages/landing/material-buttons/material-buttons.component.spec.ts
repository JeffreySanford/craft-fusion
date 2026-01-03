import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { MaterialButtonsComponent } from './material-buttons.component';

describe('MaterialButtonsComponent', () => {
  let component: MaterialButtonsComponent;
  let fixture: ComponentFixture<MaterialButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MaterialButtonsComponent],
      imports: [MatCardModule, MatButtonModule, MatIconModule],
    }).compileComponents();

    fixture = TestBed.createComponent(MaterialButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
