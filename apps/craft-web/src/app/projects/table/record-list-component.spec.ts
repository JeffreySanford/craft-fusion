import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecordListComponent } from './record-list.component';

describe('RecordListComponent', () => {
  let component: RecordListComponent;
  let fixture: ComponentFixture<RecordListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecordListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecordListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // it('should have a defined title', () => {
  //   expect(component.title).toBeDefined();
  // });

  it('should have a non-empty record list', () => {
    expect(component.records.length).toBeGreaterThan(0);
  });

  it('should render records in a table', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelectorAll('table tr').length).toBe(component.records.length + 1); // +1 for header row
  });
});