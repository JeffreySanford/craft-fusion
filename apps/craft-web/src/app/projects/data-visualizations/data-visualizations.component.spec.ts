import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DataVisualizationsComponent } from './data-visualizations.component';
import { ChartLayoutService } from './services/chart-layout.service';
import { DataVisualizationsModule } from './data-visualizations.module';

describe('DataVisualizationsComponent', () => {
  let component: DataVisualizationsComponent;
  let fixture: ComponentFixture<DataVisualizationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataVisualizationsModule, HttpClientTestingModule],
      providers: [ChartLayoutService],
    }).compileComponents();

    fixture = TestBed.createComponent(DataVisualizationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
