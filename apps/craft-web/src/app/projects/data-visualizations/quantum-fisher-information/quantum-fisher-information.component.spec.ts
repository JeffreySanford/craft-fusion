import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuantumFisherInformationComponent } from './quantum-fisher-information.component';

describe('QuantumFisherInformationComponent', () => {
  let component: QuantumFisherInformationComponent;
  let fixture: ComponentFixture<QuantumFisherInformationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QuantumFisherInformationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuantumFisherInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
